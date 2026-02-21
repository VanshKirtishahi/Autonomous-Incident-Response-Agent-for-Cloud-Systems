import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, Box, RotateCcw, StopCircle, Play, 
  AlertTriangle, Server, Cpu, HardDrive, Clock,
  GitBranch, Activity, ChevronDown, ChevronUp,
  Terminal, Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { API } from '../utils/api';

// Helper functions
const barClass = (value) => {
  if (value > 80) return 'critical';
  if (value > 60) return 'warning';
  return 'normal';
};

const formatUptime = (uptime) => {
  if (!uptime) return '0m';
  return uptime;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Simple Loading Spinner Component
const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => (
  <div className="loading-spinner-container">
    <div className={`spinner ${size}`} />
    {text && <div className="spinner-text">{text}</div>}
    <style jsx>{`
      .loading-spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        gap: 16px;
      }
      .spinner {
        border: 3px solid var(--border);
        border-top-color: var(--accent-blue);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      .spinner.small { width: 20px; height: 20px; }
      .spinner.medium { width: 40px; height: 40px; }
      .spinner.large { width: 60px; height: 60px; }
      .spinner-text {
        color: var(--text-dim);
        font-size: 14px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default function ContainersPage() {
  const { liveMetrics, activeIncidents, addToast } = useApp();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedContainer, setExpandedContainer] = useState(null);
  const [filterService, setFilterService] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fixed 6 cloud-hosted containers configuration
  const expectedContainers = [
    { service: 'api-gateway', name: 'API Gateway', icon: '🌐' },
    { service: 'user-service', name: 'User Service', icon: '👤' },
    { service: 'payment-service', name: 'Payment Service', icon: '💰' },
    { service: 'order-service', name: 'Order Service', icon: '📦' },
    { service: 'postgres-db', name: 'PostgreSQL', icon: '🗄️' },
    { service: 'redis-cache', name: 'Redis Cache', icon: '⚡' }
  ];

  const fetchContainers = useCallback(async () => {
    try {
      const response = await API.get('/containers');
      setContainers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch containers:', error);
      if (addToast) {
        addToast({
          type: 'error',
          title: 'Failed to load containers',
          message: error.message
        });
      }
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchContainers, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchContainers]);

  const handleContainerAction = async (containerId, action) => {
    try {
      await API.post(`/containers/${containerId}/${action}`);
      
      if (addToast) {
        addToast({
          type: 'success',
          title: 'Action triggered',
          message: `${action} initiated for container`
        });
      }
      
      fetchContainers();
    } catch (error) {
      if (addToast) {
        addToast({
          type: 'error',
          title: 'Action failed',
          message: error.message
        });
      }
    }
  };

  const toggleExpand = (containerId) => {
    setExpandedContainer(expandedContainer === containerId ? null : containerId);
  };

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner size="large" text="Loading containers..." />
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <Server size={20} />
            Docker Images
          </h1>
          <p className="page-subtitle">
            6 cloud-hosted containers • Real-time metrics • Version tracking
          </p>
        </div>
        <div className="header-actions">
          <select 
            className="filter-select"
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
          >
            <option value="all">All Services</option>
            {expectedContainers.map(c => (
              <option key={c.service} value={c.service}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <button 
            className={`btn btn-ghost ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw size={14} className={autoRefresh ? 'spin' : ''} />
            Auto
          </button>
          <button className="btn btn-ghost" onClick={fetchContainers}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Container Grid */}
      <div className="container-grid">
        {expectedContainers.map((expected) => {
          const container = containers.find(c => c?.service === expected.service) || {
            service: expected.service,
            name: expected.name,
            status: 'unknown',
            healthStatus: 'unknown',
            containerId: 'pending',
            image: 'pending:latest',
            cpu: 0,
            memory: 0,
            restarts: 0,
            replicas: 1,
            uptime: '0m'
          };

          const liveMet = liveMetrics?.[container.service];
          const cpu = liveMet?.cpu ?? container.cpu ?? 0;
          const mem = liveMet?.memory ?? container.memory ?? 0;
          const hasActiveIncident = activeIncidents?.some(
            inc => inc?.affectedService === container.service && inc?.status !== 'resolved'
          );
          const isExpanded = expandedContainer === container.containerId;

          return (
            <div 
              key={container.service}
              className={`container-card ${container.healthStatus !== 'healthy' ? 'unhealthy' : ''} 
                ${container.status === 'rolling_back' ? 'rolling-back' : ''}
                ${hasActiveIncident ? 'incident-active' : ''}`}
            >
              {/* Header with service icon */}
              <div className="card-header">
                <div className="service-icon">
                  {expected.icon}
                </div>
                <div className="service-info">
                  <div className="service-name">
                    {container.name}
                    <span className="service-badge">{container.service}</span>
                  </div>
                  <div className="container-id">
                    {container.containerId === 'pending' ? 'Connecting...' : container.containerId.slice(0, 12)}
                  </div>
                </div>
                <div className="status-group">
                  <div className={`status-badge ${container.status}`}>
                    <span className={`status-dot ${container.status}`} />
                    {container.status}
                  </div>
                  <div className={`health-badge ${container.healthStatus}`}>
                    {container.healthStatus}
                  </div>
                </div>
              </div>

              {/* Image version tracking */}
              <div className="version-tracking">
                <div className="current-version">
                  <GitBranch size={12} />
                  <span className="version-label">Current:</span>
                  <span className="version-tag">{container.image}</span>
                </div>
                {container.previousImage && container.image !== container.previousImage && (
                  <div className="previous-version">
                    <RotateCcw size={10} />
                    <span className="version-label">Previous:</span>
                    <span className="version-tag prev">{container.previousImage}</span>
                  </div>
                )}
              </div>

              {/* CPU/Memory bars */}
              <div className="metrics-container">
                <div className="metric-row">
                  <div className="metric-label">
                    <Cpu size={12} />
                    <span>CPU</span>
                    <span className={`metric-value ${cpu > 80 ? 'critical' : cpu > 60 ? 'warning' : ''}`}>
                      {cpu.toFixed(1)}%
                    </span>
                  </div>
                  <div className="metric-bar-container">
                    <div className="metric-bar-bg">
                      <div 
                        className={`metric-bar-fill ${barClass(cpu)}`}
                        style={{ width: `${Math.min(cpu, 100)}%` }}
                      />
                    </div>
                    {cpu > 80 && <AlertTriangle size={12} className="warning-icon" />}
                  </div>
                </div>

                <div className="metric-row">
                  <div className="metric-label">
                    <HardDrive size={12} />
                    <span>Memory</span>
                    <span className={`metric-value ${mem > 80 ? 'critical' : mem > 60 ? 'warning' : ''}`}>
                      {mem.toFixed(1)}%
                    </span>
                  </div>
                  <div className="metric-bar-container">
                    <div className="metric-bar-bg">
                      <div 
                        className={`metric-bar-fill ${barClass(mem)}`}
                        style={{ width: `${Math.min(mem, 100)}%` }}
                      />
                    </div>
                    {mem > 80 && <AlertTriangle size={12} className="warning-icon" />}
                  </div>
                </div>
              </div>

              {/* Container stats */}
              <div className="container-stats">
                <div className="stat">
                  <RotateCcw size={11} />
                  <span>{container.restarts} restarts</span>
                </div>
                <div className="stat">
                  <Activity size={11} />
                  <span>{container.replicas} replica{container.replicas !== 1 ? 's' : ''}</span>
                </div>
                <div className="stat">
                  <Clock size={11} />
                  <span>{formatUptime(container.uptime)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="action-buttons">
                <button 
                  className="btn btn-ghost rollback-btn"
                  onClick={() => handleContainerAction(container.containerId, 'rollback')}
                  disabled={!container.previousImage || container.containerId === 'pending'}
                  title={container.previousImage ? 'Rollback to previous version' : 'No previous version available'}
                >
                  <RotateCcw size={13} />
                  Rollback
                </button>
                <button 
                  className="btn btn-danger stop-btn"
                  onClick={() => handleContainerAction(container.containerId, 'stop')}
                  disabled={container.status === 'stopped' || container.containerId === 'pending'}
                >
                  <StopCircle size={13} />
                  Stop
                </button>
                <button 
                  className="btn btn-success start-btn"
                  onClick={() => handleContainerAction(container.containerId, 'start')}
                  disabled={container.status === 'running' || container.containerId === 'pending'}
                >
                  <Play size={13} />
                  Start
                </button>
                <button 
                  className={`btn expand-btn ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleExpand(container.containerId)}
                  disabled={container.containerId === 'pending'}
                >
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {isExpanded ? 'Less' : 'More'}
                </button>
              </div>

              {/* Expanded details */}
              {isExpanded && container.containerId !== 'pending' && (
                <div className="expanded-details">
                  <div className="details-section">
                    <h4>Container Details</h4>
                    <div className="detailed-metrics">
                      <div className="metric-detail">
                        <span className="detail-label">Container ID:</span>
                        <span className="detail-value mono">{container.containerId}</span>
                      </div>
                      <div className="metric-detail">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{container.createdAt || 'N/A'}</span>
                      </div>
                      <div className="metric-detail">
                        <span className="detail-label">Last Started:</span>
                        <span className="detail-value">{container.lastStarted || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>Recent Logs</h4>
                    <div className="log-preview">
                      <Terminal size={12} />
                      <span className="log-text">Container operating normally</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Active incident overlay */}
              {hasActiveIncident && (
                <div className="incident-overlay">
                  <AlertTriangle size={14} />
                  <span>Active incident</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .page {
          padding: 24px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .page-subtitle {
          color: var(--text-dim);
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-select {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          color: var(--text-primary);
          cursor: pointer;
          min-width: 160px;
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--accent-blue);
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          background: none;
        }

        .btn-ghost {
          background: var(--bg-elevated);
          border-color: var(--border);
          color: var(--text-secondary);
        }

        .btn-ghost:hover:not(:disabled) {
          background: var(--bg-hover);
          border-color: var(--accent-blue);
          color: var(--accent-blue);
        }

        .btn-ghost.active {
          background: var(--accent-blue);
          color: white;
          border-color: var(--accent-blue);
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: var(--accent-red);
        }

        .btn-danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          border-color: var(--accent-red);
        }

        .btn-success {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: var(--accent-green);
        }

        .btn-success:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.2);
          border-color: var(--accent-green);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .container-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
          gap: 20px;
        }

        .container-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          position: relative;
          transition: all 0.2s;
        }

        .container-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          border-color: var(--accent-blue);
        }

        .container-card.incident-active {
          animation: alert-pulse 2s infinite;
          border-color: var(--accent-red);
        }

        .container-card.rolling-back {
          border-color: var(--accent-yellow);
        }

        .container-card.unhealthy {
          border-left: 4px solid var(--accent-red);
        }

        @keyframes alert-pulse {
          0%, 100% { 
            border-color: var(--accent-red); 
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); 
          }
          50% { 
            border-color: rgba(239, 68, 68, 0.3); 
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1); 
          }
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .service-icon {
          width: 44px;
          height: 44px;
          background: var(--bg-card);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .service-info {
          flex: 1;
        }

        .service-name {
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .service-badge {
          font-size: 10px;
          background: var(--bg-card);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--accent-blue);
          font-family: monospace;
        }

        .container-id {
          font-size: 11px;
          font-family: monospace;
          color: var(--text-dim);
        }

        .status-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          background: var(--bg-card);
          text-transform: capitalize;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.running { background: #10b981; }
        .status-dot.stopped { background: #6b7280; }
        .status-dot.rolling_back { 
          background: #f59e0b;
          animation: pulse-dot 1s infinite;
        }
        .status-dot.unknown { background: #6b7280; }

        .health-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .health-badge.healthy {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .health-badge.unhealthy {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .health-badge.degraded {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .health-badge.unknown {
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        }

        .version-tracking {
          background: var(--bg-card);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .current-version,
        .previous-version {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .previous-version {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--border);
        }

        .version-label {
          color: var(--text-dim);
        }

        .version-tag {
          font-family: monospace;
          color: var(--accent-blue);
          word-break: break-all;
        }

        .version-tag.prev {
          color: var(--text-secondary);
        }

        .metrics-container {
          margin-bottom: 16px;
        }

        .metric-row {
          margin-bottom: 12px;
        }

        .metric-row:last-child {
          margin-bottom: 0;
        }

        .metric-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-dim);
          margin-bottom: 4px;
        }

        .metric-value {
          margin-left: auto;
          font-family: monospace;
          font-weight: 600;
        }

        .metric-value.warning { color: #f59e0b; }
        .metric-value.critical { color: #ef4444; }

        .metric-bar-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .metric-bar-bg {
          flex: 1;
          height: 6px;
          background: var(--bg-card);
          border-radius: 3px;
          overflow: hidden;
        }

        .metric-bar-fill {
          height: 100%;
          transition: width 0.3s;
        }

        .metric-bar-fill.normal { background: #3b82f6; }
        .metric-bar-fill.warning { background: #f59e0b; }
        .metric-bar-fill.critical { background: #ef4444; }

        .warning-icon {
          color: #f59e0b;
        }

        .container-stats {
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: var(--text-dim);
          margin-bottom: 16px;
          padding: 12px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .expand-btn {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }

        .expand-btn.expanded {
          background: var(--accent-blue);
          color: white;
          border-color: var(--accent-blue);
        }

        .expanded-details {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }

        .details-section {
          margin-bottom: 20px;
        }

        .details-section h4 {
          font-size: 12px;
          color: var(--text-dim);
          font-family: monospace;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detailed-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          background: var(--bg-card);
          border-radius: 8px;
          padding: 16px;
        }

        .metric-detail {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 10px;
          color: var(--text-dim);
          text-transform: uppercase;
        }

        .detail-value {
          font-size: 13px;
          font-weight: 500;
        }

        .detail-value.mono {
          font-family: monospace;
        }

        .log-preview {
          background: var(--bg-card);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-dim);
        }

        .log-text {
          flex: 1;
          font-family: monospace;
        }

        .incident-overlay {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          animation: slideIn 0.3s;
        }

        @keyframes slideIn {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .container-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            grid-template-columns: repeat(2, 1fr);
          }

          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .filter-select {
            width: 100%;
          }

          .btn {
            width: 100%;
          }

          .detailed-metrics {
            grid-template-columns: 1fr;
          }

          .status-group {
            flex-direction: column;
            align-items: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
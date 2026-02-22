import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, Box, RotateCcw, StopCircle, Play, 
  AlertTriangle, Server, Cpu, HardDrive, Clock,
  GitBranch, Shield, Activity, ChevronDown, ChevronUp,
  Terminal, Info, Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { API } from '../utils/api';
import { barClass, formatUptime, formatBytes } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
export default function ContainersPage() {
  const { liveMetrics, activeIncidents, addToast } = useApp();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedContainer, setExpandedContainer] = useState(null);
  const [filterService, setFilterService] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [versionHistory, setVersionHistory] = useState({});

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
      addToast({
        type: 'error',
        title: 'Failed to load containers',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchVersionHistory = useCallback(async (containerId) => {
    try {
      const response = await API.get(`/containers/${containerId}/versions`);
      setVersionHistory(prev => ({
        ...prev,
        [containerId]: response.data || []
      }));
    } catch (error) {
      console.error('Failed to fetch version history:', error);
    }
  }, []);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchContainers, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchContainers]);

  const handleContainerAction = async (containerId, action, version = null) => {
    try {
      const endpoint = version 
        ? `/containers/${containerId}/rollback/${version}`
        : `/containers/${containerId}/${action}`;
      
      await API.post(endpoint);
      
      addToast({
        type: 'success',
        title: 'Action triggered',
        message: `${action} initiated for container`
      });
      
      fetchContainers();
      if (action === 'rollback') {
        fetchVersionHistory(containerId);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Action failed',
        message: error.message
      });
    }
  };

  const toggleExpand = (containerId) => {
    if (expandedContainer === containerId) {
      setExpandedContainer(null);
    } else {
      setExpandedContainer(containerId);
      fetchVersionHistory(containerId);
    }
  };

  if (loading) {
    return (
      <div className="page loading-state">
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
          const container = containers.find(c => c.service === expected.service) || {
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
          const versions = versionHistory[container.containerId] || [];

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
                  <div className="container-id">{container.containerId.slice(0, 12)}</div>
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

              {/* CPU/Memory bars with live metrics */}
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
                  disabled={!container.previousImage}
                  title={container.previousImage ? 'Rollback to previous version' : 'No previous version available'}
                >
                  <RotateCcw size={13} />
                  Rollback
                </button>
                <button 
                  className="btn btn-danger stop-btn"
                  onClick={() => handleContainerAction(container.containerId, 'stop')}
                >
                  <StopCircle size={13} />
                  Stop
                </button>
                <button 
                  className="btn btn-success start-btn"
                  onClick={() => handleContainerAction(container.containerId, 'start')}
                >
                  <Play size={13} />
                  Start
                </button>
                <button 
                  className={`btn expand-btn ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleExpand(container.containerId)}
                >
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {isExpanded ? 'Less' : 'More'}
                </button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="expanded-details">
                  <div className="details-section">
                    <h4>Version History</h4>
                    <div className="version-history">
                      {versions.length > 0 ? (
                        versions.map((version, idx) => (
                          <div key={idx} className="version-item">
                            <div className="version-info">
                              <GitBranch size={10} />
                              <span className="version-hash">{version.tag}</span>
                              <span className="version-date">{version.deployedAt}</span>
                              {version.current && (
                                <span className="current-badge">Current</span>
                              )}
                            </div>
                            <button 
                              className="btn btn-xs btn-ghost"
                              onClick={() => handleContainerAction(container.containerId, 'rollback', version.tag)}
                              disabled={version.current}
                            >
                              <RotateCcw size={10} />
                              Rollback
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="no-versions">No version history available</div>
                      )}
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>Detailed Metrics</h4>
                    <div className="detailed-metrics">
                      <div className="metric-detail">
                        <span className="detail-label">Container ID:</span>
                        <span className="detail-value mono">{container.containerId}</span>
                      </div>
                      <div className="metric-detail">
                        <span className="detail-label">Image Size:</span>
                        <span className="detail-value">{formatBytes(container.imageSize || 0)}</span>
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
                      <button className="btn btn-link">
                        <Download size={10} />
                        View full logs
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Active incident overlay */}
              {hasActiveIncident && (
                <div className="incident-overlay">
                  <AlertTriangle size={14} />
                  <span>Active incident on this service</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
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

        .container-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
          gap: 20px;
        }

        .container-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
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
          0%, 100% { border-color: var(--accent-red); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
          50% { border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1); }
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .service-icon {
          width: 40px;
          height: 40px;
          background: var(--bg-card);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .service-info {
          flex: 1;
        }

        .service-name {
          font-weight: 600;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .service-badge {
          font-size: 10px;
          background: var(--bg-card);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--accent-blue);
          font-family: var(--font-mono);
        }

        .container-id {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-dim);
          margin-top: 2px;
        }

        .status-group {
          display: flex;
          gap: 8px;
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
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .status-dot.running { background: var(--accent-green); }
        .status-dot.stopped { background: var(--text-dim); }
        .status-dot.rolling_back { background: var(--accent-yellow); animation: pulse-dot 1s infinite; }

        .health-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .health-badge.healthy {
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent-green);
        }

        .health-badge.unhealthy {
          background: rgba(239, 68, 68, 0.1);
          color: var(--accent-red);
        }

        .health-badge.degraded {
          background: rgba(245, 158, 11, 0.1);
          color: var(--accent-yellow);
        }

        .version-tracking {
          background: var(--bg-card);
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 16px;
        }

        .current-version,
        .previous-version {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }

        .previous-version {
          margin-top: 6px;
          opacity: 0.8;
        }

        .version-label {
          color: var(--text-dim);
        }

        .version-tag {
          font-family: var(--font-mono);
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
          margin-bottom: 10px;
        }

        .metric-row:last-child {
          margin-bottom: 0;
        }

        .metric-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-dim);
          margin-bottom: 4px;
        }

        .metric-value {
          margin-left: auto;
          font-family: var(--font-mono);
          font-weight: 600;
        }

        .metric-value.warning { color: var(--accent-yellow); }
        .metric-value.critical { color: var(--accent-red); }

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

        .warning-icon {
          color: var(--accent-yellow);
        }

        .container-stats {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: var(--text-dim);
          margin-bottom: 16px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .btn-ghost {
          background: var(--bg-card);
          border-color: var(--border);
          color: var(--text-secondary);
        }

        .btn-ghost:hover:not(:disabled) {
          background: var(--bg-elevated);
          border-color: var(--accent-blue);
          color: var(--accent-blue);
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

        .expand-btn {
          background: var(--bg-card);
          border-color: var(--border);
          color: var(--text-secondary);
        }

        .expand-btn.expanded {
          background: var(--accent-blue);
          color: white;
          border-color: var(--accent-blue);
        }

        .expanded-details {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .details-section {
          margin-bottom: 16px;
        }

        .details-section h4 {
          font-size: 11px;
          color: var(--text-dim);
          font-family: var(--font-mono);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .version-history {
          background: var(--bg-card);
          border-radius: 8px;
          padding: 8px;
        }

        .version-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border-bottom: 1px solid var(--border);
        }

        .version-item:last-child {
          border-bottom: none;
        }

        .version-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }

        .version-hash {
          font-family: var(--font-mono);
          color: var(--accent-blue);
        }

        .version-date {
          color: var(--text-dim);
        }

        .current-badge {
          font-size: 9px;
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent-green);
          padding: 2px 4px;
          border-radius: 3px;
        }

        .btn-xs {
          padding: 2px 6px;
          font-size: 10px;
        }

        .detailed-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          background: var(--bg-card);
          border-radius: 8px;
          padding: 10px;
        }

        .metric-detail {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-label {
          font-size: 9px;
          color: var(--text-dim);
          text-transform: uppercase;
        }

        .detail-value {
          font-size: 11px;
          font-weight: 500;
        }

        .detail-value.mono {
          font-family: var(--font-mono);
        }

        .log-preview {
          background: var(--bg-card);
          border-radius: 8px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text-dim);
        }

        .log-text {
          flex: 1;
          font-family: var(--font-mono);
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--accent-blue);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .btn-link:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        .incident-overlay {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--accent-red);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          animation: slide-in 0.3s;
        }

        @keyframes slide-in {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .no-versions {
          padding: 12px;
          text-align: center;
          color: var(--text-dim);
          font-size: 11px;
        }

        @media (max-width: 640px) {
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

          .detailed-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
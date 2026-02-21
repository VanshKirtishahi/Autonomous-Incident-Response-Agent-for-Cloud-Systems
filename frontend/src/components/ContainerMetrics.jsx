import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, Box, RotateCcw, StopCircle, Play, 
  AlertTriangle, Server, Cpu, HardDrive, Clock,
  GitBranch, Activity, ChevronDown, ChevronUp,
  Terminal, Info, Zap, Shield
} from 'lucide-react';

// Simple context mock if not available
const useApp = () => {
  const [state, setState] = useState({
    liveMetrics: {},
    activeIncidents: []
  });
  
  // Mock addToast if not provided
  const addToast = ({ type, title, message }) => {
    console.log(`Toast: ${type} - ${title} - ${message}`);
  };

  return {
    liveMetrics: state.liveMetrics,
    activeIncidents: state.activeIncidents,
    addToast
  };
};

// Mock API
const API = {
  get: async (url) => {
    console.log(`GET ${url}`);
    // Return mock data
    return { data: [] };
  },
  post: async (url) => {
    console.log(`POST ${url}`);
    return { data: {} };
  }
};

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
  if (bytes === 0 || !bytes) return '0 B';
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
  </div>
);

export default function ContainersPage() {
  const { liveMetrics, activeIncidents, addToast } = useApp();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedContainer, setExpandedContainer] = useState(null);
  const [filterService, setFilterService] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fixed 6 cloud-hosted containers configuration with mock data
  const [expectedContainers] = useState([
    { 
      service: 'api-gateway', 
      name: 'API Gateway', 
      icon: '🌐',
      status: 'running',
      healthStatus: 'healthy',
      containerId: 'api-gw-123456',
      image: 'api-gateway:v2.1.0',
      previousImage: 'api-gateway:v2.0.0',
      cpu: 45,
      memory: 62,
      restarts: 2,
      replicas: 3,
      uptime: '15d 4h',
      createdAt: '2024-01-15T10:30:00Z',
      lastStarted: '2024-02-01T08:00:00Z'
    },
    { 
      service: 'user-service', 
      name: 'User Service', 
      icon: '👤',
      status: 'running',
      healthStatus: 'healthy',
      containerId: 'user-svc-789012',
      image: 'user-service:v1.5.2',
      previousImage: 'user-service:v1.5.1',
      cpu: 28,
      memory: 45,
      restarts: 1,
      replicas: 2,
      uptime: '8d 12h',
      createdAt: '2024-01-20T14:20:00Z',
      lastStarted: '2024-01-28T11:15:00Z'
    },
    { 
      service: 'payment-service', 
      name: 'Payment Service', 
      icon: '💰',
      status: 'running',
      healthStatus: 'degraded',
      containerId: 'pay-svc-345678',
      image: 'payment-service:v3.0.1',
      previousImage: 'payment-service:v3.0.0',
      cpu: 78,
      memory: 82,
      restarts: 5,
      replicas: 2,
      uptime: '2d 6h',
      createdAt: '2024-01-10T09:45:00Z',
      lastStarted: '2024-01-30T15:30:00Z'
    },
    { 
      service: 'order-service', 
      name: 'Order Service', 
      icon: '📦',
      status: 'running',
      healthStatus: 'healthy',
      containerId: 'ord-svc-901234',
      image: 'order-service:v1.2.3',
      previousImage: 'order-service:v1.2.2',
      cpu: 34,
      memory: 41,
      restarts: 0,
      replicas: 2,
      uptime: '21d 3h',
      createdAt: '2024-01-05T11:00:00Z',
      lastStarted: '2024-01-05T11:00:00Z'
    },
    { 
      service: 'postgres-db', 
      name: 'PostgreSQL', 
      icon: '🗄️',
      status: 'running',
      healthStatus: 'healthy',
      containerId: 'postgres-567890',
      image: 'postgres:15.2',
      previousImage: 'postgres:15.1',
      cpu: 52,
      memory: 68,
      restarts: 1,
      replicas: 1,
      uptime: '30d 2h',
      createdAt: '2023-12-01T08:00:00Z',
      lastStarted: '2024-01-25T10:00:00Z'
    },
    { 
      service: 'redis-cache', 
      name: 'Redis Cache', 
      icon: '⚡',
      status: 'rolling_back',
      healthStatus: 'unhealthy',
      containerId: 'redis-123789',
      image: 'redis:7.0.12',
      previousImage: 'redis:7.0.11',
      cpu: 92,
      memory: 88,
      restarts: 8,
      replicas: 1,
      uptime: '4h 30m',
      createdAt: '2024-01-18T16:20:00Z',
      lastStarted: '2024-02-01T09:15:00Z'
    }
  ]);

  const fetchContainers = useCallback(async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from API
      // const response = await API.get('/containers');
      // setContainers(response.data || []);
      
      // Using mock data for now
      setContainers(expectedContainers);
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
  }, [addToast, expectedContainers]);

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
      // In a real app, this would call the API
      // await API.post(`/containers/${containerId}/${action}`);
      
      console.log(`Action ${action} on container ${containerId}`);
      
      if (addToast) {
        addToast({
          type: 'success',
          title: 'Action triggered',
          message: `${action} initiated for container`
        });
      }
      
      // Update local state to reflect action
      setContainers(prev => prev.map(c => {
        if (c.containerId === containerId) {
          if (action === 'stop') return { ...c, status: 'stopped' };
          if (action === 'start') return { ...c, status: 'running' };
          if (action === 'rollback') {
            return { 
              ...c, 
              status: 'rolling_back',
              image: c.previousImage,
              previousImage: c.image
            };
          }
        }
        return c;
      }));
      
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

  // Filter containers
  const filteredContainers = containers.filter(c => 
    filterService === 'all' || c.service === filterService
  );

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

      {/* Stats summary */}
      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{containers.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Running</span>
          <span className="stat-value success">
            {containers.filter(c => c.status === 'running').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Unhealthy</span>
          <span className="stat-value warning">
            {containers.filter(c => c.healthStatus !== 'healthy').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Rolling Back</span>
          <span className="stat-value info">
            {containers.filter(c => c.status === 'rolling_back').length}
          </span>
        </div>
      </div>

      {/* Container Grid */}
      <div className="container-grid">
        {filteredContainers.map((container) => {
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
                  {container.icon}
                </div>
                <div className="service-info">
                  <div className="service-name">
                    {container.name}
                    <span className="service-badge">{container.service}</span>
                  </div>
                  <div className="container-id">
                    {container.containerId}
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
                  disabled={!container.previousImage}
                  title={container.previousImage ? 'Rollback to previous version' : 'No previous version available'}
                >
                  <RotateCcw size={13} />
                  Rollback
                </button>
                <button 
                  className="btn btn-danger stop-btn"
                  onClick={() => handleContainerAction(container.containerId, 'stop')}
                  disabled={container.status === 'stopped'}
                >
                  <StopCircle size={13} />
                  Stop
                </button>
                <button 
                  className="btn btn-success start-btn"
                  onClick={() => handleContainerAction(container.containerId, 'start')}
                  disabled={container.status === 'running'}
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
                    <h4>Container Details</h4>
                    <div className="detailed-metrics">
                      <div className="metric-detail">
                        <span className="detail-label">Container ID:</span>
                        <span className="detail-value mono">{container.containerId}</span>
                      </div>
                      <div className="metric-detail">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">
                          {new Date(container.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="metric-detail">
                        <span className="detail-label">Last Started:</span>
                        <span className="detail-value">
                          {new Date(container.lastStarted).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>Recent Logs</h4>
                    <div className="log-preview">
                      <Terminal size={12} />
                      <span className="log-text">
                        [{new Date().toLocaleTimeString()}] Container operating normally
                      </span>
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
          max-width: 1600px;
          margin: 0 auto;
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
          color: #fff;
        }

        .page-subtitle {
          color: #9ca3af;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-select {
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          color: #fff;
          cursor: pointer;
          min-width: 160px;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
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
          color: #fff;
        }

        .btn-ghost {
          background: #1f2937;
          border-color: #374151;
          color: #d1d5db;
        }

        .btn-ghost:hover:not(:disabled) {
          background: #2d3748;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .btn-ghost.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .btn-danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
        }

        .btn-success {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: #10b981;
        }

        .btn-success:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
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

        .stats-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
          background: #1f2937;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #374151;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #9ca3af;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #fff;
        }

        .stat-value.success { color: #10b981; }
        .stat-value.warning { color: #f59e0b; }
        .stat-value.info { color: #3b82f6; }

        .container-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
          gap: 20px;
        }

        .container-card {
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 12px;
          padding: 20px;
          position: relative;
          transition: all 0.2s;
        }

        .container-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          border-color: #3b82f6;
        }

        .container-card.incident-active {
          animation: alert-pulse 2s infinite;
          border-color: #ef4444;
        }

        .container-card.rolling-back {
          border-color: #f59e0b;
        }

        .container-card.unhealthy {
          border-left: 4px solid #ef4444;
        }

        @keyframes alert-pulse {
          0%, 100% { 
            border-color: #ef4444; 
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
          width: 48px;
          height: 48px;
          background: #111827;
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
          color: #fff;
        }

        .service-badge {
          font-size: 10px;
          background: #111827;
          padding: 2px 6px;
          border-radius: 4px;
          color: #3b82f6;
          font-family: monospace;
        }

        .container-id {
          font-size: 11px;
          font-family: monospace;
          color: #9ca3af;
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
          background: #111827;
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
          background: #111827;
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
          border-top: 1px solid #374151;
        }

        .version-label {
          color: #9ca3af;
        }

        .version-tag {
          font-family: monospace;
          color: #3b82f6;
          word-break: break-all;
        }

        .version-tag.prev {
          color: #9ca3af;
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
          color: #9ca3af;
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
          background: #111827;
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
          color: #9ca3af;
          margin-bottom: 16px;
          padding: 12px 0;
          border-top: 1px solid #374151;
          border-bottom: 1px solid #374151;
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
          background: #111827;
          border: 1px solid #374151;
          color: #9ca3af;
        }

        .expand-btn.expanded {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .expanded-details {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #374151;
        }

        .details-section {
          margin-bottom: 20px;
        }

        .details-section h4 {
          font-size: 12px;
          color: #9ca3af;
          font-family: monospace;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detailed-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          background: #111827;
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
          color: #9ca3af;
          text-transform: uppercase;
        }

        .detail-value {
          font-size: 13px;
          font-weight: 500;
          color: #fff;
        }

        .detail-value.mono {
          font-family: monospace;
        }

        .log-preview {
          background: #111827;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #9ca3af;
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

        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .spinner {
          border: 3px solid #374151;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner.small { width: 20px; height: 20px; }
        .spinner.medium { width: 40px; height: 40px; }
        .spinner.large { width: 60px; height: 60px; }

        .spinner-text {
          color: #9ca3af;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .page {
            padding: 16px;
          }

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

          .stats-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
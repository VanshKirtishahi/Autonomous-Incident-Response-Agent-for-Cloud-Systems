import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, RotateCcw, StopCircle, Play, 
  AlertTriangle, Server, Cpu, HardDrive, Clock,
  GitBranch, Activity, ChevronDown, ChevronUp,
  Terminal
} from 'lucide-react';

// Mock useApp hook if not available in your context
const useApp = () => {
  return {
    liveMetrics: {},
    activeIncidents: [],
    addToast: ({ type, title, message }) => {
      console.log(`Toast: ${type} - ${title} - ${message}`);
    }
  };
};

// Mock API
const API = {
  get: async (url) => {
    console.log(`GET ${url}`);
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

export default function ContainersPage() {
  const { liveMetrics, activeIncidents, addToast } = useApp();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedContainer, setExpandedContainer] = useState(null);
  const [filterService, setFilterService] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fixed 6 cloud-hosted containers with mock data
  const mockContainers = [
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
  ];

  const fetchContainers = useCallback(async () => {
    try {
      setLoading(true);
      // Use mock data directly since we're having import issues
      setContainers(mockContainers);
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

  // Loading Spinner Component
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #374151',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ color: '#9ca3af' }}>Loading containers...</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
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
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
      `}</style>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fff',
            margin: 0
          }}>
            <Server size={20} />
            Docker Images
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            6 cloud-hosted containers • Real-time metrics • Version tracking
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            style={{
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#fff',
              cursor: 'pointer',
              minWidth: '160px'
            }}
          >
            <option value="all">All Services</option>
            {mockContainers.map(c => (
              <option key={c.service} value={c.service}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid transparent',
              background: autoRefresh ? '#3b82f6' : '#1f2937',
              borderColor: autoRefresh ? '#3b82f6' : '#374151',
              color: autoRefresh ? '#fff' : '#d1d5db'
            }}
          >
            <RefreshCw size={14} className={autoRefresh ? 'spin' : ''} />
            Auto
          </button>
          
          <button
            onClick={fetchContainers}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#d1d5db'
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
        background: '#1f2937',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #374151'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' }}>Total</span>
          <span style={{ fontSize: '24px', fontWeight: 600, color: '#fff' }}>{containers.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' }}>Running</span>
          <span style={{ fontSize: '24px', fontWeight: 600, color: '#10b981' }}>
            {containers.filter(c => c.status === 'running').length}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' }}>Unhealthy</span>
          <span style={{ fontSize: '24px', fontWeight: 600, color: '#f59e0b' }}>
            {containers.filter(c => c.healthStatus !== 'healthy').length}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' }}>Rolling Back</span>
          <span style={{ fontSize: '24px', fontWeight: 600, color: '#3b82f6' }}>
            {containers.filter(c => c.status === 'rolling_back').length}
          </span>
        </div>
      </div>

      {/* Container Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))',
        gap: '20px'
      }}>
        {filteredContainers.map((container) => {
          const hasActiveIncident = activeIncidents?.some(
            inc => inc?.affectedService === container.service && inc?.status !== 'resolved'
          );
          const isExpanded = expandedContainer === container.containerId;

          return (
            <div
              key={container.service}
              style={{
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                transition: 'all 0.2s',
                borderLeft: container.healthStatus !== 'healthy' ? '4px solid #ef4444' : '1px solid #374151',
                animation: hasActiveIncident ? 'alert-pulse 2s infinite' : 'none',
                ...(container.status === 'rolling_back' && { borderColor: '#f59e0b' })
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = container.status === 'rolling_back' ? '#f59e0b' : '#374151';
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#111827',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {container.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    color: '#fff'
                  }}>
                    {container.name}
                    <span style={{
                      fontSize: '10px',
                      background: '#111827',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#3b82f6',
                      fontFamily: 'monospace'
                    }}>
                      {container.service}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#9ca3af' }}>
                    {container.containerId}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: '#111827',
                    textTransform: 'capitalize'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: container.status === 'running' ? '#10b981' : 
                                 container.status === 'rolling_back' ? '#f59e0b' : '#6b7280',
                      animation: container.status === 'rolling_back' ? 'pulse-dot 1s infinite' : 'none'
                    }} />
                    {container.status}
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    background: container.healthStatus === 'healthy' ? 'rgba(16,185,129,0.1)' :
                               container.healthStatus === 'degraded' ? 'rgba(245,158,11,0.1)' :
                               container.healthStatus === 'unhealthy' ? 'rgba(239,68,68,0.1)' :
                               'rgba(107,114,128,0.1)',
                    color: container.healthStatus === 'healthy' ? '#10b981' :
                           container.healthStatus === 'degraded' ? '#f59e0b' :
                           container.healthStatus === 'unhealthy' ? '#ef4444' :
                           '#6b7280'
                  }}>
                    {container.healthStatus}
                  </div>
                </div>
              </div>

              {/* Version tracking */}
              <div style={{
                background: '#111827',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <GitBranch size={12} />
                  <span style={{ color: '#9ca3af' }}>Current:</span>
                  <span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{container.image}</span>
                </div>
                {container.previousImage && container.image !== container.previousImage && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #374151'
                  }}>
                    <RotateCcw size={10} />
                    <span style={{ color: '#9ca3af' }}>Previous:</span>
                    <span style={{ fontFamily: 'monospace', color: '#9ca3af' }}>{container.previousImage}</span>
                  </div>
                )}
              </div>

              {/* CPU/Memory bars */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginBottom: '4px'
                  }}>
                    <Cpu size={12} />
                    <span>CPU</span>
                    <span style={{
                      marginLeft: 'auto',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: container.cpu > 80 ? '#ef4444' : container.cpu > 60 ? '#f59e0b' : '#d1d5db'
                    }}>
                      {container.cpu.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#111827', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(container.cpu, 100)}%`,
                        background: container.cpu > 80 ? '#ef4444' : container.cpu > 60 ? '#f59e0b' : '#3b82f6',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    {container.cpu > 80 && <AlertTriangle size={12} style={{ color: '#f59e0b' }} />}
                  </div>
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginBottom: '4px'
                  }}>
                    <HardDrive size={12} />
                    <span>Memory</span>
                    <span style={{
                      marginLeft: 'auto',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: container.memory > 80 ? '#ef4444' : container.memory > 60 ? '#f59e0b' : '#d1d5db'
                    }}>
                      {container.memory.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#111827', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(container.memory, 100)}%`,
                        background: container.memory > 80 ? '#ef4444' : container.memory > 60 ? '#f59e0b' : '#3b82f6',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    {container.memory > 80 && <AlertTriangle size={12} style={{ color: '#f59e0b' }} />}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '20px',
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '16px',
                padding: '12px 0',
                borderTop: '1px solid #374151',
                borderBottom: '1px solid #374151'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={11} />
                  <span>{container.restarts} restarts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={11} />
                  <span>{container.replicas} replica{container.replicas !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={11} />
                  <span>{formatUptime(container.uptime)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px'
              }}>
                <button
                  onClick={() => handleContainerAction(container.containerId, 'rollback')}
                  disabled={!container.previousImage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: !container.previousImage ? 'not-allowed' : 'pointer',
                    border: '1px solid #374151',
                    background: '#111827',
                    color: !container.previousImage ? '#6b7280' : '#d1d5db',
                    opacity: !container.previousImage ? 0.5 : 1
                  }}
                  title={container.previousImage ? 'Rollback to previous version' : 'No previous version available'}
                >
                  <RotateCcw size={13} />
                  Rollback
                </button>
                
                <button
                  onClick={() => handleContainerAction(container.containerId, 'stop')}
                  disabled={container.status === 'stopped'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: container.status === 'stopped' ? 'not-allowed' : 'pointer',
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.1)',
                    color: container.status === 'stopped' ? '#6b7280' : '#ef4444',
                    opacity: container.status === 'stopped' ? 0.5 : 1
                  }}
                >
                  <StopCircle size={13} />
                  Stop
                </button>
                
                <button
                  onClick={() => handleContainerAction(container.containerId, 'start')}
                  disabled={container.status === 'running'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: container.status === 'running' ? 'not-allowed' : 'pointer',
                    border: '1px solid rgba(16,185,129,0.3)',
                    background: 'rgba(16,185,129,0.1)',
                    color: container.status === 'running' ? '#6b7280' : '#10b981',
                    opacity: container.status === 'running' ? 0.5 : 1
                  }}
                >
                  <Play size={13} />
                  Start
                </button>
                
                <button
                  onClick={() => toggleExpand(container.containerId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid #374151',
                    background: isExpanded ? '#3b82f6' : '#111827',
                    color: isExpanded ? '#fff' : '#d1d5db'
                  }}
                >
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {isExpanded ? 'Less' : 'More'}
                </button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #374151' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      fontFamily: 'monospace',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Container Details
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px',
                      background: '#111827',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Container ID</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff', fontFamily: 'monospace' }}>
                          {container.containerId}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Created</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>
                          {new Date(container.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase' }}>Last Started</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>
                          {new Date(container.lastStarted).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      fontFamily: 'monospace',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Recent Logs
                    </h4>
                    <div style={{
                      background: '#111827',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      <Terminal size={12} />
                      <span style={{ flex: 1, fontFamily: 'monospace' }}>
                        [{new Date().toLocaleTimeString()}] Container operating normally
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Active incident overlay */}
              {hasActiveIncident && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#ef4444',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                  animation: 'slideIn 0.3s'
                }}>
                  <AlertTriangle size={14} />
                  <span>Active incident</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredContainers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#9ca3af'
        }}>
          <Server size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>No containers found</h3>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>Try adjusting your filters</p>
        </div>
      )}

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(auto-fill, minmax(500px, 1fr))"] {
            grid-template-columns: 1fr !important;
          }
          
          div[style*="grid-template-columns: repeat(4, 1fr)"][style*="margin-bottom: 24px"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          div[style*="display: flex"][style*="justify-content: space-between"] {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          
          select[style*="min-width: 160px"] {
            width: 100% !important;
          }
          
          button {
            width: 100% !important;
          }
          
          div[style*="grid-template-columns: repeat(2, 1fr)"][style*="gap: 16px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
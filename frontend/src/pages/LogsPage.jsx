import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import { API } from '../utils/api';
import { formatTimestamp } from '../utils/helpers';

export default function LogsPage() {
  const { liveLogs } = useApp();
  const [logs, setLogs] = useState([]);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterService, setFilterService] = useState('');
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    API.get('/logs?limit=200').then(r => setLogs(r.data)).catch(() => { });
  }, []);

  useEffect(() => {
    if (liveLogs.length > 0) {
      setLogs(prev => [...prev.slice(-300), ...liveLogs]);
    }
  }, [liveLogs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filtered = logs.filter(l => {
    if (filterLevel && l.level !== filterLevel) return false;
    if (filterService && l.service !== filterService) return false;
    if (anomalyOnly && !l.isAnomaly) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">Live Log Stream</div>
          <div className="page-subtitle">Real-time container logs with anomaly detection</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-green)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse-dot 2s infinite' }} />
            LIVE
          </div>
          <select className="select" style={{ width: 130 }} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
            <option value="">All Levels</option>
            <option>DEBUG</option><option>INFO</option><option>WARN</option><option>ERROR</option><option>FATAL</option>
          </select>
          <select className="select" style={{ width: 160 }} value={filterService} onChange={e => setFilterService(e.target.value)}>
            <option value="">All Services</option>
            <option>api-gateway</option><option>user-service</option><option>payment-service</option>
            <option>order-service</option><option>postgres-db</option><option>redis-cache</option>
          </select>
          <button className={`btn ${anomalyOnly ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setAnomalyOnly(!anomalyOnly)}>
            <AlertTriangle size={13} />{anomalyOnly ? 'Anomalies' : 'Anomaly'}
          </button>
        </div>
      </div>

      <div className="log-terminal">
        <div className="log-terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot" style={{ background: '#ef4444' }} />
            <div className="terminal-dot" style={{ background: '#f59e0b' }} />
            <div className="terminal-dot" style={{ background: '#10b981' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>
            cloud-guard-ai — log stream — {filtered.length} entries
          </div>
        </div>
        <div className="log-body" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>Waiting for logs...</div>
          ) : filtered.map((log, i) => (
            <div key={i} className={`log-entry ${log.isAnomaly ? 'anomaly' : ''}`}>
              <span className="log-time">{format(new Date(log.timestamp || Date.now()), 'HH:mm:ss.SSS')}</span>
              <span className={`log-level ${log.level}`}>{log.level}</span>
              <span style={{ fontSize: 10, color: 'var(--accent-blue)', flexShrink: 0, fontFamily: 'var(--font-mono)', width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.service || log.containerName}</span>
              <span className="log-msg">{log.message}</span>
              {log.isAnomaly && <span style={{ fontSize: 9, background: 'rgba(239,68,68,0.2)', color: 'var(--accent-red)', padding: '1px 4px', borderRadius: 3, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>ANOMALY</span>}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
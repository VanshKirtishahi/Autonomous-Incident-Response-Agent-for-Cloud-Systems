import React, { useState, useEffect } from 'react';
import { Play, X, RefreshCw, Info } from 'lucide-react';
import { API } from '../utils/api';

export default function TriggerModal({ open, onClose, onTrigger }) {
  const [type, setType] = useState('MEMORY_LEAK');
  const [containerId, setContainerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([]);

  useEffect(() => {
    if (open) {
      API.get('/incident-types')
        .then(r => setTypes(r.data || []))
        .catch(() => { });
    }
  }, [open]);

  // Focus only on the 4 requested core types
  const coreTypes = [
    { key: 'MEMORY_LEAK', name: '🧠 Memory Leak', detail: '(OOMKilled pod)' },
    { key: 'POD_CRASH_LOOP', name: '💥 Pod Crash Loop', detail: '← fails fix → auto-rollback' },
    { key: 'DB_CONNECTION_SATURATION', name: '🗃 DB Connection Saturation', detail: '(Pool Exhausted)' },
    { key: 'NETWORK_LATENCY', name: '⚡ High Latency Spike', detail: '(Timeouts)' }
  ];

  const containers = [
    { id: 'c1f3a8b2d4e9', name: 'api-gateway' },
    { id: 'b2e7c9a1f5d3', name: 'user-service' },
    { id: 'a9d4f2e8c6b1', name: 'payment-service' },
    { id: 'e6a3c9f1d2b8', name: 'order-service' },
    { id: 'f7b4d2e8a1c5', name: 'postgres-db' },
  ];

  const handle = async () => {
    setLoading(true);
    await onTrigger(type, containerId);
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="flex-between mb-20">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Simulate Incident</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Trigger an autonomous incident response scenario</div>
          </div>
          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6, display: 'block', fontFamily: 'var(--font-mono)' }}>INCIDENT TYPE</label>
          <select className="select" value={type} onChange={e => setType(e.target.value)}>
            {coreTypes.map(t => (
              <option key={t.key} value={t.key}>{t.name} {t.detail}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6, display: 'block', fontFamily: 'var(--font-mono)' }}>TARGET CONTAINER</label>
          <select className="select" value={containerId} onChange={e => setContainerId(e.target.value)}>
            <option value="">Random Container</option>
            {containers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ background: 'rgba(77, 166, 255, 0.06)', border: '1px solid rgba(77, 166, 255, 0.2)', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)' }}>
          <Info size={12} style={{ display: 'inline', marginRight: 6, color: 'var(--accent-blue)' }} />
          The AI agent will autonomously detect, diagnose, remediate, and verify the incident. If a fix fails validation, the previous Docker image will be automatically restored.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handle} disabled={loading}>
            {loading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />Starting...</> : <><Play size={14} />Launch Simulation</>}
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useApp } from '../context/AppContext';
import { API } from '../utils/api';
import { statusIcon } from '../utils/helpers';
import IncidentDetail from '../components/IncidentDetail';

export default function IncidentsPage() {
  const { activeIncidents } = useApp();
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSev, setFilterSev] = useState('');

  const fetchIncidents = () => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    if (filterSev) params.severity = filterSev;
    API.get('/incidents', { params: { ...params, limit: 50 } })
      .then(r => setIncidents(r.data.incidents || []))
      .catch(() => { });
  };

  useEffect(() => { fetchIncidents(); }, [filterStatus, filterSev]);
  useEffect(() => {
    if (activeIncidents?.length > 0) fetchIncidents();
  }, [activeIncidents?.length]);

  const fetchDetail = (id) => {
    if(!id) return;
    API.get(`/incidents/${id}`).then(r => setSelected(r.data)).catch(() => { });
  };

  return (
    <div className="page">
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">Incidents</div>
          <div className="page-subtitle">All detected and remediated incidents</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="select" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="detecting">Detecting</option>
            <option value="diagnosing">Diagnosing</option>
            <option value="remediating">Remediating</option>
            <option value="resolved">Resolved</option>
            <option value="rolled_back">Rolled Back</option>
          </select>
          <select className="select" style={{ width: 140 }} value={filterSev} onChange={e => setFilterSev(e.target.value)}>
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
          <button className="btn btn-ghost" onClick={fetchIncidents}><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="grid-6040">
        <div className="card">
          <div className="card-header">
            <span className="card-title"><AlertTriangle size={14} />Incident Log</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{incidents?.length ?? 0} records</span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            {!incidents || incidents.length === 0 ? (
              <div className="empty-state"><AlertTriangle size={32} /><div>No incidents found</div></div>
            ) : incidents.map((inc, index) => (
              <div
                key={inc?.incidentId ?? index}
                className={`incident-row ${inc?.severity ?? 'low'}`}
                onClick={() => fetchDetail(inc?.incidentId)}
                style={{ background: selected?.incidentId === inc?.incidentId ? 'var(--bg-elevated)' : '' }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{inc?.incidentId ?? 'UNKNOWN'}</span>
                    {inc?.rollbackTriggered && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.2)', color: 'var(--accent-yellow)', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>ROLLBACK</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{inc?.title ?? 'Unknown Title'}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${inc?.severity ?? 'low'}`}>{inc?.severity ?? 'N/A'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{inc?.affectedService ?? 'Unknown'}</span>
                    {inc?.detectedAt && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{formatDistanceToNow(new Date(inc.detectedAt), { addSuffix: true })}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div className="flex gap-8" style={{ alignItems: 'center' }}>
                    {statusIcon(inc?.status)}
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{inc?.status ?? 'Pending'}</span>
                  </div>
                  {inc?.duration && <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{Math.floor(inc.duration / 60)}m{inc.duration % 60}s</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selected ? <IncidentDetail incident={selected} /> : (
            <div className="card">
              <div className="empty-state" style={{ padding: 80 }}>
                <Eye size={40} style={{ opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Select an incident</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>Click an incident to view root cause analysis, playbook execution, and AI diagnosis</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
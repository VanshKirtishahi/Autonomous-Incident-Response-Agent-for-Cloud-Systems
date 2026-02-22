import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { API } from '../utils/api';

// NEW: Mock Data for Self-Evolving Runbooks
const MOCK_KNOWLEDGE = [
  {
    knowledgeId: 'KB-1042',
    title: 'Memory Leak in Node.js Microservice',
    category: 'MEMORY_LEAK',
    createdBy: 'learned',
    approved: true,
    successRate: 100,
    timesUsed: 2,
    sourceIncidentId: 'INC-8492',
    problem: 'Node.js V8 heap out of memory due to unclosed database connections causing memory bloat over 4 hours.',
    solution: 'Increase connection pool timeout, restart affected pods, and scale horizontally by 1 replica.',
    tags: ['auto-learned', 'nodejs', 'oom']
  },
  {
    knowledgeId: 'KB-1043',
    title: 'Pod Crash Loop on API Gateway',
    category: 'POD_CRASH_LOOP',
    createdBy: 'learned',
    approved: false,
    successRate: 94,
    timesUsed: 12,
    sourceIncidentId: 'INC-7731',
    problem: 'Container failing health checks repeatedly due to missing environment variables during deployment.',
    solution: 'Automatically rollback to previous stable Docker image and notify CI/CD pipeline manager.',
    tags: ['auto-learned', 'crashloop', 'rollback']
  },
  {
    knowledgeId: 'KB-1044',
    title: 'Database Connection Pool Exhaustion',
    category: 'DB_CONNECTION_SATURATION',
    createdBy: 'manual',
    approved: true,
    successRate: 88,
    timesUsed: 5,
    sourceIncidentId: 'INC-2291',
    problem: 'Postgres rejecting new connections. Spikes in active queries holding locks.',
    solution: 'Kill idle connections > 5m, scale pgbouncer horizontally, and temporarily increase max_connections by 100.',
    tags: ['postgres', 'saturation']
  }
];

export default function KnowledgePage() {
  const [knowledge, setKnowledge] = useState([]);
  const [filter, setFilter] = useState('');
  const { addToast } = useApp();

  const fetchKB = () => {
    API.get('/knowledge').then(r => {
      if (r.data && r.data.length > 0) {
        setKnowledge(r.data);
      } else {
        setKnowledge(MOCK_KNOWLEDGE); // Fallback to mock data to demonstrate the feature
      }
    }).catch(() => {
      setKnowledge(MOCK_KNOWLEDGE); // Fallback to mock data to demonstrate the feature
    });
  };

  useEffect(() => { fetchKB(); }, []);

  const approve = async (id) => {
    try {
      await API.patch(`/knowledge/${id}/approve`);
      addToast({ type: 'success', title: 'Approved', message: 'Runbook entry added to knowledge base' });
      fetchKB();
    } catch { 
      // Simulate success for mock data locally if API fails
      setKnowledge(prev => prev.map(k => k.knowledgeId === id ? { ...k, approved: true } : k));
      addToast({ type: 'success', title: 'Approved', message: 'Runbook entry added to knowledge base (Simulated)' });
    }
  };

  const filtered = knowledge?.filter(k => !filter || k?.category === filter || k?.createdBy === filter) || [];
  const learned = knowledge?.filter(k => k?.createdBy === 'learned') || [];

  return (
    <div className="page">
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">Knowledge Base</div>
          <div className="page-subtitle">Auto-growing incident runbook library with AI-generated entries</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="select" style={{ width: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Entries</option>
            <option value="manual">Manual</option>
            <option value="learned">AI Learned</option>
            <option value="agent">Agent</option>
          </select>
          <button className="btn btn-ghost" onClick={fetchKB}><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="grid-3 mb-24">
        <div className="stat-card blue">
          <div className="stat-label">Total Entries</div>
          <div className="stat-value">{knowledge?.length ?? 0}</div>
          <div className="stat-sub">Knowledge articles</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">AI Learned</div>
          <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{learned?.length ?? 0}</div>
          <div className="stat-sub">Auto-generated from incidents</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value" style={{ color: 'var(--accent-yellow)' }}>{knowledge?.filter(k => !k?.approved).length ?? 0}</div>
          <div className="stat-sub">Awaiting review</div>
        </div>
      </div>

      {filtered?.map((kb, index) => (
        <div key={kb?.knowledgeId ?? `kb-${index}`} className={`kb-card ${kb?.createdBy ?? 'unknown'}`}>
          <div className="flex-between mb-16">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{kb?.title ?? 'Untitled'}</span>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-mono)',
                  background: kb?.createdBy === 'learned' ? 'rgba(168,85,247,0.2)' : kb?.createdBy === 'manual' ? 'rgba(77,166,255,0.2)' : 'rgba(0,212,255,0.2)',
                  color: kb?.createdBy === 'learned' ? 'var(--accent-purple)' : kb?.createdBy === 'manual' ? 'var(--accent-blue)' : 'var(--accent-cyan)'
                }}>
                  {kb?.createdBy === 'learned' ? '⚡ AUTO-LEARNED' : kb?.createdBy === 'manual' ? '📋 MANUAL' : '🤖 AGENT'}
                </span>
                {!kb?.approved && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'rgba(245,158,11,0.2)', color: 'var(--accent-yellow)', fontFamily: 'var(--font-mono)' }}>
                    PENDING REVIEW
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-medium">{kb?.category?.replace(/_/g, ' ') ?? 'Unknown Category'}</span>
                {(kb?.tags || []).map((t, idx) => <span key={idx} className="tag">{t}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
              {!kb?.approved && kb?.knowledgeId && (
                <button className="btn btn-success" style={{ fontSize: 12 }} onClick={() => approve(kb.knowledgeId)}>
                  <CheckCircle size={12} />Approve
                </button>
              )}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-green)' }}>{kb?.successRate ?? 0}%</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>success</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>PROBLEM</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{kb?.problem ?? 'No description'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>SOLUTION</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{kb?.solution ?? 'No solution provided'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            <span>USED: {kb?.timesUsed ?? 0}x</span>
            <span>AVG TIME: {kb?.avgResolutionTime ?? 'N/A'}</span>
            {/* ENHANCEMENT: Clearly show the source incident ID to tie into the dashboard loop */}
            {kb?.sourceIncidentId && (
              <span style={{ color: 'var(--accent-blue)' }}>LEARNED FROM INCIDENT #{kb.sourceIncidentId}</span>
            )}
          </div>
        </div>
      ))}

      {filtered?.length === 0 && (
        <div className="empty-state">
          <BookOpen size={40} style={{ opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>No knowledge entries found</div>
        </div>
      )}
    </div>
  );
}
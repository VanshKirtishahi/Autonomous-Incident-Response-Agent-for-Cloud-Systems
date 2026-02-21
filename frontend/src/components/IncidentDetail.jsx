import React from 'react';
import { Sparkles, AlertTriangle, RotateCcw, GitBranch } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { statusIcon, formatDuration } from '../utils/helpers';

export default function IncidentDetail({ incident }) {
  if (!incident) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="card-body">
          <div className="flex-between mb-20">
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{incident?.incidentId ?? 'UNKNOWN-ID'}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{incident?.title ?? 'Unknown Incident'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`badge badge-${incident?.severity ?? 'low'}`}>{incident?.severity ?? 'N/A'}</span>
                <span className={`badge badge-${incident?.status ?? 'unknown'}`}>{incident?.status ?? 'Pending'}</span>
                {incident?.rollbackTriggered && <span className="badge badge-rolled_back">↩ ROLLBACK</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {incident?.detectedAt && <div>DETECTED {formatDistanceToNow(new Date(incident.detectedAt), { addSuffix: true })}</div>}
              {incident?.resolvedAt && <div>RESOLVED IN {formatDuration(incident?.duration)}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Service', incident?.affectedService],
              ['Container', incident?.affectedContainer],
              ['Image', incident?.dockerImage],
              ['Previous Image', incident?.previousDockerImage],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{v || '–'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {incident?.aiAnalysis && (
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Sparkles size={14} />AI Root Cause Analysis</span>
            {incident?.aiAnalysis?.confidence && (
              <span style={{ fontSize: 12, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                {incident.aiAnalysis.confidence}% confidence
              </span>
            )}
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>SUMMARY</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{incident?.aiAnalysis?.summary ?? 'No summary available.'}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>ROOT CAUSE</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--accent-red)' }}>
                {incident?.aiAnalysis?.rootCause ?? 'Root cause not established.'}
              </div>
            </div>
            {incident?.aiAnalysis?.estimatedImpact && (
              <div style={{ fontSize: 12, color: 'var(--accent-orange)', background: 'rgba(249,115,22,0.08)', padding: 10, borderRadius: 8, border: '1px solid rgba(249,115,22,0.2)' }}>
                <AlertTriangle size={12} style={{ display: 'inline', marginRight: 6 }} />
                {incident.aiAnalysis.estimatedImpact}
              </div>
            )}
          </div>
        </div>
      )}

      {incident?.rollbackTriggered && (
        <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <RotateCcw size={18} style={{ color: 'var(--accent-yellow)', marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--accent-yellow)' }}>Automatic Rollback Triggered</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{incident?.rollbackReason ?? 'Validation failure'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  Restored: {incident?.previousDockerImage ?? 'Unknown Image'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {incident?.playbookSteps?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title"><GitBranch size={14} />Playbook Execution</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {incident.playbookSteps.filter(s => s?.status === 'completed').length}/{incident.playbookSteps.length} steps
            </span>
          </div>
          <div className="card-body">
            {incident.playbookSteps.map((step, idx) => (
              <div key={step?.step ?? idx} className="playbook-step">
                <div className={`step-num ${step?.status ?? 'pending'}`}>
                  {step?.status === 'completed' ? '✓' : step?.status === 'failed' ? '✗' : (step?.step ?? idx + 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', marginBottom: 2 }}>{step?.action ?? 'Unknown Action'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: step?.output ? 4 : 0 }}>{step?.description ?? 'No description'}</div>
                  {step?.output && (
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: step?.status === 'failed' ? 'var(--accent-red)' : 'var(--accent-green)', background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: 4 }}>
                      {step.output}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
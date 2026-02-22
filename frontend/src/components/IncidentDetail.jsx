import React, { useState } from 'react';
import { Sparkles, AlertTriangle, RotateCcw, GitBranch, Zap, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { statusIcon, formatDuration } from '../utils/helpers';

export default function IncidentDetail({ incident }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  if (!incident) return null;

  const handleApplyFix = () => {
    setApplying(true);
    // Simulate API call for executing the runbook
    setTimeout(() => {
      setApplying(false);
      setApplied(true);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* NEW: Suggestion Engine Block for Active Incidents */}
      {incident?.status !== 'resolved' && (
        <div className="card" style={{ borderColor: 'rgba(168, 85, 247, 0.4)', background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.03) 0%, transparent 100%)' }}>
           <div className="card-header" style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <span className="card-title" style={{ color: 'var(--accent-purple)' }}>
                 <Zap size={14} /> Self-Evolving Runbook Suggestion
              </span>
              <span style={{ fontSize: 12, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                 96% Match Confidence
              </span>
           </div>
           <div className="card-body">
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                 <div style={{ flex: 1, minWidth: 250 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                       Symptom signature matches a previously resolved incident (<strong>#{incident?.aiAnalysis?.similarIncident || 'INC-8492'}</strong>). 
                       Applying this auto-learned runbook has a historically high success rate.
                    </div>
                    <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--accent-purple)', marginBottom: 16 }}>
                       <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>PROPOSED FIX</div>
                       <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                          {incident?.aiAnalysis?.proposedFix || 'Restart affected pods, prune idle DB connections, and scale replicas +1.'}
                       </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                       <span><CheckCircle size={11} style={{ display: 'inline', marginRight: 4, color: 'var(--accent-green)' }}/> Success Rate: 100%</span>
                       <span><RotateCcw size={11} style={{ display: 'inline', marginRight: 4 }}/> Usage Count: 2</span>
                    </div>
                 </div>
                 <div style={{ width: 140, flexShrink: 0 }}>
                    <button 
                       className="btn btn-primary" 
                       style={{ 
                         width: '100%', 
                         padding: '10px 0', 
                         justifyContent: 'center',
                         background: applied ? 'var(--accent-green)' : 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
                         border: 'none',
                         boxShadow: applied ? '0 0 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(168, 85, 247, 0.3)'
                       }}
                       onClick={handleApplyFix}
                       disabled={applying || applied}
                    >
                       {applying ? 'Applying...' : applied ? 'Fix Applied ✓' : 'One-Click Apply'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

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
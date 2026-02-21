import React, { useState } from 'react';
import { GitBranch, RotateCcw } from 'lucide-react';

export default function PlaybooksPage() {
  const playbooks = [
    { type: 'MEMORY_LEAK', name: 'Memory Leak Response', severity: 'critical', steps: 6, avgTime: '4.2 min', successRate: 94 },
    { type: 'POD_CRASH_LOOP', name: 'Pod Crash Loop Recovery', severity: 'critical', steps: 6, avgTime: '3.8 min', successRate: 97 },
    { type: 'DB_CONNECTION_SATURATION', name: 'DB Connection Saturation', severity: 'high', steps: 6, avgTime: '6.1 min', successRate: 91 },
    { type: 'HIGH_CPU', name: 'CPU Spike Mitigation', severity: 'high', steps: 5, avgTime: '3.2 min', successRate: 88 },
    { type: 'NETWORK_LATENCY', name: 'Network Latency Recovery', severity: 'medium', steps: 5, avgTime: '4.5 min', successRate: 83 },
    { type: 'DISK_PRESSURE', name: 'Disk Pressure Relief', severity: 'high', steps: 5, avgTime: '7.2 min', successRate: 96 },
  ];

  const steps = {
    MEMORY_LEAK: ['identify_affected_containers', 'capture_heap_dump', 'scale_horizontal', 'restart_affected_pods', 'verify_memory_normal', 'alert_dev_team'],
    POD_CRASH_LOOP: ['detect_crash_pattern', 'check_dependencies', 'rollback_deployment', 'verify_pod_stability', 'update_liveness_probe', 'create_incident_ticket'],
    DB_CONNECTION_SATURATION: ['analyze_connection_pool', 'kill_idle_connections', 'identify_connection_hogs', 'scale_pgbouncer', 'tune_pool_settings', 'verify_connections_normal'],
    HIGH_CPU: ['profile_cpu_usage', 'check_for_runaway_process', 'set_cpu_limits', 'horizontal_scale', 'verify_cpu_normal'],
    NETWORK_LATENCY: ['trace_network_path', 'check_service_mesh', 'restart_ingress_controller', 'flush_dns_cache', 'verify_latency_normal'],
    DISK_PRESSURE: ['identify_disk_hogs', 'rotate_logs', 'clean_temp_files', 'expand_pvc', 'verify_disk_normal'],
  };

  const [selected, setSelected] = useState(null);

  return (
    <div className="page">
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">Remediation Playbooks</div>
          <div className="page-subtitle">Automated response procedures for each incident type</div>
        </div>
      </div>

      <div className="grid-4060">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {playbooks.map(p => (
            <div
              key={p.type}
              className="card"
              style={{ cursor: 'pointer', borderColor: selected?.type === p.type ? 'var(--accent-blue)' : '' }}
              onClick={() => setSelected(p)}
            >
              <div className="card-body" style={{ padding: 14 }}>
                <div className="flex-between mb-16">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className={`badge badge-${p.severity}`}>{p.severity}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{p.steps} steps</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-green)' }}>{p.successRate}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>success rate</div>
                  </div>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${p.successRate}%`, background: p.successRate > 90 ? 'var(--accent-green)' : p.successRate > 80 ? 'var(--accent-yellow)' : 'var(--accent-orange)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                  <span>Avg: {p.avgTime}</span>
                  <span>Includes rollback protection</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          {selected ? (
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <div className="card-header">
                <span className="card-title"><GitBranch size={14} />{selected.name}</span>
                <span className={`badge badge-${selected.severity}`}>{selected.severity}</span>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-green)' }}>{selected.successRate}%</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Success</div>
                    </div>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-blue)' }}>{selected.steps}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Steps</div>
                    </div>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-yellow)' }}>{selected.avgTime}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Avg Time</div>
                    </div>
                  </div>
                </div>

                {(steps[selected.type] || []).map((step, i) => (
                  <div key={i} className="playbook-step">
                    <div className="step-num completed">{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>{step}</div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <RotateCcw size={14} style={{ color: 'var(--accent-yellow)', marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-yellow)', marginBottom: 2 }}>Rollback Protection</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>If fix validation fails post-remediation, the agent automatically redeploys the previous Docker image to prevent extended downtime.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state" style={{ padding: 80 }}>
                <GitBranch size={40} style={{ opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Select a playbook</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
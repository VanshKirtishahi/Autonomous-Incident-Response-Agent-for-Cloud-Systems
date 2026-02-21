import React from 'react';
import { AlertOctagon, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => removeToast(t.id)}>
          <div style={{ color: t.type === 'critical' ? 'var(--accent-red)' : t.type === 'success' ? 'var(--accent-green)' : t.type === 'warning' ? 'var(--accent-yellow)' : 'var(--accent-blue)', flexShrink: 0, marginTop: 2 }}>
            {t.type === 'critical' ? <AlertOctagon size={16} /> : t.type === 'success' ? <CheckCircle size={16} /> : t.type === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.message}</div>
          </div>
          <X size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
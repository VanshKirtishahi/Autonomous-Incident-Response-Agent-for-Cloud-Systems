import React from 'react';

export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@400;500;600;700;800&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --bg-base: #050810;
        --bg-surface: #0a0e1a;
        --bg-card: #0f1424;
        --bg-card-hover: #141929;
        --bg-elevated: #1a2035;
        --border: rgba(99, 179, 237, 0.08);
        --border-bright: rgba(99, 179, 237, 0.2);
        --text-primary: #e8edf8;
        --text-secondary: #8892a4;
        --text-dim: #4a5568;
        --accent-blue: #4da6ff;
        --accent-cyan: #00d4ff;
        --accent-purple: #a855f7;
        --accent-green: #10b981;
        --accent-yellow: #f59e0b;
        --accent-red: #ef4444;
        --accent-orange: #f97316;
        --glow-blue: 0 0 20px rgba(77, 166, 255, 0.3);
        --glow-red: 0 0 20px rgba(239, 68, 68, 0.3);
        --glow-green: 0 0 20px rgba(16, 185, 129, 0.3);
        --font-main: 'Space Grotesk', sans-serif;
        --font-display: 'Syne', sans-serif;
        --font-mono: 'JetBrains Mono', monospace;
        --radius: 12px;
        --radius-sm: 8px;
      }

      body {
        font-family: var(--font-main);
        background: var(--bg-base);
        color: var(--text-primary);
        overflow-x: hidden;
        min-height: 100vh;
      }

      body::before {
        content: '';
        position: fixed;
        top: 0; left: 0; right: 0; height: 400px;
        background: radial-gradient(ellipse at 30% 0%, rgba(77, 166, 255, 0.06) 0%, transparent 60%),
                    radial-gradient(ellipse at 80% 0%, rgba(168, 85, 247, 0.04) 0%, transparent 50%);
        pointer-events: none;
        z-index: 0;
      }

      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: var(--bg-base); }
      ::-webkit-scrollbar-thumb { background: var(--bg-elevated); border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: var(--border-bright); }

      .app { display: flex; min-height: 100vh; position: relative; z-index: 1; }

      .main {
        margin-left: 240px;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .topbar {
        height: 60px;
        background: var(--bg-surface);
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        position: sticky;
        top: 0;
        z-index: 50;
      }

      .topbar-title {
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 700;
      }

      .topbar-right { display: flex; align-items: center; gap: 12px; }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border-radius: var(--radius-sm);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.15s ease;
        font-family: var(--font-main);
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--accent-blue), #2563eb);
        color: white;
        box-shadow: 0 4px 15px rgba(77, 166, 255, 0.3);
      }
      .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(77, 166, 255, 0.4); }

      .btn-danger {
        background: rgba(239, 68, 68, 0.15);
        color: var(--accent-red);
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      .btn-danger:hover { background: rgba(239, 68, 68, 0.25); }

      .btn-ghost {
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border);
      }
      .btn-ghost:hover { border-color: var(--border-bright); color: var(--text-primary); background: var(--bg-elevated); }

      .btn-success {
        background: rgba(16, 185, 129, 0.15);
        color: var(--accent-green);
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      .page { padding: 24px; }
      .page-header { margin-bottom: 24px; }
      .page-title {
        font-family: var(--font-display);
        font-size: 24px;
        font-weight: 800;
        margin-bottom: 4px;
      }
      .page-subtitle { color: var(--text-secondary); font-size: 13px; }

      .card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        transition: border-color 0.2s ease;
      }
      .card:hover { border-color: var(--border-bright); }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
      }
      .card-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .card-body { padding: 20px; }

      .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
      .stat-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 20px;
        position: relative;
        overflow: hidden;
        transition: all 0.2s ease;
      }
      .stat-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
      }
      .stat-card.blue::before { background: linear-gradient(90deg, var(--accent-blue), transparent); }
      .stat-card.red::before { background: linear-gradient(90deg, var(--accent-red), transparent); }
      .stat-card.green::before { background: linear-gradient(90deg, var(--accent-green), transparent); }
      .stat-card.purple::before { background: linear-gradient(90deg, var(--accent-purple), transparent); }

      .stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-family: var(--font-mono); }
      .stat-value { font-size: 32px; font-weight: 700; font-family: var(--font-display); line-height: 1; }
      .stat-sub { font-size: 11px; color: var(--text-dim); margin-top: 6px; }
      .stat-icon { position: absolute; right: 16px; top: 16px; opacity: 0.15; }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        font-family: var(--font-mono);
      }
      .badge-critical { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
      .badge-high { background: rgba(249, 115, 22, 0.15); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.3); }
      .badge-medium { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
      .badge-low { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
      .badge-resolved { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
      .badge-active { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
      .badge-rolled_back { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }

      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .grid-6040 { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; }
      .grid-4060 { display: grid; grid-template-columns: 2fr 3fr; gap: 20px; }

      .flex-between { display: flex; align-items: center; justify-content: space-between; }
      .mb-16 { margin-bottom: 16px; }
      .mb-20 { margin-bottom: 20px; }
      .mb-24 { margin-bottom: 24px; }

      .text-mono { font-family: var(--font-mono); }
      .text-dim { color: var(--text-dim); }
      .text-secondary { color: var(--text-secondary); }

      .active-banner {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: var(--radius);
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
        animation: alert-pulse 2s infinite;
      }

      @keyframes alert-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
        50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.15); }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: var(--text-dim);
        gap: 12px;
      }
    `}</style>
  );
}
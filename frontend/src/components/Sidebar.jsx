import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, AlertTriangle, Box, Terminal, GitBranch, BookOpen, Zap } from 'lucide-react';

export default function Sidebar({ agentActive }) {
  const navItems = [
    { path: '/', icon: <BarChart2 size={16} />, label: 'Dashboard' },
    { path: '/incidents', icon: <AlertTriangle size={16} />, label: 'Incidents' },
    { path: '/containers', icon: <Box size={16} />, label: 'Containers' },
    { path: '/logs', icon: <Terminal size={16} />, label: 'Live Logs' },
    { path: '/playbooks', icon: <GitBranch size={16} />, label: 'Playbooks' },
    { path: '/knowledge', icon: <BookOpen size={16} />, label: 'Knowledge Base' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"><Zap size={18} color="white" /></div>
        <div className="logo-text">Sequoia AI</div>
        <div className="logo-sub">INCIDENT RESPONSE SYSTEM</div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="agent-status-pill">
          <div className={`status-dot ${agentActive ? 'active' : 'inactive'}`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>AI Agent</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {agentActive ? 'MONITORING' : 'STANDBY'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
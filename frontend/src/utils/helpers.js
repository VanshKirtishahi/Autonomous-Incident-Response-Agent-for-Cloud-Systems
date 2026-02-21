import React from 'react';
import { 
  Radio, Eye, Zap, RefreshCw, CheckCircle, XCircle, RotateCcw, Info 
} from 'lucide-react';
import { format } from 'date-fns';

export function severityColor(s) {
  const colors = {
    critical: 'var(--accent-red)',
    high: 'var(--accent-orange)',
    medium: 'var(--accent-yellow)',
    low: 'var(--accent-green)'
  };
  return colors[s] || 'var(--text-dim)';
}

export function barClass(pct) {
  if (pct >= 90) return 'bar-critical';
  if (pct >= 75) return 'bar-high';
  if (pct >= 50) return 'bar-medium';
  return 'bar-low';
}

export function statusIcon(s) {
  const map = {
    detecting: React.createElement(Radio, { size: 14, className: "text-yellow" }),
    diagnosing: React.createElement(Eye, { size: 14, style: { color: 'var(--accent-blue)' } }),
    remediating: React.createElement(Zap, { size: 14, style: { color: 'var(--accent-purple)' } }),
    verifying: React.createElement(RefreshCw, { size: 14, style: { color: 'var(--accent-cyan)' } }),
    resolved: React.createElement(CheckCircle, { size: 14, style: { color: 'var(--accent-green)' } }),
    failed: React.createElement(XCircle, { size: 14, style: { color: 'var(--accent-red)' } }),
    rolled_back: React.createElement(RotateCcw, { size: 14, style: { color: 'var(--accent-yellow)' } })
  };
  return map[s] || React.createElement(Info, { size: 14 });
}

export const COLORS = ['#4da6ff', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#00d4ff'];

export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  return format(new Date(timestamp), 'HH:mm:ss.SSS');
}

export function formatDuration(seconds) {
  if (!seconds) return '–';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m${secs}s`;
}

export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Added formatUptime to resolve the missing export SyntaxError
export function formatUptime(uptime) {
  if (!uptime) return '0m';
  // If it's already a formatted string from dummyData (e.g., "14d 3h")
  if (typeof uptime === 'string') return uptime;
  
  // If the backend passes raw seconds
  const d = Math.floor(uptime / 86400);
  const h = Math.floor((uptime % 86400) / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
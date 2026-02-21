import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    BarChart2, TrendingUp, Clock, Activity, AlertTriangle,
    CheckCircle, Zap, RotateCcw, Sparkles, AlertOctagon,
    Radio, XCircle, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip, CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts';
import { useApp } from '../context/AppContext';
import { API } from '../utils/api';
import { COLORS } from '../utils/helpers';
import RecentIncidentsList from '../components/RecentIncidentsList';

export default function Dashboard() {
    const { activeIncidents, liveMetrics } = useApp();
    const [stats, setStats] = useState(null);
    const [metricsHistory, setMetricsHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = () => {
            API.get('/incidents/stats/summary').then(r => setStats(r.data)).catch(() => { });
        };
        
        fetchStats();
        const statsInterval = setInterval(fetchStats, 5000);

        API.get('/metrics?limit=30').then(r => {
            const grouped = {};
            r.data?.forEach(m => {
                const key = format(new Date(m?.timestamp || Date.now()), 'HH:mm');
                if (!grouped[key]) grouped[key] = { time: key, cpu: 0, memory: 0, latency: 0, errorRate: 0, count: 0 };
                grouped[key].cpu += m?.cpu || 0;
                grouped[key].memory += m?.memory || 0;
                grouped[key].latency += m?.networkLatency || 0;
                grouped[key].errorRate += m?.errorRate || 0;
                grouped[key].count++;
            });
            const arr = Object.values(grouped).map(g => ({
                time: g.time,
                cpu: +(g.cpu / g.count).toFixed(1),
                memory: +(g.memory / g.count).toFixed(1),
                latency: +(g.latency / g.count).toFixed(0),
                errorRate: +(g.errorRate / g.count).toFixed(2)
            })).slice(-15);
            setMetricsHistory(arr);
        }).catch(() => { });

        return () => clearInterval(statsInterval);
    }, []);

    useEffect(() => {
        if (!liveMetrics || Object.keys(liveMetrics).length === 0) return;
        const vals = Object.values(liveMetrics);
        const avg = {
            time: format(new Date(), 'HH:mm:ss'),
            cpu: +(vals.reduce((a, m) => a + (m?.cpu || 0), 0) / vals.length).toFixed(1),
            memory: +(vals.reduce((a, m) => a + (m?.memory || 0), 0) / vals.length).toFixed(1),
            latency: +(vals.reduce((a, m) => a + (m?.networkLatency || 0), 0) / vals.length).toFixed(0),
            errorRate: +(vals.reduce((a, m) => a + (m?.errorRate || 0), 0) / vals.length).toFixed(2)
        };
        setMetricsHistory(prev => [...prev.slice(-19), avg]);
    }, [liveMetrics]);

    const byType = stats?.byType || [];
    const pieData = byType.map((b, i) => ({ name: b?._id ?? 'Unknown', value: b?.count ?? 0, fill: COLORS[i % COLORS.length] }));

    const currentMetrics = metricsHistory[metricsHistory.length - 1] || { cpu: 0, memory: 0, latency: 0, errorRate: 0 };

    return (
        <div className="page">
            <div className="flex-between mb-24">
                <div>
                    <div className="page-title">Operations Dashboard</div>
                    <div className="page-subtitle">Real-time autonomous incident monitoring & response</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        LAST UPDATE: {format(new Date(), 'HH:mm:ss')}
                    </div>
                </div>
            </div>

            {activeIncidents?.filter(inc => inc?.incidentId)?.map((inc, index) => (
                <div 
                    key={inc?.incidentId ? `${inc.incidentId}-${index}` : `dash-incident-${index}`} 
                    className="incident-row active-banner" 
                    onClick={() => navigate('/incidents')}
                    style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: 8, borderRadius: 8, cursor: 'pointer' }}
                >
                    <div className="incident-info">
                        <span className="incident-id">{inc?.incidentId ?? 'N/A'}</span>
                        <span className="incident-type">
                            {inc?.type?.replace(/_/g, ' ') ?? 'Unknown Type'}
                        </span>
                        <span className="incident-service">{inc?.affectedService ?? 'Unknown Service'}</span>
                    </div>
                    <div className="incident-status">
                        <span className={`status-badge ${inc?.status ?? 'unknown'}`}>
                            {inc?.status ?? 'Pending'}
                        </span>
                    </div>
                </div>
            ))}

            <div className="stat-grid mb-24">
                <div className="stat-card blue">
                    <div className="stat-label">Total Incidents</div>
                    <div className="stat-value">{stats?.total ?? 0}</div>
                    <div className="stat-sub">All time</div>
                    <div className="stat-icon"><AlertTriangle size={40} /></div>
                </div>
                <div className="stat-card red">
                    <div className="stat-label">Active Now</div>
                    <div className="stat-value" style={{ color: activeIncidents?.filter(inc => inc?.incidentId)?.length > 0 ? 'var(--accent-red)' : 'inherit' }}>
                        {activeIncidents?.filter(inc => inc?.incidentId)?.length ?? 0}
                    </div>
                    <div className="stat-sub">Being remediated</div>
                    <div className="stat-icon"><Radio size={40} /></div>
                </div>
                <div className="stat-card green">
                    <div className="stat-label">Resolved</div>
                    <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats?.resolved ?? 0}</div>
                    <div className="stat-sub">Autonomous resolution</div>
                    <div className="stat-icon"><CheckCircle size={40} /></div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-label">Avg. Resolution</div>
                    <div className="stat-value" style={{ fontSize: 26 }}>
                        {stats?.avgResolutionTime ? `${Math.floor(stats.avgResolutionTime / 60)}m${stats.avgResolutionTime % 60}s` : '0m0s'}
                    </div>
                    <div className="stat-sub">Agent response time</div>
                    <div className="stat-icon"><Zap size={40} /></div>
                </div>
            </div>

            {/* NEW: Live System Metrics Sparklines */}
            <div className="grid-4 mb-20" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                    { label: 'CPU USAGE', value: `${currentMetrics.cpu}%`, dataKey: 'cpu', color: '#4da6ff' },
                    { label: 'MEMORY', value: `${currentMetrics.memory}%`, dataKey: 'memory', color: '#a855f7' },
                    { label: 'LATENCY', value: `${currentMetrics.latency}ms`, dataKey: 'latency', color: '#f59e0b' },
                    { label: 'ERROR RATE', value: `${currentMetrics.errorRate}%`, dataKey: 'errorRate', color: '#ef4444' }
                ].map((metric, i) => (
                    <div key={i} className="card" style={{ padding: '16px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{metric.label}</div>
                        <div style={{ fontSize: 24, fontWeight: '700', color: metric.color, marginBottom: '12px' }}>{metric.value}</div>
                        <ResponsiveContainer width="100%" height={40}>
                            <LineChart data={metricsHistory}>
                                <Line type="monotone" dataKey={metric.dataKey} stroke={metric.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ))}
            </div>

            <div className="grid-2 mb-20">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><TrendingUp size={14} />Historical Performance</span>
                        <span style={{ fontSize: 11, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>● LIVE</span>
                    </div>
                    <div className="card-body" style={{ paddingTop: 12 }}>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={metricsHistory}>
                                <defs>
                                    <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4da6ff" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4da6ff" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="time" tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                                <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                                <Area type="monotone" dataKey="cpu" stroke="#4da6ff" fill="url(#gCpu)" strokeWidth={2} dot={false} name="CPU %" />
                                <Area type="monotone" dataKey="memory" stroke="#a855f7" fill="url(#gMem)" strokeWidth={2} dot={false} name="Memory %" />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                                <div style={{ width: 12, height: 3, background: '#4da6ff', borderRadius: 2 }} />CPU
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                                <div style={{ width: 12, height: 3, background: '#a855f7', borderRadius: 2 }} />Memory
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><BarChart2 size={14} />Incidents by Type</span>
                    </div>
                    <div className="card-body" style={{ paddingTop: 8 }}>
                        {pieData?.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <PieChart width={160} height={160}>
                                    <Pie data={pieData} innerRadius={45} outerRadius={75} dataKey="value" strokeWidth={0}>
                                        {pieData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                                </PieChart>
                                <div style={{ flex: 1 }}>
                                    {pieData.map((d, i) => (
                                        <div key={`legend-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{d?.name?.replace(/_/g, ' ') ?? 'Unknown'}</div>
                                            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{d?.value ?? 0}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: 40 }}>
                                <BarChart2 size={32} />
                                <div style={{ fontSize: 13 }}>No data yet</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><Clock size={14} />Recent Incidents</span>
                        <Link to="/incidents" style={{ fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none' }}>View all →</Link>
                    </div>
                    <RecentIncidentsList incidents={activeIncidents?.filter(inc => inc?.incidentId)} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="card">
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>ROLLBACKS TRIGGERED</div>
                                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-yellow)' }}>{stats?.rollbacks ?? 0}</div>
                                </div>
                                <RotateCcw size={28} style={{ color: 'var(--accent-yellow)', opacity: 0.5 }} />
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Previous images restored automatically when fix validation fails</div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>KB PROPOSALS</div>
                                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-purple)' }}>{stats?.learningProposals ?? 0}</div>
                                </div>
                                <Sparkles size={28} style={{ color: 'var(--accent-purple)', opacity: 0.5 }} />
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Auto-generated runbook entries from resolved incidents</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
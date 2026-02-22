import React, { useState } from 'react';
import { TrendingDown, DollarSign, Activity, Zap, CheckCircle, Settings, ArrowRight, Shield } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ComposedChart, Line } from 'recharts';
import { useApp } from '../context/AppContext';

// Mock Data for the Forecast Chart
const forecastData = [
  { time: '00:00', actual: 15, predicted: 18, allocation: 80 },
  { time: '04:00', actual: 12, predicted: 15, allocation: 80 },
  { time: '08:00', actual: 45, predicted: 50, allocation: 80 },
  { time: '12:00', actual: 75, predicted: 78, allocation: 80 },
  { time: '16:00', actual: 60, predicted: 65, allocation: 80 },
  { time: '20:00', actual: 30, predicted: 35, allocation: 80 },
  { time: '24:00', actual: 18, predicted: 20, allocation: 80 },
];

// Mock Recommendations
const mockRecommendations = [
  {
    id: 'opt-1',
    service: 'api-gateway',
    pattern: 'Daily cycle (Nightly Dip)',
    oldAlloc: '4 CPU, 8GB',
    newAlloc: '2 CPU, 4GB',
    confidence: 96,
    savings: 340,
    status: 'pending',
    reason: 'Traffic drops by 85% between 00:00 and 06:00. Safe to scale down.'
  },
  {
    id: 'opt-2',
    service: 'payment-service',
    pattern: 'Over-provisioned Baseline',
    oldAlloc: '8 CPU, 16GB',
    newAlloc: '4 CPU, 8GB',
    confidence: 88,
    savings: 520,
    status: 'pending',
    reason: 'Peak CPU has never exceeded 15% in the last 90 days. Z-score anomaly check passed.'
  },
  {
    id: 'opt-3',
    service: 'user-service',
    pattern: 'Weekly cycle (Weekend Dip)',
    oldAlloc: '4 CPU, 8GB',
    newAlloc: '1 CPU, 2GB',
    confidence: 91,
    savings: 180,
    status: 'pending',
    reason: 'Consistent traffic drop on Sat/Sun. Apply scale-down schedule.'
  }
];

export default function RightsizingPage() {
  const { addToast } = useApp();
  const [execMode, setExecMode] = useState('advisory');
  const [recommendations, setRecommendations] = useState(mockRecommendations);

  const handleApply = (id) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === id ? { ...rec, status: 'applying' } : rec
    ));

    setTimeout(() => {
      setRecommendations(prev => prev.map(rec => 
        rec.id === id ? { ...rec, status: 'applied' } : rec
      ));
      addToast({ type: 'success', title: 'Optimization Applied', message: 'Cloud resources have been successfully scaled.' });
    }, 1500);
  };

  const totalSavings = recommendations.reduce((acc, curr) => acc + (curr?.status === 'applied' ? curr.savings : 0), 0);
  const potentialSavings = recommendations.reduce((acc, curr) => acc + (curr?.status === 'pending' ? curr.savings : 0), 0);

  return (
    <div className="page">
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">Smart Rightsizing</div>
          <div className="page-subtitle">Predictive auto-scaling based on historical usage patterns</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>EXECUTION MODE</div>
          <select className="select" style={{ width: 160 }} value={execMode} onChange={e => setExecMode(e.target.value)}>
            <option value="advisory">Advisory (Manual)</option>
            <option value="semi">Semi-Auto (Nights)</option>
            <option value="full">Full-Auto (Immediate)</option>
          </select>
        </div>
      </div>

      <div className="stat-grid mb-24">
        <div className="stat-card blue">
          <div className="stat-label">Current Cloud Spend</div>
          <div className="stat-value">$4,250</div>
          <div className="stat-sub">Monthly run rate</div>
          <div className="stat-icon"><Activity size={40} /></div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Identified Waste</div>
          <div className="stat-value">65%</div>
          <div className="stat-sub">Average unused capacity</div>
          <div className="stat-icon"><TrendingDown size={40} /></div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Potential Savings</div>
          <div className="stat-value" style={{ color: 'var(--accent-yellow)' }}>${potentialSavings}</div>
          <div className="stat-sub">Awaiting approval</div>
          <div className="stat-icon"><Zap size={40} /></div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Realized Savings</div>
          <div className="stat-value" style={{ color: 'var(--accent-green)' }}>${totalSavings}</div>
          <div className="stat-sub">Saved this month</div>
          <div className="stat-icon"><DollarSign size={40} /></div>
        </div>
      </div>

      <div className="grid-6040 mb-20">
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Activity size={14} /> Forecast vs. Allocation</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>24 Hour Cycle (Includes 20% Safety Buffer)</span>
          </div>
          <div className="card-body" style={{ paddingTop: 16 }}>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4da6ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4da6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#4a5568', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Area type="monotone" dataKey="actual" fill="url(#fillActual)" stroke="#4da6ff" strokeWidth={2} name="Actual Usage %" />
                <Line type="monotone" dataKey="predicted" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Predicted + 20% Buffer" />
                <Line type="step" dataKey="allocation" stroke="#ef4444" strokeWidth={2} dot={false} name="Static Allocation (Waste)" />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <div style={{ width: 12, height: 3, background: '#ef4444' }} /> Static Provisioning
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <div style={{ width: 12, height: 3, background: '#a855f7', borderBottom: '2px dashed #a855f7' }} /> Smart Auto-Scale
                </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><Settings size={14} /> Optimization Rules Engine</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>RULE 01: DOWNSIZE</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>If Allocation &gt; Predicted Need by 30% for 7 days, recommend scale down.</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>RULE 02: PRE-SCALE</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>If Predicted Peak &gt; 80% Capacity, auto-scale up 1 hour before peak.</div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-green)', marginBottom: 4 }}>
                    <Shield size={14} /> <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>SAFETY BUFFER</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>All forecasts include a 20% headroom buffer to handle unexpected traffic spikes without causing OOMs or CPU throttling.</div>
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 32 }}>Suggested Optimizations</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        {recommendations.map((rec) => (
          <div key={rec?.id} className="card" style={{ borderColor: rec?.status === 'applied' ? 'rgba(16, 185, 129, 0.3)' : '' }}>
            <div className="card-body" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 24 }}>
              
              <div style={{ width: 200 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{rec?.service}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{rec?.pattern}</div>
              </div>

              <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>CURRENT</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textDecoration: 'line-through' }}>{rec?.oldAlloc}</div>
                 </div>
                 <ArrowRight size={16} style={{ color: 'var(--text-dim)' }} />
                 <div>
                    <div style={{ fontSize: 10, color: 'var(--accent-blue)', marginBottom: 4 }}>RECOMMENDED</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{rec?.newAlloc}</div>
                 </div>
              </div>

              <div style={{ width: 120 }}>
                 <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>EST. SAVINGS</div>
                 <div style={{ fontSize: 18, color: 'var(--accent-green)', fontWeight: 700 }}>${rec?.savings}/mo</div>
                 <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{rec?.confidence}% Confidence</div>
              </div>

              <div style={{ width: 140, textAlign: 'right' }}>
                {rec?.status === 'applied' ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-green)', fontSize: 13, fontWeight: 600 }}>
                     <CheckCircle size={16} /> Applied
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleApply(rec?.id)}
                    disabled={rec?.status === 'applying'}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {rec?.status === 'applying' ? 'Applying...' : 'Apply Fix'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
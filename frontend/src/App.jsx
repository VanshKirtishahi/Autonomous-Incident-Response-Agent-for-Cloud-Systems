import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Play, StopCircle } from 'lucide-react';
import { AppContext } from './context/AppContext';
import { API } from './utils/api';
import GlobalStyles from './components/GlobalStyles';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';
import TriggerModal from './components/TriggerModal';
import Dashboard from './pages/Dashboard';
import IncidentsPage from './pages/IncidentsPage';
import ContainersPage from './pages/ContainersPage';
import LogsPage from './pages/LogsPage';
import PlaybooksPage from './pages/PlaybooksPage';
import KnowledgePage from './pages/KnowledgePage';
import RightsizingPage from './pages/RightsizingPage'; // NEW IMPORT
import './App.css';

function AppContent() {
  const [toasts, setToasts] = useState([]);
  const [agentActive, setAgentActive] = useState(true);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [liveLogs, setLiveLogs] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState({});
  const [showTrigger, setShowTrigger] = useState(false);

  const addToast = (toast) => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchUpdates = async () => {
    try {
      const incidentRes = await API.get('/incidents?status=detecting,diagnosing,remediating,verifying'); 
      setActiveIncidents(incidentRes.data?.incidents || []);

      const metricsRes = await API.get('/metrics/current');
      setLiveMetrics(metricsRes.data || {});

      const logsRes = await API.get('/logs?anomalyOnly=true&limit=10');
      setLiveLogs(logsRes.data || []);
    } catch (error) {
      console.error("Polling error:", error);
    }
  };

  useEffect(() => {
    fetchUpdates();
    const interval = setInterval(fetchUpdates, 5000);
    return () => clearInterval(interval);
  }, [activeIncidents]);

  const triggerIncident = async (type, containerId) => {
    try {
      await API.post('/incidents/trigger', { type, containerId });
      addToast({ type: 'info', title: 'Simulation Started', message: `${type.replace(/_/g, ' ')} scenario launched` });
      fetchUpdates();
    } catch (e) {
      addToast({ type: 'critical', title: 'Error', message: 'Failed to trigger simulation' });
    }
  };

  const toggleAgent = async () => {
    try {
      await API.post(agentActive ? '/agent/stop' : '/agent/start');
      setAgentActive(!agentActive);
    } catch { }
  };

  return (
    <AppContext.Provider value={{ addToast, liveMetrics, liveLogs, activeIncidents }}>
      <GlobalStyles />
      <div className="app">
        <Sidebar agentActive={agentActive} />
        <main className="main">
          <div className="topbar">
            <div className="topbar-title">Sequoia AI</div>
            <div className="topbar-right">
              <button className="btn btn-ghost" onClick={() => setShowTrigger(true)}>
                <Play size={14} />Simulate Incident
              </button>
              <button
                className={`btn ${agentActive ? 'btn-danger' : 'btn-success'}`}
                onClick={toggleAgent}
              >
                {agentActive ? <><StopCircle size={14} />Stop Agent</> : <><Play size={14} />Start Agent</>}
              </button>
            </div>
          </div>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/containers" element={<ContainersPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/playbooks" element={<PlaybooksPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/rightsizing" element={<RightsizingPage />} /> {/* NEW ROUTE */}
          </Routes>
        </main>

        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <TriggerModal open={showTrigger} onClose={() => setShowTrigger(false)} onTrigger={triggerIncident} />
      </div>
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppContent />
    </Router>
  );
}
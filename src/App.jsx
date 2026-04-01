import React, { useState, useEffect } from 'react';
import { Activity, LayoutDashboard, UserPlus, FileText, Settings, Bell, Search, ShieldCheck, LogOut, User, Menu, X } from 'lucide-react';
import axios from 'axios';
import IntakePortal from './components/IntakePortal';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState('patient'); // 'patient' or 'doctor'
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [lastSubmissionId, setLastSubmissionId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchSubmissions = async () => {
    try {
      const getBaseUrl = () => {
          if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
          if (typeof window !== 'undefined') return window.location.origin;
          return '';
      };
      const API_URL = getBaseUrl();
      const resp = await axios.get(`${API_URL}/api/submissions`);
      setSubmissions(resp.data.reverse());
    } catch (err) {
      console.error("Failed to fetch submissions");
      alert(`FETCH ERROR: ${err.message}\nURL: ${API_URL}`);
    }
  };

  useEffect(() => {
    if (view === 'doctor') {
      fetchSubmissions();
    }
  }, [view]);

  const handlePatientSubmit = (result) => {
    setLastSubmissionId(result.id);
  };

  if (view === 'patient') {
    return (
      <div className="patient-portal">
        <div className="portal-header">
          <button 
            onClick={() => setView('doctor')} 
            className="nav-item doctor-login-btn"
            onTouchEnd={() => setView('doctor')}
          >
            <ShieldCheck size={18} />
            <span>Doctor Login</span>
          </button>
        </div>

        <div className="portal-content">
          <div className="logo-container unified-logo">
            <div className="logo-icon"><ShieldCheck size={20} color="white" /></div>
            <h2>SentinelMD Patient Portal</h2>
          </div>

          {!lastSubmissionId ? (
            <IntakePortal onResult={handlePatientSubmit} />
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Activity size={32} color="var(--accent-emerald)" />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Assessment Submitted</h3>
              <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>
                Your questionnaire has been securely transmitted to the clinical review queue (ID: {lastSubmissionId.slice(0, 8)}).
                A physician will review your risk indicators shortly.
              </p>
              <button
                className="btn-primary"
                onClick={() => setLastSubmissionId(null)}
                style={{ maxWidth: '200px', margin: '0 auto' }}
              >
                New Assessment
              </button>
            </div>
          )}
        </div>
        <footer className="portal-footer">
          &copy; 2025 SentinelMD Science Fair Project
        </footer>
      </div>
    );
  }

  return (
    <div className={`app-layout ${isMobileMenuOpen ? 'mobile-menu-active' : ''}`}>
      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="logo-container">
          <div className="logo-icon">
            <ShieldCheck size={20} color="white" />
          </div>
          <h2 style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Sentinel MD</h2>
        </div>

        <nav>
          <div className={`nav-item active`}>
            <LayoutDashboard size={20} />
            <span>Review Queue</span>
          </div>
          <div className="nav-item" onClick={() => setView('patient')}>
            <LogOut size={20} />
            <span>Exit to Portal</span>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <p style={{ color: '#475569', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', paddingLeft: '1rem', marginBottom: '0.5rem' }}>System</p>
            <div className="nav-item">
              <Settings size={20} />
              <span>Settings</span>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="search-container" style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} color="#94a3b8" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Dr. Specialist</span>
              <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', border: '2px solid rgba(255,255,255,0.1)' }}></div>
            </div>
          </div>
        </header>

        <section className="content-area">
          <div className="dashboard-grid">
            {/* Patient Queue */}
            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={18} color="var(--primary)" />
                  Active Queue
                </h3>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '70vh' }}>
                {submissions.length === 0 ? (
                  <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>No pending assessments.</p>
                ) : (
                  submissions.map(sub => (
                    <div
                      key={sub.id}
                      className={`nav-item ${selectedSubmission?.id === sub.id ? 'active' : ''}`}
                      onClick={() => setSelectedSubmission(sub)}
                      style={{ margin: '0.5rem 1rem', padding: '1rem', borderRadius: '0.75rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Patient {sub.id.slice(0, 6)}</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <span className="badge" style={{ fontSize: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'var(--text-dim)', border: '1px solid var(--glass-border)' }}>
                            {sub.screening_type === 'lung_cancer' ? 'LUNG' : sub.screening_type === 'diabetes' ? 'DIAB' : 'COVID'}
                          </span>
                          <span className={`badge ${sub.prediction?.category?.toLowerCase().includes('high') ? 'badge-risk-high' : 'badge-risk-low'}`} style={{ fontSize: '0.6rem' }}>
                            {sub.prediction?.category?.split(' ')[0] || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(sub.timestamp).toLocaleTimeString()} • {sub.patient_data.age}y
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Analysis Dashboard */}
            <Dashboard
              result={selectedSubmission}
              onUpdate={(updatedData) => {
                setSubmissions(prev => prev.map(s => s.id === updatedData.id ? updatedData : s));
                setSelectedSubmission(updatedData);
              }}
            />
          </div>

          <footer style={{ marginTop: '3rem', padding: '2rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#475569', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>&copy; 2025 SentinelMD</span>
            <span>Science Fair Project</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;

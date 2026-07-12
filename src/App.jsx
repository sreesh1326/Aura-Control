import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';

// Import Views
import OverviewTab from './components/OverviewTab';
import TicketTab from './components/TicketTab';
import CrowdTab from './components/CrowdTab';
import ParkingTab from './components/ParkingTab';
import EmergencyTab from './components/EmergencyTab';

// Import Initial Data
import { INITIAL_SECTIONS, INITIAL_PARKING, INITIAL_TICKETS } from './data/mockData';

// Import Test Suite
import { runDiagnostics } from './utils/testSuite';

// Import Icons
import {
  LayoutDashboard,
  QrCode,
  Users,
  Car,
  ShieldAlert,
  Clock,
  MapPin,
  Wrench,
  CheckCircle,
  XCircle,
  X,
  AlertOctagon
} from 'lucide-react';

/** Tab configuration — single source of truth for nav items */
const NAV_TABS = [
  { id: 'overview',   label: 'Overview & Tournament',        Icon: LayoutDashboard },
  { id: 'ticketing',  label: 'Smart Ticket & QR Scan',       Icon: QrCode          },
  { id: 'crowd',      label: 'Crowd & Safety Dispatch',      Icon: Users           },
  { id: 'parking',    label: 'Parking & Gate Allocation',    Icon: Car             },
  { id: 'emergency',  label: 'Emergency & Healthcare',       Icon: ShieldAlert     },
];

/** Map tab ID → readable page title */
const TAB_TITLES = {
  overview:  'Stadium Operations & Match Center',
  ticketing: 'Ticket Integrity & QR Gate Entrance',
  crowd:     'Real-Time Crowd Density & Security Allocation',
  parking:   'Parking Navigation & Turnstile Monitor',
  emergency: 'Emergency Dispatch & Healthcare Center',
};

function App() {
  const [activeTab, setActiveTab]                 = useState('overview');
  const [sections, setSections]                   = useState(INITIAL_SECTIONS);
  const [parkingLots, setParkingLots]             = useState(INITIAL_PARKING);
  const [tickets, setTickets]                     = useState(INITIAL_TICKETS);
  const [scanLogs, setScanLogs]                   = useState([]);
  const [incidents, setIncidents]                 = useState([
    {
      id: 'INC-1002',
      category: 'Medical',
      targetGroup: 'Audience',
      title: 'Heat Exhaustion Alert',
      severity: 'Moderate',
      location: 'South Stand, Row M, Seat 32',
      description: 'Fan collapsed due to dehydration and heat.',
      status: 'Responding',
      reportedAt: '18:15:10',
      dispatchedAt: '18:17:22',
      resolvedAt: null
    }
  ]);
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [simulationSpeed, setSimulationSpeed]     = useState(1);
  const [currentTime, setCurrentTime]             = useState(new Date().toLocaleTimeString());

  // Diagnostics modal state
  const [showDiagnostics, setShowDiagnostics]     = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState([]);

  // ── Clock ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close modal on Escape key — accessibility requirement
  useEffect(() => {
    if (!showDiagnostics) return;
    const handleKey = (e) => { if (e.key === 'Escape') setShowDiagnostics(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showDiagnostics]);

  // ── Memoised derived values ────────────────────────────────────────────
  const criticalThreats = useMemo(
    () => incidents.filter(i => i.status !== 'Resolved' && i.severity === 'Critical'),
    [incidents]
  );

  const crowdAlerts = useMemo(
    () => sections.filter(s => (s.occupancy / s.capacity) * 100 >= 95),
    [sections]
  );

  const pendingCount = useMemo(
    () => incidents.filter(i => i.status === 'Pending Dispatch').length,
    [incidents]
  );

  const sysStatus = useMemo(() => {
    if (criticalThreats.length > 0) return { name: 'CRITICAL WARNING',   color: 'var(--rose)'   };
    if (crowdAlerts.length > 0)     return { name: 'CONGESTION WARNING', color: 'var(--amber)'  };
    return                                 { name: 'SYSTEMS ONLINE',     color: 'var(--emerald)' };
  }, [criticalThreats.length, crowdAlerts.length]);

  const alertTicker = useMemo(() => [
    ...criticalThreats.map(t => `[CRITICAL EMERGENCY] ${t.title} reported at ${t.location}.`),
    ...crowdAlerts.map(c => `[OVERCROWDING WARNING] ${c.name.split(' (')[0]} is at ${((c.occupancy / c.capacity) * 100).toFixed(0)}% capacity.`),
  ].join('  |  '), [criticalThreats, crowdAlerts]);

  // ── Callbacks ─────────────────────────────────────────────────────────
  const handleRunDiagnostics = useCallback(() => {
    const results = runDiagnostics(sections, parkingLots);
    setDiagnosticResults(results);
    setShowDiagnostics(true);
  }, [sections, parkingLots]);

  const handleCloseDiagnostics = useCallback(() => setShowDiagnostics(false), []);

  // ── Passed/failed summary ──────────────────────────────────────────────
  const passedCount = diagnosticResults.filter(r => r.status === 'PASSED').length;
  const allPassed   = diagnosticResults.length > 0 && passedCount === diagnosticResults.length;

  return (
    <div className="app-wrapper">

      {/* ── Sidebar Navigation ──────────────────────────────────────────── */}
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        <div className="sidebar-header">
          <div className="logo-icon" aria-hidden="true">A</div>
          <span className="logo-text">AURA CONTROL</span>
        </div>

        <nav className="nav-menu" aria-label="Dashboard sections">
          {NAV_TABS.map(({ id, label, Icon }) => {
            const isEmergency = id === 'emergency';
            const hasBadge    = isEmergency && pendingCount > 0;
            return (
              <button
                key={id}
                className={`nav-item ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                aria-label={hasBadge ? `${label} — ${pendingCount} pending dispatch` : label}
                style={hasBadge ? { borderLeft: '3px solid var(--rose)', color: 'var(--rose)' } : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="nav-label">{label}</span>
                {hasBadge && (
                  <span
                    className="nav-badge"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}

          <button
            className="nav-item"
            style={{ marginTop: 'auto', color: 'var(--cyan)' }}
            onClick={handleRunDiagnostics}
            aria-label="Run automated system diagnostics"
          >
            <Wrench size={18} aria-hidden="true" />
            <span className="nav-label">Run Test Diagnostics</span>
          </button>
        </nav>

        <div className="sidebar-footer" role="contentinfo">
          <div>AURA v2.6.4 (PROD)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={10} aria-hidden="true" /> Metropolis Arena
          </div>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="main-content" id="main-content" tabIndex={-1}>

        {/* Header Bar */}
        <header className="header-bar" role="banner">
          <div className="header-title-container">
            {/* Single <h1> per page — rotates with active tab */}
            <h1 className="header-title" style={{ fontSize: '20px', margin: '0' }}>
              {TAB_TITLES[activeTab]}
            </h1>

            <div
              className="header-status"
              style={{
                color:       sysStatus.color,
                borderColor: `${sysStatus.color}30`,
                background:  `${sysStatus.color}10`,
              }}
              role="status"
              aria-live="polite"
              aria-label={`System status: ${sysStatus.name}`}
            >
              <span
                style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: sysStatus.color }}
                className="pulsing-ring"
                aria-hidden="true"
              />
              {sysStatus.name}
            </div>
          </div>

          <div className="header-actions">
            {simulationRunning && (
              <span
                style={{ fontSize: '11px', color: 'var(--emerald)', background: 'rgba(16,185,129,0.08)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.2)' }}
                aria-label={`Live simulation active at ${simulationSpeed}x speed`}
              >
                ⚡ Sim Active ({simulationSpeed}x)
              </span>
            )}

            <div className="time-badge" aria-label={`Current time: ${currentTime}`}>
              <Clock size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} aria-hidden="true" />
              <time>{currentTime}</time>
            </div>
          </div>
        </header>

        {/* Global Critical Alerts Ticker */}
        {(criticalThreats.length > 0 || crowdAlerts.length > 0) && (
          <div
            style={{ background: 'var(--rose)', color: 'white', padding: '6px 20px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flexShrink: 0 }}
            role="alert"
            aria-live="assertive"
            aria-label="Critical stadium alert"
          >
            <AlertOctagon size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
            <div className="alert-marquee" style={{ width: '100%' }}>
              {alertTicker}
            </div>
          </div>
        )}

        {/* View Router */}
        {activeTab === 'overview' && (
          <OverviewTab
            sections={sections}
            parkingLots={parkingLots}
            tickets={tickets}
            incidents={incidents}
          />
        )}
        {activeTab === 'ticketing' && (
          <TicketTab
            tickets={tickets}
            setTickets={setTickets}
            scanLogs={scanLogs}
            setScanLogs={setScanLogs}
            sections={sections}
          />
        )}
        {activeTab === 'crowd' && (
          <CrowdTab
            sections={sections}
            setSections={setSections}
            simulationRunning={simulationRunning}
            setSimulationRunning={setSimulationRunning}
            simulationSpeed={simulationSpeed}
            setSimulationSpeed={setSimulationSpeed}
          />
        )}
        {activeTab === 'parking' && (
          <ParkingTab
            parkingLots={parkingLots}
            setParkingLots={setParkingLots}
            sections={sections}
          />
        )}
        {activeTab === 'emergency' && (
          <EmergencyTab
            incidents={incidents}
            setIncidents={setIncidents}
          />
        )}
      </main>

      {/* ── Diagnostics Modal ────────────────────────────────────────────── */}
      {showDiagnostics && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="diagnostics-title"
          aria-describedby="diagnostics-desc"
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseDiagnostics(); }}
        >
          <div
            className="glass-panel"
            style={{ width: '90%', maxWidth: '680px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-focus)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(6,182,212,0.25)' }}
          >
            <div className="card-header" style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.05)' }}>
              <h2 id="diagnostics-title" className="card-title" style={{ color: 'var(--cyan)' }}>
                <Wrench size={18} aria-hidden="true" />
                AURA Automated Verification System
              </h2>
              <button
                onClick={handleCloseDiagnostics}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                aria-label="Close diagnostics panel"
              >
                <X size={20} />
              </button>
            </div>

            <div className="card-body" style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p id="diagnostics-desc" style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Executing operations pipeline verification tests across {diagnosticResults.length} test cases — covering ticket integrity, crowd safety, parking routing, emergency lifecycle, and boundary guards.
              </p>

              {/* Pass / fail summary strip */}
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                <span style={{ color: 'var(--emerald)', fontWeight: 'bold' }}>✓ {passedCount} Passed</span>
                <span style={{ color: 'var(--rose)', fontWeight: 'bold' }}>✗ {diagnosticResults.length - passedCount} Failed</span>
              </div>

              <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {diagnosticResults.map((res) => (
                  <div
                    key={res.id}
                    role="listitem"
                    style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-card)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
                  >
                    {res.status === 'PASSED'
                      ? <CheckCircle size={20} style={{ color: 'var(--emerald)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                      : <XCircle    size={20} style={{ color: 'var(--rose)',    flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                    }
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{res.name}</span>
                        <span
                          style={{
                            fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px',
                            background: res.status === 'PASSED' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                            color:      res.status === 'PASSED' ? 'var(--emerald)'        : 'var(--rose)',
                          }}
                          aria-label={`Test ${res.id}: ${res.status}`}
                        >
                          {res.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{res.details}</div>
                    </div>
                  </div>
                ))}
              </div>

              {allPassed && (
                <div
                  role="status"
                  style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--emerald)', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}
                >
                  ✓ ALL {diagnosticResults.length} VERIFICATION TESTS COMPLETED WITH 100% INTEGRITY RATING
                </div>
              )}
            </div>

            <div className="card-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-card)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(15,18,28,0.5)' }}>
              <button className="btn-primary" onClick={handleCloseDiagnostics}>
                Acknowledge &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

import React, { useState, useCallback, useMemo } from 'react';
import { QrCode, ShieldAlert, CheckCircle, AlertTriangle, UserPlus } from 'lucide-react';

/**
 * generateSecureHash
 * Djb2-style hash over "code-name-seat-SALT" to produce an 8-char hex signature.
 * The same algorithm is mirrored in testSuite.js for diagnostic verification.
 */
const generateSecureHash = (code, name, seat) => {
  const stringToHash = `${code}-${name}-${seat}-SECRET_SALT_2026`;
  let hash = 0;
  for (let i = 0; i < stringToHash.length; i++) {
    hash = (hash << 5) - hash + stringToHash.charCodeAt(i);
    hash |= 0; // Coerce to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
};

/** Ticket section price map */
const SECTION_PRICES = { north: '$45', east: '$50', south: '$35', west: '$90', vip: '$250' };

/**
 * TicketTab
 * Handles ticket issuance, QR-code gate scanning, fraud & duplicate detection,
 * and a live security event log for the AURA Smart Stadium dashboard.
 */
export default function TicketTab({ tickets, setTickets, scanLogs, setScanLogs, sections }) {
  const [newName, setNewName]               = useState('');
  const [selectedSection, setSelectedSection] = useState('north');
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [scanResult, setScanResult]          = useState(null);
  const [noTicketWarning, setNoTicketWarning] = useState(false);

  // ── Derived values ──────────────────────────────────────────────────────
  const scannedCount  = useMemo(() => tickets.filter(t => t.scans > 0).length, [tickets]);
  const fraudCount    = useMemo(() => tickets.filter(t => t.status === 'FRAUD_ATTEMPT' || t.status === 'DUPLICATE_ATTEMPT').length, [tickets]);

  // ── Logging helper ───────────────────────────────────────────────────────
  const addLog = useCallback((message) => {
    const time = new Date().toLocaleTimeString();
    setScanLogs(prev => [`[${time}] ${message}`, ...prev]);
  }, [setScanLogs]);

  // ── Ticket Generation ───────────────────────────────────────────────────
  const handleGenerateTicket = useCallback((e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    const section  = sections.find(s => s.id === selectedSection);
    const randNum  = Math.floor(1000 + Math.random() * 9000);
    const code     = `TKT-${selectedSection.toUpperCase()}-${randNum}`;
    const row      = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const seatNum  = Math.floor(1 + Math.random() * 50);
    const seatDesc = `Sec ${selectedSection.toUpperCase()[0]}${Math.floor(Math.random() * 4) + 1}, Row ${row}, Seat ${seatNum}`;
    const price    = SECTION_PRICES[selectedSection] ?? '$40';
    const hash     = generateSecureHash(code, trimmed, seatDesc);

    const newTicket = {
      ticketCode: code,
      name:       trimmed,
      sectionId:  selectedSection,
      seat:       seatDesc,
      price,
      status:     'VALID',
      scans:      0,
      hash,
    };

    setTickets(prev => [newTicket, ...prev]);
    setNewName('');
    addLog(`Ticket generated: ${code} for ${trimmed} (${seatDesc})`);
  }, [newName, selectedSection, sections, setTickets, addLog]);

  // ── QR Scan & Fraud Detection ───────────────────────────────────────────
  const handleScanTicket = useCallback((code, scanType = 'normal') => {
    const time = new Date().toLocaleTimeString();

    // 1. Counterfeit check — code must exist in database
    const ticket = tickets.find(t => t.ticketCode === code);
    if (scanType === 'unknown' || !ticket) {
      const unknownCode = scanType === 'unknown'
        ? `TKT-FAKE-${Math.floor(1000 + Math.random() * 9000)}`
        : code;
      setScanResult({ success: false, title: 'FRAUD ALERT: Counterfeit Ticket', message: 'The scanned ticket code does not exist in the registration database.', code: unknownCode, timestamp: time });
      addLog(`🚨 SECURITY BREACH: Unknown ticket code scanned (${unknownCode}). Counterfeit/Fraud detected!`);
      return;
    }

    // 2. Build the ticket as it was presented at the gate
    let presented = { ...ticket };
    if (scanType === 'tampered') {
      presented.name = 'Fake Attendant';
      presented.seat = 'Sec VIP, Row A, Seat 1';
    }

    // 3. Cryptographic integrity check
    const expectedHash  = generateSecureHash(presented.ticketCode, presented.name, presented.seat);
    const isHashValid   = presented.hash === expectedHash;

    if (!isHashValid) {
      setScanResult({ success: false, title: 'FRAUD ALERT: Tampered Ticket Details', message: `Ticket data has been altered. Authorised: ${ticket.name} (${ticket.seat}). Presented: ${presented.name} (${presented.seat}).`, code: presented.ticketCode, timestamp: time });
      addLog(`🚨 SECURITY BREACH: Forged ticket details for ${presented.ticketCode}. Hash verification failed!`);
      setTickets(prev => prev.map(t => t.ticketCode === code ? { ...t, status: 'FRAUD_ATTEMPT' } : t));
      return;
    }

    // 4. Duplicate scan check
    if (ticket.scans > 0) {
      setScanResult({ success: false, title: 'ACCESS DENIED: Duplicate Ticket Scan', message: `This ticket has already been used. Scan count: ${ticket.scans + 1}. First entry: ${ticket.lastScannedTime}.`, code: ticket.ticketCode, timestamp: time });
      addLog(`🚨 ACCESS WARNING: Duplicate scan for ${ticket.ticketCode}. Already scanned at ${ticket.lastScannedTime}.`);
      setTickets(prev => prev.map(t => t.ticketCode === code ? { ...t, scans: t.scans + 1, status: 'DUPLICATE_ATTEMPT' } : t));
      return;
    }

    // 5. Valid access granted
    const section = sections.find(s => s.id === ticket.sectionId);
    const gateInfo = section ? section.gates.join(' or ') : 'Gate 1';

    setTickets(prev => prev.map(t => t.ticketCode === code ? { ...t, scans: 1, lastScannedTime: time, status: 'SCANNED' } : t));
    setScanResult({ success: true, title: 'ACCESS GRANTED', message: `Verified: ${ticket.name}. Seat: ${ticket.seat}. Gate: ${gateInfo}. Welcome to the stadium!`, code: ticket.ticketCode, timestamp: time });
    addLog(`✅ VERIFIED: ${code} — ${ticket.name} → ${gateInfo}`);
  }, [tickets, sections, setTickets, addLog]);

  // ── Simulate tamper on first ticket — no alert() ─────────────────────────
  const handleSimulateTamper = useCallback(() => {
    if (tickets.length === 0) {
      setNoTicketWarning(true);
      setTimeout(() => setNoTicketWarning(false), 3000);
      return;
    }
    setNoTicketWarning(false);
    handleScanTicket(tickets[0].ticketCode, 'tampered');
  }, [tickets, handleScanTicket]);

  // ── Status badge helper ──────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    const styles = {
      SCANNED:           { bg: 'rgba(16,185,129,0.15)',   color: 'var(--emerald)', border: 'rgba(16,185,129,0.3)',   label: 'SCANNED'          },
      FRAUD_ATTEMPT:     { bg: 'rgba(244,63,94,0.15)',    color: 'var(--rose)',    border: 'rgba(244,63,94,0.3)',    label: 'TAMPER FRAUD'     },
      DUPLICATE_ATTEMPT: { bg: 'rgba(245,158,11,0.15)',   color: 'var(--amber)',   border: 'rgba(245,158,11,0.3)',   label: 'DUPLICATE SCANNED'},
    };
    const s = styles[status] ?? { bg: 'rgba(6,182,212,0.15)', color: 'var(--cyan)', border: 'rgba(6,182,212,0.3)', label: 'ACTIVE' };
    return (
      <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="view-container">
      {/* Quick-stat KPI strip */}
      <div className="dashboard-grid">
        <div className="col-3 glass-panel glow-cyan">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(6,182,212,0.1)', borderRadius: '12px', color: 'var(--cyan)' }}><QrCode size={22} aria-hidden="true" /></div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Tickets Issued</div>
              <div style={{ fontSize: '22px', fontWeight: '700' }}>{tickets.length}</div>
            </div>
          </div>
        </div>
        <div className="col-3 glass-panel glow-emerald">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', color: 'var(--emerald)' }}><CheckCircle size={22} aria-hidden="true" /></div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Gate Admissions</div>
              <div style={{ fontSize: '22px', fontWeight: '700' }}>{scannedCount}</div>
            </div>
          </div>
        </div>
        <div className={`col-3 glass-panel ${fraudCount > 0 ? 'glow-rose' : ''}`}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: fraudCount > 0 ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.1)', borderRadius: '12px', color: fraudCount > 0 ? 'var(--rose)' : 'var(--amber)' }}>
              <ShieldAlert size={22} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Fraud Incidents</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: fraudCount > 0 ? 'var(--rose)' : 'inherit' }}>{fraudCount}</div>
            </div>
          </div>
        </div>
        <div className="col-3 glass-panel">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', color: 'var(--violet)' }}><AlertTriangle size={22} aria-hidden="true" /></div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active (Unscanned)</div>
              <div style={{ fontSize: '22px', fontWeight: '700' }}>{tickets.filter(t => t.status === 'VALID').length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="col-7 flex-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Ticket Issuance */}
          <div className="glass-panel">
            <div className="card-header">
              <h2 className="card-title">
                <UserPlus size={18} style={{ color: 'var(--cyan)' }} aria-hidden="true" />
                Smart Ticket Issuing System
              </h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleGenerateTicket} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} aria-label="Issue a new stadium ticket">
                <div style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="spectator-name" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Spectator Full Name</label>
                  <input
                    id="spectator-name"
                    type="text"
                    placeholder="e.g. Liam Neeson"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                    autoComplete="name"
                    aria-required="true"
                  />
                </div>

                <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="sector-select" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Stadium Sector Allocation</label>
                  <select id="sector-select" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name.split(' (')[0]}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', paddingTop: '10px' }}>
                  <button type="submit" className="btn-primary" style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎟️ Issue Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* QR Scanner */}
          <div className="glass-panel">
            <div className="card-header">
              <h2 className="card-title">
                <QrCode size={18} style={{ color: 'var(--cyan)' }} aria-hidden="true" />
                Real-Time Gate Entrance Scanner Simulator
              </h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Camera viewport */}
                <div
                  role="img"
                  aria-label="Simulated QR code camera stream. Gate Turnstile Scanner v4.2"
                  style={{ background: '#04060a', borderRadius: '12px', border: '2px solid rgba(6,182,212,0.2)', aspectRatio: '4/3', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', top: '16px', left: '16px', borderTop: '3px solid var(--cyan)', borderLeft: '3px solid var(--cyan)', width: '20px', height: '20px' }} aria-hidden="true" />
                  <div style={{ position: 'absolute', top: '16px', right: '16px', borderTop: '3px solid var(--cyan)', borderRight: '3px solid var(--cyan)', width: '20px', height: '20px' }} aria-hidden="true" />
                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', borderBottom: '3px solid var(--cyan)', borderLeft: '3px solid var(--cyan)', width: '20px', height: '20px' }} aria-hidden="true" />
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', borderBottom: '3px solid var(--cyan)', borderRight: '3px solid var(--cyan)', width: '20px', height: '20px' }} aria-hidden="true" />
                  <div className="scanner-line" style={{ position: 'absolute', top: '20%', left: '10%', right: '10%', height: '2px', background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)', zIndex: 2 }} aria-hidden="true" />
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--cyan)', opacity: 0.7, marginBottom: '12px' }} aria-hidden="true">
                    <path d="M3 3h6v6H3V3zm0 12h6v6H3v-6zm12-12h6v6h-6V3zm3 18h3m-3-3h.01M21 15v3m-6 3h3m-3-6h3m0 3h.01" />
                  </svg>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', zIndex: 3 }}>CAMERA STREAM: ACTIVE</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gate Turnstile QR Scanner v4.2</div>
                </div>

                {/* Scan controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="manual-scan-input" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manual Scanner Input</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        id="manual-scan-input"
                        type="text"
                        placeholder="Paste Ticket Code"
                        value={manualCodeInput}
                        onChange={e => setManualCodeInput(e.target.value)}
                        style={{ flex: '1' }}
                        aria-label="Enter ticket code for manual scanning"
                        onKeyDown={e => { if (e.key === 'Enter') handleScanTicket(manualCodeInput); }}
                      />
                      <button
                        className="btn-secondary"
                        style={{ padding: '0 12px' }}
                        onClick={() => handleScanTicket(manualCodeInput)}
                        aria-label="Scan the entered ticket code"
                      >
                        Scan
                      </button>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-card)', padding: '10px 0' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>Simulate Security Threats:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        className="btn-danger"
                        style={{ fontSize: '11px', padding: '6px' }}
                        onClick={() => handleScanTicket('FAKE-CODE-999', 'unknown')}
                        aria-label="Simulate counterfeit ticket scan"
                      >
                        ⚠️ Counterfeit
                      </button>
                      <button
                        className="btn-danger"
                        style={{ fontSize: '11px', padding: '6px' }}
                        onClick={handleSimulateTamper}
                        aria-label="Simulate tampered ticket details scan"
                      >
                        ⚡ Tamper Details
                      </button>
                    </div>

                    {/* Inline warning replaces browser alert() */}
                    {noTicketWarning && (
                      <div
                        role="alert"
                        style={{ marginTop: '8px', fontSize: '11px', color: 'var(--amber)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '6px 10px' }}
                      >
                        ⚠️ Please issue a ticket first before simulating a tamper attack.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scan result */}
              {scanResult && (
                <div
                  role="status"
                  aria-live="polite"
                  aria-label={`Scan result: ${scanResult.title}`}
                  style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', background: scanResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', border: scanResult.success ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(244,63,94,0.3)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                >
                  {scanResult.success
                    ? <CheckCircle size={24} style={{ color: 'var(--emerald)', flexShrink: 0 }} aria-hidden="true" />
                    : <ShieldAlert  size={24} style={{ color: 'var(--rose)', flexShrink: 0 }} aria-hidden="true" />
                  }
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: scanResult.success ? 'var(--emerald)' : 'var(--rose)' }}>{scanResult.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{scanResult.message}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Code: <code style={{ color: 'white' }}>{scanResult.code}</code> | Scanned: {scanResult.timestamp}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Security Log & Ticket DB */}
        <div className="col-5 glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h2 className="card-title">
              <ShieldAlert size={18} style={{ color: 'var(--rose)' }} aria-hidden="true" />
              Cyber-Ticketing Security Logger
            </h2>
            <button
              className="btn-secondary"
              style={{ padding: '4px 8px', fontSize: '11px' }}
              onClick={() => setScanLogs([])}
              aria-label="Clear all security log entries"
            >
              Clear Logs
            </button>
          </div>

          <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              className="logs-box fraud"
              style={{ height: '180px' }}
              role="log"
              aria-label="Security event log"
              aria-live="polite"
            >
              {scanLogs.length === 0
                ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '60px' }}>System idle. Standing by for scan events…</div>
                : scanLogs.map((log, i) => (
                    <div
                      key={i}
                      className="log-entry"
                      style={{ color: log.includes('ACCESS WARNING') ? 'var(--amber)' : log.includes('SECURITY BREACH') ? 'var(--rose)' : log.includes('✅') ? 'var(--emerald)' : '#94a3b8' }}
                    >
                      {log}
                    </div>
                  ))
              }
            </div>

            {/* Tickets database */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Active Stadium Database ({tickets.length})
              </h3>
              <div style={{ overflowY: 'auto', maxHeight: '250px', border: '1px solid var(--border-card)', borderRadius: '8px' }}>
                <table className="premium-table" style={{ fontSize: '12px' }} aria-label="Issued tickets database">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Ticket Code</th>
                      <th scope="col">Section</th>
                      <th scope="col">Status</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.ticketCode}>
                        <td style={{ fontWeight: '600' }}>{t.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{t.ticketCode}</td>
                        <td>{t.sectionId.toUpperCase()}</td>
                        <td>{getStatusBadge(t.status)}</td>
                        <td>
                          <button
                            className="btn-primary"
                            style={{ padding: '3px 8px', fontSize: '10px', boxShadow: 'none' }}
                            onClick={() => handleScanTicket(t.ticketCode)}
                            aria-label={`Scan QR code for ticket ${t.ticketCode} issued to ${t.name}`}
                          >
                            📷 Scan QR
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

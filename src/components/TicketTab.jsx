import React, { useState } from 'react';
import { QrCode, ShieldAlert, CheckCircle, AlertTriangle, UserPlus, ListFilter, Trash } from 'lucide-react';

// Simple hashing function to simulate a secure validation signature
const generateSecureHash = (code, name, seat) => {
  let stringToHash = `${code}-${name}-${seat}-SECRET_SALT_2026`;
  let hash = 0;
  for (let i = 0; i < stringToHash.length; i++) {
    hash = (hash << 5) - hash + stringToHash.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
};

export default function TicketTab({ tickets, setTickets, scanLogs, setScanLogs, sections }) {
  const [newName, setNewName] = useState('');
  const [selectedSection, setSelectedSection] = useState('north');
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  
  // Create a new ticket
  const handleGenerateTicket = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const section = sections.find(s => s.id === selectedSection);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const code = `TKT-${selectedSection.toUpperCase()}-${randNum}`;
    const row = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const seatNum = Math.floor(1 + Math.random() * 50);
    const seatDesc = `Sec ${selectedSection.toUpperCase()[0]}${Math.floor(Math.random()*4)+1}, Row ${row}, Seat ${seatNum}`;
    
    const prices = { north: '$45', east: '$50', south: '$35', west: '$90', vip: '$250' };
    const price = prices[selectedSection] || '$40';
    const hash = generateSecureHash(code, newName, seatDesc);

    const newTicket = {
      ticketCode: code,
      name: newName,
      sectionId: selectedSection,
      seat: seatDesc,
      price: price,
      status: 'VALID',
      scans: 0,
      hash: hash,
    };

    setTickets(prev => [newTicket, ...prev]);
    setNewName('');
    
    // Add to scan logs
    addLog(`Ticket generated successfully: ${code} for ${newName} (${seatDesc})`, 'system');
  };

  const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setScanLogs(prev => [`[${time}] ${message}`, ...prev]);
  };

  // Main QR code scanning and fraud detection logic
  const handleScanTicket = (code, scanType = 'normal') => {
    const time = new Date().toLocaleTimeString();
    
    // 1. Check if ticket exists in database
    let ticket = tickets.find(t => t.ticketCode === code);
    
    if (scanType === 'unknown' || !ticket) {
      const mockUnknownCode = scanType === 'unknown' ? `TKT-FAKE-${Math.floor(1000 + Math.random() * 9000)}` : code;
      const errorMsg = `🚨 SECURITY BREACH: Access Denied. Unknown Ticket Code scanned (${mockUnknownCode}). Counterfeit/Fraud detected!`;
      setScanResult({
        success: false,
        title: 'FRAUD ALERT: Counterfeit Ticket',
        message: 'The scanned ticket code does not exist in the registration database.',
        code: mockUnknownCode,
        timestamp: time
      });
      addLog(errorMsg, 'error');
      return;
    }

    // Clone ticket for manipulation in case of simulation
    let processedTicket = { ...ticket };

    // Simulate tampered ticket details
    if (scanType === 'tampered') {
      processedTicket.name = 'Fake Attendant';
      processedTicket.seat = 'Sec VIP, Row A, Seat 1';
      // Hash is unchanged, so checking code + fake details against hash will fail!
    }

    // 2. Validate cryptographic hash signature (Integrity check)
    const expectedHash = generateSecureHash(processedTicket.ticketCode, processedTicket.name, processedTicket.seat);
    const isSignatureValid = processedTicket.hash === expectedHash;

    if (!isSignatureValid) {
      const errorMsg = `🚨 SECURITY BREACH: Forged ticket details detected for ${processedTicket.ticketCode}. Signature hash verification failed!`;
      setScanResult({
        success: false,
        title: 'FRAUD ALERT: Tampered Ticket Details',
        message: `Ticket data has been altered. Authorized: ${ticket.name} (Seat: ${ticket.seat}). Scanned: ${processedTicket.name} (Seat: ${processedTicket.seat}).`,
        code: processedTicket.ticketCode,
        timestamp: time
      });
      addLog(errorMsg, 'error');
      
      // Update ticket status to suspicious in list
      setTickets(prev => prev.map(t => t.ticketCode === code ? { ...t, status: 'FRAUD_ATTEMPT' } : t));
      return;
    }

    // 3. Check for Duplicate Scans
    if (ticket.scans > 0) {
      const errorMsg = `🚨 ACCESS WARNING: Duplicate ticket scan attempt for ${ticket.ticketCode}. Already scanned at ${ticket.lastScannedTime}.`;
      setScanResult({
        success: false,
        title: 'ACCESS DENIED: Duplicate Ticket Scan',
        message: `This ticket has already been used. Scans count: ${ticket.scans + 1}. First entry was at ${ticket.lastScannedTime}.`,
        code: ticket.ticketCode,
        timestamp: time
      });
      addLog(errorMsg, 'error');
      
      // Update scan count and status in db
      setTickets(prev => prev.map(t => {
        if (t.ticketCode === code) {
          return { ...t, scans: t.scans + 1, status: 'DUPLICATE_ATTEMPT' };
        }
        return t;
      }));
      return;
    }

    // 4. Success Scan
    const section = sections.find(s => s.id === ticket.sectionId);
    const gateInfo = section ? section.gates.join(' or ') : 'Gate 1';

    setTickets(prev => prev.map(t => {
      if (t.ticketCode === code) {
        return { ...t, scans: 1, lastScannedTime: time, status: 'SCANNED' };
      }
      return t;
    }));

    setScanResult({
      success: true,
      title: 'ACCESS GRANTED',
      message: `Verified: ${ticket.name}. Seat: ${ticket.seat}. Gate allocated: ${gateInfo}. Welcome to the stadium!`,
      code: ticket.ticketCode,
      timestamp: time
    });
    
    addLog(`✅ VERIFIED: Ticket ${code} scanned. Holder: ${ticket.name}. Entrance: ${gateInfo}`, 'success');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCANNED':
        return <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>SCANNED</span>;
      case 'FRAUD_ATTEMPT':
        return <span style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--rose)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>TAMPER FRAUD</span>;
      case 'DUPLICATE_ATTEMPT':
        return <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--amber)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>DUPLICATE SCANNED</span>;
      default:
        return <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--cyan)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>ACTIVE</span>;
    }
  };

  return (
    <div className="view-container">
      <div className="dashboard-grid">
        {/* Left Column: Generate Tickets & Scan Console */}
        <div className="col-7 flex-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Ticket Registration / Generation Card */}
          <div className="glass-panel">
            <div className="card-header">
              <h2 className="card-title">
                <UserPlus size={18} style={{ color: 'var(--cyan)' }} />
                Smart Ticket Issuing System
              </h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleGenerateTicket} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Spectator Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter Name (e.g. Liam Neeson)" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    required 
                  />
                </div>
                
                <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Stadium Sector Allocation</label>
                  <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
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

          {/* QR Code Scanner Console Simulation */}
          <div className="glass-panel">
            <div className="card-header">
              <h2 className="card-title">
                <QrCode size={18} style={{ color: 'var(--cyan)' }} />
                Real-Time Gate Entrance Scanner Simulator
              </h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* Simulated Camera Window */}
                <div style={{ 
                  background: '#04060a', 
                  borderRadius: '12px', 
                  border: '2px solid rgba(6, 182, 212, 0.2)',
                  aspectRatio: '4/3',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {/* Camera overlay corners */}
                  <div style={{ position: 'absolute', top: '16px', left: '16px', borderTop: '3px solid var(--cyan)', borderLeft: '3px solid var(--cyan)', width: '20px', height: '20px' }}></div>
                  <div style={{ position: 'absolute', top: '16px', right: '16px', borderTop: '3px solid var(--cyan)', borderRight: '3px solid var(--cyan)', width: '20px', height: '20px' }}></div>
                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', borderBottom: '3px solid var(--cyan)', borderLeft: '3px solid var(--cyan)', width: '20px', height: '20px' }}></div>
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', borderBottom: '3px solid var(--cyan)', borderRight: '3px solid var(--cyan)', width: '20px', height: '20px' }}></div>
                  
                  {/* Scanning line animation */}
                  <div className="scanner-line" style={{ position: 'absolute', top: '20%', left: '10%', right: '10%', height: '2px', background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)', zIndex: '2' }}></div>
                  
                  {/* Custom QR SVG */}
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--cyan)', opacity: '0.7', marginBottom: '12px' }}>
                    <path d="M3 3h6v6H3V3zm0 12h6v6H3v-6zm12-12h6v6h-6V3zm3 18h3m-3-3h.01M21 15v3m-6 3h3m-3-6h3m0 3h.01" />
                  </svg>
                  
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', zIndex: '3' }}>CAMERA STREAM: ACTIVE</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gate Turnstile QR Scanner v4.2</div>
                </div>

                {/* Scan Action Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manual Scanner Input</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="text" 
                        placeholder="Paste Ticket Code" 
                        value={manualCodeInput} 
                        onChange={e => setManualCodeInput(e.target.value)} 
                        style={{ flex: '1' }}
                      />
                      <button className="btn-secondary" style={{ padding: '0 12px' }} onClick={() => handleScanTicket(manualCodeInput)}>Scan</button>
                    </div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-card)', padding: '10px 0' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>Simulate Security Threats:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button 
                        className="btn-danger" 
                        style={{ fontSize: '11px', padding: '6px' }}
                        onClick={() => handleScanTicket('FAKE-CODE-999', 'unknown')}
                      >
                        ⚠️ Counterfeit
                      </button>
                      <button 
                        className="btn-danger" 
                        style={{ fontSize: '11px', padding: '6px' }}
                        onClick={() => {
                          if (tickets.length > 0) {
                            handleScanTicket(tickets[0].ticketCode, 'tampered');
                          } else {
                            alert("Please issue a ticket first!");
                          }
                        }}
                      >
                        ⚡ Tamper Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Scan Results Display */}
              {scanResult && (
                <div style={{ 
                  marginTop: '16px',
                  padding: '16px', 
                  borderRadius: '8px', 
                  background: scanResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                  border: scanResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}>
                  {scanResult.success ? 
                    <CheckCircle size={24} style={{ color: 'var(--emerald)', flexShrink: '0' }} /> : 
                    <ShieldAlert size={24} style={{ color: 'var(--rose)', flexShrink: '0', animation: 'pulse-ring 1s infinite' }} />
                  }
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: scanResult.success ? 'var(--emerald)' : 'var(--rose)' }}>
                      {scanResult.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {scanResult.message}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Code: <code style={{ color: 'white' }}>{scanResult.code}</code> | Scanned: {scanResult.timestamp}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Security Log Console & Tickets Database */}
        <div className="col-5 glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h2 className="card-title">
              <ShieldAlert size={18} style={{ color: 'var(--rose)' }} />
              Cyber-Ticketing Security Logger
            </h2>
            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setScanLogs([])}>
              Clear Logs
            </button>
          </div>
          <div className="card-body" style={{ flexGrow: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Terminal Log Console */}
            <div className="logs-box fraud" style={{ height: '180px' }}>
              {scanLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '60px' }}>
                  System idle. Standing by for scan events...
                </div>
              ) : (
                scanLogs.map((log, i) => (
                  <div key={i} className="log-entry" style={{ 
                    color: log.includes('ACCESS WARNING') ? 'var(--amber)' : log.includes('SECURITY BREACH') ? 'var(--rose)' : log.includes('✅') ? 'var(--emerald)' : '#94a3b8' 
                  }}>
                    {log}
                  </div>
                ))
              )}
            </div>

            {/* Issued Tickets Database */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Active Stadium Database ({tickets.length})</h3>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '250px', border: '1px solid var(--border-card)', borderRadius: '8px' }}>
                <table className="premium-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Ticket Code</th>
                      <th>Section</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{t.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{t.ticketCode}</td>
                        <td>{t.sectionId.toUpperCase()}</td>
                        <td>{getStatusBadge(t.status)}</td>
                        <td>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '3px 8px', fontSize: '10px', boxShadow: 'none' }}
                            onClick={() => handleScanTicket(t.ticketCode)}
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

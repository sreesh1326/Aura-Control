import React, { useState, useCallback, useMemo } from 'react';
import { ShieldAlert, HeartPulse, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { INCIDENT_TEMPLATES } from '../data/mockData';

/**
 * playAlertBeep — non-blocking audio cue on emergency dispatch.
 * Wrapped in try/catch so AudioContext policy failures are silent.
 */
const playAlertBeep = () => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (_) { /* AudioContext policy — silent fail */ }
};

export default function EmergencyTab({ incidents, setIncidents }) {
  const [category, setCategory]       = useState('Medical');
  const [targetGroup, setTargetGroup] = useState('Player');
  const [severity, setSeverity]       = useState('Critical');
  const [templateIdx, setTemplateIdx] = useState(0);
  const [customLocation, setCustomLocation] = useState('Field Sector Center');
  const [customDesc, setCustomDesc]   = useState('');

  // Memoised: only recompute when category changes
  const filteredTemplates = useMemo(
    () => INCIDENT_TEMPLATES.filter(t => t.category === category),
    [category]
  );

  // Memoised summary stats
  const activeCount   = useMemo(() => incidents.filter(i => i.status !== 'Resolved').length, [incidents]);
  const resolvedCount = useMemo(() => incidents.filter(i => i.status === 'Resolved').length, [incidents]);
  const criticalCount = useMemo(() => incidents.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length, [incidents]);
  
  const handleTriggerIncident = useCallback((e) => {
    e.preventDefault();
    const template = filteredTemplates[templateIdx] ?? filteredTemplates[0];
    if (!template) return;

    const newIncident = {
      id:           `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      targetGroup,
      title:        template.title,
      severity,
      location:     customLocation.trim() || 'Field Sector Center',
      description:  customDesc.trim() || template.desc,
      status:       'Pending Dispatch',
      reportedAt:   new Date().toLocaleTimeString(),
      dispatchedAt: null,
      resolvedAt:   null,
    };

    setIncidents(prev => [newIncident, ...prev]);
    setCustomDesc('');
    playAlertBeep();
  }, [filteredTemplates, templateIdx, category, targetGroup, severity, customLocation, customDesc, setIncidents]);

  const handleDispatch = useCallback((id) => {
    setIncidents(prev => prev.map(inc =>
      inc.id === id ? { ...inc, status: 'Responding', dispatchedAt: new Date().toLocaleTimeString() } : inc
    ));
  }, [setIncidents]);

  const handleResolve = useCallback((id) => {
    setIncidents(prev => prev.map(inc =>
      inc.id === id ? { ...inc, status: 'Resolved', resolvedAt: new Date().toLocaleTimeString() } : inc
    ));
  }, [setIncidents]);

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'Critical': return { color: 'var(--rose)', bg: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)' };
      case 'Moderate': return { color: 'var(--amber)', bg: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)' };
      default: return { color: 'var(--cyan)', bg: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)' };
    }
  };

  return (
    <div className="view-container">

      {/* Quick clinical indicators */}
      <div className="dashboard-grid">
        <div className="col-3 glass-panel glow-rose">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(244,63,94,0.15)', borderRadius: '12px', color: 'var(--rose)' }}><HeartPulse size={24} aria-hidden="true" /></div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>EMS Medics Standby</div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>6 Units Active</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>4 at Pitchside, 2 in Main Plaza</div>
            </div>
          </div>
        </div>

        <div className="col-3 glass-panel glow-cyan">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(6,182,212,0.1)', borderRadius: '12px', color: 'var(--cyan)' }}><Shield size={24} aria-hidden="true" /></div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tactical Security Response</div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>3 Fast Teams Ready</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Located at Pitch Tunneled Gates</div>
            </div>
          </div>
        </div>

        <div className="col-3 glass-panel glow-violet">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', color: 'var(--violet)' }}><Clock size={24} aria-hidden="true" /></div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Average Dispatch Speed</div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>1m 48s <span style={{ fontSize: '12px', color: 'var(--emerald)' }}>● Goal Met</span></div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target: Under 3 mins response</div>
            </div>
          </div>
        </div>

        <div className={`col-3 glass-panel ${criticalCount > 0 ? 'glow-rose' : ''}`}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: criticalCount > 0 ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.1)', borderRadius: '12px', color: criticalCount > 0 ? 'var(--rose)' : 'var(--emerald)' }}>
              <ShieldAlert size={24} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active Incidents</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: activeCount > 0 ? 'var(--rose)' : 'inherit' }}>{activeCount} Open</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{resolvedCount} Resolved Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Incidents Dispatcher & Trigger Alert Form */}
      <div className="dashboard-grid">
        
        {/* Left Column: Active Emergency Incidents List */}
        <div className="col-7 glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h2 className="card-title">
              <ShieldAlert size={18} style={{ color: 'var(--rose)' }} />
              Command Center Triage Dispatch Logs
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Real-time event dispatcher</span>
          </div>
          <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {incidents.length === 0 ? (
              <div style={{ 
                border: '2px dashed var(--border-card)', 
                borderRadius: '12px', 
                padding: '40px', 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <CheckCircle size={32} style={{ color: 'var(--emerald)' }} />
                <div>No active emergency incident tickets. All sectors green.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
                {incidents.map((inc) => {
                  const style = getSeverityStyle(inc.severity);
                  return (
                    <div key={inc.id} style={{ 
                      background: 'rgba(15, 18, 28, 0.6)', 
                      border: '1px solid var(--border-card)', 
                      borderLeft: `4px solid ${style.color}`,
                      borderRadius: '8px', 
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: 'bold', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              color: style.color,
                              background: style.bg,
                              border: style.border
                            }}>
                              {inc.severity.toUpperCase()}
                            </span>
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: 'bold', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              color: 'var(--violet)',
                              background: 'rgba(139, 92, 246, 0.1)',
                              border: '1px solid rgba(139, 92, 246, 0.2)'
                            }}>
                              {inc.category} Target: {inc.targetGroup}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {inc.id}</span>
                          </div>
                          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', marginTop: '6px' }}>{inc.title}</h3>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                          Reported: {inc.reportedAt}
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <strong>Location: </strong> <span style={{ color: 'white' }}>{inc.location}</span> | {inc.description}
                      </div>

                      {/* Display player focus warnings */}
                      {inc.targetGroup === 'Player' && (
                        <div style={{ 
                          background: 'rgba(139, 92, 246, 0.08)', 
                          border: '1px dashed rgba(139, 92, 246, 0.3)', 
                          borderRadius: '6px', 
                          padding: '8px 12px',
                          fontSize: '11px',
                          color: 'var(--text-primary)'
                        }}>
                          🚨 <strong>PLAYER HIGH PRIORITY DISPATCH:</strong> Incident affects field-of-play personnel. Medical teams are routed via the Player Tunnel access ramps for zero-delay triage.
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', marginTop: '4px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: inc.status === 'Resolved' ? 'var(--emerald)' : inc.status === 'Responding' ? 'var(--amber)' : 'var(--rose)' }} className={inc.status !== 'Resolved' ? 'pulsing-ring' : ''}></span>
                          <span>Status: <strong>{inc.status}</strong></span>
                          {inc.dispatchedAt && <span style={{ color: 'var(--text-muted)' }}> (EMS Out: {inc.dispatchedAt})</span>}
                          {inc.resolvedAt && <span style={{ color: 'var(--emerald)' }}> (Cleared: {inc.resolvedAt})</span>}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {inc.status === 'Pending Dispatch' && (
                            <button 
                              className="btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '11px', background: 'linear-gradient(135deg, var(--rose), var(--amber))', boxShadow: 'none' }}
                              onClick={() => handleDispatch(inc.id)}
                            >
                              🚒 Dispatch Team Now
                            </button>
                          )}
                          {inc.status === 'Responding' && (
                            <button 
                              className="btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '11px', background: 'linear-gradient(135deg, var(--emerald), var(--cyan))', boxShadow: 'none' }}
                              onClick={() => handleResolve(inc.id)}
                            >
                              ✅ Mark Resolved
                            </button>
                          )}
                          {inc.status === 'Resolved' && (
                            <span style={{ fontSize: '11px', color: 'var(--emerald)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              ✔ Closed & Cleared
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Trigger Incident Form */}
        <div className="col-5 glass-panel">
          <div className="card-header">
            <h2 className="card-title">
              <AlertTriangle size={18} style={{ color: 'var(--rose)' }} aria-hidden="true" />
              Fast-Trigger Medical &amp; Security Alarm
            </h2>
          </div>
          <div className="card-body">
            <form
              onSubmit={handleTriggerIncident}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              aria-label="Trigger emergency incident form"
            >

              {/* Category & Target */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="alarm-category" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Alarm Category</label>
                  <select id="alarm-category" value={category} onChange={e => { setCategory(e.target.value); setTemplateIdx(0); }}>
                    <option value="Medical">🏥 Healthcare / Medical</option>
                    <option value="Security">🛡️ Security Incident</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="target-group" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target Group Affected</label>
                  <select id="target-group" value={targetGroup} onChange={e => setTargetGroup(e.target.value)}>
                    <option value="Player">⚽ Players (Field Spot)</option>
                    <option value="Audience">📣 Fans / Audience Stands</option>
                    <option value="Staff">👔 Tournament Staff</option>
                  </select>
                </div>
              </div>

              {/* Severity & Template */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="incident-severity" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Incident Severity</label>
                  <select id="incident-severity" value={severity} onChange={e => setSeverity(e.target.value)}>
                    <option value="Critical">🔴 Critical (Danger / EMS Required)</option>
                    <option value="Moderate">🟡 Moderate (Mild Injury / Dispute)</option>
                    <option value="Low">🔵 Low (Bottleneck / Logistics)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="alarm-template" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Alarm Template</label>
                  <select id="alarm-template" value={templateIdx} onChange={e => setTemplateIdx(parseInt(e.target.value))}>
                    {filteredTemplates.map((t, idx) => (
                      <option key={t.title} value={idx}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="incident-location" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Specify Location Spot</label>
                <input
                  id="incident-location"
                  type="text"
                  value={customLocation}
                  onChange={e => setCustomLocation(e.target.value)}
                  placeholder="e.g. South Stand, Section S2, Row F, Seat 15"
                  required
                  aria-required="true"
                />
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="incident-desc" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Incident Details (Optional Override)</label>
                <textarea
                  id="incident-desc"
                  value={customDesc}
                  onChange={e => setCustomDesc(e.target.value)}
                  placeholder="Enter details about symptoms or safety description…"
                  rows="3"
                />
              </div>

              {/* Fire alarm submit button */}
              <button 
                type="submit" 
                className="btn-danger" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  fontWeight: '700', 
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ef4444, #991b1b)',
                  border: 'none',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                }}
              >
                🚨 TRIGGER EMERGENCY ALARM
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Shield, AlertTriangle, ShieldAlert, ArrowRight, RefreshCw, Zap } from 'lucide-react';

export default function CrowdTab({ sections, setSections, simulationRunning, setSimulationRunning, simulationSpeed, setSimulationSpeed }) {
  const [selectedSectionId, setSelectedSectionId] = useState('south');
  const [standbyGuards, setStandbyGuards] = useState(20);
  
  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // Density safety threshold warnings
  const getSafetyLevel = (density) => {
    if (density < 50) return { name: 'SAFE / LOW', color: 'var(--emerald)', desc: 'Relaxed occupancy. Safe flow.' };
    if (density < 75) return { name: 'MODERATE', color: 'var(--cyan)', desc: 'Steady entry rate. Normal operations.' };
    if (density < 90) return { name: 'HIGH DENSITY', color: 'var(--amber)', desc: 'High congestion. Monitor gates closely.' };
    return { name: 'CRITICAL / OVERCROWDING', color: 'var(--rose)', desc: 'Severe bottleneck risks. Critical hazard!' };
  };

  // Crowd entry simulation loop
  useEffect(() => {
    if (!simulationRunning) return;

    const intervalTime = 1000 / simulationSpeed;
    const timer = setInterval(() => {
      setSections(prevSections => prevSections.map(sect => {
        // South stand is popular, VIP increases slower
        let increment = 0;
        if (sect.id === 'south') {
          increment = Math.floor(Math.random() * 40) + 15;
        } else if (sect.id === 'vip') {
          increment = Math.floor(Math.random() * 8) + 2;
        } else {
          increment = Math.floor(Math.random() * 25) + 10;
        }

        // Do not exceed capacity
        const nextOccupancy = Math.min(sect.capacity, sect.occupancy + increment);
        return {
          ...sect,
          occupancy: nextOccupancy
        };
      }));
    }, intervalTime);

    return () => clearInterval(timer);
  }, [simulationRunning, simulationSpeed, setSections]);

  const handleAdjustGuards = useCallback((amount) => {
    if (amount > 0 && standbyGuards <= 0) return;
    if (amount < 0 && selectedSection.securityGuards <= 0) return;
    setStandbyGuards(prev => prev - amount);
    setSections(prev => prev.map(s => s.id === selectedSectionId ? { ...s, securityGuards: s.securityGuards + amount } : s));
  }, [standbyGuards, selectedSection, selectedSectionId, setSections]);

  const handleAutoRebalance = useCallback(() => {
    const totalAssigned = sections.reduce((acc, s) => acc + s.securityGuards, 0);
    const totalPool = totalAssigned + standbyGuards;
    const totalOccupancy = sections.reduce((acc, s) => acc + s.occupancy, 0);
    if (totalOccupancy === 0) return;

    let distributed = 0;
    const newSections = sections.map(s => {
      const idealGuards = Math.max(3, Math.round((s.occupancy / totalOccupancy) * totalPool));
      distributed += idealGuards;
      return { ...s, securityGuards: idealGuards };
    });

    const diff = totalPool - distributed;
    if (diff >= 0) {
      setStandbyGuards(diff);
      setSections(newSections);
    } else {
      let remainder = Math.abs(diff);
      const adjustedSections = newSections.map(s => {
        if (s.id === 'vip' && s.securityGuards > remainder + 3) {
          s.securityGuards -= remainder;
          remainder = 0;
        }
        return s;
      });
      setStandbyGuards(remainder);
      setSections(adjustedSections);
    }
  }, [sections, standbyGuards, setSections]);

  const getHeatmapColor = (density) => {
    if (density < 50) return 'rgba(16, 185, 129, 0.4)'; // Emerald
    if (density < 75) return 'rgba(6, 182, 212, 0.4)'; // Cyan
    if (density < 90) return 'rgba(245, 158, 11, 0.5)'; // Amber
    return 'rgba(244, 63, 94, 0.7)'; // Rose/Red
  };

  // Memoised: sections where density > 80% and guard ratio is insufficient
  const securityAlerts = useMemo(() =>
    sections.filter(s => {
      const density = (s.occupancy / s.capacity) * 100;
      const ratio   = s.occupancy / (s.securityGuards || 1);
      return density > 80 && ratio > 450;
    }),
    [sections]
  );

  return (
    <div className="view-container">
      {/* Simulation Controller */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: simulationRunning ? 'var(--emerald)' : 'var(--text-muted)', borderRadius: '50%' }} className={simulationRunning ? 'pulsing-ring' : ''}></span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Live Crowd Density Simulator</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Simulate fans entering the stadium turnstiles in real-time.</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="sim-speed-widget">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Speed:</span>
            {[1, 2, 5].map(speed => (
              <button 
                key={speed}
                onClick={() => setSimulationSpeed(speed)}
                className={`tab-btn ${simulationSpeed === speed ? 'active' : ''}`}
                style={{ padding: '2px 8px', fontSize: '11px' }}
              >
                {speed}x
              </button>
            ))}
          </div>
          <button 
            className="btn-primary" 
            style={{ 
              background: simulationRunning ? 'rgba(244, 63, 94, 0.15)' : 'linear-gradient(135deg, var(--emerald), var(--cyan))', 
              color: simulationRunning ? 'var(--rose)' : 'white',
              boxShadow: 'none',
              border: simulationRunning ? '1px solid rgba(244, 63, 94, 0.3)' : 'none'
            }}
            onClick={() => setSimulationRunning(!simulationRunning)}
          >
            {simulationRunning ? '⏸️ Pause Entry' : '▶️ Resume Entry'}
          </button>
        </div>
      </div>

      {/* Security Alerts Banner */}
      {securityAlerts.map(sect => (
        <div key={sect.id} style={{ 
          background: 'rgba(244, 63, 94, 0.12)', 
          border: '1px solid rgba(244, 63, 94, 0.3)', 
          borderRadius: '8px', 
          padding: '12px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <ShieldAlert size={20} style={{ color: 'var(--rose)', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', flexGrow: 1 }}>
            <strong style={{ color: 'var(--rose)' }}>SECURITY ALERT: </strong> 
            {sect.name} is currently at <strong>{((sect.occupancy / sect.capacity) * 100).toFixed(0)}%</strong> capacity with only <strong>{sect.securityGuards}</strong> guards assigned (1 guard per {Math.round(sect.occupancy / sect.securityGuards)} fans). High crowding safety hazard!
          </div>
          <button 
            className="btn-primary" 
            style={{ padding: '4px 10px', fontSize: '11px', boxShadow: 'none' }}
            onClick={() => {
              setSelectedSectionId(sect.id);
              handleAutoRebalance();
            }}
          >
            Auto-Rebalance Now
          </button>
        </div>
      ))}

      {/* Main Interactive Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Interactive Heatmap SVG Map */}
        <div className="col-7 glass-panel">
          <div className="card-header">
            <h2 className="card-title">
              <Users size={18} style={{ color: 'var(--cyan)' }} />
              Live Sector Occupancy Heatmap
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Click stand sections to manage security</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            
            {/* Visual Heatmap representation using custom SVG */}
            <div className="stadium-svg-container" style={{ width: '100%', maxWidth: '480px' }}>
              <svg viewBox="0 0 400 400" width="100%" height="100%">
                {/* Outer Boundary */}
                <rect x="10" y="10" width="380" height="380" rx="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                
                {/* Central Field pitch */}
                <rect x="120" y="150" width="160" height="100" rx="4" fill="#0f172a" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <circle cx="200" cy="200" r="25" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <line x1="200" y1="150" x2="200" y2="250" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

                {/* West Stand (Left Block) */}
                <path 
                  d="M 60,110 A 130,130 0 0,0 60,290 L 100,270 A 90,90 0 0,1 100,130 Z" 
                  fill={getHeatmapColor((sections.find(s => s.id === 'west').occupancy / sections.find(s => s.id === 'west').capacity) * 100)}
                  className={`stadium-path ${selectedSectionId === 'west' ? 'selected' : ''}`}
                  onClick={() => setSelectedSectionId('west')}
                />
                <text x="50" y="200" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">WEST</text>

                {/* East Stand (Right Block) */}
                <path 
                  d="M 340,110 A 130,130 0 0,1 340,290 L 300,270 A 90,90 0 0,0 300,130 Z" 
                  fill={getHeatmapColor((sections.find(s => s.id === 'east').occupancy / sections.find(s => s.id === 'east').capacity) * 100)}
                  className={`stadium-path ${selectedSectionId === 'east' ? 'selected' : ''}`}
                  onClick={() => setSelectedSectionId('east')}
                />
                <text x="350" y="200" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">EAST</text>

                {/* North Stand (Top Block) */}
                <path 
                  d="M 110,60 A 130,130 0 0,1 290,60 L 270,100 A 90,90 0 0,0 130,100 Z" 
                  fill={getHeatmapColor((sections.find(s => s.id === 'north').occupancy / sections.find(s => s.id === 'north').capacity) * 100)}
                  className={`stadium-path ${selectedSectionId === 'north' ? 'selected' : ''}`}
                  onClick={() => setSelectedSectionId('north')}
                />
                <text x="200" y="50" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">NORTH</text>

                {/* South Stand (Bottom Block) */}
                <path 
                  d="M 110,340 A 130,130 0 0,0 290,340 L 270,300 A 90,90 0 0,1 130,300 Z" 
                  fill={getHeatmapColor((sections.find(s => s.id === 'south').occupancy / sections.find(s => s.id === 'south').capacity) * 100)}
                  className={`stadium-path ${selectedSectionId === 'south' ? 'selected' : ''}`}
                  onClick={() => setSelectedSectionId('south')}
                />
                <text x="200" y="360" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">SOUTH</text>

                {/* VIP Suites (Center Top Ring) */}
                <path 
                  d="M 160,115 A 40,40 0 0,1 240,115 L 235,135 A 20,20 0 0,0 165,135 Z" 
                  fill={getHeatmapColor((sections.find(s => s.id === 'vip').occupancy / sections.find(s => s.id === 'vip').capacity) * 100)}
                  className={`stadium-path ${selectedSectionId === 'vip' ? 'selected' : ''}`}
                  onClick={() => setSelectedSectionId('vip')}
                />
                <text x="200" y="125" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">VIP</text>
              </svg>
            </div>

            {/* Heatmap Legend */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%', borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.4)', borderRadius: '2px' }}></span>
                <span>Low (&lt;50%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(6, 182, 212, 0.4)', borderRadius: '2px' }}></span>
                <span>Moderate (50-75%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(245, 158, 11, 0.5)', borderRadius: '2px' }}></span>
                <span>High (75-90%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(244, 63, 94, 0.7)', borderRadius: '2px' }}></span>
                <span>Critical (&gt;90%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Sector & Security Allocation Controls */}
        <div className="col-5 flex-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section Stats & Details Card */}
          {selectedSection && (
            <div className="glass-panel">
              <div className="card-header">
                <h2 className="card-title" style={{ color: selectedSection.color }}>
                  🛡️ {selectedSection.name} Panel
                </h2>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Real-time Density Gauge */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Section Density Index:</span>
                      <strong style={{ color: getSafetyLevel((selectedSection.occupancy / selectedSection.capacity) * 100).color }}>
                        {((selectedSection.occupancy / selectedSection.capacity) * 100).toFixed(1)}%
                      </strong>
                    </div>
                    
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ 
                        width: `${(selectedSection.occupancy / selectedSection.capacity) * 100}%`,
                        background: getSafetyLevel((selectedSection.occupancy / selectedSection.capacity) * 100).color,
                        boxShadow: `0 0 10px ${getSafetyLevel((selectedSection.occupancy / selectedSection.capacity) * 100).color}`,
                        transition: 'width 0.4s ease'
                      }}></div>
                    </div>
                  </div>

                  {/* Quick stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Occupied Seats</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedSection.occupancy.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Capacity</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedSection.capacity.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Safety details info */}
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', borderLeft: `4px solid ${getSafetyLevel((selectedSection.occupancy / selectedSection.capacity) * 100).color}` }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: getSafetyLevel((selectedSection.occupancy / selectedSection.capacity) * 100).color }}>
                      STATUS: {getSafetyLevel((selectedSection.occupancy / selectedSection.capacity) * 100).name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {getSafetyLevel((selectedSection.occupancy / selectedSection.capacity) * 100).desc}
                    </div>
                  </div>

                  {/* Entrance Allocations */}
                  <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>Allocated Entrance Turnstiles:</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {selectedSection.gates.map((g, idx) => (
                        <span key={idx} style={{ 
                          fontSize: '11px', 
                          fontWeight: '600', 
                          background: 'rgba(6, 182, 212, 0.1)', 
                          color: 'var(--cyan)', 
                          border: '1px solid rgba(6, 182, 212, 0.2)',
                          padding: '4px 8px', 
                          borderRadius: '4px' 
                        }}>{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Officers Dispatcher */}
          <div className="glass-panel">
            <div className="card-header">
              <h2 className="card-title">
                <Shield size={18} style={{ color: 'var(--emerald)' }} />
                Security Dispatch Console
              </h2>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Dispatch overview stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Standby Reserve Officers</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--emerald)' }}>{standbyGuards} Active Reserve</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Assigned Patrols</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                    {sections.reduce((acc, s) => acc + s.securityGuards, 0)}
                  </div>
                </div>
              </div>

              {/* Controls to shift guards in selected section */}
              {selectedSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Guards in <strong>{selectedSection.name.split(' (')[0]}</strong>:</span>
                    <strong style={{ color: 'white' }}>{selectedSection.securityGuards} guards</strong>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-danger" 
                      style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
                      onClick={() => handleAdjustGuards(-1)}
                      disabled={selectedSection.securityGuards <= 0}
                    >
                      ➖ Recall 1 Guard
                    </button>
                    
                    <button 
                      className="btn-primary" 
                      style={{ 
                        flex: '1', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px', 
                        padding: '8px',
                        background: 'linear-gradient(135deg, var(--emerald), var(--cyan))',
                        boxShadow: 'none'
                      }}
                      onClick={() => handleAdjustGuards(1)}
                      disabled={standbyGuards <= 0}
                    >
                      ➕ Dispatch 1 Guard
                    </button>
                  </div>
                </div>
              )}

              {/* Automatic algorithm dispatch helper */}
              <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '16px', display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-secondary" 
                  style={{ flex: '1', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                  onClick={handleAutoRebalance}
                >
                  <RefreshCw size={14} /> Auto-Balance (Density Proportional)
                </button>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                💡 <strong>Dynamic Recommendation:</strong> Auto-Balance distributes guards based on live spectator density percentages, shifting guards from low-density stands to congested zones.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Car, Compass, AlertCircle, ArrowRight, CheckCircle, Info } from 'lucide-react';

export default function ParkingTab({ parkingLots, setParkingLots, sections }) {
  const [selectedStand, setSelectedStand] = useState('south');
  const [navigationResult, setNavigationResult] = useState(null);
  
  // Custom mock slot details for the selected parking zone
  const [selectedZoneId, setSelectedZoneId] = useState('zone-c');
  const [zoneSlots, setZoneSlots] = useState({});

  // Generate random slot maps for the zones on mount
  useEffect(() => {
    const initialSlots = {};
    parkingLots.forEach(lot => {
      const slots = [];
      for (let i = 1; i <= 20; i++) {
        let state = 'available';
        const rand = Math.random();
        if (rand < 0.6) state = 'occupied';
        else if (rand < 0.75) state = 'reserved';
        slots.push({ id: `slot-${lot.id}-${i}`, number: `${lot.id.toUpperCase().split('-')[1]}${i}`, status: state });
      }
      initialSlots[lot.id] = slots;
    });
    setZoneSlots(initialSlots);
  }, []);

  // Update parking occupancy simulation loop
  useEffect(() => {
    const timer = setInterval(() => {
      const zoneKeys = ['zone-a', 'zone-b', 'zone-c', 'zone-d'];
      const randomZone = zoneKeys[Math.floor(Math.random() * zoneKeys.length)];

      setZoneSlots(prev => {
        const next = { ...prev };
        const slotsList = prev[randomZone] ? [...prev[randomZone]] : [];
        if (slotsList.length === 0) return prev;
        
        const slotIdx = Math.floor(Math.random() * slotsList.length);
        const currentSlot = slotsList[slotIdx];
        
        let newStatus = 'available';
        if (currentSlot.status === 'available') {
          newStatus = Math.random() > 0.3 ? 'occupied' : 'reserved';
        }
        
        slotsList[slotIdx] = { ...currentSlot, status: newStatus };
        next[randomZone] = slotsList;
        return next;
      });

      setParkingLots(prevLots => prevLots.map(lot => {
        if (lot.id === randomZone) {
          const increment = Math.random() > 0.5 ? 5 : -5;
          const nextOccupied = Math.max(0, Math.min(lot.totalSlots, lot.occupiedSlots + increment));
          return {
            ...lot,
            occupiedSlots: nextOccupied,
            status: nextOccupied >= lot.totalSlots * 0.95 ? 'Full' : nextOccupied >= lot.totalSlots * 0.8 ? 'Busy' : 'Available'
          };
        }
        return lot;
      }));
    }, 3000);

    return () => clearInterval(timer);
  }, [setParkingLots]);

  // Calculate Navigation instructions based on selected seating Stand
  const handleCalculateRoute = () => {
    const section = sections.find(s => s.id === selectedStand);
    if (!section) return;

    // Find optimal parking zone (one that matches optimalFor)
    let optimalZone = parkingLots.find(lot => lot.optimalFor.includes(selectedStand));
    let alternateZone = parkingLots.find(lot => lot.id !== optimalZone.id && lot.status !== 'Full');
    
    // Check if optimal zone is Full, if so, suggest reroute to prevent overcrowding!
    let isRerouted = false;
    let finalParkingZone = optimalZone;

    if (optimalZone.occupiedSlots >= optimalZone.totalSlots * 0.95) {
      isRerouted = true;
      finalParkingZone = alternateZone;
    }

    // Gate allocation
    const bestGate = section.gates[0];
    const alternateGate = section.gates[1] || 'VIP Entrance';

    let directionSteps = [];
    if (finalParkingZone.id === 'zone-a') {
      directionSteps = [
        'Take Exit 12 (Metropolis Stadium North/VIP).',
        'Follow Stadium Ring Road North.',
        'Enter Zone A parking lot via Gate 1A/1B (Swipe Ticket Barcode).',
        `Proceed to Zone A, Sector 4. Walk 2 mins to ${bestGate}.`
      ];
    } else if (finalParkingZone.id === 'zone-b') {
      directionSteps = [
        'Take Exit 13 (East Stadium Boulevard).',
        'Enter Zone B parking lot via Boulevard Gate B.',
        `Park in bays B10-B50. Follow the blue arrow walking trail to ${bestGate}.`
      ];
    } else if (finalParkingZone.id === 'zone-c') {
      directionSteps = [
        'Take Exit 14 (Stadium South Fan Zone).',
        'Enter Zone C parking lot via South Gate C.',
        `Optimal bays: C20-C45. Walk past the Fan Zone directly to ${bestGate}.`
      ];
    } else {
      directionSteps = [
        'Take Exit 15 (Press & Premium Suites Boulevard).',
        'Enter Zone D parking lot via VIP Guard checkpoint.',
        `Park in Zone D bays D5-D25. Walk 3 mins to ${bestGate}.`
      ];
    }

    setNavigationResult({
      optimalZone: optimalZone,
      finalZone: finalParkingZone,
      isRerouted: isRerouted,
      gate: bestGate,
      alternateGate: alternateGate,
      steps: directionSteps
    });
  };

  const getParkingStatusBadgeColor = (status) => {
    switch (status) {
      case 'Full': return 'var(--rose)';
      case 'Busy': return 'var(--amber)';
      default: return 'var(--emerald)';
    }
  };

  // Mock flow rates for turnstiles/gates
  const gateFlowRates = [
    { name: 'Gate 1 & 2', stand: 'North Stand', rate: 22, status: 'Clear', color: 'var(--emerald)' },
    { name: 'Gate 3 & 4', stand: 'East Stand', rate: 48, status: 'Slow / Busy', color: 'var(--amber)' },
    { name: 'Gate 5 & 6', stand: 'South Stand', rate: 74, status: 'Bottleneck Risk', color: 'var(--rose)' },
    { name: 'Gate 7 & 8', stand: 'West Stand', rate: 15, status: 'Clear', color: 'var(--emerald)' },
    { name: 'VIP Entrance', stand: 'VIP Suites', rate: 8, status: 'Clear', color: 'var(--emerald)' }
  ];

  return (
    <div className="view-container">
      <div className="dashboard-grid">
        
        {/* Left Column: Smart Navigation & Routing Panel */}
        <div className="col-5 flex-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Navigator widget */}
          <div className="glass-panel">
            <div className="card-header">
              <h2 className="card-title">
                <Compass size={18} style={{ color: 'var(--cyan)' }} />
                Smart Parking & Gate Navigator
              </h2>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Select Your Ticket Seating Sector:</label>
                <select value={selectedStand} onChange={e => setSelectedStand(e.target.value)} style={{ width: '100%' }}>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.name.split(' (')[0]}</option>
                  ))}
                </select>
              </div>

              <button className="btn-primary" onClick={handleCalculateRoute} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                🚗 Calculate Optimal Route
              </button>

              {navigationResult && (
                <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Rerouted Warning if optimal zone is full */}
                  {navigationResult.isRerouted ? (
                    <div style={{ 
                      background: 'rgba(245, 158, 11, 0.12)', 
                      border: '1px solid rgba(245, 158, 11, 0.3)', 
                      borderRadius: '8px', 
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px'
                    }}>
                      <AlertCircle size={18} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                      <div>
                        <strong>DYNAMIC OVERFLOW REROUTING:</strong> Recommended {navigationResult.optimalZone.name} is Full. Rerouting to <strong>{navigationResult.finalZone.name}</strong> to avoid congestion.
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      border: '1px solid rgba(16, 185, 129, 0.2)', 
                      borderRadius: '8px', 
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px'
                    }}>
                      <CheckCircle size={16} style={{ color: 'var(--emerald)' }} />
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Optimal parking zone is available. No traffic alerts found.
                      </div>
                    </div>
                  )}

                  {/* Navigation stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assigned Parking</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--cyan)' }}>{navigationResult.finalZone.name.split(' (')[0]}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Optimal Gate Entry</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--violet)' }}>{navigationResult.gate}</div>
                    </div>
                  </div>

                  {/* Directions steps */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>Turn-by-Turn Navigation:</div>
                    <ol style={{ fontSize: '12px', paddingLeft: '16px', color: 'var(--text-secondary)' }}>
                      {navigationResult.steps.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Turnstiles / Gate Flow Overcrowding Control */}
          <div className="glass-panel">
            <div className="card-header">
              <h2 className="card-title">
                <AlertCircle size={18} style={{ color: 'var(--rose)' }} />
                Gate Bottleneck & Flow Monitor
              </h2>
            </div>
            <div className="card-body" style={{ padding: '0px' }}>
              <table className="premium-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Gate</th>
                    <th>Stand Destination</th>
                    <th>Flow (Fans/Min)</th>
                    <th>Traffic Status</th>
                  </tr>
                </thead>
                <tbody>
                  {gateFlowRates.map((g, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold' }}>{g.name}</td>
                      <td>{g.stand}</td>
                      <td style={{ fontWeight: 'bold' }}>{g.rate} / min</td>
                      <td>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 'bold',
                          color: g.color,
                          background: `${g.color}15`,
                          border: `1px solid ${g.color}30`,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>{g.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '16px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-card)' }}>
                ℹ️ <strong>System Automation:</strong> Turnstiles dynamically adjust gate locks and prompt nearby digital stadium signage to reroute fans if flow exceeds 60 fans per minute.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Parking Lots Occupancy */}
        <div className="col-7 glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h2 className="card-title">
              <Car size={18} style={{ color: 'var(--cyan)' }} />
              Visual Parking Lot Slot Grid
            </h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              {parkingLots.map(lot => (
                <button 
                  key={lot.id} 
                  className={`tab-btn ${selectedZoneId === lot.id ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  onClick={() => setSelectedZoneId(lot.id)}
                >
                  {lot.id.toUpperCase().split('-')[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body" style={{ flexGrow: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Zone summary statistics */}
            {parkingLots.find(lot => lot.id === selectedZoneId) && (() => {
              const currentLot = parkingLots.find(lot => lot.id === selectedZoneId);
              const freeSlots = currentLot.totalSlots - currentLot.occupiedSlots;
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 'bold' }}>{currentLot.name}</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{currentLot.distanceToGates}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 'bold', 
                      background: `${getParkingStatusBadgeColor(currentLot.status)}15`, 
                      color: getParkingStatusBadgeColor(currentLot.status),
                      border: `1px solid ${getParkingStatusBadgeColor(currentLot.status)}30`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      marginRight: '8px'
                    }}>{currentLot.status.toUpperCase()}</span>
                    <strong style={{ fontSize: '16px' }}>{freeSlots} / {currentLot.totalSlots} Free</strong>
                  </div>
                </div>
              );
            })()}

            {/* Parking Slot Matrix Simulation */}
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '8px' }}>
                Simulated Slot Status Grid (Zone {selectedZoneId.toUpperCase().split('-')[1]} bays):
              </div>
              <div className="parking-grid">
                {zoneSlots[selectedZoneId] && zoneSlots[selectedZoneId].map((slot) => (
                  <div key={slot.id} className={`parking-slot ${slot.status}`} title={`Slot: ${slot.number} - Status: ${slot.status}`}>
                    <div>{slot.number}</div>
                    <div style={{ fontSize: '7px', alignSelf: 'flex-end', opacity: '0.8' }}>
                      {slot.status === 'available' ? 'FREE' : slot.status === 'reserved' ? 'RSVD' : 'FULL'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parking Legend */}
            <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-card)', paddingTop: '16px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '2px' }}></span>
                <span>Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '2px' }}></span>
                <span>Occupied</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '2px' }}></span>
                <span>Reserved (VIP / Staff)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

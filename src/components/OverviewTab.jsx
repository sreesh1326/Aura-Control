import React, { useState } from 'react';
import { Calendar, User, Trophy, Shield, Activity, Users, MapPin, TrendingUp } from 'lucide-react';
import { FIXTURES, POINTS_TABLE, PLAYER_STATS } from '../data/mockData';

export default function OverviewTab({ sections, parkingLots, tickets, incidents }) {
  const [fixturesList, setFixturesList] = useState(FIXTURES);
  const [selectedFixture, setSelectedFixture] = useState(FIXTURES[0]);
  
  // Calculate total metrics
  const totalOccupancy = sections.reduce((acc, curr) => acc + curr.occupancy, 0);
  const totalCapacity = sections.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalGuards = sections.reduce((acc, curr) => acc + curr.securityGuards, 0);
  const scannedTicketsCount = tickets.filter(t => t.scans > 0).length;
  
  const totalParkingSlots = parkingLots.reduce((acc, curr) => acc + curr.totalSlots, 0);
  const occupiedParkingSlots = parkingLots.reduce((acc, curr) => acc + curr.occupiedSlots, 0);
  const freeParkingSlots = totalParkingSlots - occupiedParkingSlots;

  // Active critical incidents
  const activeCriticalIncidents = incidents.filter(i => i.status !== 'Resolved' && i.severity === 'Critical').length;

  const handleUpdateScore = () => {
    // Update live fixture
    setFixturesList(prev => prev.map(f => {
      if (f.status === 'LIVE') {
        const parts = f.score.split(' - ');
        const hScore = parseInt(parts[0]) + (Math.random() > 0.7 ? 1 : 0);
        const aScore = parseInt(parts[1]) + (Math.random() > 0.8 ? 1 : 0);
        const currentMin = parseInt(f.minute) || 72;
        const nextMin = currentMin >= 90 ? '90+\'' : `${currentMin + 1}'`;
        
        return {
          ...f,
          score: `${hScore} - ${aScore}`,
          minute: nextMin
        };
      }
      return f;
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'LIVE': return 'var(--rose)';
      case 'FINISHED': return 'var(--text-muted)';
      default: return 'var(--cyan)';
    }
  };

  return (
    <div className="view-container">
      {/* KPI Cards Row */}
      <div className="dashboard-grid">
        <div className="col-3 glass-panel glow-cyan">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px', color: 'var(--cyan)' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Live Crowd Occupancy</div>
              <div style={{ fontSize: '22px', fontWeight: '700' }}>
                {totalOccupancy.toLocaleString()} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ {totalCapacity.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {((totalOccupancy / totalCapacity) * 100).toFixed(1)}% Capacity Filled
              </div>
            </div>
          </div>
        </div>

        <div className="col-3 glass-panel glow-emerald">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--emerald)' }}>
              <Shield size={24} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Guards Dispatched</div>
              <div style={{ fontSize: '22px', fontWeight: '700' }}>{totalGuards} Officers</div>
              <div style={{ fontSize: '12px', color: 'var(--emerald)' }}>All Sectors Secured</div>
            </div>
          </div>
        </div>

        <div className="col-3 glass-panel glow-violet">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: 'var(--violet)' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Parking Availability</div>
              <div style={{ fontSize: '22px', fontWeight: '700' }}>{freeParkingSlots} Slots</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {((freeParkingSlots / totalParkingSlots) * 100).toFixed(0)}% Slots Free
              </div>
            </div>
          </div>
        </div>

        <div className={`col-3 glass-panel ${activeCriticalIncidents > 0 ? 'glow-rose' : ''}`} style={{ borderColor: activeCriticalIncidents > 0 ? 'rgba(244, 63, 94, 0.4)' : '' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              padding: '12px', 
              background: activeCriticalIncidents > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.1)', 
              borderRadius: '12px', 
              color: activeCriticalIncidents > 0 ? 'var(--rose)' : 'var(--amber)' 
            }}>
              <Activity size={24} className={activeCriticalIncidents > 0 ? 'pulsing-ring' : ''} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Critical Incidents</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: activeCriticalIncidents > 0 ? 'var(--rose)' : 'var(--text-primary)' }}>
                {activeCriticalIncidents} Active
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {incidents.filter(i => i.status === 'Pending').length} Pending Dispatch
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Match Details & Tournaments */}
      <div className="dashboard-grid">
        {/* Left Column: Live Matches & Fixtures */}
        <div className="col-8 glass-panel">
          <div className="card-header">
            <h2 className="card-title">
              <Calendar size={18} className="color-cyan" style={{ color: 'var(--cyan)' }} />
              Tournament Match & Fixtures Center
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleUpdateScore}>
                ⚡ Simulate Minute & Score
              </button>
            </div>
          </div>
          <div className="card-body">
            {/* Live Match Hero Banner */}
            {fixturesList.filter(f => f.status === 'LIVE').map(liveFixture => (
              <div key={liveFixture.id} style={{ 
                background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                textAlign: 'center',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--rose)', borderRadius: '50%' }} className="pulsing-ring"></span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--rose)', letterSpacing: '1px' }}>{liveFixture.status} - {liveFixture.minute}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{liveFixture.tournament}</div>
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '48px', margin: '16px 0' }}>
                  <div style={{ textAlign: 'right', flex: '1' }}>
                    <div style={{ fontSize: '32px' }}>{liveFixture.homeLogo}</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>{liveFixture.homeTeam}</div>
                  </div>
                  
                  <div style={{ background: 'rgba(15, 18, 28, 0.8)', padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--border-card)', minWidth: '120px' }}>
                    <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '4px', color: 'white' }}>{liveFixture.score}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Spectators: {liveFixture.spectators}</div>
                  </div>
                  
                  <div style={{ textAlign: 'left', flex: '1' }}>
                    <div style={{ fontSize: '32px' }}>{liveFixture.awayLogo}</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>{liveFixture.awayTeam}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {liveFixture.venue}
                  </div>
                </div>
              </div>
            ))}

            {/* Rest of fixtures list */}
            <div>
              <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '600' }}>Scheduled Tournament Fixtures</h3>
              <div className="fixtures-list">
                {fixturesList.map(fixture => (
                  <div key={fixture.id} className="fixture-row">
                    <div className="fixture-teams">
                      <span style={{ fontSize: '18px' }}>{fixture.homeLogo}</span>
                      <span className="fixture-team-name">{fixture.homeTeam}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>vs</span>
                      <span style={{ fontSize: '18px' }}>{fixture.awayLogo}</span>
                      <span className="fixture-team-name">{fixture.awayTeam}</span>
                    </div>

                    <div className="fixture-date">
                      {fixture.date}
                    </div>

                    <div className="fixture-status">
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.05)',
                        color: getStatusColor(fixture.status)
                      }}>
                        {fixture.status === 'LIVE' ? fixture.minute : fixture.status}
                      </span>
                      {fixture.status === 'FINISHED' && (
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{fixture.score}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Standings Points Table */}
        <div className="col-4 glass-panel">
          <div className="card-header">
            <h2 className="card-title">
              <Trophy size={18} style={{ color: 'var(--amber)' }} />
              Points Standings
            </h2>
          </div>
          <div className="card-body" style={{ padding: '0px' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team</th>
                  <th style={{ textAlign: 'center' }}>P</th>
                  <th style={{ textAlign: 'center' }}>W</th>
                  <th style={{ textAlign: 'center' }}>Pts</th>
                  <th>Form</th>
                </tr>
              </thead>
              <tbody>
                {POINTS_TABLE.map((row, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 'bold', color: index < 3 ? 'var(--amber)' : 'var(--text-muted)' }}>#{row.rank}</td>
                    <td style={{ fontWeight: '600' }}>{row.team}</td>
                    <td style={{ textAlign: 'center' }}>{row.played}</td>
                    <td style={{ textAlign: 'center' }}>{row.wins}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'white' }}>{row.points}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {row.form.map((f, fi) => (
                          <span key={fi} style={{ 
                            fontSize: '9px', 
                            fontWeight: 'bold', 
                            width: '14px', 
                            height: '14px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            borderRadius: '3px',
                            background: f === 'W' ? 'rgba(16, 185, 129, 0.15)' : f === 'D' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: f === 'W' ? 'var(--emerald)' : f === 'D' ? 'var(--amber)' : 'var(--rose)',
                            border: f === 'W' ? '1px solid rgba(16,185,129,0.3)' : f === 'D' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(244,63,94,0.3)'
                          }}>{f}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Players Standings Section */}
      <div className="dashboard-grid">
        <div className="col-12 glass-panel">
          <div className="card-header">
            <h2 className="card-title">
              <User size={18} style={{ color: 'var(--violet)' }} />
              Tournament Player Stats & Health Hub
            </h2>
          </div>
          <div className="card-body" style={{ padding: '0px' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Team</th>
                  <th>Position</th>
                  <th>Match Status / Stats</th>
                  <th>Tournament Points</th>
                  <th>Live Rating</th>
                  <th>Health Triage Status</th>
                </tr>
              </thead>
              <tbody>
                {PLAYER_STATS.map((player) => (
                  <tr key={player.id}>
                    <td style={{ fontWeight: '600' }}>{player.name}</td>
                    <td>{player.team}</td>
                    <td>{player.role}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {player.goals !== undefined ? `⚽ ${player.goals} Goals, 👟 ${player.assists} Assists` : ''}
                      {player.interceptions !== undefined ? `🛡️ ${player.interceptions} Intercepts, 🤼 ${player.tackles} Tackles` : ''}
                      {player.saves !== undefined ? `🧤 ${player.saves} Saves, 🥅 ${player.cleanSheets} Clean Sheets` : ''}
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{player.points} pts</td>
                    <td style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>★ {player.rating}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: player.health === 'Match Fit' ? 'rgba(16, 185, 129, 0.15)' : player.health.includes('Injured') ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: player.health === 'Match Fit' ? 'var(--emerald)' : player.health.includes('Injured') ? 'var(--rose)' : 'var(--amber)',
                        border: player.health === 'Match Fit' ? '1px solid rgba(16,185,129,0.3)' : player.health.includes('Injured') ? '1px solid rgba(244,63,94,0.3)' : '1px solid rgba(245,158,11,0.3)'
                      }}>
                        {player.health}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

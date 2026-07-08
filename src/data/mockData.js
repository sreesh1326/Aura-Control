// mockData.js - Initial static and seed data for the Smart Stadium Dashboard

export const INITIAL_SECTIONS = [
  {
    id: 'north',
    name: 'North Stand (Family & General)',
    capacity: 12000,
    occupancy: 4500,
    securityGuards: 12,
    gates: ['Gate 1', 'Gate 2'],
    color: '#06b6d4',
  },
  {
    id: 'east',
    name: 'East Stand (General Admission)',
    capacity: 15000,
    occupancy: 9500,
    securityGuards: 18,
    gates: ['Gate 3', 'Gate 4'],
    color: '#8b5cf6',
  },
  {
    id: 'south',
    name: 'South Stand (Ultras & Fan Club)',
    capacity: 10000,
    occupancy: 9200, // Very high density initially
    securityGuards: 25,
    gates: ['Gate 5', 'Gate 6'],
    color: '#f43f5e',
  },
  {
    id: 'west',
    name: 'West Stand (Premium & Press)',
    capacity: 8000,
    occupancy: 3200,
    securityGuards: 10,
    gates: ['Gate 7', 'Gate 8'],
    color: '#10b981',
  },
  {
    id: 'vip',
    name: 'VIP & Executive Suites',
    capacity: 3000,
    occupancy: 1200,
    securityGuards: 8,
    gates: ['VIP Club Entrance'],
    color: '#f59e0b',
  }
];

export const INITIAL_PARKING = [
  {
    id: 'zone-a',
    name: 'Parking Zone A (North/VIP)',
    totalSlots: 400,
    occupiedSlots: 320,
    distanceToGates: '2 min walk to Gate 1 & VIP Entrance',
    optimalFor: ['north', 'vip'],
    status: 'Busy'
  },
  {
    id: 'zone-b',
    name: 'Parking Zone B (East/General)',
    totalSlots: 600,
    occupiedSlots: 480,
    distanceToGates: '4 min walk to Gate 3 & 4',
    optimalFor: ['east'],
    status: 'Normal'
  },
  {
    id: 'zone-c',
    name: 'Parking Zone C (South/Ultras)',
    totalSlots: 500,
    occupiedSlots: 490, // Almost full
    distanceToGates: '5 min walk to Gate 5 & 6',
    optimalFor: ['south'],
    status: 'Full'
  },
  {
    id: 'zone-d',
    name: 'Parking Zone D (West/Premium)',
    totalSlots: 300,
    occupiedSlots: 150,
    distanceToGates: '3 min walk to Gate 7 & 8',
    optimalFor: ['west'],
    status: 'Available'
  }
];

export const FIXTURES = [
  {
    id: 'm1',
    tournament: 'International Stadium Cup 2026',
    homeTeam: 'Strikers FC',
    awayTeam: 'Titans United',
    homeLogo: '⚡',
    awayLogo: '🛡️',
    date: 'Today, 19:30',
    venue: 'Metropolis Stadium',
    status: 'LIVE',
    score: '2 - 1',
    minute: '72\'',
    spectators: '27,600'
  },
  {
    id: 'm2',
    tournament: 'International Stadium Cup 2026',
    homeTeam: 'Apex Knights',
    awayTeam: 'Phoenix FC',
    homeLogo: '⚔️',
    awayLogo: '🔥',
    date: 'Tomorrow, 18:00',
    venue: 'Metropolis Stadium',
    status: 'UPCOMING',
    score: 'vs',
    minute: '',
    spectators: '0'
  },
  {
    id: 'm3',
    tournament: 'International Stadium Cup 2026',
    homeTeam: 'Storm City',
    awayTeam: 'Vanguard Legends',
    homeLogo: '🌀',
    awayLogo: '🏆',
    date: 'July 11, 20:00',
    venue: 'Metropolis Stadium',
    status: 'UPCOMING',
    score: 'vs',
    minute: '',
    spectators: '0'
  },
  {
    id: 'm4',
    tournament: 'International Stadium Cup 2026',
    homeTeam: 'Nova Warriors',
    awayTeam: 'Falcon FC',
    homeLogo: '💫',
    awayLogo: '🦅',
    date: 'July 05, 19:00',
    venue: 'Metropolis Stadium',
    status: 'FINISHED',
    score: '3 - 0',
    minute: 'Full Time',
    spectators: '29,400'
  }
];

export const POINTS_TABLE = [
  { rank: 1, team: 'Strikers FC', played: 5, wins: 4, draws: 1, losses: 0, points: 13, form: ['W', 'W', 'D', 'W', 'W'] },
  { rank: 2, team: 'Nova Warriors', played: 6, wins: 4, draws: 0, losses: 2, points: 12, form: ['W', 'L', 'W', 'W', 'L'] },
  { rank: 3, team: 'Titans United', played: 5, wins: 3, draws: 0, losses: 2, points: 9, form: ['W', 'W', 'L', 'L', 'W'] },
  { rank: 4, team: 'Phoenix FC', played: 5, wins: 2, draws: 1, losses: 2, points: 7, form: ['L', 'D', 'W', 'L', 'W'] },
  { rank: 5, team: 'Vanguard Legends', played: 5, wins: 1, draws: 2, losses: 2, points: 5, form: ['D', 'L', 'D', 'W', 'L'] },
  { rank: 6, team: 'Apex Knights', played: 5, wins: 1, draws: 1, losses: 3, points: 4, form: ['L', 'W', 'L', 'D', 'L'] },
  { rank: 7, team: 'Storm City', played: 5, wins: 1, draws: 1, losses: 3, points: 4, form: ['D', 'L', 'W', 'L', 'L'] },
  { rank: 8, team: 'Falcon FC', played: 6, wins: 1, draws: 0, losses: 5, points: 3, form: ['L', 'L', 'L', 'L', 'W'] }
];

export const PLAYER_STATS = [
  { id: 'p1', name: 'Marcus Sterling', team: 'Strikers FC', role: 'Forward', goals: 8, assists: 3, health: 'Match Fit', points: 280, rating: '8.4' },
  { id: 'p2', name: 'Lucas Hummels', team: 'Titans United', role: 'Defender', interceptions: 28, tackles: 19, health: 'Slight Knock', points: 210, rating: '7.8' },
  { id: 'p3', name: 'Alvaro Cortez', team: 'Nova Warriors', role: 'Midfielder', goals: 4, assists: 6, health: 'Match Fit', points: 245, rating: '8.1' },
  { id: 'p4', name: 'Hiroshi Tanaka', team: 'Phoenix FC', role: 'Goalkeeper', saves: 22, cleanSheets: 3, health: 'Match Fit', points: 190, rating: '7.6' },
  { id: 'p5', name: 'Christian Dane', team: 'Vanguard Legends', role: 'Midfielder', goals: 3, assists: 2, health: 'Injured (Hamstring)', points: 140, rating: '7.0' }
];

export const INITIAL_TICKETS = [
  { ticketCode: 'TKT-ST-NORTH-8491', name: 'Liam Neeson', sectionId: 'north', seat: 'Sec N1, Row D, Seat 12', price: '$45', status: 'VALID', scans: 0, hash: 'a1b2c3d4' },
  { ticketCode: 'TKT-ST-VIP-0921', name: 'Sophia Loren', sectionId: 'vip', seat: 'VIP Box 3, Seat A', price: '$250', status: 'VALID', scans: 0, hash: 'f5e6d7c8' },
  { ticketCode: 'TKT-ST-SOUTH-4188', name: 'Jack Ryan', sectionId: 'south', seat: 'Sec S4, Row Z, Seat 44', price: '$35', status: 'VALID', scans: 0, hash: '9a8b7c6d' },
  { ticketCode: 'TKT-ST-EAST-9902', name: 'Emma Watson', sectionId: 'east', seat: 'Sec E2, Row M, Seat 18', price: '$50', status: 'VALID', scans: 0, hash: '4e3d2c1b' },
  { ticketCode: 'TKT-ST-WEST-5512', name: 'David Beckham', sectionId: 'west', seat: 'Sec W1, Row A, Seat 1', price: '$90', status: 'VALID', scans: 0, hash: '8f7e6d5c' }
];

export const INCIDENT_TEMPLATES = [
  { category: 'Medical', title: 'Chest Pain / Cardiac Alert', severity: 'Critical', desc: 'Chest pressure and shortness of breath reported.' },
  { category: 'Medical', title: 'Heat Exhaustion', severity: 'Moderate', desc: 'Fan collapsed due to dehydration and heat.' },
  { category: 'Medical', title: 'Player Collision / Head Injury', severity: 'Critical', desc: 'Concussion symptoms after high-impact collision on field.' },
  { category: 'Security', title: 'Aggressive Crowd Behavior', severity: 'Moderate', desc: 'Verbal dispute escalation in stands.' },
  { category: 'Security', title: 'Intrusion / Pitch Invader', severity: 'Critical', desc: 'Unauthorized individual running towards field.' },
  { category: 'Security', title: 'Gate Congestion Bottleneck', severity: 'Low', desc: 'Slow clearance at turnstile 5.' }
];

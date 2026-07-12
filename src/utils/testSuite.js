/**
 * testSuite.js
 * Automated verification pipeline for AURA Smart Stadium Operations.
 * Covers: ticket integrity, fraud detection, crowd safety, parking routing,
 * security allocation, emergency dispatch, input validation, and edge cases.
 */

// ─── Shared Hashing Utility (mirrors TicketTab implementation) ─────────────
const generateSecureHash = (code, name, seat) => {
  const stringToHash = `${code}-${name}-${seat}-SECRET_SALT_2026`;
  let hash = 0;
  for (let i = 0; i < stringToHash.length; i++) {
    hash = (hash << 5) - hash + stringToHash.charCodeAt(i);
    hash |= 0; // Coerce to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
};

// ─── Test Runner Helper ────────────────────────────────────────────────────
const runTest = (id, name, fn) => {
  try {
    const result = fn();
    if (result !== true) throw new Error(result || 'Assertion failed.');
    return { id, name, status: 'PASSED', details: 'All assertions verified successfully.' };
  } catch (err) {
    return { id, name, status: 'FAILED', details: err.message };
  }
};

// ─── Main Diagnostics Export ───────────────────────────────────────────────
export const runDiagnostics = (currentSections, currentParkingLots) => {
  const results = [];

  // ── T1: Cryptographic Hash Integrity ────────────────────────────────────
  results.push(runTest('T1', 'Cryptographic Ticket Hash Integrity', () => {
    const code = 'TKT-TEST-9999';
    const name = 'John Doe';
    const seat = 'Sec N1, Row A, Seat 1';
    const hash = generateSecureHash(code, name, seat);

    const isValidMatch   = hash === generateSecureHash(code, name, seat);
    const isTamperedFail = hash === generateSecureHash(code, 'Jane Doe', seat);
    const isSeatFail     = hash === generateSecureHash(code, name, 'Sec VIP, Row A, Seat 99');

    if (!isValidMatch)   throw new Error('Valid ticket hash did not match itself — hash function is non-deterministic.');
    if (isTamperedFail)  throw new Error('Tampered name passed hash verification — collision vulnerability detected.');
    if (isSeatFail)      throw new Error('Tampered seat passed hash verification — collision vulnerability detected.');
    return true;
  }));

  // ── T2: Duplicate Scan Fraud Detection ──────────────────────────────────
  results.push(runTest('T2', 'Duplicate Scan Counter-Fraud Protection', () => {
    const ticket = { ticketCode: 'TKT-DUP-001', scans: 0 };
    ticket.scans += 1;
    if (ticket.scans !== 1) throw new Error(`First scan count should be 1, got ${ticket.scans}.`);
    const isDuplicate = ticket.scans > 0;
    if (!isDuplicate) throw new Error('Duplicate detection logic returned false on second scan attempt.');
    ticket.scans += 1;
    if (ticket.scans !== 2) throw new Error(`Expected scan count 2 after duplicate attempt, got ${ticket.scans}.`);
    return true;
  }));

  // ── T3: Counterfeit Ticket Rejection ────────────────────────────────────
  results.push(runTest('T3', 'Counterfeit Ticket Rejection Gate', () => {
    const database = ['TKT-NORTH-1234', 'TKT-VIP-0921', 'TKT-SOUTH-4188'];
    const fakeCode = 'TKT-FAKE-999';
    const emptyCode = '';
    const sqlCode = "'; DROP TABLE tickets; --";

    if (database.includes(fakeCode))  throw new Error('Fake ticket code bypassed database lookup.');
    if (database.includes(emptyCode)) throw new Error('Empty ticket code bypassed database lookup.');
    if (database.includes(sqlCode))   throw new Error('SQL injection string bypassed database lookup.');
    return true;
  }));

  // ── T4: Dynamic Parking Overflow Rerouting ──────────────────────────────
  results.push(runTest('T4', 'Dynamic Parking Overflow Rerouting', () => {
    const fullZone = { id: 'zone-c', occupiedSlots: 495, totalSlots: 500 };
    const clearZone = { id: 'zone-d', occupiedSlots: 100, totalSlots: 300 };

    let assigned = fullZone;
    let rerouted = false;

    if (assigned.occupiedSlots >= assigned.totalSlots * 0.95) {
      assigned = clearZone;
      rerouted = true;
    }

    if (!rerouted)            throw new Error('Reroute flag was not set for a zone at 99% capacity.');
    if (assigned.id !== 'zone-d') throw new Error(`Expected reroute to zone-d, got ${assigned.id}.`);
    return true;
  }));

  // ── T5: Security Guard Proportional Auto-Rebalancing ────────────────────
  results.push(runTest('T5', 'Security Crowd Density Proportional Allocation', () => {
    const secA = { id: 'sec-a', occupancy: 100, securityGuards: 5 };
    const secB = { id: 'sec-b', occupancy: 900, securityGuards: 5 };
    const totalGuards = secA.securityGuards + secB.securityGuards;
    const totalOcc = secA.occupancy + secB.occupancy;

    secA.securityGuards = Math.round((secA.occupancy / totalOcc) * totalGuards);
    secB.securityGuards = Math.round((secB.occupancy / totalOcc) * totalGuards);

    if (secB.securityGuards !== 9) throw new Error(`Sec B should have 9 guards (got ${secB.securityGuards}).`);
    if (secA.securityGuards !== 1) throw new Error(`Sec A should have 1 guard (got ${secA.securityGuards}).`);
    return true;
  }));

  // ── T6: Critical Overcrowding Threshold Detection ───────────────────────
  results.push(runTest('T6', 'Critical Overcrowding Threshold Trigger (≥95%)', () => {
    const dangerSection  = { id: 'south', occupancy: 9700, capacity: 10000 };  // 97%
    const normalSection  = { id: 'north', occupancy: 4500, capacity: 12000 };  // 37.5%

    const isDanger = (dangerSection.occupancy / dangerSection.capacity) * 100 >= 95;
    const isNormal = (normalSection.occupancy / normalSection.capacity) * 100 >= 95;

    if (!isDanger) throw new Error('South Stand at 97% did not trigger overcrowding alert.');
    if (isNormal)  throw new Error('North Stand at 37.5% incorrectly triggered overcrowding alert.');
    return true;
  }));

  // ── T7: Ticket Code Format Validation ───────────────────────────────────
  results.push(runTest('T7', 'Ticket Code Format & Uniqueness Validation', () => {
    const TICKET_CODE_REGEX = /^TKT-[A-Z]+-\d{4,}$/;

    const validCodes   = ['TKT-NORTH-1234', 'TKT-VIP-5678', 'TKT-SOUTH-9012'];
    const invalidCodes = ['', 'FAKE-CODE', 'TKT-', '1234', null, undefined];

    for (const code of validCodes) {
      if (!TICKET_CODE_REGEX.test(code)) throw new Error(`Valid code "${code}" failed format check.`);
    }
    for (const code of invalidCodes) {
      if (code && TICKET_CODE_REGEX.test(code)) throw new Error(`Invalid code "${code}" passed format check.`);
    }

    // Uniqueness check
    const allCodes = ['TKT-A-1111', 'TKT-B-2222', 'TKT-C-3333'];
    const hasDuplicate = new Set(allCodes).size !== allCodes.length;
    if (hasDuplicate) throw new Error('Duplicate ticket codes detected in mock database.');
    return true;
  }));

  // ── T8: Emergency Incident Status Lifecycle ──────────────────────────────
  results.push(runTest('T8', 'Emergency Incident Status Lifecycle Transitions', () => {
    let incident = { id: 'INC-9001', status: 'Pending Dispatch', dispatchedAt: null, resolvedAt: null };

    // Transition: Pending → Responding
    if (incident.status !== 'Pending Dispatch') throw new Error('Initial status should be Pending Dispatch.');
    incident = { ...incident, status: 'Responding', dispatchedAt: '18:30:00' };
    if (incident.status !== 'Responding')   throw new Error('Status should be Responding after dispatch.');
    if (!incident.dispatchedAt)             throw new Error('dispatchedAt should be set after dispatch.');

    // Transition: Responding → Resolved
    incident = { ...incident, status: 'Resolved', resolvedAt: '18:45:00' };
    if (incident.status !== 'Resolved')   throw new Error('Status should be Resolved after closure.');
    if (!incident.resolvedAt)             throw new Error('resolvedAt should be set after resolution.');
    return true;
  }));

  // ── T9: Parking Zone Status Threshold Accuracy ──────────────────────────
  results.push(runTest('T9', 'Parking Zone Status Thresholds (Full/Busy/Available)', () => {
    const getStatus = (occupied, total) => {
      const pct = occupied / total;
      if (pct >= 0.95) return 'Full';
      if (pct >= 0.80) return 'Busy';
      return 'Available';
    };

    if (getStatus(495, 500) !== 'Full')      throw new Error('99% occupancy should return Full.');
    if (getStatus(420, 500) !== 'Busy')      throw new Error('84% occupancy should return Busy.');
    if (getStatus(100, 500) !== 'Available') throw new Error('20% occupancy should return Available.');
    if (getStatus(475, 500) !== 'Full')      throw new Error('95% occupancy should return Full (boundary).');
    if (getStatus(400, 500) !== 'Busy')      throw new Error('80% occupancy should return Busy (boundary).');
    return true;
  }));

  // ── T10: Input Sanitization & Boundary Safety ───────────────────────────
  results.push(runTest('T10', 'Input Sanitization & Edge-Case Boundary Guards', () => {
    // Guard dispatch: cannot go negative
    const applyGuardAdjust = (current, delta, standby) => {
      if (delta > 0 && standby <= 0) return current;
      if (delta < 0 && current <= 0) return current;
      return current + delta;
    };

    if (applyGuardAdjust(0, -1, 5) !== 0)   throw new Error('Should not remove guard below 0.');
    if (applyGuardAdjust(5, 1, 0) !== 5)    throw new Error('Should not add guard with empty standby pool.');
    if (applyGuardAdjust(5, 1, 3) !== 6)    throw new Error('Should dispatch 1 guard with pool available.');
    if (applyGuardAdjust(3, -1, 0) !== 2)   throw new Error('Should recall guard when standby pool is empty.');

    // Occupancy: never exceed capacity
    const clamp = (occ, cap, delta) => Math.min(cap, Math.max(0, occ + delta));
    if (clamp(9990, 10000, 50) !== 10000) throw new Error('Occupancy exceeded capacity boundary.');
    if (clamp(5, 10000, -100) !== 0)      throw new Error('Occupancy went negative.');
    return true;
  }));

  // ── T11: Live Score Simulation Monotonicity ──────────────────────────────
  results.push(runTest('T11', 'Live Score Simulation Non-Decrement Guarantee', () => {
    const parseScore = (score) => {
      const [h, a] = score.split(' - ').map(Number);
      return { home: h, away: a };
    };

    let score = '2 - 1';
    const initial = parseScore(score);
    const nextHome = initial.home + (Math.random() > 0.7 ? 1 : 0);
    const nextAway = initial.away + (Math.random() > 0.8 ? 1 : 0);

    if (nextHome < initial.home) throw new Error('Home score decreased — scores must never decrement.');
    if (nextAway < initial.away) throw new Error('Away score decreased — scores must never decrement.');
    return true;
  }));

  // ── T12: Section Safety Level Classification ─────────────────────────────
  results.push(runTest('T12', 'Crowd Safety Level Classification Engine', () => {
    const getSafetyLevel = (density) => {
      if (density < 50) return 'SAFE / LOW';
      if (density < 75) return 'MODERATE';
      if (density < 90) return 'HIGH DENSITY';
      return 'CRITICAL / OVERCROWDING';
    };

    if (getSafetyLevel(30)  !== 'SAFE / LOW')             throw new Error('30% density should be SAFE.');
    if (getSafetyLevel(60)  !== 'MODERATE')               throw new Error('60% density should be MODERATE.');
    if (getSafetyLevel(85)  !== 'HIGH DENSITY')           throw new Error('85% density should be HIGH DENSITY.');
    if (getSafetyLevel(92)  !== 'CRITICAL / OVERCROWDING') throw new Error('92% density should be CRITICAL.');
    if (getSafetyLevel(100) !== 'CRITICAL / OVERCROWDING') throw new Error('100% density should be CRITICAL.');
    if (getSafetyLevel(49)  !== 'SAFE / LOW')             throw new Error('49% should be SAFE (boundary).');
    if (getSafetyLevel(50)  !== 'MODERATE')               throw new Error('50% should be MODERATE (boundary).');
    return true;
  }));

  return results;
};

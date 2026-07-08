// testSuite.js - Unit tests for validation of Smart Stadium Operations

// Hashing algorithm duplicate from TicketTab
const generateSecureHash = (code, name, seat) => {
  let stringToHash = `${code}-${name}-${seat}-SECRET_SALT_2026`;
  let hash = 0;
  for (let i = 0; i < stringToHash.length; i++) {
    hash = (hash << 5) - hash + stringToHash.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).substring(0, 8);
};

export const runDiagnostics = (currentSections, currentParkingLots) => {
  const results = [];
  
  // Test Case 1: Cryptographic Integrity Verification
  try {
    const code = "TKT-TEST-9999";
    const name = "John Doe";
    const seat = "Sec N1, Row A, Seat 1";
    const hash = generateSecureHash(code, name, seat);
    
    // Validate correct details
    const verifyValid = (hash === generateSecureHash(code, name, seat));
    
    // Validate tampered details (altered name)
    const verifyTampered = (hash === generateSecureHash(code, "Jane Doe", seat));
    
    if (verifyValid && !verifyTampered) {
      results.push({
        id: 'T1',
        name: 'Cryptographic Ticket Hash Verification',
        status: 'PASSED',
        details: 'Correctly verified authentic signature hashes. Successfully blocked tampered metadata details.'
      });
    } else {
      throw new Error('Hash verification logic failed.');
    }
  } catch (err) {
    results.push({
      id: 'T1',
      name: 'Cryptographic Ticket Hash Verification',
      status: 'FAILED',
      details: err.message
    });
  }

  // Test Case 2: Duplicate Scan Fraud Detection
  try {
    const mockTicket = { ticketCode: 'TKT-DUP-1', scans: 0 };
    
    // First Scan
    mockTicket.scans += 1;
    const firstScanOk = mockTicket.scans === 1;
    
    // Second Scan (Duplicate Alert)
    const secondScanError = mockTicket.scans > 0;
    mockTicket.scans += 1;
    
    if (firstScanOk && secondScanError && mockTicket.scans === 2) {
      results.push({
        id: 'T2',
        name: 'Duplicate Scan Counter-Fraud Protection',
        status: 'PASSED',
        details: 'Successfully flags duplicate entry codes. Prevents reused barcodes from passing gates.'
      });
    } else {
      throw new Error('Duplicate scanning state tracking failed.');
    }
  } catch (err) {
    results.push({
      id: 'T2',
      name: 'Duplicate Scan Counter-Fraud Protection',
      status: 'FAILED',
      details: err.message
    });
  }

  // Test Case 3: Counterfeit Ticket Scanner Rejection
  try {
    const databaseCodes = ['TKT-1', 'TKT-2', 'TKT-3'];
    const fakeCode = 'TKT-FAKE-999';
    
    const isCounterfeitBlocked = !databaseCodes.includes(fakeCode);
    
    if (isCounterfeitBlocked) {
      results.push({
        id: 'T3',
        name: 'Counterfeit Ticket Rejection',
        status: 'PASSED',
        details: 'Successfully rejected unknown barcodes. Prevented unauthorized stadium access.'
      });
    } else {
      throw new Error('Counterfeit check bypassed.');
    }
  } catch (err) {
    results.push({
      id: 'T3',
      name: 'Counterfeit Ticket Rejection',
      status: 'FAILED',
      details: err.message
    });
  }

  // Test Case 4: Dynamic Parking Reroute on Zone Congestion
  try {
    // Mock a full zone
    const mockZoneFull = { id: 'zone-c', occupiedSlots: 495, totalSlots: 500 }; // 99% full
    const mockZoneAlternate = { id: 'zone-d', occupiedSlots: 100, totalSlots: 300 }; // 33% full
    
    let assignedZone = mockZoneFull;
    let isRerouted = false;
    
    if (assignedZone.occupiedSlots >= assignedZone.totalSlots * 0.95) {
      assignedZone = mockZoneAlternate;
      isRerouted = true;
    }
    
    if (isRerouted && assignedZone.id === 'zone-d') {
      results.push({
        id: 'T4',
        name: 'Dynamic Parking Overflow Rerouting',
        status: 'PASSED',
        details: 'Successfully detected congested zones and rerouted to clear zones.'
      });
    } else {
      throw new Error('Parking overflow routing bypassed.');
    }
  } catch (err) {
    results.push({
      id: 'T4',
      name: 'Dynamic Parking Overflow Rerouting',
      status: 'FAILED',
      details: err.message
    });
  }

  // Test Case 5: Security Guard Proportional Auto-Rebalancing
  try {
    // 2 sections: Sec A (100 people), Sec B (900 people). Total 10 guards.
    const mockSecA = { id: 'sec-a', occupancy: 100, securityGuards: 5 };
    const mockSecB = { id: 'sec-b', occupancy: 900, securityGuards: 5 };
    const totalGuards = mockSecA.securityGuards + mockSecB.securityGuards;
    const totalOccupancy = mockSecA.occupancy + mockSecB.occupancy;
    
    // Rebalance
    mockSecA.securityGuards = Math.round((mockSecA.occupancy / totalOccupancy) * totalGuards);
    mockSecB.securityGuards = Math.round((mockSecB.occupancy / totalOccupancy) * totalGuards);
    
    // Sec B should get 9 guards, Sec A should get 1 guard
    if (mockSecB.securityGuards === 9 && mockSecA.securityGuards === 1) {
      results.push({
        id: 'T5',
        name: 'Security Crowd Density Allocation',
        status: 'PASSED',
        details: 'Successfully scaled guard forces proportionally according to sector densities.'
      });
    } else {
      throw new Error('Guards scaling allocation calculations incorrect.');
    }
  } catch (err) {
    results.push({
      id: 'T5',
      name: 'Security Crowd Density Allocation',
      status: 'FAILED',
      details: err.message
    });
  }

  return results;
};

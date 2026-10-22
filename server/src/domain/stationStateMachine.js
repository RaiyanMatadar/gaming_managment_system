/**
 * Station State Machine & Hardware Allocation Rules
 * 
 * Enforces valid hardware states and guarantees physical stations
 * cannot be double-booked or placed into invalid states.
 */

export const StationStatus = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE',
  RESERVED: 'RESERVED'
});

export const StationType = Object.freeze({
  PC_STANDARD: 'PC_STANDARD',
  PC_VIP: 'PC_VIP',
  PS5: 'PS5',
  XBOX: 'XBOX',
  VR: 'VR'
});

const ALLOWED_STATION_TRANSITIONS = {
  [StationStatus.AVAILABLE]: new Set([
    StationStatus.OCCUPIED,
    StationStatus.RESERVED,
    StationStatus.MAINTENANCE
  ]),
  [StationStatus.OCCUPIED]: new Set([
    StationStatus.AVAILABLE,
    StationStatus.MAINTENANCE // Emergency hardware failure
  ]),
  [StationStatus.RESERVED]: new Set([
    StationStatus.OCCUPIED,
    StationStatus.AVAILABLE
  ]),
  [StationStatus.MAINTENANCE]: new Set([
    StationStatus.AVAILABLE
  ])
};

/**
 * Validates whether a proposed station state transition is permitted.
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateStationTransition(currentStatus, nextStatus) {
  if (!StationStatus[currentStatus]) {
    return { valid: false, error: `Invalid current station status: '${currentStatus}'` };
  }
  if (!StationStatus[nextStatus]) {
    return { valid: false, error: `Invalid target station status: '${nextStatus}'` };
  }

  const allowedTargets = ALLOWED_STATION_TRANSITIONS[currentStatus];
  if (!allowedTargets.has(nextStatus)) {
    return {
      valid: false,
      error: `Illegal station transition: Cannot transition station from '${currentStatus}' to '${nextStatus}'.`
    };
  }

  return { valid: true };
}

/**
 * Validates if a station is currently bookable for a new session.
 * @param {Object} station
 * @returns {{ bookable: boolean, reason?: string }}
 */
export function canStartSession(station) {
  if (!station || typeof station !== 'object') {
    return { bookable: false, reason: 'Station object is missing or invalid' };
  }
  if (station.status !== StationStatus.AVAILABLE) {
    return {
      bookable: false,
      reason: `Station is currently in '${station.status}' status and cannot accept a new session.`
    };
  }
  if (station.currentSessionId) {
    return {
      bookable: false,
      reason: `Station already has an active session attached (${station.currentSessionId}).`
    };
  }
  return { bookable: true };
}

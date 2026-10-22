/**
 * Session State Machine & Validation Engine
 * 
 * Enforces valid lifecycle transitions and protects against illegal status mutations.
 */

export const SessionStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  EXPIRED_UNSETTLED: 'EXPIRED_UNSETTLED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
});

const ALLOWED_TRANSITIONS = {
  [SessionStatus.ACTIVE]: new Set([
    SessionStatus.ACTIVE, // Extension
    SessionStatus.PAUSED,
    SessionStatus.EXPIRED_UNSETTLED,
    SessionStatus.COMPLETED,
    SessionStatus.CANCELLED
  ]),
  [SessionStatus.PAUSED]: new Set([
    SessionStatus.ACTIVE, // Resume
    SessionStatus.CANCELLED
  ]),
  [SessionStatus.EXPIRED_UNSETTLED]: new Set([
    SessionStatus.ACTIVE, // Extended past expiry
    SessionStatus.COMPLETED,
    SessionStatus.CANCELLED
  ]),
  [SessionStatus.COMPLETED]: new Set(), // Terminal
  [SessionStatus.CANCELLED]: new Set()  // Terminal
};

/**
 * Validates whether a proposed session state transition is permitted.
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateSessionTransition(currentStatus, nextStatus) {
  if (!SessionStatus[currentStatus]) {
    return { valid: false, error: `Invalid current session status: '${currentStatus}'` };
  }
  if (!SessionStatus[nextStatus]) {
    return { valid: false, error: `Invalid target session status: '${nextStatus}'` };
  }

  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedTargets.has(nextStatus)) {
    return {
      valid: false,
      error: `Illegal transition: Cannot transition session from '${currentStatus}' to '${nextStatus}'.`
    };
  }

  return { valid: true };
}

/**
 * Determines current derived status based on wall-clock time and pause status.
 * @param {Object} session
 * @param {Date|string|number} [currentTime=Date.now()]
 * @returns {string} One of SessionStatus
 */
export function deriveSessionStatus(session, currentTime = Date.now()) {
  if (session.status === SessionStatus.COMPLETED || session.status === SessionStatus.CANCELLED) {
    return session.status;
  }
  if (session.status === SessionStatus.PAUSED) {
    return SessionStatus.PAUSED;
  }

  const scheduledEndMs = new Date(session.scheduledEndTime).getTime();
  const nowMs = new Date(currentTime).getTime();

  if (nowMs > scheduledEndMs) {
    return SessionStatus.EXPIRED_UNSETTLED;
  }

  return SessionStatus.ACTIVE;
}

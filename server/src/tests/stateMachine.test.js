import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SessionStatus,
  validateSessionTransition,
  deriveSessionStatus
} from '../domain/sessionStateMachine.js';
import {
  StationStatus,
  validateStationTransition,
  canStartSession
} from '../domain/stationStateMachine.js';

describe('State Machines & Transition Validators', () => {

  describe('Session State Machine', () => {
    it('allows valid transitions from ACTIVE', () => {
      assert.deepEqual(validateSessionTransition(SessionStatus.ACTIVE, SessionStatus.PAUSED), { valid: true });
      assert.deepEqual(validateSessionTransition(SessionStatus.ACTIVE, SessionStatus.EXPIRED_UNSETTLED), { valid: true });
      assert.deepEqual(validateSessionTransition(SessionStatus.ACTIVE, SessionStatus.COMPLETED), { valid: true });
      assert.deepEqual(validateSessionTransition(SessionStatus.ACTIVE, SessionStatus.CANCELLED), { valid: true });
    });

    it('allows resuming from PAUSED to ACTIVE', () => {
      assert.deepEqual(validateSessionTransition(SessionStatus.PAUSED, SessionStatus.ACTIVE), { valid: true });
      assert.deepEqual(validateSessionTransition(SessionStatus.PAUSED, SessionStatus.CANCELLED), { valid: true });
    });

    it('allows extending or completing from EXPIRED_UNSETTLED', () => {
      assert.deepEqual(validateSessionTransition(SessionStatus.EXPIRED_UNSETTLED, SessionStatus.ACTIVE), { valid: true });
      assert.deepEqual(validateSessionTransition(SessionStatus.EXPIRED_UNSETTLED, SessionStatus.COMPLETED), { valid: true });
    });

    it('rejects illegal transitions from COMPLETED or CANCELLED', () => {
      const fromCompleted = validateSessionTransition(SessionStatus.COMPLETED, SessionStatus.ACTIVE);
      assert.equal(fromCompleted.valid, false);

      const fromCancelled = validateSessionTransition(SessionStatus.CANCELLED, SessionStatus.ACTIVE);
      assert.equal(fromCancelled.valid, false);
    });

    it('rejects direct transition from PAUSED to COMPLETED', () => {
      const res = validateSessionTransition(SessionStatus.PAUSED, SessionStatus.COMPLETED);
      assert.equal(res.valid, false);
    });

    it('derives EXPIRED_UNSETTLED dynamically when now > scheduledEndTime', () => {
      const session = {
        status: SessionStatus.ACTIVE,
        scheduledEndTime: new Date('2026-10-21T12:00:00Z')
      };
      const beforeEnd = deriveSessionStatus(session, new Date('2026-10-21T11:59:00Z'));
      assert.equal(beforeEnd, SessionStatus.ACTIVE);

      const afterEnd = deriveSessionStatus(session, new Date('2026-10-21T12:01:00Z'));
      assert.equal(afterEnd, SessionStatus.EXPIRED_UNSETTLED);
    });
  });

  describe('Station State Machine', () => {
    it('allows valid lifecycle transitions', () => {
      assert.deepEqual(validateStationTransition(StationStatus.AVAILABLE, StationStatus.OCCUPIED), { valid: true });
      assert.deepEqual(validateStationTransition(StationStatus.OCCUPIED, StationStatus.AVAILABLE), { valid: true });
      assert.deepEqual(validateStationTransition(StationStatus.AVAILABLE, StationStatus.MAINTENANCE), { valid: true });
      assert.deepEqual(validateStationTransition(StationStatus.MAINTENANCE, StationStatus.AVAILABLE), { valid: true });
    });

    it('rejects invalid direct transitions', () => {
      const res = validateStationTransition(StationStatus.OCCUPIED, StationStatus.RESERVED);
      assert.equal(res.valid, false);
    });

    it('canStartSession verifies station is AVAILABLE with no existing session', () => {
      const availableStation = { id: 'st1', status: StationStatus.AVAILABLE, currentSessionId: null };
      assert.deepEqual(canStartSession(availableStation), { bookable: true });

      const occupiedStation = { id: 'st2', status: StationStatus.OCCUPIED, currentSessionId: 'sess1' };
      const resOccupied = canStartSession(occupiedStation);
      assert.equal(resOccupied.bookable, false);

      const maintenanceStation = { id: 'st3', status: StationStatus.MAINTENANCE, currentSessionId: null };
      const resMaint = canStartSession(maintenanceStation);
      assert.equal(resMaint.bookable, false);
    });
  });

});

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { memoryStore } from '../storage/memoryStore.js';
import { expiryPoller } from '../services/expiryPoller.js';
import { eventBroadcaster } from '../services/eventBroadcaster.js';
import { sessionService } from '../services/sessionService.js';
import { SessionStatus } from '../domain/sessionStateMachine.js';

describe('Milestone 3: Expiry Poller & Event Broadcaster', () => {
  beforeEach(() => {
    memoryStore.reset();
    eventBroadcaster.reset();
    expiryPoller.stop();
  });

  afterEach(() => {
    expiryPoller.stop();
    eventBroadcaster.reset();
  });

  it('detects an expired session and transitions it to EXPIRED_UNSETTLED', async () => {
    const station = await memoryStore.createStation({
      name: 'PC-EXP-01',
      type: 'PC_STANDARD',
      hourlyRate: 100
    });

    // Create session scheduled in the past
    const pastStart = new Date(Date.now() - 65 * 60 * 1000); // 65 mins ago
    const pastEnd = new Date(Date.now() - 5 * 60 * 1000);    // ended 5 mins ago

    const session = await memoryStore.createSession({
      stationId: station._id,
      stationName: station.name,
      customerName: 'Past Gamer',
      pricingType: 'PACKAGE',
      bookedMinutes: 60,
      startTime: pastStart,
      scheduledEndTime: pastEnd,
      status: SessionStatus.ACTIVE,
      rateCardSnapshot: { hourlyRate: 100, gracePeriodMinutes: 5, overtimeBlockMinutes: 15 },
      financials: {}
    });

    let eventFired = false;
    let eventData = null;
    eventBroadcaster.once('SESSION_EXPIRED', (data) => {
      eventFired = true;
      eventData = data;
    });

    const result = await expiryPoller.checkActiveSessions();
    assert.equal(result.expired, 1);
    assert.equal(eventFired, true);
    assert.equal(String(eventData.sessionId), String(session._id));

    // Verify database state updated
    const updated = await memoryStore.getSessionById(session._id);
    assert.equal(updated.status, SessionStatus.EXPIRED_UNSETTLED);
  });

  it('emits SESSION_EXPIRY_WARNING when session has <= 5 minutes remaining without altering status', async () => {
    const station = await memoryStore.createStation({
      name: 'PC-WARN-01',
      type: 'PC_STANDARD',
      hourlyRate: 100
    });

    // Scheduled to end 3 minutes from now
    const now = Date.now();
    const startTime = new Date(now - 57 * 60 * 1000);
    const scheduledEndTime = new Date(now + 3 * 60 * 1000); // 3 mins remaining

    const session = await memoryStore.createSession({
      stationId: station._id,
      stationName: station.name,
      customerName: 'Warning Gamer',
      pricingType: 'PACKAGE',
      bookedMinutes: 60,
      startTime,
      scheduledEndTime,
      status: SessionStatus.ACTIVE,
      rateCardSnapshot: { hourlyRate: 100, gracePeriodMinutes: 5, overtimeBlockMinutes: 15 },
      financials: {}
    });

    let warningFired = false;
    let warningPayload = null;
    eventBroadcaster.once('SESSION_EXPIRY_WARNING', (payload) => {
      warningFired = true;
      warningPayload = payload;
    });

    const result = await expiryPoller.checkActiveSessions(now);
    assert.equal(result.warned, 1);
    assert.equal(result.expired, 0);
    assert.equal(warningFired, true);
    assert.equal(warningPayload.remainingMinutes, 3);

    // Verify session remains ACTIVE
    const sessionInDb = await memoryStore.getSessionById(session._id);
    assert.equal(sessionInDb.status, SessionStatus.ACTIVE);

    // Running checkActiveSessions a second time should deduplicate and NOT emit warning again
    let duplicateFired = false;
    eventBroadcaster.once('SESSION_EXPIRY_WARNING', () => {
      duplicateFired = true;
    });

    const secondCycle = await expiryPoller.checkActiveSessions(now);
    assert.equal(secondCycle.warned, 0);
    assert.equal(duplicateFired, false);
  });

  it('broadcasts real-time events on session lifecycle actions', async () => {
    const station = await memoryStore.createStation({
      name: 'PC-SSE-01',
      type: 'PC_STANDARD',
      hourlyRate: 100
    });

    let startBroadcast = false;
    let pauseBroadcast = false;
    let resumeBroadcast = false;

    eventBroadcaster.once('SESSION_STARTED', () => { startBroadcast = true; });
    eventBroadcaster.once('SESSION_PAUSED', () => { pauseBroadcast = true; });
    eventBroadcaster.once('SESSION_RESUMED', () => { resumeBroadcast = true; });

    const session = await sessionService.startSession({
      stationId: station._id,
      customerName: 'Broadcaster Test',
      bookedMinutes: 60
    });
    assert.equal(startBroadcast, true);

    await sessionService.pauseSession(session._id, { staffId: 'Staff-1' });
    assert.equal(pauseBroadcast, true);

    await sessionService.resumeSession(session._id, { staffId: 'Staff-1' });
    assert.equal(resumeBroadcast, true);
  });
});

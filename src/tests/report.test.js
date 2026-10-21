import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { memoryStore } from '../storage/memoryStore.js';
import { sessionService } from '../services/sessionService.js';

describe('Milestone 6: Shift Reconciliation & Reporting Engine', () => {
  let app;

  beforeEach(() => {
    memoryStore.reset();
    app = createApp();
  });

  it('aggregates daily revenue with accurate Cash vs UPI breakdown', async () => {
    const station1 = await memoryStore.createStation({
      name: 'PC-REP-01',
      type: 'PC_STANDARD',
      hourlyRate: 100
    });

    const station2 = await memoryStore.createStation({
      name: 'PS5-REP-01',
      type: 'PS5',
      hourlyRate: 150
    });

    // Session 1: Paid ₹100 via CASH
    const sess1 = await sessionService.startSession({
      stationId: station1._id,
      customerName: 'Cash Gamer',
      bookedMinutes: 60
    });
    await sessionService.checkoutSession(sess1._id, {
      payment: {
        amount: 100,
        paymentMethod: 'CASH',
        idempotencyKey: 'tx_rep_cash_01'
      }
    });

    // Session 2: Paid ₹150 via UPI
    const sess2 = await sessionService.startSession({
      stationId: station2._id,
      customerName: 'UPI Gamer',
      bookedMinutes: 60
    });
    await sessionService.checkoutSession(sess2._id, {
      payment: {
        amount: 150,
        paymentMethod: 'UPI',
        referenceNumber: 'UPI7788990011',
        idempotencyKey: 'tx_rep_upi_02'
      }
    });

    // Request shift report
    const res = await request(app).get('/api/reports/shift');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const { financialSummary, gamingMetrics, stationBreakdown } = res.body.data;

    // Verify financial reconciliation
    assert.equal(financialSummary.totalRevenue, 250);
    assert.equal(financialSummary.cashTotal, 100);
    assert.equal(financialSummary.upiTotal, 150);
    assert.equal(financialSummary.cardTotal, 0);
    assert.equal(financialSummary.outstandingBalance, 0);

    // Verify gaming hours
    assert.equal(gamingMetrics.totalSessions, 2);
    assert.equal(gamingMetrics.completedSessions, 2);
    assert.equal(gamingMetrics.hoursSold, 2); // 60m + 60m = 2 hours

    // Verify station breakdown
    const st1 = stationBreakdown.find(s => String(s.stationId) === String(station1._id));
    const st2 = stationBreakdown.find(s => String(s.stationId) === String(station2._id));
    assert.ok(st1);
    assert.ok(st2);
    assert.equal(st1.sessionCount, 1);
    assert.equal(st1.revenue, 100);
    assert.equal(st2.sessionCount, 1);
    assert.equal(st2.revenue, 150);
  });

  it('GET /api/audit retrieves chronological audit logs', async () => {
    const station = await memoryStore.createStation({
      name: 'PC-AUD-01',
      type: 'PC_STANDARD',
      hourlyRate: 100
    });

    const session = await sessionService.startSession({
      stationId: station._id,
      customerName: 'Audit Gamer',
      bookedMinutes: 60,
      staffId: 'Cashier-Alice'
    });

    await sessionService.pauseSession(session._id, {
      staffId: 'Cashier-Alice',
      reason: 'Network testing'
    });

    const res = await request(app).get('/api/audit');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 2);

    const actions = res.body.data.map(l => l.action);
    assert.ok(actions.includes('START_SESSION'));
    assert.ok(actions.includes('PAUSE_SESSION'));

    const pauseLog = res.body.data.find(l => l.action === 'PAUSE_SESSION');
    assert.equal(pauseLog.reason, 'Network testing');
    assert.equal(pauseLog.actorId, 'Cashier-Alice');
  });

  it('pruneOldSessions auto-deletes closed sessions older than 30 days', async () => {
    const station = await memoryStore.createStation({
      name: 'PC-PRUNE-01',
      type: 'PC_STANDARD',
      hourlyRate: 100
    });

    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    // Old closed session (40 days ago) - should be pruned
    await memoryStore.createSession({
      stationId: station._id,
      stationName: station.name,
      customerName: 'Old Gamer',
      status: 'COMPLETED',
      startTime: fortyDaysAgo,
      createdAt: fortyDaysAgo,
      bookedMinutes: 60
    });

    // Recent closed session (10 days ago) - should be kept
    await memoryStore.createSession({
      stationId: station._id,
      stationName: station.name,
      customerName: 'Recent Gamer',
      status: 'COMPLETED',
      startTime: tenDaysAgo,
      createdAt: tenDaysAgo,
      bookedMinutes: 60
    });

    // Old ACTIVE session - should NEVER be pruned
    await memoryStore.createSession({
      stationId: station._id,
      stationName: station.name,
      customerName: 'Active Old Gamer',
      status: 'ACTIVE',
      startTime: fortyDaysAgo,
      createdAt: fortyDaysAgo,
      bookedMinutes: 60
    });

    // Execute prune
    const pruned = await memoryStore.pruneOldSessions();
    assert.equal(pruned, 1);

    const remaining = await memoryStore.getAllSessions();
    const names = remaining.map(s => s.customerName);
    assert.ok(!names.includes('Old Gamer')); // Deleted!
    assert.ok(names.includes('Recent Gamer')); // Kept!
    assert.ok(names.includes('Active Old Gamer')); // Active sessions kept!
  });
});

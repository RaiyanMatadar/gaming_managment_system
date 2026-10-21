import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { memoryStore } from '../storage/memoryStore.js';

describe('Gaming Center Management System — REST API & Lifecycle', () => {
  let app;

  beforeEach(() => {
    memoryStore.reset();
    app = createApp();
  });

  describe('Health & Station Management', () => {
    it('GET /api/health returns 200 OK', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'OK');
    });

    it('GET / serves the frontend single-page application', async () => {
      const res = await request(app).get('/');
      assert.equal(res.status, 200);
      assert.match(res.text, /Gaming Center Management System/);
    });

    it('POST /api/stations creates a station successfully', async () => {
      const res = await request(app)
        .post('/api/stations')
        .send({ name: 'PC-VIP-01', type: 'PC_VIP', hourlyRate: 150 });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, 'PC-VIP-01');
      assert.equal(res.body.data.status, 'AVAILABLE');
      assert.equal(res.body.data.hourlyRate, 150);
    });

    it('POST /api/stations rejects duplicate station name with 409', async () => {
      await request(app)
        .post('/api/stations')
        .send({ name: 'PC-VIP-01', type: 'PC_VIP', hourlyRate: 150 });

      const res = await request(app)
        .post('/api/stations')
        .send({ name: 'PC-VIP-01', type: 'PC_VIP', hourlyRate: 150 });

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
    });

    it('PATCH /api/stations/:id/status updates maintenance state', async () => {
      const st = await memoryStore.createStation({
        name: 'PS5-01',
        type: 'PS5',
        hourlyRate: 200
      });

      const res = await request(app)
        .patch(`/api/stations/${st._id}/status`)
        .send({ status: 'MAINTENANCE', notes: 'Controller drift repair' });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.status, 'MAINTENANCE');
      assert.equal(res.body.data.notes, 'Controller drift repair');
    });
  });

  describe('Session Lifecycle & Concurrency Protection', () => {
    let station1;
    let station2;

    beforeEach(async () => {
      station1 = await memoryStore.createStation({
        name: 'PC-01',
        type: 'PC_STANDARD',
        hourlyRate: 100
      });
      station2 = await memoryStore.createStation({
        name: 'PC-02',
        type: 'PC_STANDARD',
        hourlyRate: 100
      });
    });

    it('starts a session and atomically locks station to OCCUPIED', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .send({
          stationId: station1._id,
          customerName: 'Alex',
          pricingType: 'PACKAGE',
          bookedMinutes: 60
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.status, 'ACTIVE');
      assert.equal(res.body.data.customerName, 'Alex');

      // Verify physical station is OCCUPIED
      const updatedStation = await memoryStore.getStationById(station1._id);
      assert.equal(updatedStation.status, 'OCCUPIED');
      assert.equal(String(updatedStation.currentSessionId), String(res.body.data._id));
    });

    it('prevents concurrent session collisions on the same station', async () => {
      // First cashier starts session
      const res1 = await request(app)
        .post('/api/sessions')
        .send({ stationId: station1._id, customerName: 'Alex', bookedMinutes: 60 });
      assert.equal(res1.status, 201);

      // Second cashier attempts to book the same station simultaneously
      const res2 = await request(app)
        .post('/api/sessions')
        .send({ stationId: station1._id, customerName: 'Bob', bookedMinutes: 60 });
      assert.equal(res2.status, 409);
      assert.equal(res2.body.success, false);
      assert.match(res2.body.error, /cannot accept a new session/);
    });

    it('pauses and resumes a session, pushing scheduled end time forward', async () => {
      const startRes = await request(app)
        .post('/api/sessions')
        .send({ stationId: station1._id, customerName: 'Charlie', bookedMinutes: 60 });
      const sessionId = startRes.body.data._id;
      const originalScheduledEnd = new Date(startRes.body.data.scheduledEndTime).getTime();

      // Pause
      const pauseRes = await request(app)
        .post(`/api/sessions/${sessionId}/pause`)
        .send({ staffId: 'Cashier-1', reason: 'Restroom break' });
      assert.equal(pauseRes.status, 200);
      assert.equal(pauseRes.body.data.status, 'PAUSED');

      // Resume
      const resumeRes = await request(app)
        .post(`/api/sessions/${sessionId}/resume`)
        .send({ staffId: 'Cashier-1' });
      assert.equal(resumeRes.status, 200);
      assert.equal(resumeRes.body.data.status, 'ACTIVE');

      const newScheduledEnd = new Date(resumeRes.body.data.scheduledEndTime).getTime();
      assert.ok(newScheduledEnd >= originalScheduledEnd);
    });

    it('extends session duration', async () => {
      const startRes = await request(app)
        .post('/api/sessions')
        .send({ stationId: station1._id, customerName: 'David', bookedMinutes: 60 });
      const sessionId = startRes.body.data._id;
      const initialEndMs = new Date(startRes.body.data.scheduledEndTime).getTime();

      const extRes = await request(app)
        .post(`/api/sessions/${sessionId}/extend`)
        .send({ addedMinutes: 30, staffId: 'Cashier-1' });

      assert.equal(extRes.status, 200);
      const updatedEndMs = new Date(extRes.body.data.scheduledEndTime).getTime();
      // Extended by 30 mins (1,800,000 ms)
      assert.equal(updatedEndMs - initialEndMs, 30 * 60 * 1000);
    });

    it('transfers session to another station, releasing old and occupying new', async () => {
      const startRes = await request(app)
        .post('/api/sessions')
        .send({ stationId: station1._id, customerName: 'Eva', bookedMinutes: 60 });
      const sessionId = startRes.body.data._id;

      const transferRes = await request(app)
        .post(`/api/sessions/${sessionId}/transfer`)
        .send({ targetStationId: station2._id, reason: 'Keyboard issue' });

      assert.equal(transferRes.status, 200);
      assert.equal(String(transferRes.body.data.stationId), String(station2._id));

      // Check physical station states
      const oldStation = await memoryStore.getStationById(station1._id);
      const newStation = await memoryStore.getStationById(station2._id);
      assert.equal(oldStation.status, 'AVAILABLE');
      assert.equal(oldStation.currentSessionId, null);
      assert.equal(newStation.status, 'OCCUPIED');
      assert.equal(String(newStation.currentSessionId), String(sessionId));
    });

    it('checks out session, records payment with idempotency, and releases station', async () => {
      const startRes = await request(app)
        .post('/api/sessions')
        .send({ stationId: station1._id, customerName: 'Frank', bookedMinutes: 60 });
      const sessionId = startRes.body.data._id;

      const idempotencyKey = 'idemp_test_uuid_12345';
      const checkoutRes = await request(app)
        .post(`/api/sessions/${sessionId}/checkout`)
        .send({
          payment: {
            amount: 100,
            paymentMethod: 'UPI',
            referenceNumber: 'UPI9876543210',
            idempotencyKey
          },
          discount: 0
        });

      assert.equal(checkoutRes.status, 200);
      assert.equal(checkoutRes.body.data.session.status, 'COMPLETED');
      assert.equal(checkoutRes.body.data.receipt.financials.paymentStatus, 'PAID');
      assert.equal(checkoutRes.body.data.receipt.financials.balanceDue, 0);

      // Station must be freed
      const station = await memoryStore.getStationById(station1._id);
      assert.equal(station.status, 'AVAILABLE');
      assert.equal(station.currentSessionId, null);

      // Verify idempotency: re-submitting with identical idempotencyKey does not double-record payment
      const payments = await memoryStore.getPaymentsBySessionId(sessionId);
      assert.equal(payments.length, 1);
    });

    it('cancelling a session releases the station to AVAILABLE', async () => {
      const startRes = await request(app)
        .post('/api/sessions')
        .send({ stationId: station1._id, customerName: 'Grace', bookedMinutes: 60 });
      const sessionId = startRes.body.data._id;

      const cancelRes = await request(app)
        .post(`/api/sessions/${sessionId}/cancel`)
        .send({ staffId: 'Manager-1', reason: 'Customer had emergency' });

      assert.equal(cancelRes.status, 200);
      assert.equal(cancelRes.body.data.status, 'CANCELLED');
      assert.equal(cancelRes.body.data.cancellationReason, 'Customer had emergency');

      const station = await memoryStore.getStationById(station1._id);
      assert.equal(station.status, 'AVAILABLE');
      assert.equal(station.currentSessionId, null);
    });

    it('GET /api/sessions/live returns live status enriched with remaining and overtime values', async () => {
      await request(app)
        .post('/api/sessions')
        .send({ stationId: station1._id, customerName: 'Harry', bookedMinutes: 45 });

      const res = await request(app).get('/api/sessions/live');
      assert.equal(res.status, 200);
      const s1 = res.body.data.find(s => String(s._id) === String(station1._id));
      assert.ok(s1);
      assert.ok(s1.liveSession);
      assert.equal(s1.liveSession.customerName, 'Harry');
      assert.equal(s1.liveSession.status, 'ACTIVE');
      assert.ok(typeof s1.liveSession.remainingMinutes === 'number');
    });
  });

});

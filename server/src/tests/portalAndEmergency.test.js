import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { memoryStore } from '../storage/memoryStore.js';

describe('Customer Self-Service Portal & UPS Emergency Freeze', () => {
  let app;
  let station;
  let activeSession;

  beforeEach(async () => {
    memoryStore.reset();
    app = createApp();

    // Setup station
    const stRes = await request(app)
      .post('/api/stations')
      .send({ name: 'PC-DESK-01', type: 'PC_VIP', hourlyRate: 150 });
    assert.equal(stRes.status, 201);
    station = stRes.body.data;

    // Start session on PC-DESK-01
    const sessRes = await request(app)
      .post('/api/sessions')
      .send({
        stationId: station._id,
        customerName: 'Aarav Tester',
        bookedMinutes: 60,
        pricingType: 'PACKAGE'
      });
    assert.equal(sessRes.status, 201);
    activeSession = sessRes.body.data;
  });

  describe('In-Desk Customer Self-Service Portal', () => {
    it('GET /api/portal/station/:id returns station info, live session and snack menu', async () => {
      const res = await request(app).get(`/api/portal/station/${station._id}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.station.name, 'PC-DESK-01');
      assert.equal(res.body.data.session.customerName, 'Aarav Tester');
      assert.equal(res.body.data.session.bookedMinutes, 60);
      assert.ok(Array.isArray(res.body.data.menu));
      assert.ok(res.body.data.menu.length > 0);
    });

    it('POST /api/portal/station/:id/call-staff broadcasts assistance request', async () => {
      const res = await request(app)
        .post(`/api/portal/station/${station._id}/call-staff`)
        .send({
          reason: 'Headset left ear audio not working',
          customerName: 'Aarav Tester'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.match(res.body.message, /Staff alerted/i);
    });

    it('POST /api/portal/station/:id/order-snack calculates total and submits in-seat order', async () => {
      const res = await request(app)
        .post(`/api/portal/station/${station._id}/order-snack`)
        .send({
          customerName: 'Aarav Tester',
          items: [
            { id: 'snk_redbull', name: 'Red Bull Energy (250ml)', price: 125, qty: 2 },
            { id: 'snk_ramen', name: 'Spicy Korean Shin Ramyun', price: 95, qty: 1 }
          ],
          notes: 'Extra spicy please!'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.totalAmount, 125 * 2 + 95); // 345
      assert.match(res.body.data.orderId, /^ORD-/);
    });

    it('POST /api/portal/station/:id/request-extension requests more time', async () => {
      const res = await request(app)
        .post(`/api/portal/station/${station._id}/request-extension`)
        .send({
          additionalMinutes: 30,
          customerName: 'Aarav Tester'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.match(res.body.message, /\+30 mins/i);
    });
  });

  describe('UPS Emergency Power Cut Freeze Mode', () => {
    it('POST /api/sessions/emergency/freeze-all pauses all active sessions and sets emergency flag', async () => {
      // 1. Initial emergency status is false
      const statusBefore = await request(app).get('/api/sessions/emergency/status');
      assert.equal(statusBefore.body.data.isEmergencyFrozen, false);

      // 2. Trigger freeze all
      const freezeRes = await request(app)
        .post('/api/sessions/emergency/freeze-all')
        .send({ reason: 'Main Power Grid Tripped - Running on UPS' });

      assert.equal(freezeRes.status, 200);
      assert.equal(freezeRes.body.success, true);
      assert.equal(freezeRes.body.data.frozenCount, 1);

      // 3. Status now indicates frozen
      const statusAfter = await request(app).get('/api/sessions/emergency/status');
      assert.equal(statusAfter.body.data.isEmergencyFrozen, true);
      assert.equal(statusAfter.body.data.frozenCount, 1);

      // 4. Session status in DB is PAUSED
      const checkSession = await request(app).get(`/api/sessions/${activeSession._id}`);
      assert.equal(checkSession.body.data.status, 'PAUSED');
      assert.equal(checkSession.body.data.isEmergencyFrozen, true);

      // 5. Resume all sessions
      const resumeRes = await request(app).post('/api/sessions/emergency/resume-all');
      assert.equal(resumeRes.status, 200);
      assert.equal(resumeRes.body.data.resumedCount, 1);

      // 6. Emergency status cleared
      const statusCleared = await request(app).get('/api/sessions/emergency/status');
      assert.equal(statusCleared.body.data.isEmergencyFrozen, false);
      assert.equal(statusCleared.body.data.frozenCount, 0);

      // 7. Session status is back to ACTIVE
      const activeAgain = await request(app).get(`/api/sessions/${activeSession._id}`);
      assert.equal(activeAgain.body.data.status, 'ACTIVE');
      assert.equal(activeAgain.body.data.isEmergencyFrozen, false);
    });
  });
});

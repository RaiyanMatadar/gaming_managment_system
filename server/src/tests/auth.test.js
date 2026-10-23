import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { memoryStore } from '../storage/memoryStore.js';
import { ADMIN_REGISTRATION_SECRET } from '../middleware/authMiddleware.js';

describe('Multi-User Authentication & Multi-Tenant Data Isolation', () => {
  let app;

  beforeEach(() => {
    memoryStore.reset();
    app = createApp();
  });

  describe('Registration Security (Strict Admin Key Requirement)', () => {
    it('rejects public self-registration without x-admin-key with 403', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'public_hacker',
          password: 'password123'
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Public registration is disabled/i);
    });

    it('rejects registration with invalid x-admin-key with 403', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('x-admin-key', 'wrong-secret-key')
        .send({
          username: 'public_hacker',
          password: 'password123'
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });

    it('validates minimum field requirements when admin key is provided', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('x-admin-key', ADMIN_REGISTRATION_SECRET)
        .send({
          username: 'ab', // too short (< 3)
          password: '123' // too short (< 6)
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('successfully registers a user with valid admin key via Postman/cURL', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('x-admin-key', ADMIN_REGISTRATION_SECRET)
        .send({
          username: 'operator_dan',
          password: 'SecurePassword123!',
          name: 'Dan Operator',
          centerName: 'Dan CyberArena Downtown',
          role: 'manager'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.username, 'operator_dan');
      assert.equal(res.body.user.name, 'Dan Operator');
      assert.equal(res.body.user.centerName, 'Dan CyberArena Downtown');
      assert.equal(res.body.user.password, undefined); // Never leak hash
    });

    it('rejects duplicate username with 409 Conflict', async () => {
      await request(app)
        .post('/api/auth/register')
        .set('x-admin-key', ADMIN_REGISTRATION_SECRET)
        .send({
          username: 'unique_user',
          password: 'password123'
        });

      const res = await request(app)
        .post('/api/auth/register')
        .set('x-admin-key', ADMIN_REGISTRATION_SECRET)
        .send({
          username: 'unique_user',
          password: 'password456'
        });

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
    });
  });

  describe('User Login & JWT Verification', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .set('x-admin-key', ADMIN_REGISTRATION_SECRET)
        .send({
          username: 'cashier_sam',
          password: 'SamPassword2026!',
          name: 'Sam Cashier'
        });
    });

    it('rejects login with wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'cashier_sam',
          password: 'WrongPassword'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Invalid username or password/i);
    });

    it('rejects login with unknown username with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'non_existent_user',
          password: 'SamPassword2026!'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('returns JWT token on valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'cashier_sam',
          password: 'SamPassword2026!'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);
      assert.equal(res.body.user.username, 'cashier_sam');
    });

    it('retrieves user profile via GET /api/auth/me with Bearer token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'cashier_sam',
          password: 'SamPassword2026!'
        });

      const token = loginRes.body.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(meRes.status, 200);
      assert.equal(meRes.body.success, true);
      assert.equal(meRes.body.user.username, 'cashier_sam');
    });

    it('updates user profile including whatsappNumber via PATCH /api/auth/profile', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'cashier_sam',
          password: 'SamPassword2026!'
        });
      const token = loginRes.body.token;

      const patchRes = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Samuel Manager',
          centerName: 'Sam Gaming Lounge',
          whatsappNumber: '919876500000'
        });

      assert.equal(patchRes.status, 200);
      assert.equal(patchRes.body.success, true);
      assert.equal(patchRes.body.user.name, 'Samuel Manager');
      assert.equal(patchRes.body.user.centerName, 'Sam Gaming Lounge');
      assert.equal(patchRes.body.user.whatsappNumber, '919876500000');

      // Verify GET /api/auth/me returns updated fields
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(meRes.status, 200);
      assert.equal(meRes.body.user.whatsappNumber, '919876500000');
    });

    it('rejects invalid or forged Bearer token with 401', async () => {
      const res = await request(app)
        .get('/api/stations')
        .set('Authorization', 'Bearer forged.invalid.token');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });
  });

  describe('Multi-Tenant Data Isolation (User A cannot see or mutate User B data)', () => {
    let tokenAlpha;
    let tokenBeta;

    beforeEach(async () => {
      // 1. Create User Alpha
      await request(app)
        .post('/api/auth/register')
        .set('x-admin-key', ADMIN_REGISTRATION_SECRET)
        .send({
          username: 'center_alpha',
          password: 'AlphaPassword123!',
          name: 'Owner Alpha',
          centerName: 'Alpha Arena'
        });

      const resAlpha = await request(app)
        .post('/api/auth/login')
        .send({ username: 'center_alpha', password: 'AlphaPassword123!' });
      tokenAlpha = resAlpha.body.token;

      // 2. Create User Beta
      await request(app)
        .post('/api/auth/register')
        .set('x-admin-key', ADMIN_REGISTRATION_SECRET)
        .send({
          username: 'center_beta',
          password: 'BetaPassword123!',
          name: 'Owner Beta',
          centerName: 'Beta Gaming Lounge'
        });

      const resBeta = await request(app)
        .post('/api/auth/login')
        .send({ username: 'center_beta', password: 'BetaPassword123!' });
      tokenBeta = resBeta.body.token;
    });

    it('strictly isolates stations between users', async () => {
      // Alpha creates Station 1
      const alphaStationRes = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({ name: 'Alpha-PC-01', type: 'PC_VIP', hourlyRate: 150 });
      assert.equal(alphaStationRes.status, 201);
      const alphaStationId = alphaStationRes.body.data._id;

      // Beta creates Station 2
      const betaStationRes = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${tokenBeta}`)
        .send({ name: 'Beta-PC-01', type: 'PC_STANDARD', hourlyRate: 80 });
      assert.equal(betaStationRes.status, 201);

      // Alpha queries stations -> ONLY sees Alpha-PC-01
      const alphaList = await request(app)
        .get('/api/stations')
        .set('Authorization', `Bearer ${tokenAlpha}`);
      assert.equal(alphaList.body.data.length, 1);
      assert.equal(alphaList.body.data[0].name, 'Alpha-PC-01');

      // Beta queries stations -> ONLY sees Beta-PC-01
      const betaList = await request(app)
        .get('/api/stations')
        .set('Authorization', `Bearer ${tokenBeta}`);
      assert.equal(betaList.body.data.length, 1);
      assert.equal(betaList.body.data[0].name, 'Beta-PC-01');

      // Beta tries to delete Alpha station -> gets 404 Not Found
      const betaDeleteAlpha = await request(app)
        .delete(`/api/stations/${alphaStationId}`)
        .set('Authorization', `Bearer ${tokenBeta}`);
      assert.equal(betaDeleteAlpha.status, 404);

      // Verify Alpha station still exists
      const alphaListAfter = await request(app)
        .get('/api/stations')
        .set('Authorization', `Bearer ${tokenAlpha}`);
      assert.equal(alphaListAfter.body.data.length, 1);
    });

    it('strictly isolates active sessions, live overview, and shift reports', async () => {
      // Alpha creates a station and starts a session
      const stRes = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({ name: 'Alpha-VIP', type: 'PC_VIP', hourlyRate: 100 });
      const alphaStId = stRes.body.data._id;

      const sessionRes = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({
          stationId: alphaStId,
          customerName: 'Alpha Gamer',
          bookedMinutes: 60
        });
      assert.equal(sessionRes.status, 201);
      const alphaSessionId = sessionRes.body.data._id;

      // Beta checks live overview -> Beta has 0 stations, sees 0 active sessions
      const betaLive = await request(app)
        .get('/api/sessions/live')
        .set('Authorization', `Bearer ${tokenBeta}`);
      assert.equal(betaLive.body.data.length, 0);

      // Beta tries to cancel Alpha session -> 404 Not Found
      const betaCancel = await request(app)
        .post(`/api/sessions/${alphaSessionId}/cancel`)
        .set('Authorization', `Bearer ${tokenBeta}`)
        .send({ reason: 'Hacking attempt' });
      assert.equal(betaCancel.status, 404);

      // Beta checks shift report -> 0 revenue
      const betaReport = await request(app)
        .get('/api/reports/shift')
        .set('Authorization', `Bearer ${tokenBeta}`);
      assert.equal(betaReport.body.data.financialSummary.totalRevenue, 0);
      assert.equal(betaReport.body.data.gamingMetrics.totalSessions, 0);

      // Alpha checks live overview -> sees Alpha-VIP with active session
      const alphaLive = await request(app)
        .get('/api/sessions/live')
        .set('Authorization', `Bearer ${tokenAlpha}`);
      assert.equal(alphaLive.body.data.length, 1);
      assert.ok(alphaLive.body.data[0].liveSession);
      assert.equal(alphaLive.body.data[0].liveSession.customerName, 'Alpha Gamer');
    });
  });
});

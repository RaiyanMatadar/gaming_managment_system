import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { WhatsAppService, whatsappService } from '../services/whatsappService.js';
import { LocalQrWhatsAppProvider } from '../services/whatsapp/localQrProvider.js';
import { CloudApiWhatsAppProvider } from '../services/whatsapp/cloudApiProvider.js';
import { memoryStore } from '../storage/memoryStore.js';
import { expiryPoller } from '../services/expiryPoller.js';
import { eventBroadcaster } from '../services/eventBroadcaster.js';
import { SessionStatus } from '../domain/sessionStateMachine.js';
import { ADMIN_REGISTRATION_SECRET } from '../middleware/authMiddleware.js';

describe('WhatsApp Notification Service (Dual Warning Engine)', () => {
  beforeEach(() => {
    whatsappService.reset();
    whatsappService.switchProvider('local_qr');
  });

  describe('Phone Number Formatting', () => {
    it('correctly standardizes 10-digit numbers with default country code 91', () => {
      const formatted = whatsappService.formatPhoneNumber('9876543210', '91');
      assert.equal(formatted, '919876543210');
    });

    it('strips dashes, spaces, and brackets while preserving country code', () => {
      const formatted = whatsappService.formatPhoneNumber('+91 (987) 654-3210');
      assert.equal(formatted, '919876543210');
    });

    it('returns null for missing, non-string, or invalid short numbers', () => {
      assert.equal(whatsappService.formatPhoneNumber(null), null);
      assert.equal(whatsappService.formatPhoneNumber(''), null);
      assert.equal(whatsappService.formatPhoneNumber('12345'), null);
    });
  });

  describe('Approach 2: Local QR Gateway Provider', () => {
    it('sends both customer and manager WhatsApp notifications when phone is available', async () => {
      const scheduledEndTime = new Date(Date.now() + 5 * 60 * 1000);

      const result = await whatsappService.sendFiveMinuteAlerts({
        sessionId: 'sess_wa_test_01',
        customerPhone: '9876543210',
        customerName: 'Aarav Gamer',
        stationName: 'PC-VIP-03',
        scheduledEndTime,
        remainingMinutes: 5
      });

      assert.equal(result.success, true);
      assert.equal(result.customerSent, true);
      assert.equal(result.managerSent, true);

      // Verify messages logged in service history
      assert.equal(whatsappService.sentMessagesLog.length, 2);
      const customerRecord = whatsappService.sentMessagesLog.find(m => m.recipient === 'customer');
      const managerRecord = whatsappService.sentMessagesLog.find(m => m.recipient === 'manager');

      assert.ok(customerRecord);
      assert.equal(customerRecord.phone, '919876543210');
      assert.ok(managerRecord);
      assert.equal(managerRecord.stationName, 'PC-VIP-03');
    });

    it('gracefully sends only to manager when customer has no phone number', async () => {
      const result = await whatsappService.sendFiveMinuteAlerts({
        sessionId: 'sess_wa_test_02',
        customerPhone: null, // No phone provided
        customerName: 'Walk-in Guest',
        stationName: 'PS5-01',
        scheduledEndTime: new Date(),
        remainingMinutes: 5
      });

      assert.equal(result.success, true);
      assert.equal(result.customerSent, false);
      assert.equal(result.managerSent, true);
      assert.equal(whatsappService.sentMessagesLog.length, 1);
    });

    it('enforces idempotency: does not duplicate WhatsApp alerts for the same session', async () => {
      const payload = {
        sessionId: 'sess_wa_test_dedupe',
        customerPhone: '9876543210',
        customerName: 'Sam',
        stationName: 'PC-01',
        scheduledEndTime: new Date(),
        remainingMinutes: 5
      };

      const firstCall = await whatsappService.sendFiveMinuteAlerts(payload);
      assert.equal(firstCall.success, true);
      assert.equal(firstCall.deduplicated, undefined);

      const secondCall = await whatsappService.sendFiveMinuteAlerts(payload);
      assert.equal(secondCall.success, true);
      assert.equal(secondCall.deduplicated, true);

      // Total messages sent should still be only 2 (1 customer + 1 manager from first call)
      assert.equal(whatsappService.sentMessagesLog.length, 2);
    });
  });

  describe('Approach 1: Cloud API Provider (Meta / Twilio Swappable)', () => {
    it('seamlessly switches to Cloud API provider without modifying caller code', async () => {
      const service = new WhatsAppService({ provider: 'cloud_api' });
      assert.equal(service.providerName, 'cloud_api');
      assert.ok(service.provider instanceof CloudApiWhatsAppProvider);

      const status = await service.getStatus();
      assert.equal(status.provider, 'cloud_api');

      // Test sending alert via Cloud API adapter
      const result = await service.sendFiveMinuteAlerts({
        sessionId: 'sess_wa_cloud_01',
        customerPhone: '9876543210',
        customerName: 'Meta User',
        stationName: 'PC-05',
        scheduledEndTime: new Date(),
        remainingMinutes: 5
      });

      assert.equal(result.success, true);
      assert.equal(result.customerSent, true);
      assert.equal(result.managerSent, true);
    });
  });

  describe('Expiry Poller Integration with WhatsApp', () => {
    it('automatically dispatches WhatsApp alerts when Expiry Poller triggers 5-min warning', async () => {
      memoryStore.reset();
      whatsappService.reset();

      const station = await memoryStore.createStation({
        name: 'PC-WA-EXP',
        type: 'PC_STANDARD',
        hourlyRate: 100
      });

      const now = Date.now();
      const session = await memoryStore.createSession({
        stationId: station._id,
        stationName: station.name,
        customerName: 'WhatsApp Gamer',
        customerPhone: '9988776655',
        pricingType: 'PACKAGE',
        bookedMinutes: 60,
        startTime: new Date(now - 56 * 60 * 1000),
        scheduledEndTime: new Date(now + 4 * 60 * 1000), // 4 mins left
        status: SessionStatus.ACTIVE,
        rateCardSnapshot: { hourlyRate: 100, gracePeriodMinutes: 5, overtimeBlockMinutes: 15 },
        financials: {}
      });

      const pollerResult = await expiryPoller.checkActiveSessions(now);
      assert.equal(pollerResult.warned, 1);

      // Wait for non-blocking fire-and-forget dispatches to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify WhatsApp service received and logged the alerts
      assert.equal(whatsappService.sentMessagesLog.length, 2);
      const customerMsg = whatsappService.sentMessagesLog.find(m => m.recipient === 'customer');
      const managerMsg = whatsappService.sentMessagesLog.find(m => m.recipient === 'manager');
      assert.ok(customerMsg);
      assert.equal(customerMsg.phone, '919988776655');
      assert.ok(managerMsg);
    });
  });

  describe('Multi-Tenant Manager WhatsApp Routing', () => {
    it('routes manager warnings specifically to each user configured whatsapp number', async () => {
      memoryStore.reset();
      whatsappService.reset();

      // Create User A and User B with different WhatsApp numbers
      const userA = await memoryStore.createUser({
        username: 'manager_mumbai',
        passwordHash: 'hash1',
        name: 'Manager Mumbai',
        centerName: 'Mumbai CyberZone',
        whatsappNumber: '919111111111'
      });

      const userB = await memoryStore.createUser({
        username: 'manager_delhi',
        passwordHash: 'hash2',
        name: 'Manager Delhi',
        centerName: 'Delhi GameHub',
        whatsappNumber: '919222222222'
      });

      // Send alert for session belonging to user A
      const resA = await whatsappService.sendFiveMinuteAlerts({
        sessionId: 'sess_mumbai_01',
        customerPhone: '9888888888',
        customerName: 'Player Mumbai',
        stationName: 'PC-MUM-01',
        scheduledEndTime: new Date(),
        remainingMinutes: 5,
        userId: userA._id
      });

      assert.equal(resA.success, true);
      assert.equal(resA.managerSent, true);

      // Send alert for session belonging to user B
      const resB = await whatsappService.sendFiveMinuteAlerts({
        sessionId: 'sess_delhi_01',
        customerPhone: '9777777777',
        customerName: 'Player Delhi',
        stationName: 'PC-DEL-01',
        scheduledEndTime: new Date(),
        remainingMinutes: 5,
        userId: userB._id
      });

      assert.equal(resB.success, true);
      assert.equal(resB.managerSent, true);

      // Verify log contains manager messages routed to their respective phone numbers
      const managerMsgs = whatsappService.sentMessagesLog.filter(m => m.recipient === 'manager');
      assert.equal(managerMsgs.length, 2);

      const msgA = managerMsgs.find(m => m.sessionId === 'sess_mumbai_01');
      const msgB = managerMsgs.find(m => m.sessionId === 'sess_delhi_01');

      assert.ok(msgA);
      assert.equal(msgA.phone, '919111111111');

      assert.ok(msgB);
      assert.equal(msgB.phone, '919222222222');
    });

    it('isolates per-account linked WhatsApp sender numbers, session directories, and avoids global fallback', async () => {
      memoryStore.reset();
      whatsappService.reset();

      const userA = await memoryStore.createUser({
        username: 'arena_a',
        password: 'hashA',
        name: 'Manager A',
        whatsappNumber: '919111111111',
        whatsappLinkedNumber: '918111111111'
      });

      const userB = await memoryStore.createUser({
        username: 'arena_b',
        password: 'hashB',
        name: 'Manager B',
        whatsappNumber: '919222222222',
        whatsappLinkedNumber: '918222222222'
      });

      const userC = await memoryStore.createUser({
        username: 'arena_c_unconfigured',
        password: 'hashC',
        name: 'Manager C',
        whatsappNumber: '',
        whatsappLinkedNumber: ''
      });

      // Verify independent provider instances & session paths
      const provA = whatsappService.getProviderForUser(userA._id);
      const provB = whatsappService.getProviderForUser(userB._id);
      assert.notEqual(provA, provB);
      assert.notEqual(provA.sessionDir, provB.sessionDir);
      assert.ok(provA.sessionDir.includes(String(userA._id)));
      assert.ok(provB.sessionDir.includes(String(userB._id)));

      // Route alerts for Account A
      const resA = await whatsappService.sendFiveMinuteAlerts({
        sessionId: 'sess_iso_a',
        customerPhone: '9888888888',
        customerName: 'Player A',
        stationName: 'PC-A1',
        scheduledEndTime: new Date(),
        remainingMinutes: 5,
        userId: userA._id
      });
      assert.equal(resA.from, '918111111111');
      assert.equal(resA.customerSent, true);
      assert.equal(resA.managerSent, true);

      // Route alerts for Account B
      const resB = await whatsappService.sendFiveMinuteAlerts({
        sessionId: 'sess_iso_b',
        customerPhone: '9777777777',
        customerName: 'Player B',
        stationName: 'PC-B1',
        scheduledEndTime: new Date(),
        remainingMinutes: 5,
        userId: userB._id
      });
      assert.equal(resB.from, '918222222222');
      assert.equal(resB.customerSent, true);
      assert.equal(resB.managerSent, true);

      // Account C without Manager Phone must NOT fall back to global or other account numbers
      const resC = await whatsappService.sendFiveMinuteAlerts({
        sessionId: 'sess_iso_c',
        customerPhone: '9666666666',
        customerName: 'Player C',
        stationName: 'PC-C1',
        scheduledEndTime: new Date(),
        remainingMinutes: 5,
        userId: userC._id
      });
      assert.equal(resC.customerSent, true);
      assert.equal(resC.managerSent, false);
      assert.equal(resC.from, null);

      // Verify provider histories remained strictly isolated
      assert.equal(provA.history.length, 2);
      assert.ok(provA.history.every(m => m.from === '918111111111' && m.userId === String(userA._id)));
      assert.equal(provB.history.length, 2);
      assert.ok(provB.history.every(m => m.from === '918222222222' && m.userId === String(userB._id)));

      // Verify mismatched live socket phone vs DB linked number is blocked
      provA.connectedPhone = '919999999999';
      const mismatchRes = await whatsappService.sendFiveMinuteAlerts({
        sessionId: 'sess_iso_mismatch',
        customerPhone: '9888888888',
        customerName: 'Player A2',
        stationName: 'PC-A2',
        scheduledEndTime: new Date(),
        remainingMinutes: 5,
        userId: userA._id
      });
      assert.equal(mismatchRes.success, false);
      assert.equal(mismatchRes.customerSent, false);
      assert.equal(mismatchRes.managerSent, false);
    });

    it('isolates /api/whatsapp status and logout endpoints per authenticated user', async () => {
      memoryStore.reset();
      whatsappService.reset();
      const app = createApp();

      // Register & login User Alpha and User Beta with distinct numbers
      await request(app)
        .post('/api/auth/register')
        .set('x-admin-key', ADMIN_REGISTRATION_SECRET)
        .send({
          username: 'wa_alpha',
          password: 'Password123!',
          whatsappNumber: '919100000001',
          whatsappLinkedNumber: '918100000001'
        });
      const loginA = await request(app)
        .post('/api/auth/login')
        .send({ username: 'wa_alpha', password: 'Password123!' });
      const tokenA = loginA.body.token;

      await request(app)
        .post('/api/auth/register')
        .set('x-admin-key', ADMIN_REGISTRATION_SECRET)
        .send({
          username: 'wa_beta',
          password: 'Password123!',
          whatsappNumber: '919200000002',
          whatsappLinkedNumber: '918200000002'
        });
      const loginB = await request(app)
        .post('/api/auth/login')
        .send({ username: 'wa_beta', password: 'Password123!' });
      const tokenB = loginB.body.token;

      // Each account sees only its own managerPhone & linkedWhatsappNumber
      const statusA = await request(app)
        .get('/api/whatsapp/status')
        .set('Authorization', `Bearer ${tokenA}`);
      assert.equal(statusA.status, 200);
      assert.equal(statusA.body.data.managerPhone, '919100000001');
      assert.equal(statusA.body.data.linkedWhatsappNumber, '918100000001');

      const statusB = await request(app)
        .get('/api/whatsapp/status')
        .set('Authorization', `Bearer ${tokenB}`);
      assert.equal(statusB.status, 200);
      assert.equal(statusB.body.data.managerPhone, '919200000002');
      assert.equal(statusB.body.data.linkedWhatsappNumber, '918200000002');

      // User A logging out WhatsApp device must clear ONLY User A's linked number, not User B's
      const logoutA = await request(app)
        .post('/api/whatsapp/logout')
        .set('Authorization', `Bearer ${tokenA}`);
      assert.equal(logoutA.status, 200);

      const statusAAfter = await request(app)
        .get('/api/whatsapp/status')
        .set('Authorization', `Bearer ${tokenA}`);
      assert.equal(statusAAfter.body.data.linkedWhatsappNumber, null);

      const statusBAfter = await request(app)
        .get('/api/whatsapp/status')
        .set('Authorization', `Bearer ${tokenB}`);
      assert.equal(statusBAfter.body.data.linkedWhatsappNumber, '918200000002');
    });
  });

  describe('WhatsApp REST API Endpoints', () => {
    it('GET /api/whatsapp/status returns gateway readiness and status', async () => {
      const app = createApp();
      const res = await request(app).get('/api/whatsapp/status');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.provider);
    });

    it('GET /api/whatsapp/qr returns QR state structure', async () => {
      const app = createApp();
      const res = await request(app).get('/api/whatsapp/qr');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok('status' in res.body.data);
    });

    it('POST /api/whatsapp/test dispatches test message to specified phone', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/whatsapp/test')
        .send({ phone: '9876543210', message: 'Test ping' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });
});

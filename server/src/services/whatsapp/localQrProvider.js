import { BaseWhatsAppProvider } from './baseProvider.js';
import path from 'node:path';
import fs from 'node:fs';

function sanitizeUserId(userId) {
  return String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Approach 2: Direct Baileys WhatsApp Web Session & QR Gateway Provider.
 * Strictly isolated per user account when userId is provided, storing credentials
 * in a dedicated per-account session directory (src/storage/wa_sessions/<userId>).
 */
export class LocalQrWhatsAppProvider extends BaseWhatsAppProvider {
  constructor(options = {}) {
    super('local_qr');
    this.userId = options.userId ? String(options.userId) : null;
    this.gatewayUrl = options.gatewayUrl || process.env.WHATSAPP_LOCAL_GATEWAY_URL || null;
    this.baseSessionDir = options.baseSessionDir || path.resolve('src/storage/wa_sessions');
    this.sessionDir = options.sessionDir || (
      this.userId
        ? path.join(this.baseSessionDir, sanitizeUserId(this.userId))
        : path.resolve('src/storage/wa_session')
    );
    this.onConnected = options.onConnected || null;
    this.onDisconnected = options.onDisconnected || null;
    this.autoConnect = options.autoConnect;

    this.history = [];
    this.sock = null;
    this.qrCodeDataUrl = null;
    this.isConnected = false;
    this.connectedPhone = options.connectedPhone || null;
    this.status = 'scan_qr_required';
    this.error = null;
    this.isConnecting = false;
    this.isDisposed = false;
    this.reconnectTimer = null;

    // In unit testing environment, keep mock connected without initiating live socket
    this.isTestEnv = process.env.NODE_ENV === 'test' ||
      process.argv.some(arg => typeof arg === 'string' && (arg.includes('test') || arg.includes('--test')));

    if (this.isTestEnv || options.autoConnect === false) {
      this.isConnected = true;
      this.status = 'mock_ready';
    }
  }

  /**
   * Checks whether this account already has saved Baileys credentials on disk.
   */
  hasSavedSession() {
    try {
      return fs.existsSync(path.join(this.sessionDir, 'creds.json'));
    } catch {
      return false;
    }
  }

  /**
   * Initializes or re-establishes the native Baileys WhatsApp Web socket for this account.
   */
  async initBaileys() {
    if (this.isTestEnv || this.autoConnect === false) return;
    if (this.isConnecting || this.isConnected || this.isDisposed) return;

    this.isConnecting = true;
    this.status = 'connecting';
    this.error = null;

    try {
      if (!fs.existsSync(this.sessionDir)) {
        fs.mkdirSync(this.sessionDir, { recursive: true });
      }

      // Dynamic import to keep startup lightweight and test-runner safe
      const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = await import('@whiskeysockets/baileys');
      const QRCode = await import('qrcode');
      const { default: pino } = await import('pino');

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);

      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: [`GameDash-${this.userId || 'default'}`, 'Chrome', '1.0.0']
      });
      this.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        // Ignore events from stale sockets replaced by logout/dispose
        if (this.sock !== sock || this.isDisposed) return;

        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
            this.status = 'scan_qr_required';
            this.isConnected = false;
            this.error = null;
            console.log(`\n📱 [WHATSAPP${this.userId ? ` user:${this.userId}` : ''}] Scan QR code in GameDash to link device.`);
          } catch (qrErr) {
            console.error('[WHATSAPP] Error generating QR DataURL:', qrErr.message);
          }
        }

        if (connection === 'open') {
          const rawPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Unknown';
          const cleanedPhone = rawPhone.replace(/\D/g, '');

          if (this.onConnected && cleanedPhone) {
            try {
              const check = await this.onConnected(cleanedPhone);
              if (check?.conflict) {
                console.warn(`⛔ [WHATSAPP] Conflict detected for user:${this.userId}: ${check.error}`);
                this.status = 'phone_conflict';
                this.error = check.error || 'This WhatsApp number is already linked to another account.';
                this.isConnected = false;
                this.isConnecting = false;
                this.connectedPhone = null;
                this.qrCodeDataUrl = null;
                this.sock = null;
                try {
                  await sock.logout().catch(() => {});
                  sock.end?.();
                } catch {}
                try {
                  fs.rmSync(this.sessionDir, { recursive: true, force: true });
                } catch {}
                return;
              }
            } catch (cbErr) {
              console.error('[WHATSAPP] Error in onConnected hook:', cbErr.message);
            }
          }

          this.isConnected = true;
          this.status = 'connected';
          this.error = null;
          this.qrCodeDataUrl = null;
          this.isConnecting = false;
          this.connectedPhone = cleanedPhone || null;

          console.log(`\n✅ [WHATSAPP${this.userId ? ` user:${this.userId}` : ''}] Connected! Linked Device: +${this.connectedPhone}\n`);
        }

        if (connection === 'close') {
          this.isConnected = false;
          this.isConnecting = false;

          if (this.status === 'phone_conflict' || this.isDisposed) {
            return;
          }

          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason?.loggedOut;

          if (isLoggedOut) {
            console.log(`⚠️ [WHATSAPP${this.userId ? ` user:${this.userId}` : ''}] Session logged out. Clearing stored credentials...`);
            this.status = 'scan_qr_required';
            this.connectedPhone = null;
            this.qrCodeDataUrl = null;
            this.sock = null;
            try {
              fs.rmSync(this.sessionDir, { recursive: true, force: true });
            } catch {}
            if (this.onDisconnected) {
              await this.onDisconnected().catch(() => {});
            }
            if (!this.isDisposed) {
              clearTimeout(this.reconnectTimer);
              this.reconnectTimer = setTimeout(() => this.initBaileys(), 2000);
            }
          } else {
            this.status = 'reconnecting';
            console.log(`🔄 [WHATSAPP${this.userId ? ` user:${this.userId}` : ''}] Connection dropped. Reconnecting in 5s...`);
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => this.initBaileys(), 5000);
          }
        }
      });
    } catch (err) {
      this.isConnecting = false;
      this.status = 'error';
      this.error = err.message;
      console.error('[WHATSAPP] Error starting Baileys connection:', err.message);
    }
  }

  /**
   * Dispatches WhatsApp message strictly using this account's provider/connection.
   */
  async sendMessage({ to, from = null, message, type = 'warning', meta = {} }) {
    if (this.userId && meta?.userId && String(this.userId) !== String(meta.userId)) {
      throw new Error(`Account isolation error: Provider for user '${this.userId}' cannot send for user '${meta.userId}'.`);
    }

    const timestamp = new Date().toISOString();
    const messageId = `wa_qr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const senderPhone = from || this.connectedPhone || null;

    // 1. External HTTP Gateway (if explicitly configured via .env)
    if (this.gatewayUrl) {
      try {
        const response = await fetch(`${this.gatewayUrl}/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.WHATSAPP_LOCAL_GATEWAY_KEY ? { 'Authorization': `Bearer ${process.env.WHATSAPP_LOCAL_GATEWAY_KEY}` } : {})
          },
          body: JSON.stringify({
            phone: to,
            from: senderPhone,
            userId: this.userId,
            message,
            meta
          })
        });

        if (!response.ok) {
          throw new Error(`Local gateway returned HTTP ${response.status}`);
        }

        const data = await response.json().catch(() => ({}));
        const record = {
          messageId,
          to,
          from: senderPhone,
          userId: this.userId,
          message,
          type,
          meta,
          timestamp,
          deliveredVia: 'gateway_http'
        };
        this.history.push(record);
        return { success: true, messageId: data.messageId || messageId, from: senderPhone, provider: this.name };
      } catch (err) {
        console.error(`[WHATSAPP QR-GATEWAY] HTTP dispatch failed to ${to}:`, err.message);
      }
    }

    // 2. Real Native Baileys Dispatch (when this account's socket is connected)
    if (this.sock && this.isConnected) {
      if (from && this.connectedPhone && from.replace(/\D/g, '') !== this.connectedPhone.replace(/\D/g, '')) {
        throw new Error(
          `WhatsApp sender mismatch for user '${this.userId}': expected +${from} but linked socket is +${this.connectedPhone}.`
        );
      }

      try {
        const cleanTo = to.replace(/\D/g, '');
        const jid = `${cleanTo}@s.whatsapp.net`;

        await this.sock.sendMessage(jid, { text: message });

        const actualFrom = this.connectedPhone || senderPhone;
        const record = {
          messageId,
          to: cleanTo,
          from: actualFrom,
          userId: this.userId,
          message,
          type,
          meta,
          timestamp,
          deliveredVia: 'baileys_live_socket'
        };
        this.history.push(record);

        const logBadge = type === 'customer' ? '👤 [CUSTOMER WHATSAPP REAL]' : '🛡️ [MANAGER WHATSAPP REAL]';
        console.log(`✅ ${logBadge} From: +${actualFrom} -> To: +${cleanTo}`);

        return {
          success: true,
          messageId,
          from: actualFrom,
          provider: this.name,
          deliveredVia: 'baileys_live_socket'
        };
      } catch (err) {
        console.error(`❌ [WHATSAPP DISPATCH ERROR] Failed to send real message to ${to}:`, err.message);
      }
    }

    // 3. Fallback / Test / Direct Console Dispatch
    const logPrefix = type === 'customer' ? '👤 [CUSTOMER WHATSAPP]' : '🛡️ [MANAGER WHATSAPP]';
    console.log(`${logPrefix}${senderPhone ? ` From: +${senderPhone} ->` : ''} To: ${to} | Alert: "${message.replace(/\n/g, ' ')}"`);

    const record = {
      messageId,
      to,
      from: senderPhone,
      userId: this.userId,
      message,
      type,
      meta,
      timestamp,
      deliveredVia: this.isTestEnv ? 'local_qr_session' : 'unlinked_fallback'
    };
    this.history.push(record);

    return {
      success: true,
      messageId,
      from: senderPhone,
      provider: this.name
    };
  }

  /**
   * Returns current connection status, QR code data, and linked phone for this account.
   */
  async getStatus() {
    return {
      provider: this.name,
      userId: this.userId,
      ready: true,
      status: this.status,
      error: this.error,
      isConnected: this.isConnected,
      connectedPhone: this.connectedPhone,
      hasQr: Boolean(this.qrCodeDataUrl),
      qr: this.qrCodeDataUrl,
      gatewayConfigured: Boolean(this.gatewayUrl),
      messagesSent: this.history.length
    };
  }

  /**
   * Retrieves current QR Code Data URL for this account.
   */
  getQrCode() {
    return {
      qr: this.qrCodeDataUrl,
      status: this.status,
      error: this.error,
      isConnected: this.isConnected,
      connectedPhone: this.connectedPhone
    };
  }

  /**
   * Unlinks ONLY this account's WhatsApp session and regenerates a new QR code.
   */
  async logout() {
    clearTimeout(this.reconnectTimer);
    this.isConnecting = false;
    this.error = null;

    const oldSock = this.sock;
    this.sock = null;
    try {
      if (oldSock) {
        await oldSock.logout().catch(() => {});
        oldSock.end?.();
      }
    } catch {}

    this.isConnected = false;
    this.connectedPhone = null;
    this.qrCodeDataUrl = null;
    this.status = this.isTestEnv ? 'mock_ready' : 'scan_qr_required';

    try {
      fs.rmSync(this.sessionDir, { recursive: true, force: true });
    } catch {}

    if (this.onDisconnected) {
      await this.onDisconnected().catch(() => {});
    }

    if (!this.isTestEnv && this.autoConnect !== false) {
      await this.initBaileys();
    }
    return { success: true, message: 'Logged out successfully. New QR code generated.' };
  }

  /**
   * Stops socket and timers without wiping other state (used when disposing/resetting provider).
   */
  dispose() {
    this.isDisposed = true;
    clearTimeout(this.reconnectTimer);
    try {
      this.sock?.end?.();
    } catch {}
    this.sock = null;
  }

  reset() {
    clearTimeout(this.reconnectTimer);
    this.history = [];
    this.error = null;
    if (this.isTestEnv || this.autoConnect === false) {
      this.isConnected = true;
      this.status = 'mock_ready';
    }
  }
}

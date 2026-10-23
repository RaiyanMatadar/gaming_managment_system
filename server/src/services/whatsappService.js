import { LocalQrWhatsAppProvider } from './whatsapp/localQrProvider.js';
import { CloudApiWhatsAppProvider } from './whatsapp/cloudApiProvider.js';
import { store } from '../storage/index.js';

export class WhatsAppService {
  constructor(options = {}) {
    this.sentKeys = new Set();
    this.sentMessagesLog = [];
    this.initProvider(options.provider || process.env.WHATSAPP_PROVIDER || 'local_qr', options);
  }

  initProvider(providerName, options = {}) {
    this.providerName = String(providerName).toLowerCase();
    switch (this.providerName) {
      case 'cloud_api':
      case 'meta':
      case 'twilio':
        this.provider = new CloudApiWhatsAppProvider(options);
        break;
      case 'local_qr':
      case 'baileys':
      default:
        this.provider = new LocalQrWhatsAppProvider(options);
        break;
    }
  }

  /**
   * Dynamically switch provider between Local QR (Approach 2) and Meta Cloud API (Approach 1).
   */
  switchProvider(providerName, options = {}) {
    this.initProvider(providerName, options);
    return this.provider;
  }

  /**
   * Sanitizes and formats phone numbers to international digits.
   * e.g., "98765 43210" -> "919876543210"
   * e.g., "+91-9876543210" -> "919876543210"
   * @param {string} phone
   * @param {string} [defaultCountryCode='91']
   * @returns {string|null}
   */
  formatPhoneNumber(phone, defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '91') {
    if (!phone || typeof phone !== 'string') return null;

    // Strip non-digits
    const clean = phone.replace(/\D/g, '');
    if (!clean || clean.length < 7) return null;

    // If 10 digits, prepend default country code (e.g. 91 for India)
    if (clean.length === 10) {
      return `${defaultCountryCode}${clean}`;
    }

    return clean;
  }

  /**
   * Retrieves configured manager WhatsApp phone number for a specific tenant or falls back to env.
   * @param {string} [userId] - Authenticated tenant / manager user ID
   * @returns {Promise<string|null>}
   */
  async getManagerPhone(userId = null) {
    if (userId) {
      try {
        const user = await store.getUserById(userId);
        if (user && user.whatsappNumber) {
          const formatted = this.formatPhoneNumber(user.whatsappNumber);
          if (formatted) return formatted;
        }
      } catch (err) {
        console.error('[WHATSAPP SERVICE] Error fetching tenant phone for user:', userId, err.message);
      }
    }

    return this.formatPhoneNumber(process.env.MANAGER_WHATSAPP_PHONE || process.env.OWNER_PHONE || '919876543210');
  }

  /**
   * Dispatches dual 5-minute warning WhatsApp notifications:
   * 1. To the player/customer on their mobile phone (if provided).
   * 2. To the gaming center manager/cashier for operational awareness.
   *
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} [params.customerPhone]
   * @param {string} [params.customerName='Player']
   * @param {string} [params.stationName='PC Station']
   * @param {Date|string} params.scheduledEndTime
   * @param {number} [params.remainingMinutes=5]
   * @param {string} [params.userId]
   * @returns {Promise<{ success: boolean, deduplicated?: boolean, customerSent?: boolean, managerSent?: boolean }>}
   */
  async sendFiveMinuteAlerts({
    sessionId,
    customerPhone = null,
    customerName = 'Player',
    stationName = 'PC Station',
    scheduledEndTime,
    remainingMinutes = 5,
    userId = null
  }) {
    const dedupeKey = `warn_wa_${sessionId}`;
    if (this.sentKeys.has(dedupeKey)) {
      return { success: true, deduplicated: true };
    }
    this.sentKeys.add(dedupeKey);

    const formattedEnd = scheduledEndTime
      ? new Date(scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'shortly';

    let customerSent = false;
    let managerSent = false;

    // 1. Send Notification to Customer (if valid phone is available)
    const formattedCustomerPhone = this.formatPhoneNumber(customerPhone);
    if (formattedCustomerPhone) {
      const customerText = [
        `🎮 *GameDash — 5 Minutes Remaining*`,
        `Hi ${customerName}!`,
        `Your gaming session on *${stationName}* has only *${remainingMinutes} minutes left* (ends at ${formattedEnd}).`,
        ``,
        `If you want to extend your playtime, please visit the counter now to add minutes before your session ends! 👍`
      ].join('\n');

      try {
        const res = await this.provider.sendMessage({
          to: formattedCustomerPhone,
          message: customerText,
          type: 'customer',
          meta: { sessionId, customerName, stationName, remainingMinutes, scheduledEndTime, userId }
        });
        customerSent = Boolean(res?.success);
        this.sentMessagesLog.push({
          recipient: 'customer',
          phone: formattedCustomerPhone,
          sessionId,
          stationName,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('[WHATSAPP SERVICE] Failed to send customer warning:', err.message);
      }
    }

    // 2. Send Notification to Manager / Dashboard Owner (Tenant Scoped)
    const managerPhone = await this.getManagerPhone(userId);
    if (managerPhone) {
      const managerText = [
        `⚠️ *GameDash Staff Warning — 5 Mins Left*`,
        `• Station: *${stationName}*`,
        `• Player: *${customerName}*`,
        `• Remaining: *${remainingMinutes} minutes* (Ends at ${formattedEnd})`,
        `• Customer Phone: ${customerPhone ? formattedCustomerPhone : 'Not provided'}`
      ].join('\n');

      try {
        const res = await this.provider.sendMessage({
          to: managerPhone,
          message: managerText,
          type: 'manager',
          meta: { sessionId, customerName, stationName, remainingMinutes, scheduledEndTime, userId }
        });
        managerSent = Boolean(res?.success);
        this.sentMessagesLog.push({
          recipient: 'manager',
          phone: managerPhone,
          sessionId,
          stationName,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('[WHATSAPP SERVICE] Failed to send manager warning:', err.message);
      }
    }

    return {
      success: true,
      customerSent,
      managerSent
    };
  }

  /**
   * Initializes the socket connection (for Local QR provider).
   */
  async initSocket() {
    if (this.providerName === 'local_qr' && typeof this.provider.initBaileys === 'function') {
      await this.provider.initBaileys();
    }
  }

  async getStatus() {
    const provStatus = await this.provider.getStatus();
    return {
      provider: this.providerName,
      ...provStatus,
      totalMessagesSent: this.sentMessagesLog.length,
      managerPhoneConfigured: Boolean(await this.getManagerPhone())
    };
  }

  getQrCode() {
    if (this.providerName === 'local_qr' && typeof this.provider.getQrCode === 'function') {
      return this.provider.getQrCode();
    }
    return { qr: null, status: 'not_applicable' };
  }

  async logout() {
    if (this.providerName === 'local_qr' && typeof this.provider.logout === 'function') {
      return await this.provider.logout();
    }
    return { success: true, message: 'Provider does not require logout.' };
  }

  async sendTestMessage(to, message = '🎮 GameDash WhatsApp Integration Test: Real-time alerts are working properly!') {
    const formatted = this.formatPhoneNumber(to);
    if (!formatted) {
      throw new Error('Invalid phone number. Please enter a 10-digit number or international format.');
    }
    return await this.provider.sendMessage({
      to: formatted,
      message,
      type: 'test'
    });
  }

  reset() {
    this.sentKeys.clear();
    this.sentMessagesLog = [];
    if (this.provider?.reset) {
      this.provider.reset();
    }
  }
}

export const whatsappService = new WhatsAppService();

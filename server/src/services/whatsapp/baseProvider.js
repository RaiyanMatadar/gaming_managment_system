/**
 * Base abstract interface for WhatsApp notification providers.
 * Allows seamless switching between Local QR Gateway (Approach 2) and Meta Cloud API (Approach 1).
 */
export class BaseWhatsAppProvider {
  constructor(name = 'base') {
    this.name = name;
  }

  /**
   * Sends a plain text or template message to a phone number.
   * @param {Object} params
   * @param {string} params.to - Recipient phone number (E.164 or digits)
   * @param {string} params.message - Text body
   * @param {string} [params.type='warning'] - Category of notification
   * @param {Object} [params.meta] - Additional metadata for logging/tracking
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendMessage({ to, message, type = 'warning', meta = {} }) {
    throw new Error(`sendMessage() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Retrieves provider connection and readiness status.
   * @returns {Promise<{ provider: string, ready: boolean, status: string, details?: any }>}
   */
  async getStatus() {
    return {
      provider: this.name,
      ready: true,
      status: 'operational'
    };
  }
}

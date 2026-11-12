import { whatsappService } from '../services/whatsappService.js';
import { store } from '../storage/index.js';

export const whatsappController = {
  async getStatus(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const status = await whatsappService.getStatus(userId);
      res.json({
        success: true,
        data: status
      });
    } catch (err) {
      next(err);
    }
  },

  async getQr(req, res, next) {
    try {
      const userId = req.user?.id || null;
      // Initiate socket exclusively for the authenticated account
      await whatsappService.initSocket(userId);
      const qrData = whatsappService.getQrCode(userId);
      res.json({
        success: true,
        data: qrData
      });
    } catch (err) {
      next(err);
    }
  },

  async connect(req, res, next) {
    try {
      const userId = req.user?.id || null;
      await whatsappService.initSocket(userId);
      const status = await whatsappService.getStatus(userId);
      res.json({
        success: true,
        message: 'WhatsApp socket connection initiated for your account.',
        data: status
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const result = await whatsappService.logout(userId);
      res.json({
        success: true,
        message: result.message || 'Logged out from WhatsApp device.'
      });
    } catch (err) {
      next(err);
    }
  },

  async sendTestMessage(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const { phone, message } = req.body;

      // Always resolve fresh Manager Phone Number from DB rather than trusting stale JWT claims
      const dbUser = userId ? await store.getUserById(userId) : null;
      const targetPhone = phone || dbUser?.whatsappNumber || req.user?.whatsappNumber;

      if (!targetPhone) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a recipient phone number or configure your Manager WhatsApp number in your profile.'
        });
      }

      const result = await whatsappService.sendTestMessage(targetPhone, message, userId);
      res.json({
        success: true,
        message: `Test alert dispatched to +${whatsappService.formatPhoneNumber(targetPhone)}`,
        data: result
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  }
};

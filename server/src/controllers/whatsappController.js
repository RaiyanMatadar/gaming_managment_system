import { whatsappService } from '../services/whatsappService.js';

export const whatsappController = {
  async getStatus(req, res, next) {
    try {
      const status = await whatsappService.getStatus();
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
      // If socket is not running yet, initiate it
      await whatsappService.initSocket();
      const qrData = whatsappService.getQrCode();
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
      await whatsappService.initSocket();
      const status = await whatsappService.getStatus();
      res.json({
        success: true,
        message: 'WhatsApp socket connection initiated.',
        data: status
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const result = await whatsappService.logout();
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
      const { phone, message } = req.body;
      const targetPhone = phone || req.user?.whatsappNumber;

      if (!targetPhone) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a recipient phone number or configure your WhatsApp number in your profile.'
        });
      }

      const result = await whatsappService.sendTestMessage(targetPhone, message);
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

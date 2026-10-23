import express from 'express';
import { whatsappController } from '../controllers/whatsappController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/status', whatsappController.getStatus);
router.get('/qr', whatsappController.getQr);
router.post('/connect', whatsappController.connect);
router.post('/logout', whatsappController.logout);
router.post('/test', whatsappController.sendTestMessage);

export default router;

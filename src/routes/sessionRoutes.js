import { Router } from 'express';
import {
  getLiveOverview,
  startSession,
  pauseSession,
  resumeSession,
  extendSession,
  transferSession,
  checkoutSession,
  cancelSession,
  getSessionById
} from '../controllers/sessionController.js';

const router = Router();

router.get('/live', getLiveOverview);
router.get('/:id', getSessionById);
router.post('/', startSession);
router.post('/:id/pause', pauseSession);
router.post('/:id/resume', resumeSession);
router.post('/:id/extend', extendSession);
router.post('/:id/transfer', transferSession);
router.post('/:id/checkout', checkoutSession);
router.post('/:id/cancel', cancelSession);

export default router;

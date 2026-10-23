import { Router } from 'express';
import {
  getStationPortalDetails,
  callStaffAssistance,
  orderSnackInSeat,
  requestTimeExtension
} from '../controllers/portalController.js';

const router = Router();

// Public in-desk portal endpoints (no auth required so player phone can access desk QR)
router.get('/station/:stationId', getStationPortalDetails);
router.post('/station/:stationId/call-staff', callStaffAssistance);
router.post('/station/:stationId/order-snack', orderSnackInSeat);
router.post('/station/:stationId/request-extension', requestTimeExtension);

export default router;

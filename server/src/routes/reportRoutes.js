import { Router } from 'express';
import { getShiftReport } from '../controllers/reportController.js';

const router = Router();

router.get('/shift', getShiftReport);

export default router;

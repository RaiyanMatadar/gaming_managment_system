import { Router } from 'express';
import {
  getAllStations,
  createStation,
  updateStationStatus
} from '../controllers/stationController.js';

const router = Router();

router.get('/', getAllStations);
router.post('/', createStation);
router.patch('/:id/status', updateStationStatus);

export default router;

import { Router } from 'express';
import {
  getAllStations,
  createStation,
  updateStationStatus,
  deleteStation
} from '../controllers/stationController.js';

const router = Router();

router.get('/', getAllStations);
router.post('/', createStation);
router.patch('/:id/status', updateStationStatus);
router.delete('/:id', deleteStation);

export default router;

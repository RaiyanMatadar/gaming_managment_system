import { store } from '../storage/index.js';
import { StationStatus, StationType, validateStationTransition } from '../domain/stationStateMachine.js';

export async function getAllStations(req, res, next) {
  try {
    const stations = await store.getAllStations();
    res.json({ success: true, count: stations.length, data: stations });
  } catch (err) {
    next(err);
  }
}

export async function createStation(req, res, next) {
  try {
    const { name, type, hourlyRate, notes } = req.body;

    if (!name || !type || hourlyRate === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Station name, type, and hourlyRate are required.'
      });
    }

    if (!StationType[type]) {
      return res.status(400).json({
        success: false,
        error: `Invalid station type: '${type}'. Allowed: ${Object.values(StationType).join(', ')}`
      });
    }

    const rate = Number(hourlyRate);
    if (isNaN(rate) || rate < 0) {
      return res.status(400).json({
        success: false,
        error: 'hourlyRate must be a non-negative number.'
      });
    }

    const station = await store.createStation({
      name: name.trim(),
      type,
      hourlyRate: rate,
      notes: notes || ''
    });

    res.status(201).json({ success: true, data: station });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: `Station with name '${req.body.name}' already exists.`
      });
    }
    next(err);
  }
}

export async function updateStationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const station = await store.getStationById(id);
    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found.' });
    }

    const validation = validateStationTransition(station.status, status);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const updated = await store.updateStationStatus(id, status, notes);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

import { sessionService } from '../services/sessionService.js';
import { store } from '../storage/index.js';

export async function getLiveOverview(req, res, next) {
  try {
    const data = await sessionService.getLiveStationOverview();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

export async function startSession(req, res, next) {
  try {
    const { stationId, customerName, customerPhone, pricingType, bookedMinutes, staffId } = req.body;

    if (!stationId) {
      return res.status(400).json({ success: false, error: 'stationId is required.' });
    }

    const session = await sessionService.startSession({
      stationId,
      customerName,
      customerPhone,
      pricingType: pricingType || 'PACKAGE',
      bookedMinutes: bookedMinutes ? Number(bookedMinutes) : 60,
      staffId
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function pauseSession(req, res, next) {
  try {
    const { id } = req.params;
    const { staffId, reason } = req.body;
    const session = await sessionService.pauseSession(id, { staffId, reason });
    res.json({ success: true, data: session });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function resumeSession(req, res, next) {
  try {
    const { id } = req.params;
    const { staffId } = req.body;
    const session = await sessionService.resumeSession(id, { staffId });
    res.json({ success: true, data: session });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function extendSession(req, res, next) {
  try {
    const { id } = req.params;
    const { addedMinutes, staffId } = req.body;

    if (!addedMinutes || Number(addedMinutes) <= 0) {
      return res.status(400).json({ success: false, error: 'addedMinutes must be positive.' });
    }

    const session = await sessionService.extendSession(id, { addedMinutes, staffId });
    res.json({ success: true, data: session });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function transferSession(req, res, next) {
  try {
    const { id } = req.params;
    const { targetStationId, staffId, reason } = req.body;

    if (!targetStationId) {
      return res.status(400).json({ success: false, error: 'targetStationId is required.' });
    }

    const session = await sessionService.transferStation(id, { targetStationId, staffId, reason });
    res.json({ success: true, data: session });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function checkoutSession(req, res, next) {
  try {
    const { id } = req.params;
    const { payment, discount, addOns, staffId } = req.body;

    const result = await sessionService.checkoutSession(id, {
      payment,
      discount,
      addOns,
      staffId
    });

    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function cancelSession(req, res, next) {
  try {
    const { id } = req.params;
    const { staffId, reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: 'reason is required for cancellation.' });
    }

    const session = await sessionService.cancelSession(id, { staffId, reason });
    res.json({ success: true, data: session });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function getSessionById(req, res, next) {
  try {
    const { id } = req.params;
    const session = await store.getSessionById(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

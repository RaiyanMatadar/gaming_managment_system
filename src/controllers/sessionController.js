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

export async function getCustomerHistory(req, res, next) {
  try {
    const { search, status, limit, month } = req.query;

    // 1. Auto-delete completed/cancelled sessions older than 30 days (1 month)
    const prunedCount = await store.pruneOldSessions();

    const allSessions = await store.getAllSessions();

    // 2. Filter sessions within month / 30-day retention window
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = month && month !== 'ALL' && month !== 'current' ? month : currentYearMonth;

    let filtered = allSessions;

    if (month && month !== 'ALL') {
      filtered = filtered.filter(s => {
        const sessionDate = new Date(s.startTime || s.createdAt || Date.now());
        const ym = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
        return ym === selectedMonth;
      });
    }

    if (status && status !== 'ALL') {
      filtered = filtered.filter(s => s.status === status);
    }

    if (search) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(s =>
        (s.customerName && String(s.customerName).toLowerCase().includes(q)) ||
        (s.customerPhone && String(s.customerPhone).toLowerCase().includes(q)) ||
        (s.stationName && String(s.stationName).toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => new Date(b.startTime || b.createdAt || 0).getTime() - new Date(a.startTime || a.createdAt || 0).getTime());

    const max = Number(limit) || 100;
    const paginated = filtered.slice(0, max);

    // Compute unique customer count and statistics defensively
    const uniqueCustomers = new Set(
      allSessions
        .map(s => (s.customerName || '').trim())
        .filter(name => name.length > 0 && name.toLowerCase() !== 'guest')
    ).size;

    const totalMinutes = allSessions.reduce((sum, s) => {
      const el = s.financials?.elapsedMinutes ?? s.bookedMinutes ?? 0;
      return sum + (Number(el) || 0);
    }, 0);

    const totalHoursLogged = Math.round((totalMinutes / 60) * 10) / 10;
    const totalSpend = Math.round(
      allSessions.reduce((sum, s) => sum + (Number(s.financials?.totalPayable) || 0), 0)
    );

    res.json({
      success: true,
      count: paginated.length,
      total: filtered.length,
      prunedCount,
      retentionPolicy: {
        activeMonth: selectedMonth,
        retentionDays: 30,
        description: 'Monthly retention active: records older than 1 month (30 days) are automatically pruned.'
      },
      analytics: {
        uniqueCustomers: Math.max(uniqueCustomers, allSessions.length > 0 ? 1 : 0),
        totalSessions: allSessions.length,
        totalHoursLogged,
        totalSpend
      },
      data: paginated
    });
  } catch (err) {
    console.error('Error fetching customer history:', err);
    res.status(500).json({ success: false, error: err.message || 'Error fetching customer history' });
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
    if (id === 'history' || id === 'live') {
      return next();
    }
    const session = await store.getSessionById(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

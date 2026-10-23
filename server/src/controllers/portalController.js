import { store } from '../storage/index.js';
import { calculateElapsedDuration, calculateOvertime } from '../domain/billingCalculator.js';
import { deriveSessionStatus, SessionStatus } from '../domain/sessionStateMachine.js';
import { eventBroadcaster } from '../services/eventBroadcaster.js';

export const ARENA_SNACK_MENU = [
  { id: 'snk_redbull', name: 'Red Bull Energy (250ml)', category: 'Beverages', price: 125, inStock: true, emoji: '⚡' },
  { id: 'snk_monster', name: 'Monster Energy (350ml)', category: 'Beverages', price: 130, inStock: true, emoji: '🥤' },
  { id: 'snk_ramen', name: 'Spicy Korean Shin Ramyun', category: 'Hot Food', price: 95, inStock: true, emoji: '🍜' },
  { id: 'snk_coldcoffee', name: 'Iced Cold Brew Latte', category: 'Beverages', price: 90, inStock: true, emoji: '☕' },
  { id: 'snk_doritos', name: 'Doritos Nacho Cheese', category: 'Snacks', price: 40, inStock: true, emoji: '🧀' },
  { id: 'snk_water', name: 'Chilled Mineral Water (1L)', category: 'Beverages', price: 20, inStock: true, emoji: '💧' }
];

export async function getStationPortalDetails(req, res, next) {
  try {
    const { stationId } = req.params;
    const station = await store.getStationById(stationId);
    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found.' });
    }

    let activeSessionInfo = null;

    if (station.status === 'OCCUPIED' && station.currentSessionId) {
      const session = await store.getSessionById(station.currentSessionId);
      if (session) {
        const now = new Date();
        const derivedStatus = deriveSessionStatus({
          currentStatus: session.status,
          scheduledEndTime: session.scheduledEndTime,
          now
        });

        const elapsed = calculateElapsedDuration({
          startTime: session.startTime,
          totalPausedMs: session.totalPausedMs,
          currentPauseStartTime: session.currentPauseStartTime,
          endTime: now
        });

        const overtime = calculateOvertime({
          elapsedMinutes: elapsed.elapsedMinutes,
          bookedMinutes: session.bookedMinutes,
          hourlyRate: session.rateCardSnapshot?.hourlyRate || station.hourlyRate || 100,
          gracePeriodMinutes: session.rateCardSnapshot?.gracePeriodMinutes || 5,
          overtimeBlockMinutes: session.rateCardSnapshot?.overtimeBlockMinutes || 15
        });

        const remainingMs = new Date(session.scheduledEndTime).getTime() - now.getTime();
        const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
        const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

        activeSessionInfo = {
          sessionId: session._id,
          customerName: session.customerName,
          status: derivedStatus,
          startTime: session.startTime,
          scheduledEndTime: session.scheduledEndTime,
          bookedMinutes: session.bookedMinutes,
          elapsedMinutes: elapsed.elapsedMinutes,
          remainingMinutes,
          remainingSeconds,
          isWarning: remainingMinutes > 0 && remainingMinutes <= 5,
          isOvertime: overtime.isOvertime,
          billableOvertimeMinutes: overtime.billableOvertimeMinutes,
          overtimeFee: overtime.overtimeFee,
          hourlyRate: session.rateCardSnapshot?.hourlyRate || station.hourlyRate
        };
      }
    }

    res.json({
      success: true,
      data: {
        station: {
          id: station._id,
          name: station.name,
          type: station.type,
          hourlyRate: station.hourlyRate,
          status: station.status
        },
        session: activeSessionInfo,
        menu: ARENA_SNACK_MENU
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function callStaffAssistance(req, res, next) {
  try {
    const { stationId } = req.params;
    const { reason, customerName } = req.body || {};

    const station = await store.getStationById(stationId);
    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found.' });
    }

    const payload = {
      stationId: station._id,
      stationName: station.name,
      customerName: customerName || 'Gamer',
      reason: reason || 'Assistance requested at desk',
      timestamp: new Date()
    };

    // Log to audit trail
    await store.createAuditLog({
      action: 'CALL_STAFF_REQUEST',
      actorId: 'Customer',
      targetType: 'STATION',
      targetId: String(station._id),
      customerName: payload.customerName,
      stationName: station.name,
      reason: payload.reason,
      metadata: payload,
      userId: station.userId || null
    });

    // Broadcast SSE alert with sound cue to cashiers
    eventBroadcaster.broadcast('STAFF_ASSISTANCE_REQUEST', payload);

    res.json({
      success: true,
      message: `Staff alerted for ${station.name}. Help is on the way!`
    });
  } catch (err) {
    next(err);
  }
}

export async function orderSnackInSeat(req, res, next) {
  try {
    const { stationId } = req.params;
    const { items = [], customerName = 'Gamer', notes = '' } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Please select at least one item to order.' });
    }

    const station = await store.getStationById(stationId);
    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found.' });
    }

    const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0);
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    const orderPayload = {
      orderId,
      stationId: station._id,
      stationName: station.name,
      customerName,
      items,
      totalAmount,
      notes,
      timestamp: new Date()
    };

    // Log to audit trail
    await store.createAuditLog({
      action: 'IN_SEAT_SNACK_ORDER',
      actorId: 'Customer',
      targetType: 'STATION',
      targetId: String(station._id),
      customerName,
      stationName: station.name,
      metadata: orderPayload,
      userId: station.userId || null
    });

    // Broadcast to cashier SSE
    eventBroadcaster.broadcast('IN_SEAT_ORDER_RECEIVED', orderPayload);

    res.json({
      success: true,
      data: {
        orderId,
        totalAmount,
        message: `Order #${orderId} (₹${totalAmount}) received! Floor staff will bring it to ${station.name}.`
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function requestTimeExtension(req, res, next) {
  try {
    const { stationId } = req.params;
    const { additionalMinutes = 30, customerName = 'Gamer' } = req.body || {};

    const station = await store.getStationById(stationId);
    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found.' });
    }

    const payload = {
      stationId: station._id,
      stationName: station.name,
      customerName,
      additionalMinutes: Number(additionalMinutes),
      timestamp: new Date()
    };

    eventBroadcaster.broadcast('EXTENSION_REQUESTED', payload);

    res.json({
      success: true,
      message: `Request for +${additionalMinutes} mins sent to counter cashier!`
    });
  } catch (err) {
    next(err);
  }
}

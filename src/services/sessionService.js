import { store } from '../storage/index.js';
import {
  calculateElapsedDuration,
  calculateScheduledEndTime,
  calculateOvertime,
  calculateSessionFinancials,
  roundCurrency
} from '../domain/billingCalculator.js';
import {
  SessionStatus,
  validateSessionTransition,
  deriveSessionStatus
} from '../domain/sessionStateMachine.js';
import { canStartSession } from '../domain/stationStateMachine.js';
import { eventBroadcaster } from './eventBroadcaster.js';

export class SessionService {
  /**
   * Starts a new session on a station with atomic collision protection.
   */
  async startSession({
    stationId,
    customerName = 'Guest',
    customerPhone = '',
    pricingType = 'PACKAGE',
    bookedMinutes = 60,
    staffId = 'Cashier'
  }) {
    const station = await store.getStationById(stationId);
    if (!station) {
      const err = new Error(`Station not found with id '${stationId}'`);
      err.statusCode = 404;
      throw err;
    }

    const bookableCheck = canStartSession(station);
    if (!bookableCheck.bookable) {
      const err = new Error(bookableCheck.reason);
      err.statusCode = 409;
      throw err;
    }

    const startTime = new Date();
    const scheduledEndTime = calculateScheduledEndTime({
      startTime,
      bookedMinutes: Number(bookedMinutes)
    });

    const rateCardSnapshot = {
      hourlyRate: station.hourlyRate,
      gracePeriodMinutes: 5,
      overtimeBlockMinutes: 15
    };

    const initialFinancials = calculateSessionFinancials({
      pricingType,
      hourlyRate: station.hourlyRate,
      bookedMinutes: Number(bookedMinutes),
      startTime,
      scheduledEndTime,
      endTime: startTime
    });

    // Create session entity
    const sessionData = {
      stationId: station._id,
      stationName: station.name,
      customerName,
      customerPhone,
      pricingType,
      bookedMinutes: Number(bookedMinutes),
      startTime,
      scheduledEndTime,
      status: SessionStatus.ACTIVE,
      rateCardSnapshot,
      totalPausedMs: 0,
      financials: initialFinancials,
      createdBy: staffId
    };

    const session = await store.createSession(sessionData);

    // Atomic station occupancy locking
    const occupiedStation = await store.atomicOccupyStation(station._id, session._id);
    if (!occupiedStation) {
      // Concurrency collision: another cashier claimed it in the same tick!
      await store.updateSession(session._id, {
        status: SessionStatus.CANCELLED,
        cancellationReason: 'Concurrent collision during assignment'
      });
      const err = new Error(`Station '${station.name}' was claimed by another cashier. Please choose another station.`);
      err.statusCode = 409;
      throw err;
    }

    await store.createAuditLog({
      action: 'START_SESSION',
      actorId: staffId,
      targetType: 'SESSION',
      targetId: String(session._id),
      customerName: session.customerName,
      stationName: station.name,
      after: session,
      reason: 'Session initiated'
    });

    eventBroadcaster.broadcast('SESSION_STARTED', {
      session,
      stationId: station._id,
      stationName: station.name
    });

    return session;
  }

  /**
   * Pauses an active session.
   */
  async pauseSession(sessionId, { staffId = 'Cashier', reason = '' }) {
    const session = await store.getSessionById(sessionId);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }

    const validation = validateSessionTransition(session.status, SessionStatus.PAUSED);
    if (!validation.valid) {
      const err = new Error(validation.error);
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    const updated = await store.updateSession(sessionId, {
      status: SessionStatus.PAUSED,
      currentPauseStartTime: now
    });

    await store.createAuditLog({
      action: 'PAUSE_SESSION',
      actorId: staffId,
      targetType: 'SESSION',
      targetId: String(sessionId),
      customerName: session.customerName,
      stationName: session.stationName,
      before: { status: session.status },
      after: { status: SessionStatus.PAUSED, currentPauseStartTime: now },
      reason
    });

    eventBroadcaster.broadcast('SESSION_PAUSED', {
      sessionId,
      stationId: session.stationId,
      currentPauseStartTime: now
    });

    return updated;
  }

  /**
   * Resumes a paused session, accumulating pause duration and extending scheduled end time.
   */
  async resumeSession(sessionId, { staffId = 'Cashier' }) {
    const session = await store.getSessionById(sessionId);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }

    const validation = validateSessionTransition(session.status, SessionStatus.ACTIVE);
    if (!validation.valid) {
      const err = new Error(validation.error);
      err.statusCode = 400;
      throw err;
    }

    const resumedAt = new Date();
    const pausedAt = session.currentPauseStartTime ? new Date(session.currentPauseStartTime) : resumedAt;
    const durationMs = Math.max(0, resumedAt.getTime() - pausedAt.getTime());

    const pauseRecords = [...(session.pauseRecords || [])];
    pauseRecords.push({ pausedAt, resumedAt, durationMs });

    const newTotalPausedMs = (session.totalPausedMs || 0) + durationMs;

    const newScheduledEndTime = calculateScheduledEndTime({
      startTime: session.startTime,
      bookedMinutes: session.bookedMinutes,
      totalPausedMs: newTotalPausedMs,
      extensions: session.extensions
    });

    const updated = await store.updateSession(sessionId, {
      status: SessionStatus.ACTIVE,
      currentPauseStartTime: null,
      pauseRecords,
      totalPausedMs: newTotalPausedMs,
      scheduledEndTime: newScheduledEndTime
    });

    await store.createAuditLog({
      action: 'RESUME_SESSION',
      actorId: staffId,
      targetType: 'SESSION',
      targetId: String(sessionId),
      customerName: session.customerName,
      stationName: session.stationName,
      after: {
        status: SessionStatus.ACTIVE,
        totalPausedMs: newTotalPausedMs,
        scheduledEndTime: newScheduledEndTime
      }
    });

    eventBroadcaster.broadcast('SESSION_RESUMED', {
      sessionId,
      stationId: session.stationId,
      newScheduledEndTime
    });

    return updated;
  }

  /**
   * Extends session duration.
   */
  async extendSession(sessionId, { addedMinutes, staffId = 'Cashier' }) {
    const session = await store.getSessionById(sessionId);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }

    if (session.status === SessionStatus.COMPLETED || session.status === SessionStatus.CANCELLED) {
      const err = new Error(`Cannot extend a session with status '${session.status}'`);
      err.statusCode = 400;
      throw err;
    }

    const mins = Number(addedMinutes);
    if (isNaN(mins) || mins <= 0) {
      const err = new Error('addedMinutes must be a positive number');
      err.statusCode = 400;
      throw err;
    }

    const hourlyRate = session.rateCardSnapshot.hourlyRate;
    const extensionFee = roundCurrency((mins / 60) * hourlyRate);

    const extensions = [...(session.extensions || [])];
    extensions.push({
      addedMinutes: mins,
      fee: extensionFee,
      extendedAt: new Date(),
      extendedBy: staffId
    });

    const newScheduledEndTime = calculateScheduledEndTime({
      startTime: session.startTime,
      bookedMinutes: session.bookedMinutes,
      totalPausedMs: session.totalPausedMs,
      extensions
    });

    const updated = await store.updateSession(sessionId, {
      status: SessionStatus.ACTIVE, // Reset to ACTIVE if it was expired
      extensions,
      scheduledEndTime: newScheduledEndTime
    });

    await store.createAuditLog({
      action: 'EXTEND_SESSION',
      actorId: staffId,
      targetType: 'SESSION',
      targetId: String(sessionId),
      customerName: session.customerName,
      stationName: session.stationName,
      metadata: { addedMinutes: mins, extensionFee, newScheduledEndTime }
    });

    eventBroadcaster.broadcast('SESSION_EXTENDED', {
      sessionId,
      stationId: session.stationId,
      addedMinutes: mins,
      newScheduledEndTime
    });

    return updated;
  }

  /**
   * Transfers a session to another available station.
   */
  async transferStation(sessionId, { targetStationId, staffId = 'Cashier', reason = '' }) {
    const session = await store.getSessionById(sessionId);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }

    if (session.status === SessionStatus.COMPLETED || session.status === SessionStatus.CANCELLED) {
      const err = new Error(`Cannot transfer a session that is '${session.status}'`);
      err.statusCode = 400;
      throw err;
    }

    const targetStation = await store.getStationById(targetStationId);
    if (!targetStation) {
      const err = new Error('Target station not found');
      err.statusCode = 404;
      throw err;
    }

    const bookableCheck = canStartSession(targetStation);
    if (!bookableCheck.bookable) {
      const err = new Error(`Cannot transfer: ${bookableCheck.reason}`);
      err.statusCode = 409;
      throw err;
    }

    // Atomically reserve target station
    const occupiedTarget = await store.atomicOccupyStation(targetStation._id, sessionId);
    if (!occupiedTarget) {
      const err = new Error(`Target station '${targetStation.name}' is no longer available.`);
      err.statusCode = 409;
      throw err;
    }

    // Release old station
    await store.atomicReleaseStation(session.stationId);

    const transfers = [...(session.transfers || [])];
    transfers.push({
      fromStationId: session.stationId,
      toStationId: targetStation._id,
      transferredAt: new Date(),
      rateAtTransfer: targetStation.hourlyRate
    });

    const updated = await store.updateSession(sessionId, {
      stationId: targetStation._id,
      stationName: targetStation.name,
      transfers
    });

    await store.createAuditLog({
      action: 'TRANSFER_STATION',
      actorId: staffId,
      targetType: 'SESSION',
      targetId: String(sessionId),
      customerName: session.customerName,
      stationName: `${session.stationName} -> ${targetStation.name}`,
      before: { stationId: session.stationId },
      after: { stationId: targetStation._id },
      reason
    });

    eventBroadcaster.broadcast('SESSION_TRANSFERRED', {
      sessionId,
      fromStationId: session.stationId,
      toStationId: targetStation._id,
      targetStationName: targetStation.name
    });

    return updated;
  }

  /**
   * Finalizes checkout, computes overtime fees, records payments with idempotency,
   * releases the physical station, and completes the session.
   */
  async checkoutSession(sessionId, {
    payment = null,
    discount = 0,
    addOns = [],
    staffId = 'Cashier'
  }) {
    const session = await store.getSessionById(sessionId);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }

    const validation = validateSessionTransition(session.status, SessionStatus.COMPLETED);
    if (!validation.valid) {
      const err = new Error(validation.error);
      err.statusCode = 400;
      throw err;
    }

    const checkoutTime = new Date();
    const existingPayments = await store.getPaymentsBySessionId(sessionId);
    let allPayments = [...existingPayments];

    // Handle payment processing if included in checkout
    if (payment && payment.amount > 0) {
      if (!payment.idempotencyKey) {
        const err = new Error('idempotencyKey is required for payment processing.');
        err.statusCode = 400;
        throw err;
      }

      // Check if duplicate request
      const existingTx = await store.getPaymentByIdempotencyKey(payment.idempotencyKey);
      if (!existingTx) {
        const newPayment = await store.createPayment({
          sessionId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod || 'CASH',
          referenceNumber: payment.referenceNumber || '',
          idempotencyKey: payment.idempotencyKey,
          receivedBy: staffId
        });
        allPayments.push(newPayment);

        await store.createAuditLog({
          action: 'RECORD_PAYMENT',
          actorId: staffId,
          targetType: 'PAYMENT',
          targetId: String(newPayment._id),
          metadata: { amount: payment.amount, method: payment.paymentMethod }
        });
      }
    }

    // Merge add-ons
    const combinedAddOns = [...(session.addOns || []), ...addOns];

    // Calculate final billing breakdown
    const financials = calculateSessionFinancials({
      pricingType: session.pricingType,
      hourlyRate: session.rateCardSnapshot.hourlyRate,
      bookedMinutes: session.bookedMinutes,
      startTime: session.startTime,
      scheduledEndTime: session.scheduledEndTime,
      endTime: checkoutTime,
      totalPausedMs: session.totalPausedMs,
      gracePeriodMinutes: session.rateCardSnapshot.gracePeriodMinutes,
      overtimeBlockMinutes: session.rateCardSnapshot.overtimeBlockMinutes,
      addOns: combinedAddOns,
      discount,
      payments: allPayments
    });

    // Mark session COMPLETED and record actual checkout time
    const updated = await store.updateSession(sessionId, {
      status: SessionStatus.COMPLETED,
      actualEndTime: checkoutTime,
      financials,
      addOns: combinedAddOns
    });

    // Atomically release station to AVAILABLE
    await store.atomicReleaseStation(session.stationId);

    await store.createAuditLog({
      action: 'CHECKOUT_SESSION',
      actorId: staffId,
      targetType: 'SESSION',
      targetId: String(sessionId),
      customerName: session.customerName,
      stationName: session.stationName,
      metadata: { financials }
    });

    eventBroadcaster.broadcast('SESSION_COMPLETED', {
      sessionId,
      stationId: session.stationId,
      stationName: session.stationName,
      financials
    });

    return {
      session: updated,
      receipt: {
        receiptNumber: `REC-${sessionId.toString().slice(-6).toUpperCase()}`,
        stationName: session.stationName,
        customerName: session.customerName,
        startTime: session.startTime,
        checkoutTime,
        financials,
        payments: allPayments
      }
    };
  }

  /**
   * Cancels a session with mandatory reason.
   */
  async cancelSession(sessionId, { staffId = 'Manager', reason }) {
    if (!reason || reason.trim() === '') {
      const err = new Error('Cancellation requires a documented reason.');
      err.statusCode = 400;
      throw err;
    }

    const session = await store.getSessionById(sessionId);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }

    const validation = validateSessionTransition(session.status, SessionStatus.CANCELLED);
    if (!validation.valid) {
      const err = new Error(validation.error);
      err.statusCode = 400;
      throw err;
    }

    const updated = await store.updateSession(sessionId, {
      status: SessionStatus.CANCELLED,
      cancellationReason: reason,
      cancelledBy: staffId
    });

    await store.atomicReleaseStation(session.stationId);

    await store.createAuditLog({
      action: 'CANCEL_SESSION',
      actorId: staffId,
      targetType: 'SESSION',
      targetId: String(sessionId),
      customerName: session.customerName,
      stationName: session.stationName,
      reason
    });

    eventBroadcaster.broadcast('SESSION_CANCELLED', {
      sessionId,
      stationId: session.stationId,
      stationName: session.stationName,
      reason
    });

    return updated;
  }

  /**
   * Returns all stations enriched with current live status, remaining time, and overtime indicators.
   */
  async getLiveStationOverview() {
    const stations = await store.getAllStations();
    const activeSessions = await store.getAllSessions();
    const now = new Date();

    const enriched = stations.map(station => {
      let activeSession = null;
      if (station.currentSessionId) {
        activeSession = activeSessions.find(
          s => String(s._id) === String(station.currentSessionId) &&
               s.status !== SessionStatus.COMPLETED &&
               s.status !== SessionStatus.CANCELLED
        );
      }

      let liveInfo = null;
      if (activeSession) {
        const derivedStatus = deriveSessionStatus(activeSession, now);
        const elapsed = calculateElapsedDuration({
          startTime: activeSession.startTime,
          endTime: now,
          totalPausedMs: activeSession.totalPausedMs,
          currentPauseStartTime: activeSession.currentPauseStartTime
        });

        const scheduledEndMs = new Date(activeSession.scheduledEndTime).getTime();
        const diffMs = scheduledEndMs - now.getTime();
        const remainingMinutes = Math.max(0, Math.ceil(diffMs / 60000));

        const overtime = calculateOvertime({
          scheduledEndTime: activeSession.scheduledEndTime,
          endTime: now,
          hourlyRate: activeSession.rateCardSnapshot.hourlyRate
        });

        liveInfo = {
          sessionId: activeSession._id,
          customerName: activeSession.customerName,
          status: derivedStatus,
          startTime: activeSession.startTime,
          scheduledEndTime: activeSession.scheduledEndTime,
          elapsedMinutes: elapsed.elapsedMinutes,
          remainingMinutes,
          isWarning: remainingMinutes > 0 && remainingMinutes <= 5,
          isOvertime: overtime.isOvertime,
          rawOvertimeMinutes: overtime.rawOvertimeMinutes,
          billableOvertimeMinutes: overtime.billableOvertimeMinutes,
          overtimeFee: overtime.overtimeFee
        };
      }

      return {
        ...station,
        liveSession: liveInfo
      };
    });

    return enriched;
  }
}

export const sessionService = new SessionService();

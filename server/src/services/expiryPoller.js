import { store } from '../storage/index.js';
import { SessionStatus } from '../domain/sessionStateMachine.js';
import { eventBroadcaster } from './eventBroadcaster.js';
import { emailService } from './emailService.js';
import { whatsappService } from './whatsappService.js';

export class ExpiryPoller {
  constructor() {
    this.timer = null;
    this.warnedSessionIds = new Set();
    this.lastPruneTime = 0;
  }

  /**
   * Scans active sessions and transitions expired ones or dispatches warnings.
   * Also performs hourly pruning of records outside the 30-day (1-month) retention window.
   * @param {Date|number} [now=Date.now()]
   * @returns {Promise<{ checked: number, expired: number, warned: number }>}
   */
  async checkActiveSessions(now = Date.now()) {
    const currentMs = new Date(now).getTime();

    // Run monthly auto-pruning once per hour
    if (currentMs - this.lastPruneTime > 60 * 60 * 1000) {
      try {
        await store.pruneOldSessions();
        this.lastPruneTime = currentMs;
      } catch (err) {
        console.error('Error during auto-prune:', err.message);
      }
    }

    const activeSessions = await store.getAllSessions({ status: SessionStatus.ACTIVE });

    let expiredCount = 0;
    let warnedCount = 0;

    for (const session of activeSessions) {
      const scheduledEndMs = new Date(session.scheduledEndTime).getTime();
      const diffMs = scheduledEndMs - currentMs;

      if (currentMs > scheduledEndMs) {
        // Session has expired!
        await store.updateSession(session._id, {
          status: SessionStatus.EXPIRED_UNSETTLED
        });

        eventBroadcaster.broadcast('SESSION_EXPIRED', {
          sessionId: session._id,
          stationId: session.stationId,
          stationName: session.stationName,
          customerName: session.customerName,
          scheduledEndTime: session.scheduledEndTime,
          overtimeMinutes: Math.ceil((currentMs - scheduledEndMs) / 60000)
        });

        this.warnedSessionIds.delete(String(session._id));
        expiredCount++;
      } else if (diffMs > 0 && diffMs <= 5 * 60 * 1000) {
        // Approaching expiry within 5 minutes warning window
        const sessionIdStr = String(session._id);

        // Check in-memory set and session persistent flag
        const alreadyWarned = this.warnedSessionIds.has(sessionIdStr) || session.warningNotificationSent;

        if (!alreadyWarned) {
          this.warnedSessionIds.add(sessionIdStr);

          // Mark persistently on session
          await store.updateSession(session._id, {
            warningNotificationSent: true
          });

          const remainingMinutes = Math.max(1, Math.ceil(diffMs / 60000));
          const customerName = session.customerName || 'Guest';
          const stationName = session.stationName || 'PC Station';

          // 1. Broadcast SSE warning to cashier dashboard popup
          eventBroadcaster.broadcast('SESSION_EXPIRY_WARNING', {
            sessionId: session._id,
            stationId: session.stationId,
            stationName,
            customerName,
            startTime: session.startTime,
            scheduledEndTime: session.scheduledEndTime,
            remainingMinutes,
            remainingSeconds: Math.ceil(diffMs / 1000),
            message: `Only 5 minutes left for ${customerName} on PC ${stationName}.`
          });

          // 2. Dispatch email to center owner (non-blocking, fail-safe)
          emailService.sendFiveMinuteWarningEmail({
            sessionId: session._id,
            customerName,
            stationName,
            startTime: session.startTime,
            scheduledEndTime: session.scheduledEndTime,
            remainingMinutes
          }).catch(err => {
            console.error('[EXPIRY POLLER] Error sending owner alert email:', err.message);
          });

          // 3. Dispatch dual WhatsApp notifications to customer and manager (non-blocking, fail-safe)
          whatsappService.sendFiveMinuteAlerts({
            sessionId: session._id,
            customerPhone: session.customerPhone,
            customerName,
            stationName,
            scheduledEndTime: session.scheduledEndTime,
            remainingMinutes,
            userId: session.userId
          }).catch(err => {
            console.error('[EXPIRY POLLER] Error sending WhatsApp warning:', err.message);
          });

          warnedCount++;
        }
      }
    }

    return {
      checked: activeSessions.length,
      expired: expiredCount,
      warned: warnedCount
    };
  }

  start(intervalMs = 5000) {
    if (this.timer) return;
    this.timer = setInterval(async () => {
      try {
        await this.checkActiveSessions();
      } catch (err) {
        console.error('Error during expiry check cycle:', err.message);
      }
    }, intervalMs);

    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.warnedSessionIds.clear();
  }
}

export const expiryPoller = new ExpiryPoller();

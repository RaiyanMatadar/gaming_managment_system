import { store } from '../storage/index.js';
import { SessionStatus } from '../domain/sessionStateMachine.js';
import { eventBroadcaster } from './eventBroadcaster.js';

export class ExpiryPoller {
  constructor() {
    this.timer = null;
    this.warnedSessionIds = new Set();
  }

  /**
   * Scans active sessions and transitions expired ones or dispatches warnings.
   * @param {Date|number} [now=Date.now()]
   * @returns {Promise<{ checked: number, expired: number, warned: number }>}
   */
  async checkActiveSessions(now = Date.now()) {
    const currentMs = new Date(now).getTime();
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
        if (!this.warnedSessionIds.has(sessionIdStr)) {
          this.warnedSessionIds.add(sessionIdStr);

          eventBroadcaster.broadcast('SESSION_EXPIRY_WARNING', {
            sessionId: session._id,
            stationId: session.stationId,
            stationName: session.stationName,
            customerName: session.customerName,
            remainingMinutes: Math.ceil(diffMs / 60000),
            scheduledEndTime: session.scheduledEndTime
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

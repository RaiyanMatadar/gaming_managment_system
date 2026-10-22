import { store } from '../storage/index.js';
import { roundCurrency } from '../domain/billingCalculator.js';

export class ReportService {
  /**
   * Generates comprehensive shift reconciliation and operational metrics.
   * @param {Object} [params]
   * @param {Date|string} [params.startDate]
   * @param {Date|string} [params.endDate]
   */
  async getShiftReport({ startDate, endDate, userId = null } = {}) {
    const startMs = startDate ? new Date(startDate).getTime() : new Date().setHours(0, 0, 0, 0);
    const endMs = endDate ? new Date(endDate).getTime() : new Date().setHours(23, 59, 59, 999);

    const filter = userId ? { userId } : {};
    const allSessions = await store.getAllSessions(filter);
    const stations = await store.getAllStations(filter);

    // Filter sessions within date range based on start time
    const shiftSessions = allSessions.filter(s => {
      const sessionTime = new Date(s.startTime || s.createdAt).getTime();
      return sessionTime >= startMs && sessionTime <= endMs;
    });

    // Gather all payments related to shift sessions
    let totalRevenue = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;

    for (const session of shiftSessions) {
      const payments = await store.getPaymentsBySessionId(session._id);
      for (const p of payments) {
        const amt = Number(p.amount) || 0;
        totalRevenue += amt;
        if (p.paymentMethod === 'CASH') cashTotal += amt;
        else if (p.paymentMethod === 'UPI') upiTotal += amt;
        else if (p.paymentMethod === 'CARD') cardTotal += amt;
      }
    }

    // Session status metrics
    let completedSessions = 0;
    let activeSessions = 0;
    let cancelledSessions = 0;
    let totalBookedMinutes = 0;
    let totalElapsedMinutes = 0;
    let totalOvertimeRevenue = 0;
    let totalDiscounts = 0;
    let totalOutstandingBalance = 0;

    // Station performance accumulator
    const stationStatsMap = new Map();
    for (const st of stations) {
      stationStatsMap.set(String(st._id), {
        stationId: st._id,
        stationName: st.name,
        stationType: st.type,
        hourlyRate: st.hourlyRate,
        sessionCount: 0,
        bookedMinutes: 0,
        elapsedMinutes: 0,
        revenue: 0
      });
    }

    for (const session of shiftSessions) {
      if (session.status === 'COMPLETED') completedSessions++;
      else if (session.status === 'CANCELLED') cancelledSessions++;
      else activeSessions++;

      const fin = session.financials || {};
      totalBookedMinutes += Number(session.bookedMinutes) || 0;
      if (session.extensions) {
        totalBookedMinutes += session.extensions.reduce((sum, ext) => sum + (ext.addedMinutes || 0), 0);
      }
      totalElapsedMinutes += Number(fin.elapsedMinutes) || 0;
      totalOvertimeRevenue += Number(fin.overtimeAmount) || 0;
      totalDiscounts += Number(fin.discountAmount) || 0;
      totalOutstandingBalance += Number(fin.balanceDue) || 0;

      // Accumulate per-station metrics
      const stStats = stationStatsMap.get(String(session.stationId));
      if (stStats) {
        stStats.sessionCount++;
        stStats.bookedMinutes += Number(session.bookedMinutes) || 0;
        stStats.elapsedMinutes += Number(fin.elapsedMinutes) || 0;
        stStats.revenue += Number(fin.totalPayable) || 0;
      }
    }

    const stationBreakdown = Array.from(stationStatsMap.values()).map(s => ({
      ...s,
      revenue: roundCurrency(s.revenue),
      gamingHours: roundCurrency(s.elapsedMinutes / 60)
    }));

    return {
      period: {
        startDate: new Date(startMs).toISOString(),
        endDate: new Date(endMs).toISOString()
      },
      financialSummary: {
        totalRevenue: roundCurrency(totalRevenue),
        cashTotal: roundCurrency(cashTotal),
        upiTotal: roundCurrency(upiTotal),
        cardTotal: roundCurrency(cardTotal),
        overtimeRevenue: roundCurrency(totalOvertimeRevenue),
        discountsGranted: roundCurrency(totalDiscounts),
        outstandingBalance: roundCurrency(totalOutstandingBalance)
      },
      gamingMetrics: {
        totalSessions: shiftSessions.length,
        completedSessions,
        activeSessions,
        cancelledSessions,
        hoursSold: roundCurrency(totalBookedMinutes / 60),
        hoursConsumed: roundCurrency(totalElapsedMinutes / 60)
      },
      stationBreakdown
    };
  }
}

export const reportService = new ReportService();

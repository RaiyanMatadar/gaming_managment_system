import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  roundCurrency,
  calculateElapsedDuration,
  calculateScheduledEndTime,
  calculateOvertime,
  calculateSessionFinancials
} from '../domain/billingCalculator.js';

describe('Billing Calculator & Time Rules Engine', () => {

  describe('roundCurrency', () => {
    it('accurately rounds monetary values avoiding floating-point drift', () => {
      assert.equal(roundCurrency(0.1 + 0.2), 0.3);
      assert.equal(roundCurrency(120.456), 120.46);
      assert.equal(roundCurrency(99.994), 99.99);
    });
  });

  describe('calculateElapsedDuration', () => {
    it('calculates elapsed minutes from start and end times', () => {
      const start = new Date('2026-10-21T10:00:00Z');
      const end = new Date('2026-10-21T11:15:00Z');
      const result = calculateElapsedDuration({ startTime: start, endTime: end });
      assert.equal(result.elapsedMinutes, 75);
      assert.equal(result.elapsedMs, 75 * 60 * 1000);
    });

    it('correctly deducts historical paused duration', () => {
      const start = new Date('2026-10-21T10:00:00Z');
      const end = new Date('2026-10-21T11:00:00Z'); // 60 mins raw
      const pausedMs = 15 * 60 * 1000; // 15 mins paused
      const result = calculateElapsedDuration({
        startTime: start,
        endTime: end,
        totalPausedMs: pausedMs
      });
      assert.equal(result.elapsedMinutes, 45);
    });

    it('deducts ongoing active pause duration', () => {
      const start = new Date('2026-10-21T10:00:00Z');
      const pauseStart = new Date('2026-10-21T10:30:00Z');
      const now = new Date('2026-10-21T10:45:00Z'); // 15 mins active pause
      const result = calculateElapsedDuration({
        startTime: start,
        endTime: now,
        totalPausedMs: 0,
        currentPauseStartTime: pauseStart
      });
      assert.equal(result.elapsedMinutes, 30);
    });
  });

  describe('calculateScheduledEndTime', () => {
    it('computes initial scheduled end time from booked minutes', () => {
      const start = new Date('2026-10-21T10:00:00Z');
      const scheduledEnd = calculateScheduledEndTime({
        startTime: start,
        bookedMinutes: 120
      });
      assert.equal(scheduledEnd.toISOString(), '2026-10-21T12:00:00.000Z');
    });

    it('pushes scheduled end time with extensions and paused duration', () => {
      const start = new Date('2026-10-21T10:00:00Z');
      const scheduledEnd = calculateScheduledEndTime({
        startTime: start,
        bookedMinutes: 60,
        totalPausedMs: 10 * 60 * 1000, // +10 min pause
        extensions: [{ addedMinutes: 30 }] // +30 min extension
      });
      // 10:00 + 60m + 30m + 10m = 11:40
      assert.equal(scheduledEnd.toISOString(), '2026-10-21T11:40:00.000Z');
    });
  });

  describe('calculateOvertime', () => {
    const hourlyRate = 120; // 2 currency units per min

    it('returns zero overtime if checkout is before or at scheduled end', () => {
      const scheduled = new Date('2026-10-21T12:00:00Z');
      const checkout = new Date('2026-10-21T12:00:00Z');
      const res = calculateOvertime({
        scheduledEndTime: scheduled,
        endTime: checkout,
        hourlyRate
      });
      assert.equal(res.isOvertime, false);
      assert.equal(res.rawOvertimeMinutes, 0);
      assert.equal(res.billableOvertimeMinutes, 0);
      assert.equal(res.overtimeFee, 0);
    });

    it('applies 5-minute grace period: 4 minutes overtime incurs 0 fee', () => {
      const scheduled = new Date('2026-10-21T12:00:00Z');
      const checkout = new Date('2026-10-21T12:04:00Z');
      const res = calculateOvertime({
        scheduledEndTime: scheduled,
        endTime: checkout,
        hourlyRate,
        gracePeriodMinutes: 5
      });
      assert.equal(res.isOvertime, true);
      assert.equal(res.rawOvertimeMinutes, 4);
      assert.equal(res.billableOvertimeMinutes, 0);
      assert.equal(res.overtimeFee, 0);
    });

    it('applies 5-minute grace period: exactly 5 minutes overtime incurs 0 fee', () => {
      const scheduled = new Date('2026-10-21T12:00:00Z');
      const checkout = new Date('2026-10-21T12:05:00Z');
      const res = calculateOvertime({
        scheduledEndTime: scheduled,
        endTime: checkout,
        hourlyRate,
        gracePeriodMinutes: 5
      });
      assert.equal(res.rawOvertimeMinutes, 5);
      assert.equal(res.billableOvertimeMinutes, 0);
      assert.equal(res.overtimeFee, 0);
    });

    it('exceeding grace period rounds to nearest 15-minute block', () => {
      const scheduled = new Date('2026-10-21T12:00:00Z');
      const checkout = new Date('2026-10-21T12:06:00Z'); // 6 minutes raw
      const res = calculateOvertime({
        scheduledEndTime: scheduled,
        endTime: checkout,
        hourlyRate,
        gracePeriodMinutes: 5,
        overtimeBlockMinutes: 15
      });
      assert.equal(res.rawOvertimeMinutes, 6);
      assert.equal(res.billableOvertimeMinutes, 15);
      // 15 mins * (120 / 60) = 30
      assert.equal(res.overtimeFee, 30);
    });

    it('calculates multi-block overtime correctly (e.g. 22 minutes -> 30 min block)', () => {
      const scheduled = new Date('2026-10-21T12:00:00Z');
      const checkout = new Date('2026-10-21T12:22:00Z');
      const res = calculateOvertime({
        scheduledEndTime: scheduled,
        endTime: checkout,
        hourlyRate,
        gracePeriodMinutes: 5,
        overtimeBlockMinutes: 15
      });
      assert.equal(res.rawOvertimeMinutes, 22);
      assert.equal(res.billableOvertimeMinutes, 30);
      // 30 mins * (120 / 60) = 60
      assert.equal(res.overtimeFee, 60);
    });
  });

  describe('calculateSessionFinancials', () => {
    it('calculates fixed package with on-time checkout and partial payment', () => {
      const start = new Date('2026-10-21T10:00:00Z');
      const scheduled = new Date('2026-10-21T11:00:00Z');
      const fin = calculateSessionFinancials({
        pricingType: 'PACKAGE',
        hourlyRate: 100,
        bookedMinutes: 60,
        startTime: start,
        scheduledEndTime: scheduled,
        endTime: scheduled,
        addOns: [{ amount: 40, description: 'Energy Drink' }],
        discount: 10,
        payments: [{ amount: 50, paymentMethod: 'CASH' }]
      });

      assert.equal(fin.baseAmount, 100);
      assert.equal(fin.overtimeAmount, 0);
      assert.equal(fin.addOnsTotal, 40);
      assert.equal(fin.subtotal, 140);
      assert.equal(fin.totalPayable, 130);
      assert.equal(fin.amountPaid, 50);
      assert.equal(fin.balanceDue, 80);
      assert.equal(fin.paymentStatus, 'PARTIALLY_PAID');
    });

    it('calculates open-ended postpaid session with minimum block charge', () => {
      const start = new Date('2026-10-21T10:00:00Z');
      const end = new Date('2026-10-21T10:35:00Z'); // 35 minutes -> 45 min block
      const fin = calculateSessionFinancials({
        pricingType: 'HOURLY_OPEN',
        hourlyRate: 120, // 2 / min
        startTime: start,
        endTime: end,
        overtimeBlockMinutes: 15,
        payments: [{ amount: 90, paymentMethod: 'UPI' }]
      });

      // 35 mins -> rounded to 45 mins -> 45 * 2 = 90
      assert.equal(fin.baseAmount, 90);
      assert.equal(fin.overtimeAmount, 0);
      assert.equal(fin.totalPayable, 90);
      assert.equal(fin.amountPaid, 90);
      assert.equal(fin.balanceDue, 0);
      assert.equal(fin.paymentStatus, 'PAID');
    });

    it('calculates package with overtime and marks PAID when fully settled', () => {
      const start = new Date('2026-10-21T10:00:00Z');
      const scheduled = new Date('2026-10-21T11:00:00Z');
      const checkout = new Date('2026-10-21T11:18:00Z'); // 18m overtime -> 30m block
      const fin = calculateSessionFinancials({
        pricingType: 'PACKAGE',
        hourlyRate: 100,
        bookedMinutes: 60,
        startTime: start,
        scheduledEndTime: scheduled,
        endTime: checkout,
        payments: [{ amount: 150, paymentMethod: 'UPI' }]
      });

      assert.equal(fin.baseAmount, 100);
      // 30 min block * (100 / 60) = 50
      assert.equal(fin.overtimeAmount, 50);
      assert.equal(fin.totalPayable, 150);
      assert.equal(fin.balanceDue, 0);
      assert.equal(fin.paymentStatus, 'PAID');
    });
  });

});

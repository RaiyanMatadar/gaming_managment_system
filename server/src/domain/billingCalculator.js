/**
 * Billing and Session Duration Calculation Engine
 * 
 * Implements deterministic business rules for gaming center billing:
 * - Authoritative server-side elapsed time calculation
 * - Grace period and block-based overtime surcharges
 * - Open-ended (postpaid) and fixed package calculations
 * - Precision rounding (2 decimal places) avoiding float inaccuracies
 */

/**
 * Rounds a monetary amount to 2 decimal places.
 * @param {number} amount
 * @returns {number}
 */
export function roundCurrency(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates effective elapsed duration in minutes.
 * @param {Object} params
 * @param {Date|string|number} params.startTime - Session start timestamp
 * @param {Date|string|number} [params.endTime] - Current time or end timestamp (defaults to Date.now())
 * @param {number} [params.totalPausedMs=0] - Accumulated paused duration in milliseconds
 * @param {Date|string|number} [params.currentPauseStartTime] - Active pause start time if currently paused
 * @returns {{ elapsedMs: number, elapsedMinutes: number }}
 */
export function calculateElapsedDuration({
  startTime,
  endTime = Date.now(),
  totalPausedMs = 0,
  currentPauseStartTime = null
}) {
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();

  let effectivePausedMs = totalPausedMs;
  if (currentPauseStartTime) {
    const pauseStartMs = new Date(currentPauseStartTime).getTime();
    if (endMs > pauseStartMs) {
      effectivePausedMs += (endMs - pauseStartMs);
    }
  }

  const rawElapsedMs = endMs - startMs;
  const elapsedMs = Math.max(0, rawElapsedMs - effectivePausedMs);
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  return { elapsedMs, elapsedMinutes };
}

/**
 * Calculates scheduled end time including extensions and paused duration.
 * @param {Object} params
 * @param {Date|string|number} params.startTime
 * @param {number} params.bookedMinutes - Initial duration
 * @param {number} [params.totalPausedMs=0]
 * @param {Array<{addedMinutes: number}>} [params.extensions=[]]
 * @returns {Date}
 */
export function calculateScheduledEndTime({
  startTime,
  bookedMinutes,
  totalPausedMs = 0,
  extensions = []
}) {
  const startMs = new Date(startTime).getTime();
  const additionalMinutes = extensions.reduce((sum, ext) => sum + (ext.addedMinutes || 0), 0);
  const totalBookedMinutes = bookedMinutes + additionalMinutes;
  const scheduledEndMs = startMs + (totalBookedMinutes * 60000) + totalPausedMs;
  return new Date(scheduledEndMs);
}

/**
 * Calculates overtime minutes, billable overtime, and overtime fee.
 * 
 * Business Rule:
 * - If overtime <= gracePeriodMinutes (default 5): billable overtime is 0.
 * - If overtime > gracePeriodMinutes: rounded up to nearest overtimeBlockMinutes (default 15).
 * 
 * @param {Object} params
 * @param {Date|string|number} params.scheduledEndTime
 * @param {Date|string|number} [params.endTime] - Current time or checkout time (defaults to Date.now())
 * @param {number} params.hourlyRate - Hourly rate for the station
 * @param {number} [params.gracePeriodMinutes=5]
 * @param {number} [params.overtimeBlockMinutes=15]
 * @returns {{ rawOvertimeMinutes: number, billableOvertimeMinutes: number, overtimeFee: number, isOvertime: boolean }}
 */
export function calculateOvertime({
  scheduledEndTime,
  endTime = Date.now(),
  hourlyRate,
  gracePeriodMinutes = 5,
  overtimeBlockMinutes = 15
}) {
  const scheduledEndMs = new Date(scheduledEndTime).getTime();
  const endMs = new Date(endTime).getTime();

  if (endMs <= scheduledEndMs) {
    return {
      rawOvertimeMinutes: 0,
      billableOvertimeMinutes: 0,
      overtimeFee: 0,
      isOvertime: false
    };
  }

  const rawOvertimeMs = endMs - scheduledEndMs;
  // Overtime minutes: any second past the minute enters that minute
  const rawOvertimeMinutes = Math.ceil(rawOvertimeMs / 60000);

  if (rawOvertimeMinutes <= gracePeriodMinutes) {
    return {
      rawOvertimeMinutes,
      billableOvertimeMinutes: 0,
      overtimeFee: 0,
      isOvertime: true
    };
  }

  // Rounded up to nearest block (e.g. 15 mins)
  const blocks = Math.ceil(rawOvertimeMinutes / overtimeBlockMinutes);
  const billableOvertimeMinutes = blocks * overtimeBlockMinutes;
  const ratePerMinute = hourlyRate / 60;
  const overtimeFee = roundCurrency(billableOvertimeMinutes * ratePerMinute);

  return {
    rawOvertimeMinutes,
    billableOvertimeMinutes,
    overtimeFee,
    isOvertime: true
  };
}

/**
 * Calculates complete itemized session financials.
 * 
 * @param {Object} params
 * @param {'PACKAGE'|'CUSTOM'|'HOURLY_OPEN'} params.pricingType
 * @param {number} params.hourlyRate
 * @param {number} [params.packagePrice] - Fixed package price if applicable
 * @param {number} [params.bookedMinutes=60]
 * @param {Date|string|number} params.startTime
 * @param {Date|string|number} [params.endTime]
 * @param {Date|string|number} [params.scheduledEndTime]
 * @param {number} [params.totalPausedMs=0]
 * @param {Date|string|number} [params.currentPauseStartTime=null]
 * @param {number} [params.gracePeriodMinutes=5]
 * @param {number} [params.overtimeBlockMinutes=15]
 * @param {number} [params.minimumCharge=0]
 * @param {Array<{amount: number, description?: string}>} [params.addOns=[]]
 * @param {number} [params.discount=0]
 * @param {Array<{amount: number, paymentMethod: string}>} [params.payments=[]]
 * @returns {Object} Full itemized financial summary
 */
export function calculateSessionFinancials({
  pricingType,
  hourlyRate,
  packagePrice = null,
  bookedMinutes = 0,
  startTime,
  endTime = Date.now(),
  scheduledEndTime = null,
  totalPausedMs = 0,
  currentPauseStartTime = null,
  gracePeriodMinutes = 5,
  overtimeBlockMinutes = 15,
  minimumCharge = 0,
  addOns = [],
  discount = 0,
  payments = []
}) {
  const { elapsedMinutes } = calculateElapsedDuration({
    startTime,
    endTime,
    totalPausedMs,
    currentPauseStartTime
  });

  let baseAmount = 0;
  let overtimeInfo = {
    rawOvertimeMinutes: 0,
    billableOvertimeMinutes: 0,
    overtimeFee: 0,
    isOvertime: false
  };

  if (pricingType === 'HOURLY_OPEN') {
    // Open-ended session: bill actual elapsed time in 15-minute blocks
    const billableMinutes = Math.max(
      overtimeBlockMinutes,
      Math.ceil(Math.max(1, elapsedMinutes) / overtimeBlockMinutes) * overtimeBlockMinutes
    );
    const computed = (billableMinutes / 60) * hourlyRate;
    baseAmount = roundCurrency(Math.max(minimumCharge, computed));
  } else {
    // Fixed package or custom duration
    if (typeof packagePrice === 'number' && packagePrice >= 0) {
      baseAmount = roundCurrency(packagePrice);
    } else {
      baseAmount = roundCurrency((bookedMinutes / 60) * hourlyRate);
    }

    // Determine scheduled end time if not directly supplied
    const effectiveScheduledEnd = scheduledEndTime || calculateScheduledEndTime({
      startTime,
      bookedMinutes,
      totalPausedMs
    });

    overtimeInfo = calculateOvertime({
      scheduledEndTime: effectiveScheduledEnd,
      endTime,
      hourlyRate,
      gracePeriodMinutes,
      overtimeBlockMinutes
    });
  }

  const addOnsTotal = roundCurrency(
    addOns.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  );

  const cleanDiscount = roundCurrency(Math.max(0, Number(discount) || 0));
  const subtotal = roundCurrency(baseAmount + overtimeInfo.overtimeFee + addOnsTotal);
  const totalPayable = roundCurrency(Math.max(0, subtotal - cleanDiscount));

  const amountPaid = roundCurrency(
    payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  );

  const balanceDue = roundCurrency(Math.max(0, totalPayable - amountPaid));

  let paymentStatus = 'UNPAID';
  if (amountPaid >= totalPayable && totalPayable > 0) {
    paymentStatus = 'PAID';
  } else if (amountPaid > 0 && amountPaid < totalPayable) {
    paymentStatus = 'PARTIALLY_PAID';
  } else if (totalPayable === 0 && amountPaid === 0) {
    paymentStatus = 'PAID';
  }

  return {
    pricingType,
    elapsedMinutes,
    baseAmount,
    rawOvertimeMinutes: overtimeInfo.rawOvertimeMinutes,
    billableOvertimeMinutes: overtimeInfo.billableOvertimeMinutes,
    overtimeAmount: overtimeInfo.overtimeFee,
    addOnsTotal,
    discountAmount: cleanDiscount,
    subtotal,
    totalPayable,
    amountPaid,
    balanceDue,
    paymentStatus
  };
}

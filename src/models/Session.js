import mongoose from 'mongoose';
import { SessionStatus } from '../domain/sessionStateMachine.js';

const sessionSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
      required: true,
      index: true
    },
    stationName: {
      type: String,
      default: ''
    },
    customerName: {
      type: String,
      default: 'Guest',
      trim: true
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true
    },
    pricingType: {
      type: String,
      enum: ['PACKAGE', 'HOURLY_OPEN', 'CUSTOM'],
      required: true
    },
    bookedMinutes: {
      type: Number,
      required: true,
      min: 0
    },
    startTime: {
      type: Date,
      required: true
    },
    scheduledEndTime: {
      type: Date,
      required: true,
      index: true
    },
    actualEndTime: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.ACTIVE,
      index: true
    },
    rateCardSnapshot: {
      hourlyRate: { type: Number, required: true },
      gracePeriodMinutes: { type: Number, default: 5 },
      overtimeBlockMinutes: { type: Number, default: 15 }
    },
    pauseRecords: [
      {
        pausedAt: { type: Date, required: true },
        resumedAt: { type: Date, default: null },
        durationMs: { type: Number, default: 0 }
      }
    ],
    currentPauseStartTime: {
      type: Date,
      default: null
    },
    totalPausedMs: {
      type: Number,
      default: 0
    },
    extensions: [
      {
        addedMinutes: { type: Number, required: true },
        fee: { type: Number, default: 0 },
        extendedAt: { type: Date, default: Date.now },
        extendedBy: { type: String, default: 'Cashier' }
      }
    ],
    addOns: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 }
      }
    ],
    financials: {
      baseAmount: { type: Number, default: 0 },
      overtimeAmount: { type: Number, default: 0 },
      addOnsTotal: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 },
      totalPayable: { type: Number, default: 0 },
      amountPaid: { type: Number, default: 0 },
      balanceDue: { type: Number, default: 0 },
      paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'],
        default: 'UNPAID'
      }
    },
    transfers: [
      {
        fromStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
        toStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
        transferredAt: { type: Date, default: Date.now },
        rateAtTransfer: { type: Number, required: true },
        durationOnPreviousMs: { type: Number, default: 0 }
      }
    ],
    cancellationReason: {
      type: String,
      default: null
    },
    cancelledBy: {
      type: String,
      default: null
    },
    createdBy: {
      type: String,
      default: 'Cashier'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly find active sessions per station
sessionSchema.index({ stationId: 1, status: 1 });

export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

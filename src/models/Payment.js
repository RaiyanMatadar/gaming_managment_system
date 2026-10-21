import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Payment amount must be greater than zero']
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD'],
      required: true
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: ''
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    receivedBy: {
      type: String,
      default: 'Cashier'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

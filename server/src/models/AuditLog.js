import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true
    },
    actorId: {
      type: String,
      default: 'system',
      index: true
    },
    targetType: {
      type: String,
      enum: ['STATION', 'SESSION', 'PAYMENT', 'PRICING'],
      required: true
    },
    targetId: {
      type: String,
      required: true,
      index: true
    },
    customerName: {
      type: String,
      default: '',
      trim: true
    },
    stationName: {
      type: String,
      default: '',
      trim: true
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    reason: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

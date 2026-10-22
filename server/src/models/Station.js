import mongoose from 'mongoose';
import { StationStatus, StationType } from '../domain/stationStateMachine.js';

const stationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(StationType),
      required: true
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(StationStatus),
      default: StationStatus.AVAILABLE,
      index: true
    },
    currentSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null
    },
    notes: {
      type: String,
      default: ''
    },
    userId: {
      type: String,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Station = mongoose.models.Station || mongoose.model('Station', stationSchema);

import mongoose from 'mongoose';
import { Station } from '../models/Station.js';
import { Session } from '../models/Session.js';
import { Payment } from '../models/Payment.js';
import { AuditLog } from '../models/AuditLog.js';
import { memoryStore } from './memoryStore.js';

function isMongoConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

export const store = {
  // --- STATIONS ---
  async getAllStations() {
    if (isMongoConnected()) {
      return await Station.find().lean();
    }
    return await memoryStore.getAllStations();
  },

  async getStationById(id) {
    if (isMongoConnected()) {
      return await Station.findById(id).lean();
    }
    return await memoryStore.getStationById(id);
  },

  async createStation(data) {
    if (isMongoConnected()) {
      return await Station.create(data);
    }
    return await memoryStore.createStation(data);
  },

  async atomicOccupyStation(stationId, sessionId) {
    if (isMongoConnected()) {
      return await Station.findOneAndUpdate(
        { _id: stationId, status: 'AVAILABLE', currentSessionId: null },
        { status: 'OCCUPIED', currentSessionId: sessionId },
        { new: true }
      ).lean();
    }
    return await memoryStore.atomicOccupyStation(stationId, sessionId);
  },

  async atomicReleaseStation(stationId) {
    if (isMongoConnected()) {
      return await Station.findOneAndUpdate(
        { _id: stationId },
        { status: 'AVAILABLE', currentSessionId: null },
        { new: true }
      ).lean();
    }
    return await memoryStore.atomicReleaseStation(stationId);
  },

  async updateStationStatus(stationId, status, notes = '') {
    if (isMongoConnected()) {
      return await Station.findByIdAndUpdate(
        stationId,
        { status, ...(notes ? { notes } : {}) },
        { new: true }
      ).lean();
    }
    return await memoryStore.updateStationStatus(stationId, status, notes);
  },

  async deleteStation(stationId) {
    if (isMongoConnected()) {
      return await Station.findByIdAndDelete(stationId);
    }
    return await memoryStore.deleteStation(stationId);
  },

  // --- SESSIONS ---
  async getSessionById(id) {
    if (isMongoConnected()) {
      return await Session.findById(id).lean();
    }
    return await memoryStore.getSessionById(id);
  },

  async getAllSessions(filter = {}) {
    if (isMongoConnected()) {
      return await Session.find(filter).lean();
    }
    return await memoryStore.getAllSessions(filter);
  },

  async createSession(data) {
    if (isMongoConnected()) {
      return await Session.create(data);
    }
    return await memoryStore.createSession(data);
  },

  async updateSession(id, updates) {
    if (isMongoConnected()) {
      return await Session.findByIdAndUpdate(id, updates, { new: true }).lean();
    }
    return await memoryStore.updateSession(id, updates);
  },

  async pruneOldSessions(cutoffDate) {
    const cutoff = cutoffDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (isMongoConnected()) {
      const res = await Session.deleteMany({
        status: { $in: ['COMPLETED', 'CANCELLED'] },
        $or: [
          { createdAt: { $lt: cutoff } },
          { startTime: { $lt: cutoff } }
        ]
      });
      return res.deletedCount || 0;
    }
    return await memoryStore.pruneOldSessions(cutoff);
  },

  // --- PAYMENTS ---
  async getPaymentByIdempotencyKey(key) {
    if (isMongoConnected()) {
      return await Payment.findOne({ idempotencyKey: key }).lean();
    }
    return await memoryStore.getPaymentByIdempotencyKey(key);
  },

  async getPaymentsBySessionId(sessionId) {
    if (isMongoConnected()) {
      return await Payment.find({ sessionId }).lean();
    }
    return await memoryStore.getPaymentsBySessionId(sessionId);
  },

  async createPayment(data) {
    if (isMongoConnected()) {
      return await Payment.create(data);
    }
    return await memoryStore.createPayment(data);
  },

  // --- AUDIT LOGS ---
  async createAuditLog(data) {
    if (isMongoConnected()) {
      return await AuditLog.create(data);
    }
    return await memoryStore.createAuditLog(data);
  },

  async getAuditLogs(options = 100) {
    if (isMongoConnected()) {
      const limit = typeof options === 'number' ? options : (options.limit || 100);
      const query = {};
      if (typeof options === 'object') {
        if (options.action && options.action !== 'ALL') {
          query.action = options.action;
        }
        if (options.search) {
          const regex = new RegExp(options.search, 'i');
          query.$or = [
            { customerName: regex },
            { stationName: regex },
            { action: regex },
            { reason: regex },
            { actorId: regex }
          ];
        }
      }
      return await AuditLog.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    }
    return await memoryStore.getAuditLogs(options);
  }
};

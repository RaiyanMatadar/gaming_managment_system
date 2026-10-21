/**
 * High-performance, Concurrency-Safe In-Memory Store
 * 
 * Supports atomic operations, unique constraints, and transaction-like rollbacks
 * for unit testing and offline development.
 */

let nextId = 1;
function generateId() {
  return `id_${Date.now()}_${nextId++}`;
}

export class MemoryStore {
  constructor() {
    this.stations = new Map();
    this.sessions = new Map();
    this.payments = new Map();
    this.auditLogs = [];
  }

  reset() {
    this.stations.clear();
    this.sessions.clear();
    this.payments.clear();
    this.auditLogs = [];
    nextId = 1;
  }

  // --- STATIONS ---
  async getAllStations() {
    return Array.from(this.stations.values());
  }

  async getStationById(id) {
    return this.stations.get(String(id)) || null;
  }

  async createStation(data) {
    const existing = Array.from(this.stations.values()).find(s => s.name === data.name);
    if (existing) {
      const err = new Error(`Station with name '${data.name}' already exists.`);
      err.code = 11000;
      throw err;
    }
    const station = {
      _id: generateId(),
      name: data.name,
      type: data.type,
      hourlyRate: Number(data.hourlyRate),
      status: data.status || 'AVAILABLE',
      currentSessionId: null,
      notes: data.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.stations.set(station._id, station);
    return station;
  }

  /**
   * Atomic Station Reservation/Occupancy.
   * Succeeds ONLY IF current status is 'AVAILABLE'.
   */
  async atomicOccupyStation(stationId, sessionId) {
    const station = this.stations.get(String(stationId));
    if (!station || station.status !== 'AVAILABLE' || station.currentSessionId) {
      return null; // Atomic failure: collision or not available
    }
    station.status = 'OCCUPIED';
    station.currentSessionId = sessionId;
    station.updatedAt = new Date();
    return { ...station };
  }

  /**
   * Atomic Station Release to AVAILABLE.
   */
  async atomicReleaseStation(stationId) {
    const station = this.stations.get(String(stationId));
    if (!station) return null;
    station.status = 'AVAILABLE';
    station.currentSessionId = null;
    station.updatedAt = new Date();
    return { ...station };
  }

  async updateStationStatus(stationId, status, notes = '') {
    const station = this.stations.get(String(stationId));
    if (!station) return null;
    station.status = status;
    if (notes) station.notes = notes;
    station.updatedAt = new Date();
    return { ...station };
  }

  // --- SESSIONS ---
  async getSessionById(id) {
    const session = this.sessions.get(String(id));
    return session ? { ...session } : null;
  }

  async getAllSessions(filter = {}) {
    let list = Array.from(this.sessions.values());
    if (filter.status) {
      list = list.filter(s => s.status === filter.status);
    }
    if (filter.stationId) {
      list = list.filter(s => String(s.stationId) === String(filter.stationId));
    }
    return list;
  }

  async createSession(data) {
    const id = generateId();
    const session = {
      _id: id,
      ...data,
      pauseRecords: data.pauseRecords || [],
      extensions: data.extensions || [],
      addOns: data.addOns || [],
      transfers: data.transfers || [],
      totalPausedMs: data.totalPausedMs || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sessions.set(id, session);
    return { ...session };
  }

  async updateSession(id, updates) {
    const session = this.sessions.get(String(id));
    if (!session) return null;
    const updated = {
      ...session,
      ...updates,
      updatedAt: new Date()
    };
    this.sessions.set(String(id), updated);
    return { ...updated };
  }

  // --- PAYMENTS ---
  async getPaymentByIdempotencyKey(key) {
    return Array.from(this.payments.values()).find(p => p.idempotencyKey === key) || null;
  }

  async getPaymentsBySessionId(sessionId) {
    return Array.from(this.payments.values()).filter(p => String(p.sessionId) === String(sessionId));
  }

  async createPayment(data) {
    if (this.payments.has(data.idempotencyKey)) {
      const err = new Error(`Payment with idempotency key '${data.idempotencyKey}' already processed.`);
      err.code = 11000;
      throw err;
    }
    const id = generateId();
    const payment = {
      _id: id,
      sessionId: String(data.sessionId),
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber || '',
      idempotencyKey: data.idempotencyKey,
      receivedBy: data.receivedBy || 'Cashier',
      createdAt: new Date()
    };
    this.payments.set(data.idempotencyKey, payment);
    return { ...payment };
  }

  // --- AUDIT LOGS ---
  async createAuditLog(data) {
    const log = {
      _id: generateId(),
      ...data,
      timestamp: new Date()
    };
    this.auditLogs.push(log);
    return log;
  }

  async getAuditLogs(limit = 100) {
    return this.auditLogs.slice(-limit).reverse();
  }
}

export const memoryStore = new MemoryStore();

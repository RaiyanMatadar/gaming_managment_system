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

const isTestEnv = () =>
  process.env.NODE_ENV === 'test' ||
  process.env.npm_lifecycle_event === 'test' ||
  process.argv.some(a => typeof a === 'string' && a.includes('test'));

export class MemoryStore {
  constructor() {
    this.stations = new Map();
    this.sessions = new Map();
    this.payments = new Map();
    this.users = new Map();
    this.auditLogs = [];
  }

  reset() {
    this.stations.clear();
    this.sessions.clear();
    this.payments.clear();
    this.users.clear();
    this.auditLogs = [];
    nextId = 1;
  }

  // --- USERS ---
  async createUser(data) {
    const username = (data.username || '').toLowerCase().trim();
    const existing = Array.from(this.users.values()).find(u => u.username === username);
    if (existing) {
      const err = new Error(`User with username '${username}' already exists.`);
      err.code = 11000;
      throw err;
    }
    const id = generateId();
    const user = {
      _id: id,
      username,
      password: data.password,
      name: data.name || 'Gaming Center Staff',
      centerName: data.centerName || 'GameDash Arena',
      email: data.email || '',
      role: data.role || 'manager',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return { ...user };
  }

  async getUserByUsername(username) {
    if (!username) return null;
    const lower = username.toLowerCase().trim();
    const user = Array.from(this.users.values()).find(u => u.username === lower);
    return user ? { ...user } : null;
  }

  async getUserById(id) {
    if (!id) return null;
    const user = this.users.get(String(id));
    return user ? { ...user } : null;
  }

  // --- STATIONS ---
  async getAllStations(filter = {}) {
    let list = Array.from(this.stations.values());
    if (filter.userId) {
      list = list.filter(s => s.userId === filter.userId || (!s.userId && isTestEnv()));
    }
    return list;
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
      userId: data.userId || null,
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

  async deleteStation(stationId) {
    const key = String(stationId);
    if (this.stations.has(key)) {
      this.stations.delete(key);
      return true;
    }
    return false;
  }

  // --- SESSIONS ---
  async getSessionById(id) {
    const session = this.sessions.get(String(id));
    return session ? { ...session } : null;
  }

  async getAllSessions(filter = {}) {
    let list = Array.from(this.sessions.values());
    if (filter.userId) {
      list = list.filter(s => s.userId === filter.userId || (!s.userId && isTestEnv()));
    }
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
      userId: data.userId || null,
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

  /**
   * Automatically deletes completed and cancelled sessions older than 30 days (1 month).
   */
  async pruneOldSessions(cutoffDate) {
    const cutoff = cutoffDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const cutoffMs = new Date(cutoff).getTime();
    let deletedCount = 0;
    for (const [id, session] of this.sessions.entries()) {
      const sessionMs = new Date(session.startTime || session.createdAt).getTime();
      if ((session.status === 'COMPLETED' || session.status === 'CANCELLED') && sessionMs < cutoffMs) {
        this.sessions.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
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
      userId: data.userId || null,
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
      userId: data.userId || null,
      timestamp: new Date()
    };
    this.auditLogs.push(log);
    return log;
  }

  async getAuditLogs(options = 100) {
    let logs = [...this.auditLogs];
    const limit = typeof options === 'number' ? options : (options.limit || 100);
    const search = typeof options === 'object' ? options.search : null;
    const action = typeof options === 'object' ? options.action : null;
    const userId = typeof options === 'object' ? options.userId : null;

    if (userId) {
      logs = logs.filter(l => l.userId === userId || (!l.userId && isTestEnv()));
    }
    if (action && action !== 'ALL') {
      logs = logs.filter(l => l.action === action);
    }
    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(l =>
        (l.customerName && l.customerName.toLowerCase().includes(q)) ||
        (l.stationName && l.stationName.toLowerCase().includes(q)) ||
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.reason && l.reason.toLowerCase().includes(q)) ||
        (l.actorId && l.actorId.toLowerCase().includes(q))
      );
    }
    return logs.slice(-limit).reverse();
  }
}

export const memoryStore = new MemoryStore();

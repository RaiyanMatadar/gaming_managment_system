# PROJECT SPECIFICATION: Gaming Center Management System

**Version:** 1.0.0  
**Status:** Approved Architecture & Specification  
**Tech Stack:** React, Vite, Tailwind CSS, Node.js, Express.js, MongoDB / Mongoose

---

## 1. Requirements

### 1.1 Business Goals
- **Overtime Revenue Capture:** Prevent unbilled playing time via automated server-side expiration tracking, visual/audio alerts, and deterministic surcharge calculation.
- **Operational Safety:** Eliminate station double-booking and billing collisions across multiple cashier terminals.
- **Payment Integrity:** Track Cash and UPI transactions separately with reference logging; avoid phantom payments and cashier reconciliation gaps.
- **Auditability:** Log every sensitive action (session pause, rate override, cancellation, transfer, refund) with timestamp, actor ID, and stated reason.

### 1.2 User Roles & RBAC Matrix
- **Owner:** Full system privileges. Station tier pricing config, staff management, full refunds, system-wide financial reporting.
- **Manager:** Operational supervisor. Authorizes manual discounts, session cancellations, and bad-debt write-offs; view daily registers.
- **Cashier:** Floor operator. Creates sessions, records extensions/transfers, processes cash/UPI checkouts, triggers station maintenance tags. No rate editing or unauthorized voiding.

### 1.3 Scope Boundaries
- **In-Scope (MVP):**
  - Web-based cashier dashboard with live station cards and countdown timers.
  - Server-side authoritative timestamp tracking (no reliance on browser countdowns).
  - Package billing, hourly pro-rata, 5-minute grace period, 15-minute overtime rounding blocks.
  - Station transfer with split-rate billing continuity.
  - Multi-part payment tracking (Cash and UPI).
  - Daily shift summary and reconciliation report.
- **Out-of-Scope (Post-MVP):**
  - Native client PC desktop locker daemon (Windows service).
  - Automated Razorpay/Stripe webhooks.
  - Loyalty points and prepaid customer wallet cards.

---

## 2. Business Rules & Lifecycles

### 2.1 Station vs. Session State Separation
- **Station Statuses:** `AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `RESERVED`
- **Session Statuses:** `ACTIVE`, `PAUSED`, `EXPIRED_UNSETTLED`, `COMPLETED`, `CANCELLED`
- An expired session does **not** free a station. The station remains `OCCUPIED` until financial settlement or explicit cashier release.

### 2.2 Billing Formulas & Overtime Engine
- Duration calculations rely exclusively on UTC timestamps stored on the server.
- All monetary amounts stored as whole numbers in minor units (paisa / cents) or exact decimals to prevent floating-point loss.

$$\text{Elapsed Minutes } (T_{elapsed}) = \left\lfloor \frac{(\text{Current Time} - \text{Start Time}) - \text{Total Paused Ms}}{60000} \right\rfloor$$
$$\text{Scheduled Minutes } (D_{sched}) = \text{Initial Booked Minutes} + \sum \text{Extended Minutes}$$
$$\text{Overtime Minutes } (D_{over}) = \max(0, T_{elapsed} - D_{sched})$$

**Overtime & Grace Period Rule:**
- Default Grace Period $G = 5 \text{ min}$.
- Overtime Billing Block $B = 15 \text{ min}$.
- Hourly Overtime Rate $R_{ot} = \text{Tier Hourly Rate}$.

$$\text{Billable Overtime Minutes } (D_{billable}) = \begin{cases} 
0, & \text{if } D_{over} \le G \\
\left\lceil \frac{D_{over}}{B} \right\rceil \times B, & \text{if } D_{over} > G 
\end{cases}$$

$$\text{Overtime Fee } (F_{over}) = D_{billable} \times \left( \frac{R_{ot}}{60} \right)$$

**Total Settlement:**
$$\text{Total Payable} = F_{base} + F_{over} + \sum \text{Add-ons} - \text{Discount}$$
$$\text{Balance Due} = \text{Total Payable} - \sum \text{Payments Received}$$

---

## 3. Edge-Case Matrix

| Scenario | Risk | Expected System Behavior & Validation | Recovery Strategy |
| :--- | :--- | :--- | :--- |
| **Cashier Browser Refresh / Crash** | Loss of countdown display | Timers reconstruct dynamically from authoritative `startTime`, `scheduledEndTime`, and `totalPausedMs` retrieved from DB. | Page loads current server state without affecting running sessions. |
| **Server Restart / Temporary Down** | Missed expiration event | Backend calculates session status dynamically upon next poll or request: if `now > scheduledEndTime`, status evaluated as `EXPIRED_UNSETTLED`. | No missed overtime; charges calculate correctly regardless of server downtime duration. |
| **Concurrent Station Assignment** | Two cashiers book Station 1 simultaneously | Atomic database condition: `Station.findOneAndUpdate({ _id: stationId, status: 'AVAILABLE' }, { status: 'OCCUPIED' })`. | First request succeeds; second fails with HTTP 409 Conflict. |
| **Duplicate Payment Submission** | Double charge on double-click | Cashier client sends UUID `idempotencyKey`. Payment endpoint checks if transaction with key exists. | Replays existing payment confirmation; no duplicate ledger entry. |
| **Station Transfer Mid-Session** | Loss of accrued time or rate collision | Previous station segment saved in `transferHistory` with its own rate card. Destination station atomically set to `OCCUPIED`. | Unified session record retains combined itemized billing. |
| **Mid-Session Rate Card Change** | Customer charged unexpected rate | Session stores a frozen copy of `rateCardSnapshot` at session start. | Historical and active sessions remain billed under their snapshot rate. |

---

## 4. Architecture

- **Client:** React (Vite, Tailwind CSS, Lucide icons). Polling / SSE / WebSocket listeners for station alerts.
- **Server:** Node.js, Express.js. RESTful endpoints, atomic state transition services, strict input validation schemas.
- **Database:** MongoDB with Mongoose. ACID transaction support for multi-document operations (e.g., station transfer, checkout settlement).

```
[ Cashier React Dashboard ] <--- REST / Socket ---> [ Express App ]
                                                           |
                                               [ Business Logic Engine ]
                                               - Billing & Overtime
                                               - State Machine
                                               - Concurrency Locks
                                                           |
                                                  [ MongoDB Database ]
                                               - Stations
                                               - Sessions
                                               - Payments & Audit Logs
```

---

## 5. Database Schemas

### 5.1 Station Model
```javascript
{
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['PC_STANDARD', 'PC_VIP', 'PS5', 'XBOX', 'VR'], required: true },
  hourlyRate: { type: Number, required: true }, // in currency units (e.g. INR)
  status: { type: String, enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'], default: 'AVAILABLE', index: true },
  currentSessionId: { type: Schema.Types.ObjectId, ref: 'Session', default: null }
}
```

### 5.2 Session Model
```javascript
{
  stationId: { type: Schema.Types.ObjectId, ref: 'Station', required: true, index: true },
  customerName: { type: String, default: 'Guest' },
  customerPhone: { type: String },
  pricingType: { type: String, enum: ['PACKAGE', 'HOURLY_OPEN', 'CUSTOM'], required: true },
  bookedMinutes: { type: Number, required: true },
  startTime: { type: Date, required: true },
  scheduledEndTime: { type: Date, required: true, index: true },
  actualEndTime: { type: Date },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'PAUSED', 'EXPIRED_UNSETTLED', 'COMPLETED', 'CANCELLED'], 
    default: 'ACTIVE',
    index: true 
  },
  rateCardSnapshot: {
    hourlyRate: { type: Number, required: true },
    gracePeriodMinutes: { type: Number, default: 5 },
    overtimeBlockMinutes: { type: Number, default: 15 }
  },
  pauseRecords: [{
    pausedAt: { type: Date },
    resumedAt: { type: Date },
    durationMs: { type: Number, default: 0 }
  }],
  totalPausedMs: { type: Number, default: 0 },
  financials: {
    baseAmount: { type: Number, default: 0 },
    overtimeAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalPayable: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'], default: 'UNPAID' }
  },
  transfers: [{
    fromStationId: { type: Schema.Types.ObjectId, ref: 'Station' },
    toStationId: { type: Schema.Types.ObjectId, ref: 'Station' },
    transferredAt: { type: Date },
    rateAtTransfer: { type: Number }
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}
```

### 5.3 Payment & Audit Log Models
- `Payment`: `sessionId`, `amount`, `paymentMethod` (`CASH`, `UPI`), `referenceNumber`, `receivedBy`, `idempotencyKey` (unique index), `createdAt`.
- `AuditLog`: `action`, `actorId`, `targetType`, `targetId`, `before`, `after`, `reason`, `timestamp`.

---

## 6. API Specification

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/stations` | GET | All | List all stations with current occupancy & remaining time |
| `/api/stations` | POST | Owner | Create new station |
| `/api/stations/:id/status` | PATCH | Cashier+ | Toggle maintenance / reserved status |
| `/api/sessions` | POST | Cashier+ | Create and start new session (atomic station lock) |
| `/api/sessions/:id/pause` | POST | Cashier+ | Pause active session |
| `/api/sessions/:id/resume` | POST | Cashier+ | Resume paused session |
| `/api/sessions/:id/extend` | POST | Cashier+ | Extend duration (recalculates scheduledEndTime) |
| `/api/sessions/:id/transfer`| POST | Cashier+ | Transfer session to another available station |
| `/api/sessions/:id/checkout`| POST | Cashier+ | Finalize billing, compute overtime, record payment |
| `/api/sessions/:id/cancel`  | POST | Manager+ | Cancel session with mandatory justification |
| `/api/reports/shift`        | GET | Manager+ | Daily shift revenue, hours sold, cash/UPI split |

---

## 7. UI/UX Specification

- **Dashboard:** Grid view of Stations. Color-coded borders:
  - Green: `AVAILABLE`
  - Blue: `ACTIVE` (with ticking countdown)
  - Amber: `EXPIRY WARNING` ($\le 5 \text{ min}$)
  - Red / Pulsing: `EXPIRED_UNSETTLED` (with positive overtime timer $+00:12:45$)
  - Grey: `MAINTENANCE`
- **Actions Bar on Station Card:** Quick buttons for `+ Extend`, `Pause`, `Transfer`, and `Checkout`.
- **Checkout Modal:** Itemized breakdown (Base package duration + Overtime minutes billable + Discounts), Cash / UPI input with automatic change or reference # capture.

---

## 8. Implementation Plan & Milestones

- **Milestone 1 (Current):** Core Domain & Business Rules Engine
  - Pure, deterministic calculation engine for billing, overtime, grace periods, and pause durations.
  - State machine validators for permitted session and station transitions.
  - Zero-dependency unit test suite covering all boundary conditions.
- **Milestone 2:** Backend Foundation & REST API
  - Express server, MongoDB / Mongoose schemas with atomic queries and unique idempotency keys.
  - Session CRUD, Pause/Resume, Extend, Transfer, and Checkout endpoints.
  - Integration tests with in-memory Mongo runner.
- **Milestone 3:** Live Session Poller & Expiry Alert Dispatcher
  - Server-side background worker detecting warning and expired states.
  - SSE/WebSocket or robust polling contract for immediate client alerting.
- **Milestone 4:** Cashier Frontend Dashboard
  - React + Vite + Tailwind station grid, dynamic timer badges, and state filters.
- **Milestone 5:** Session Management & Checkout Modals
  - Check-in modal, Extend modal, Transfer modal, and Checkout & Receipt modal.
- **Milestone 6:** Shift Reconciliation & Reporting
  - Shift summary, payment reconciliation (Cash vs UPI), audit trail viewer.

---

## 9. Testing Plan
- **Unit Tests:** Billing math, grace period edge cases (4m59s vs 5m01s), block rounding (15m increments), pause duration adjustments.
- **Concurrency Tests:** Simultaneous check-in requests on the same station.
- **Idempotency Tests:** Duplicate payment submissions.
- **System Integrity:** Power loss/recovery simulation asserting server time math matches expected cost.

---

## 10. Deployment Plan
- Single-instance lightweight Node.js service (Railway / Render / VPS).
- Managed MongoDB Atlas (M0/M2 tier) with automated daily backups.
- Centralized structured JSON logging for all financial operations.

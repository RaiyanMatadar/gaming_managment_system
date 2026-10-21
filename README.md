# Gaming Center Management System (CyberArena POS)

A production-grade, reliable Gaming Center Management System built with the MERN stack (React, Vite, Tailwind CSS, Node.js, Express, MongoDB / Mongoose).

Designed specifically for physical gaming cafes to eliminate unbilled overtime, prevent station double-booking, reconcile Cash & UPI payments, and maintain complete audit compliance.

---

## Key Features

1. **Authoritative Server-Side Time Tracking:**
   - Eliminates client clock manipulation or drift.
   - Preserves state across browser refreshes, network drops, and server restarts.
2. **Deterministic Overtime & Billing Engine:**
   - 5-minute grace period before overtime charges kick in.
   - 15-minute block rounding for billable overtime beyond grace period.
   - Automatic deduction of accumulated and active pause periods.
3. **Hardware & Concurrency Protection:**
   - Strict decoupling of Station status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `RESERVED`) from Session status (`ACTIVE`, `PAUSED`, `EXPIRED_UNSETTLED`, `COMPLETED`, `CANCELLED`).
   - Atomic conditional reservation prevents concurrent collisions when two cashiers assign the same station.
4. **Real-time Live Sync (SSE):**
   - Server-Sent Events push instant visual and audio alerts for 5-minute warnings and immediate session expiration.
5. **Payment Reconciliation & Idempotency:**
   - Separate tracking for Cash in drawer and UPI transaction reference numbers.
   - Idempotency key protection prevents double-charging on network retries or double-clicks.
6. **Shift Reports & Audit Trail:**
   - Shift reconciliation with Cash vs UPI splits, gaming hours sold vs played, and station utilization table.
   - Chronological audit logs recording every cashier action with actor ID and reason.

---

## Quick Start & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
Executes all 41 unit, integration, concurrency, state machine, and billing tests:
```bash
npm test
```

### 3. Build Production Bundle
Compiles the React frontend with Vite & Tailwind CSS:
```bash
npm run build
```

### 4. Start the Application
Starts the Express API and serves the production frontend at `http://localhost:4000`:
```bash
npm start
```

### 5. Development Mode (Frontend Hot-Reload)
In one terminal start backend:
```bash
node src/server.js
```
In a second terminal start Vite dev server:
```bash
npm run dev
```
Open `http://localhost:3000`.

---

## Configuration (`.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | Port for the backend API and static frontend |
| `MONGO_URI` | `undefined` | MongoDB connection string (e.g. `mongodb+srv://...`). When omitted, operates in high-performance in-memory mode for offline dev and testing |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |

---

## Architecture & Project Structure

```
├── PROJECT_SPEC.md              # Complete 10-section system specification
├── dist/                        # Production-compiled frontend build
├── src/
│   ├── app.js                   # Express application setup & middleware
│   ├── server.js                # Server entrypoint with DB connection
│   ├── domain/                  # Pure deterministic business logic
│   │   ├── billingCalculator.js # Time math, grace period, overtime fees
│   │   ├── sessionStateMachine.js
│   │   └── stationStateMachine.js
│   ├── models/                  # Mongoose data schemas
│   │   ├── Station.js
│   │   ├── Session.js
│   │   ├── Payment.js
│   │   └── AuditLog.js
│   ├── storage/                 # Data layer (MongoDB + Memory store)
│   ├── services/
│   │   ├── sessionService.js    # Session lifecycle & atomic locking
│   │   ├── eventBroadcaster.js  # Server-Sent Events (SSE) push engine
│   │   ├── expiryPoller.js      # Background scanning worker
│   │   └── reportService.js     # Shift reconciliation & ledger analytics
│   ├── controllers/             # REST route handlers
│   ├── routes/                  # Express API routers
│   ├── frontend/                # React + Tailwind CSS client
│   │   ├── App.jsx              # Main dashboard
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header & live status indicator
│   │   │   ├── StatsBar.jsx     # Operational KPI cards
│   │   │   ├── FilterTabs.jsx   # Quick station filters
│   │   │   ├── StationCard.jsx  # Station card with live countdown/overtime
│   │   │   ├── Modals.jsx       # Session start, extend, transfer, checkout
│   │   │   └── ShiftReportModal.jsx # Shift summary & audit trail drawer
│   └── tests/                   # Automated test suites
│       ├── billingCalculator.test.js
│       ├── stateMachine.test.js
│       ├── sessionApi.test.js
│       ├── expiryPoller.test.js
│       └── report.test.js
```

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
4. **5-Minute Warning Popup & Automated Owner Email:**
   - Real-time overlay popup modal displaying: **"Only 5 minutes left for [Customer Name] on PC [PC Number]."**
   - Dispatches automated email notification to the gaming center owner's inbox with session details.
   - Deduplicated across server restarts and multiple concurrent players.
5. **Customer History & Player Ledger:**
   - Real-time search and filter by customer name, phone number, and session status.
   - Displays booked vs actual playing duration, amounts charged, overtime surcharges, and payment statuses.
6. **Redesigned Operational Audit Trail:**
   - Clean, high-contrast visual timeline of all staff actions (`Session Started`, `Extended`, `Paid`, `Transferred`, `Cancelled`).
   - Clearly highlights Customer Name, PC Number, exact timestamp, cashier actor, and justification notes.
7. **Payment Reconciliation & Idempotency:**
   - Separate tracking for Cash in drawer and UPI transaction reference numbers.
   - Idempotency key protection prevents double-charging on network retries or double-clicks.
8. **Shift Reports & Daily Register Closing:**
   - Shift reconciliation with Cash vs UPI splits, gaming hours sold vs played, and station utilization table.

---

## Quick Start & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
Executes all 43 unit, integration, concurrency, state machine, warning, and billing tests:
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
| `MONGO_URI` | `undefined` | MongoDB connection string. When omitted, operates in high-performance in-memory mode for offline dev and testing |
| `OWNER_EMAIL` | `owner@gamingcenter.com` | Email address of the gaming center owner receiving 5-minute warning alerts |
| `SMTP_HOST` | `undefined` | SMTP server host (e.g. `smtp.gmail.com`) for sending owner alerts |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | `undefined` | SMTP account username / email |
| `SMTP_PASS` | `undefined` | SMTP account password / app password |
| `EMAIL_FROM` | `"CyberArena" <notifications@gamingcenter.com>` | Sender email header |

---

## Architecture & Project Structure

```
├── PROJECT_SPEC.md              # Complete 10-section system specification
├── USER_GUIDE.md                # Full user manual and operating guide
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
│   │   ├── Session.js           # Includes persistent warning sent flags
│   │   ├── Payment.js
│   │   └── AuditLog.js          # Includes customerName & stationName
│   ├── storage/                 # Data layer (MongoDB + Memory store)
│   ├── services/
│   │   ├── sessionService.js    # Session lifecycle & atomic locking
│   │   ├── eventBroadcaster.js  # Server-Sent Events (SSE) push engine
│   │   ├── expiryPoller.js      # Background scanning worker & 5-min warning dispatcher
│   │   ├── emailService.js      # Owner email notification service
│   │   └── reportService.js     # Shift reconciliation & ledger analytics
│   ├── controllers/             # REST route handlers
│   ├── routes/                  # Express API routers
│   ├── frontend/                # React + Tailwind CSS client
│   │   ├── App.jsx              # Main dashboard with warning queue
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header & navigation links
│   │   │   ├── StatsBar.jsx     # Operational KPI cards
│   │   │   ├── FilterTabs.jsx   # Quick station filters
│   │   │   ├── StationCard.jsx  # Station card with live countdown/overtime
│   │   │   ├── Modals.jsx       # Session start, extend, transfer, checkout
│   │   │   ├── FiveMinuteWarningModal.jsx # 5-min warning popup modal
│   │   │   ├── CustomerHistoryModal.jsx   # Customer history & player ledger
│   │   │   ├── AuditTrailModal.jsx        # Redesigned audit trail & activity log
│   │   │   └── ShiftReportModal.jsx       # Shift summary & register closing
│   └── tests/                   # Automated test suites (43 tests passing)
```

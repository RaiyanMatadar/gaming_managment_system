# GameDash — Gaming Center Management System

A production-grade, reliable Gaming Center Management System built with React 19, Tailwind CSS (Material Design 3 semantic design system), Express, Node.js, and MongoDB / In-Memory Store.

Designed specifically for physical gaming cafes to eliminate unbilled overtime, prevent station double-booking, reconcile Cash & UPI payments, provide intuitive station controls, and maintain complete audit compliance.

---

## Key Features

1. **Brand New GameDash UI (Material Design 3):**
   - High-contrast, sleek dark-mode interface built on Material Design 3 design tokens.
   - Refined visual hierarchy, smooth state transitions, and accessible contrast with zero harsh borders.
2. **Polished Start Session Workflow:**
   - Dedicated hardware indicator badge and customer details form.
   - 1-click quick-duration selection pills (30m, 1h, 2h, 3h) and customizable steppers (+/- 15m increments).
   - Real-time billing and scheduled checkout time preview before confirming.
3. **Ergonomic Active Session Controls:**
   - Balanced 2x2 grid for non-destructive actions (Pause/Resume, Add Time, Move Station, Cancel Session).
   - Dedicated prominent bottom row action for Checkout & Settle with invoice totals.
   - Modern confirmation dialogs with clear consequences replacing browser `confirm()` popups.
4. **Station Management & Safe PC Deletion:**
   - Add new PC stations with custom specifications and hourly rates.
   - Safe station deletion endpoint (`DELETE /api/stations/:id`) with strict guardrails preventing deletion of stations in `OCCUPIED` state or with active/paused/unsettled sessions.
   - Permanent deletion audit logging with actor attribution.
5. **Authoritative Server-Side Time Tracking:**
   - Eliminates client clock manipulation or drift.
   - Preserves state across browser refreshes, network drops, and server restarts.
6. **Deterministic Overtime & Billing Engine:**
   - 5-minute grace period before overtime charges kick in.
   - 15-minute block rounding for billable overtime beyond grace period.
   - Automatic deduction of accumulated and active pause periods.
7. **5-Minute Warning Popup & Automated Owner Alert:**
   - Real-time overlay popup modal: **"Only 5 minutes left for [Customer Name] on PC [PC Number]."**
   - Dispatches automated email notification to the gaming center owner's inbox.
   - Deduplicated across server restarts and multiple concurrent players.
8. **Customer History, Player Ledger & Operational Audit Trail:**
   - Real-time search and filter by customer name, phone number, and session status.
   - Clean visual timeline of all staff actions (`Session Started`, `Extended`, `Paid`, `Transferred`, `Cancelled`, `PC Deleted`).

---

## Project Structure

The project is cleanly divided into independent `client/` and `server/` packages, with root workspace scripts for developer convenience:

```
├── client/                     # Frontend Application (React 19, Vite, Tailwind CSS)
│   ├── src/
│   │   ├── components/         # M3 Primitives & Views (Modals, StationCard, etc.)
│   │   ├── styles/             # tokens.css, material.json, global styles
│   │   ├── App.jsx             # Main interactive dashboard
│   │   ├── index.css           # Tailwind & font imports
│   │   └── main.jsx            # React root mount
│   ├── index.html              # HTML entrypoint
│   ├── package.json            # Client-specific scripts & dependencies
│   ├── tailwind.config.js      # Semantic theme mappings
│   ├── vite.config.js          # Vite config & API reverse proxy (:3000 -> :4000)
│   └── .env.example            # Client environment variables
│
├── server/                     # Backend API & Business Logic (Node.js, Express)
│   ├── src/
│   │   ├── controllers/        # REST route handlers (station, session, report)
│   │   ├── domain/             # Pure deterministic billing math & state machines
│   │   ├── models/             # Data models (Station, Session, Payment, AuditLog)
│   │   ├── routes/             # Express route declarations
│   │   ├── services/           # Expiry worker, emailer, broadcaster, session rules
│   │   ├── storage/            # Dual-engine persistence (MongoDB & In-Memory Store)
│   │   ├── tests/              # 47 automated test suites (unit, concurrency, API)
│   │   ├── app.js              # Express app factory with multi-path static serving
│   │   └── server.js           # Server bootstrap & DB connection
│   ├── package.json            # Server-specific scripts & dependencies
│   └── .env.example            # Server environment variables
│
├── .env                        # Root environment variables
└── package.json                # Root orchestration & workspace scripts
```

---

## Quick Start & Commands

### 1. Install All Dependencies
Install dependencies across root, client, and server in one command:
```bash
npm install
```

### 2. Root Convenience Commands
| Command | Action |
| :--- | :--- |
| `npm run dev` | Boots BOTH backend API (:4000) and Vite frontend dev server (:3000) concurrently |
| `npm run dev:client` | Start frontend client dev server (`client/`) |
| `npm run dev:server` | Start backend server with file auto-reloading (`server/`) |
| `npm run client` | Launch frontend client dev server only (:3000) |
| `npm run server` | Start the backend API only (:4000) |
| `npm run build` | Compile production bundles for client (`client/dist`) |
| `npm start` | Run backend server and serve production frontend on `http://localhost:4000` |
| `npm test` | Execute the full 47 automated test suite |

---

## Running Client & Server Independently

### Running Server Independently
```bash
cd server
npm start          # Runs server on port 4000
# or
npm run dev        # Runs with --watch
# or
npm test           # Executes backend tests
```

### Running Client Independently
```bash
cd client
npm run dev        # Runs Vite dev server at http://localhost:3000 (proxies /api to :4000)
npm run build      # Builds production assets to client/dist
```

---

## Configuration

### Server (`server/.env` or root `.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | Backend API port |
| `MONGO_URI` | `undefined` | MongoDB connection string. When omitted, operates in zero-dependency in-memory mode |
| `OWNER_EMAIL` | `owner@gamingcenter.com` | Email address receiving 5-minute warning notifications |
| `SMTP_HOST` | `undefined` | SMTP server host for real emails (mock console logs if omitted) |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | `undefined` | SMTP username |
| `SMTP_PASS` | `undefined` | SMTP password / app key |

### Client (`client/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:4000` | Backend API URL (optional in dev due to Vite proxy) |

---

## Verification & Automated Tests
GameDash includes 47 automated unit, integration, concurrency, state machine, and API tests running via the native Node.js test runner:

```bash
npm test
```
All 47 tests verify:
- Accurate billing, overtime block calculation, and 5-minute grace period enforcement.
- Hardware concurrency locks preventing duplicate session creation.
- Pause/resume scheduled end time recalculation.
- Station transfer and atomic lock reassignment.
- Safe station deletion preventing removal of active or occupied PCs.
- Dynamic 5-minute remaining warnings and automated owner email notifications.
- Shift reconciliation and daily register closing reports.

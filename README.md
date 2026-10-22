# GameDash — Gaming Center Management System

A production-grade, highly reliable Gaming Center Management System built with a modular full-stack architecture: **React 19** (Material Design 3 tokens & Tailwind CSS), **Node.js / Express** REST API, **JWT Multi-User Authentication**, and dual persistence engines (**MongoDB** / High-Performance In-Memory Store).

Designed specifically for physical gaming cafes, LAN arenas, and esports centers to eliminate unbilled overtime, prevent station double-booking, reconcile Cash & UPI collections, provide rapid PC management, enforce tenant data isolation, and maintain complete audit compliance.

---

## Architecture Overview

GameDash is organized into two completely self-contained packages (`client/` and `server/`), each with its own dependencies and configuration, orchestrated by root convenience commands:

```text
GameDash/
├── client/                     # Frontend Application (React 19, Vite 6, Tailwind CSS)
│   ├── node_modules/           # Client-only dependencies (React, Lucide, Tailwind, Vite)
│   ├── src/
│   │   ├── components/         # M3 UI Primitives & Views
│   │   │   ├── ui/             # Reusable primitives (Button, Card, Input, Modal, etc.)
│   │   │   ├── ActiveSessionsView.jsx # Live active players table
│   │   │   ├── AppHeader.jsx   # Top header with clock, SSE status, quick start, user menu
│   │   │   ├── AuditTrailModal.jsx    # Chronological admin activity logs
│   │   │   ├── CustomerHistoryModal.jsx # 30-day customer ledger & analytics
│   │   │   ├── FilterTabs.jsx  # Station category filter pills
│   │   │   ├── FiveMinuteWarningModal.jsx # Real-time 5-minute expiry alert modal
│   │   │   ├── LoginView.jsx   # Material Design 3 dark login screen
│   │   │   ├── Modals.jsx      # Session management workflow dialogs
│   │   │   ├── ShiftReportModal.jsx   # Daily shift reconciliation & payment breakdown
│   │   │   ├── Sidebar.jsx     # Navigation drawer, rail, and mobile bottom bar
│   │   │   ├── StationCard.jsx # Live PC hardware grid card with timer progress
│   │   │   ├── StationInventoryView.jsx # PC fleet hardware & hourly rate config
│   │   │   └── StatsBar.jsx    # Quick metrics strip
│   │   ├── styles/             # tokens.css, material.json, global styles
│   │   ├── utils/
│   │   │   └── api.js          # Global fetch auth interceptor & token storage
│   │   ├── App.jsx             # Main interactive dashboard coordinator
│   │   ├── index.css           # Tailwind directives & typography scale
│   │   └── main.jsx            # React root mount
│   ├── index.html              # Frontend HTML entrypoint
│   ├── package.json            # Client scripts & dependencies
│   ├── tailwind.config.js      # Semantic M3 theme tokens (border-radius, colors)
│   ├── vite.config.js          # Vite config & API reverse proxy (:3000 -> :4000)
│   ├── dist/                   # Compiled production frontend build
│   └── .env.example            # Client environment variables
│
├── server/                     # Backend API & Domain Services (Node.js, Express)
│   ├── node_modules/           # Server-only dependencies (Express, Mongoose, JWT, bcryptjs)
│   ├── src/
│   │   ├── controllers/        # REST route handlers (auth, station, session, report)
│   │   ├── domain/             # Pure deterministic billing math & state machines
│   │   │   ├── billingCalculator.js # Time math, grace period, overtime fee formulas
│   │   │   ├── sessionStateMachine.js
│   │   │   └── stationStateMachine.js
│   │   ├── middleware/         # Auth verification & role guard middleware
│   │   │   └── authMiddleware.js
│   │   ├── models/             # Mongoose data schemas (User, Station, Session, Payment, AuditLog)
│   │   ├── routes/             # Express route definitions (auth, station, session, report)
│   │   ├── services/           # Expiry poller, email alerts, SSE broadcaster, reports
│   │   ├── storage/            # Dual-engine persistence (MongoDB & In-Memory Store)
│   │   ├── tests/              # 59 automated test suites (auth, billing, API, concurrency)
│   │   ├── app.js              # Express app factory with multi-path static serving
│   │   └── server.js           # Server bootstrap & DB connection
│   ├── package.json            # Server scripts & dependencies
│   └── .env.example            # Server environment variables
│
├── .env                        # Local root environment variables
├── .gitignore                  # Git ignore rules
├── AGENTS.md                   # AI Agent engineering conventions & constraints
├── ARCHITECTURE.md             # Comprehensive architectural blueprint & data flow
├── DESIGN_SYSTEM.md            # Material Design 3 system specifications
├── package.json                # Root convenience scripts
├── package-lock.json
├── PROJECT_SPEC.md             # System engineering specification
├── README.md                   # Project overview & running instructions
├── skills.md                   # Design skills reference
└── USER_GUIDE.md               # Cashier & manager operational manual
```

---

## Key Features

1. **Material Design 3 Rounded Interface:**
   - Soft, modern surfaces using Material Design 3 rounded tokens (`rounded-[20px]` cards, `rounded-[28px]` dialogs, `rounded-full` action pills).
   - Dynamic dark theme with accessible contrast, tonal elevation, and zero harsh white borders.
2. **Secure Multi-User Authentication & Data Isolation:**
   - JWT-based authentication with bcrypt-hashed passwords.
   - Public self-registration is disabled. Manager/Cashier accounts are provisioned via Postman using an admin key.
   - Complete multi-tenant data isolation: Each gaming center account accesses and manages only its own stations, active sessions, payments, customer ledger, and shift reports.
3. **Polished Start Session Workflow:**
   - Dedicated hardware indicator badge and customer details form.
   - 1-click quick-duration selection pills (30m, 1h, 2h, 3h) and customizable steppers (+/- 15m increments).
   - Real-time billing and scheduled checkout time preview before confirming.
4. **Ergonomic Active Session Controls:**
   - Balanced 2×2 grid for active controls (Pause/Resume, Add Time, Move Station, Cancel Session).
   - Dedicated prominent bottom row action for Checkout & Settle with invoice totals.
   - M3 confirmation dialogs with clear consequences replacing browser `confirm()` popups.
5. **Station Management & Safe PC Deletion:**
   - Add new PC stations with custom specifications and hourly rates.
   - Safe station deletion endpoint (`DELETE /api/stations/:id`) with strict guardrails preventing deletion of stations in `OCCUPIED` state or with active/paused/unsettled sessions.
   - Permanent deletion audit logging with actor attribution.
6. **Authoritative Server-Side Time Tracking:**
   - Eliminates client clock manipulation or drift.
   - Preserves state across browser refreshes, network drops, and server restarts.
7. **Deterministic Overtime & Billing Engine:**
   - 5-minute grace period before overtime charges kick in.
   - 15-minute block rounding for billable overtime beyond grace period.
   - Automatic deduction of accumulated and active pause periods.
8. **5-Minute Warning Popup & Automated Owner Alert:**
   - Real-time overlay popup modal: **"Only 5 minutes left for [Customer Name] on PC [PC Number]."**
   - Dispatches automated email notification to the gaming center owner's inbox.
   - Deduplicated across server restarts and multiple concurrent players.
9. **Customer History, Player Ledger & Operational Audit Trail:**
   - Real-time search and filter by customer name, phone number, and session status.
   - 30-day automatic retention policy for completed/cancelled sessions.
   - Clean visual timeline of all staff actions (`Session Started`, `Extended`, `Paid`, `Transferred`, `Cancelled`, `PC Deleted`).

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite 6, Tailwind CSS |
| **Design Language** | Google Material Design 3 (M3 Tokens, Roboto, Material Symbols) |
| **Icons** | Lucide React |
| **Backend Runtime** | Node.js (ES Modules), Express.js 4 |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`) |
| **Persistence Engine** | Dual-Engine: MongoDB with Mongoose 8 + Map-based atomic in-memory store |
| **Real-time Streaming** | Server-Sent Events (SSE) via `/api/events` |
| **Notifications** | Nodemailer (SMTP with mock fallback) |
| **Automated Testing** | Node.js native test runner (`node --test`), Supertest |

---

## How to Run

### 1. Unified Production Server (Single Command)
Compiles frontend assets and serves both the API and the SPA from port `4000`:
```bash
npm run build
npm start
```
Open **`http://localhost:4000`** in your browser.

### 2. Development Mode (Two Terminals)
For hot-reloading frontend development with live proxying to backend:

**Terminal 1 — Start Backend Server (with auto-reload watcher):**
```bash
npm run server:dev
# or: npm run server (without watcher)
```
*Backend runs on `http://localhost:4000` (In-Memory or MongoDB mode).*

**Terminal 2 — Start Frontend Dev Server:**
```bash
npm run dev
# or: npm run client
```
*Vite launches on `http://localhost:3000` and automatically proxies all `/api` requests to `:4000`.*

---

## Root Convenience Commands

| Command | Action | Execution Details |
| :--- | :--- | :--- |
| `npm start` | Start Unified Production App | Runs `server/src/server.js`, serving API & built client on `:4000` |
| `npm run server` | Start Backend API | Starts Express server on port `4000` |
| `npm run server:dev` | Start Backend API with Watcher | Starts Express with `node --watch` for hot-reloading on changes |
| `npm run dev` | Launch Frontend Dev Server | Runs Vite on `http://localhost:3000` |
| `npm run client` | Launch Frontend Dev Server | Alias for client development on `:3000` |
| `npm run build` | Build Production Assets | Compiles React + Tailwind assets to `client/dist` |
| `npm test` | Run Test Suite | Executes all 59 tests using native Node.js test runner |

---

## Running Directly Inside Subfolders

If you prefer working directly inside a package folder:

### Backend Only (`server/`)
```bash
cd server
npm start          # Run server on port 4000
npm run dev        # Run server with --watch
npm test           # Run 59 unit, integration, and auth tests
```

### Frontend Only (`client/`)
```bash
cd client
npm run dev        # Run Vite dev server at http://localhost:3000
npm run build      # Build production bundle to client/dist
```

---

## Configuration & Environment Variables

### Server (`server/.env` or root `.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | Port for the backend API and static SPA |
| `MONGO_URI` | `undefined` | MongoDB connection string. When omitted, operates in zero-dependency in-memory mode |
| `JWT_SECRET` | `gamedash-ultra-secure-jwt-secret-key-2026` | Secret key used to sign and verify user authentication tokens |
| `ADMIN_REGISTRATION_SECRET` | `GameDashAdminSecret2026` | Secret admin key required to manually provision new accounts via Postman |
| `OWNER_EMAIL` | `owner@gamingcenter.com` | Email address receiving 5-minute remaining warning alerts |
| `SMTP_HOST` | `undefined` | SMTP server host for sending email alerts (mock logs if omitted) |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | `undefined` | SMTP username |
| `SMTP_PASS` | `undefined` | SMTP password / app password |

### Client (`client/.env`)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:4000` | Backend API URL (leave empty in development to use Vite proxy) |

---

## Multi-User Authentication & Manual Postman Registration Guide

GameDash features an enterprise-grade multi-tenant architecture with strict data isolation. Each authenticated user manages only their own stations, active sessions, financial totals, customer history, and audit records.

### 1. Manual Account Registration via Postman (Admin Only)
To prevent unauthorized public self-registration, public signups are disabled. Only the system administrator can register center managers or cashiers using Postman or cURL with the **Admin Registration Secret**.

- **URL:** `POST http://localhost:4000/api/auth/register`
- **Headers:**
  - `Content-Type: application/json`
  - `x-admin-key: GameDashAdminSecret2026` *(or your custom `ADMIN_REGISTRATION_SECRET` from `.env`)*
- **Body (raw JSON):**
  ```json
  {
    "username": "center_alpha",
    "password": "SecurePassword123!",
    "name": "Alex Manager",
    "centerName": "Alpha Arena Downtown",
    "role": "manager"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "user": {
      "id": "6ada2eddb7e108d7a56ff5b6",
      "username": "center_alpha",
      "name": "Alex Manager",
      "centerName": "Alpha Arena Downtown",
      "role": "manager"
    }
  }
  ```

> [!NOTE]
> Any registration attempt without `x-admin-key` or with an invalid key will be rejected immediately with `403 Forbidden` (`Public registration is disabled. A valid admin registration key (x-admin-key) is required.`).

### 2. User Sign In (Web Interface)
Once an account is registered via Postman:
1. Open the GameDash UI in your browser (`http://localhost:4000` or `http://localhost:3000`).
2. Enter the provisioned `username` and `password`.
3. Click **Sign In**.
4. The user is logged in with a secure JWT token, and their center dashboard opens displaying only their data.

### 3. Multi-Tenant Data Isolation Guarantees
- **Station Fleet:** A manager only sees and manages their own gaming PCs. Stations created by other centers are completely invisible.
- **Active Sessions & Timers:** Live floor countdowns, paused states, and overtime tracking are strictly scoped to the authenticated center.
- **Customer History & Shift Reports:** Revenue reconciliation (Cash vs UPI), receipts, and player ledgers only aggregate data generated by that specific account.
- **Audit Trail:** Staff activity and lifecycle events are isolated per tenant.
- **Session Expiry & Sign Out:** Clicking the Logout button in the header or sidebar securely destroys local tokens and returns to the sign-in screen.

---

## Verification & Automated Tests

GameDash includes **59 automated tests** run with the native Node.js test runner:

```bash
npm test
```

### Test Coverage Highlights:
- **Multi-User Authentication & Data Isolation (12 Tests):** Public self-registration rejection (403), admin key verification, duplicate account conflict rejection (409), password bcrypt validation, JWT generation and verification, token rejection, and strict data isolation across User A and User B.
- **Billing Calculator & Time Rules Engine (14 Tests):** Floating-point monetary rounding, pause deduction, initial and extended scheduled end time, grace periods ($\le 5 \text{ min} = 0$ overtime charge), and 15-minute block rounding beyond grace.
- **Expiry Poller & Broadcaster (3 Tests):** Automatic transition to `EXPIRED_UNSETTLED`, 5-minute warning notification emission, and SSE broadcast dispatch.
- **Reporting & Reconciliation (3 Tests):** Cash vs UPI breakdown, shift reconciliation, chronological audit logs, and 30-day session pruning.
- **REST API & Concurrency (15 Tests):** Concurrency collision prevention, station lock/release, pause/resume, station transfers, safe station deletion (preventing deletion of active PCs), and live customer history search.
- **State Machines (12 Tests):** Valid transition enforcement for Station and Session states.

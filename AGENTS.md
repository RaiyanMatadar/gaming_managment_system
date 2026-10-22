# AI Agent Guidelines & Engineering Conventions for GameDash

This document defines the strict engineering guidelines, conventions, constraints, and architecture map that any AI coding agent must follow when working on the **GameDash** (formerly CyberArena) codebase.

---

## 1. Zero Custom / Hardcoded Colors
- **DO NOT** use arbitrary hex, rgb, or hsl values (e.g., `bg-[#...]`, `text-[#...]`, `border-[#...]`).
- **DO NOT** use default Tailwind color palette utilities (e.g., `bg-blue-600`, `text-slate-400`, `bg-cyan-500`, `text-amber-300`).
- **ALWAYS** use the semantic Material Design 3 design tokens defined in `client/src/styles/tokens.css` and `client/tailwind.config.js`.

### Token Quick Reference
- **Backdrops & Surfaces:** `bg-background`, `bg-surface`, `bg-surface-container`, `bg-surface-container-low`, `bg-surface-container-high`, `bg-surface-container-lowest`
- **Typography & Text Roles:** `text-on-surface`, `text-on-surface-variant`, `text-primary`, `text-on-primary`, `text-outline`
- **Brand & Primary Actions:** `bg-primary`, `text-on-primary`, `bg-primary-container`, `text-on-primary-container`
- **Secondary & Accent:** `bg-secondary`, `text-on-secondary`, `bg-secondary-container`, `text-on-secondary-container`
- **Status Roles:** `bg-success`, `text-success`, `bg-success-container`, `text-on-success-container`, `bg-warning`, `text-warning`, `bg-warning-container`, `text-on-warning-container`
- **Alerts & Destructive:** `bg-error`, `text-error`, `bg-error-container`, `text-on-error-container`
- **Borders & Dividers:** `border-outline`, `border-outline-variant`, `border-outline-variant/30`, `border-outline-variant/40`, `border-outline-variant/60`

---

## 2. Mandatory Use of UI Primitives
Always import and use the established primitives located in `client/src/components/ui`:
- **Buttons & FABs:** `<Button variant="filled | tonal | outlined | text | error | success" size="sm | md | lg">`, `<FAB icon={...} label={...} />`
- **Containers & Cards:** `<Card variant="container | low | lowest | high | outlined" rounded="rounded-[16px] | rounded-[20px] | rounded-[28px]">`
- **Inputs & Form Controls:** `<Input />`, `<Select />`, `<TextField variant="outlined | filled" label="..." />`
- **Chips & Filter Pills:** `<Chip label="..." count={...} selected={...} onClick={...} avatar={...} />`
- **Badges & Status Tags:** `<Badge variant="primary | secondary | tertiary | success | warning | error | neutral">`
- **Modals & Overlays:** `<Modal isOpen onClose title icon subtitle footer>` (modal dialogs use `rounded-[28px]`)
- **Feedback & Toast Notifications:** `<Snackbar message="..." type="..." onClose={...} />`
- **Toggles & Selectors:** `<Switch checked={...} onChange={...} />`, `<Checkbox checked={...} onChange={...} />`, `<Tabs />`

---

## 3. Package Structure & Dependency Hygiene
GameDash is structured into two completely independent packages:

```text
GameDash/
├── client/                     # Frontend package (React 19, Vite, Tailwind CSS)
│   ├── package.json            # Client-only dependencies
│   └── src/
├── server/                     # Backend package (Node.js Express, MongoDB / In-Memory)
│   ├── package.json            # Server-only dependencies
│   └── src/
└── package.json                # Root convenience scripts ONLY
```

- **NO dependencies in root `package.json`:** The root `package.json` is strictly an orchestration file for convenience npm scripts (`npm run dev`, `npm start`, `npm test`, `npm run build`). Do not install packages in the root directory.
- **Frontend dependencies** belong in `client/package.json` (e.g., Lucide, Tailwind, React).
- **Backend dependencies** belong in `server/package.json` (e.g., Express, Mongoose, bcryptjs, jsonwebtoken).
- **Never create or commit a root `node_modules` folder.**

---

## 4. Multi-Tenant Data Isolation & Security Rules
GameDash enforces strict multi-tenant data isolation. Every cashier and manager must only access and modify data belonging to their account:
1. **Model Tenancy Field:** Every root database model (`Station`, `Session`, `Payment`, `AuditLog`) includes a `userId` field indexed for scoped queries.
2. **Entity Creation:** Whenever an entity is created in controllers or services, always stamp it with the authenticated user ID (`userId: req.user?.id`).
3. **Query Scoping:** Whenever querying entities (`getAllStations`, `getAllSessions`, `getLiveStationOverview`, `getShiftReport`, `getAuditLogs`), always filter by `userId: req.user?.id`.
4. **Ownership Verification:** Before updating, canceling, checking out, or deleting an entity, verify that `entity.userId === req.user.id`. Return `404 Not Found` if the entity belongs to another tenant.
5. **Admin Key for Account Creation:** Public self-registration is strictly disabled. `POST /api/auth/register` requires the admin secret header `x-admin-key: GameDashAdminSecret2026` or payload `adminSecret`. Return `403 Forbidden` if missing or invalid.
6. **No Client Registration Form:** The web frontend contains ONLY a Login screen (`LoginView.jsx`). Do not add a public sign-up or registration form to the UI.

---

## 5. Domain Rules & State Machines
1. **Station State vs. Session State Separation:**
   - Station Statuses: `AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `RESERVED`
   - Session Statuses: `ACTIVE`, `PAUSED`, `EXPIRED_UNSETTLED`, `COMPLETED`, `CANCELLED`
   - **Crucial Rule:** An expired session does **NOT** free a station. The station remains `OCCUPIED` until financial settlement (`COMPLETED`) or explicit cashier cancellation (`CANCELLED`).
2. **Deterministic Billing & Overtime Rules:**
   - Time calculations must use authoritative server-side UTC timestamps (`Date.now()`). Never trust client-provided duration or end times.
   - **Grace Period ($G$):** Exactly 5 minutes. Overtime $\le 5$ minutes incurs **0** overtime surcharge.
   - **Overtime Billing Block ($B$):** Overtime $> 5$ minutes is rounded up to the nearest 15-minute block.
   - **Historical Pauses:** Historical paused durations (`pauseRecords`) and active pauses must be deducted from elapsed time.
3. **Concurrency & Safe Station Deletion:**
   - Atomic reservation lock: When starting a session, the server atomically transitions the station from `AVAILABLE` to `OCCUPIED` (`atomicOccupyStation`). If another cashier claimed it in the same tick, roll back the created session and return `409 Conflict`.
   - **Safe Station Deletion:** `DELETE /api/stations/:id` must reject deletion if the station is `OCCUPIED` or has active, paused, or unsettled sessions. Deletion must write to `AuditLog`.

---

## 6. Critical Files & Codebase Map

| File Path | Purpose & Responsibility |
| :--- | :--- |
| `client/src/App.jsx` | Main React application router, state coordinator, SSE event listener, and view router. |
| `client/src/utils/api.js` | Global auth interceptor (attaches `Authorization: Bearer <token>` to all `/api/` fetch calls) and session token management. |
| `client/src/components/LoginView.jsx` | Material Design 3 dark theme sign-in interface with admin provisioning policy notice. |
| `client/src/components/Sidebar.jsx` | Responsive navigation drawer (desktop), navigation rail (tablet), and bottom nav (mobile). |
| `client/src/components/AppHeader.jsx` | Sticky top header with live clock, SSE online status, quick-start button, station add action, and user logout. |
| `client/src/components/StationCard.jsx` | Station hardware card with real-time countdown progress bar, alert states, and session action buttons. |
| `client/src/components/Modals.jsx` | M3 dialogs for starting sessions, adding minutes, transferring stations, checkouts, and safe station deletion. |
| `client/src/components/ui/` | Reusable Material Design 3 UI component primitives (`Button`, `Card`, `Input`, `Modal`, `Snackbar`, etc.). |
| `client/src/styles/tokens.css` | Semantic design tokens mapping M3 colors, tonal surfaces, and states into CSS custom properties. |
| `client/src/styles/material.json` | Reference token JSON export. **Never edit directly.** |
| `server/src/app.js` | Express app factory, middleware configuration, static dist serving, and route mounting. |
| `server/src/server.js` | Server entrypoint, MongoDB connection, background workers initiation, and HTTP listening. |
| `server/src/domain/billingCalculator.js` | Pure deterministic financial math: elapsed minutes, grace period, overtime fees, and package totals. |
| `server/src/domain/sessionStateMachine.js` | Session transition validator and dynamic `deriveSessionStatus` evaluator. |
| `server/src/domain/stationStateMachine.js` | Station transition validator and `canStartSession` occupancy check. |
| `server/src/services/sessionService.js` | High-level session orchestration: start, pause, resume, extend, transfer, checkout, cancel, live overview. |
| `server/src/services/expiryPoller.js` | Background worker (5s interval) detecting expired sessions, dispatching 5-minute warnings, and pruning 30-day records. |
| `server/src/services/eventBroadcaster.js` | Server-Sent Events (SSE) broadcaster streaming real-time events to connected cashier terminals. |
| `server/src/services/reportService.js` | Shift reconciliation calculations (Cash vs UPI totals, occupancy, gaming hours). |
| `server/src/storage/index.js` | Persistence bridge: transparently routes operations to MongoDB (if connected) or `memoryStore`. |
| `server/src/storage/memoryStore.js` | Concurrency-safe in-memory store with atomic methods for offline execution and testing. |
| `server/src/middleware/authMiddleware.js` | JWT Bearer token validator and test-environment fallback handler. |
| `server/src/controllers/authController.js` | Endpoints for admin-gated registration (`/register`), login (`/login`), and profile retrieval (`/me`). |

---

## 7. Mandatory Verification Checklist

Before completing any task or pushing changes, verify:
1. **Backend Tests Pass 100%:** Run `npm test` from the root directory. All test suites (billing math, state machines, poller, reporting, REST lifecycle, authentication & multi-tenant isolation) must pass.
2. **Frontend Compiles Cleanly:** Run `npm run build` from the root directory. Vite must bundle assets without errors.
3. **No Root Package Contamination:** Verify that no `node_modules` or dependencies were added to the root directory.
4. **No Hardcoded Hex Colors:** Verify that all new or edited JSX/CSS files utilize semantic token classes (`bg-surface`, `text-primary`, `border-outline-variant/40`, etc.).
5. **Data Isolation Respected:** Ensure newly added features or endpoints enforce tenant scoping via `userId`.

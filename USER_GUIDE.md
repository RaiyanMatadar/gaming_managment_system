# GameDash — Gaming Center Management System: User Manual & Operating Guide

Welcome to the **GameDash Gaming Center Management System**. This software is specifically engineered for physical gaming cafes, LAN centers, and esports arenas to streamline session management, eliminate unbilled customer overtime, prevent double-booking, and reconcile daily Cash and UPI collections.

---

## Table of Contents
1. [Getting Started & Starting the System](#1-getting-started--starting-the-system)
2. [Station Setup & Configuration](#2-station-setup--configuration)
3. [Dashboard Walkthrough & Color Codes](#3-dashboard-walkthrough--color-codes)
4. [Cashier Workflows & Session Management](#4-cashier-workflows--session-management)
   - [A. Starting a New Session](#a-starting-a-new-session)
   - [B. Extending an Active or Expired Session](#b-extending-an-active-or-expired-session)
   - [C. Pausing and Resuming a Session](#c-pausing-and-resuming-a-session)
   - [D. Transferring a Session to Another Station](#d-transferring-a-session-to-another-station)
   - [E. Checking Out & Collecting Payment (Cash & UPI)](#e-checking-out--collecting-payment-cash--upi)
   - [F. 5-Minute Warning Popup & Owner Email Notifications](#f-5-minute-warning-popup--owner-email-notifications)
   - [G. Customer History Dashboard & Player Ledger](#g-customer-history-dashboard--player-ledger)
5. [Understanding Overtime & Grace Period Rules](#5-understanding-overtime--grace-period-rules)
6. [Hardware Maintenance Workflow](#6-hardware-maintenance-workflow)
7. [Shift Reconciliation & Register Closing](#7-shift-reconciliation--register-closing)
8. [Audit Trail & Accountability](#8-audit-trail--accountability)
9. [Email Configuration for Owner Alerts](#9-email-configuration-for-owner-alerts)
10. [Edge Cases & Fail-Safe Recovery](#10-edge-cases--fail-safe-recovery)

---

## 1. Getting Started & Starting the System

### Prerequisites
- Node.js (v18 or higher installed on your computer).
- A web browser (Google Chrome, Microsoft Edge, Brave, or Safari).

### Launching the Application
Open a terminal in the project directory:

```bash
# 1. Start the unified production server
npm start
```

Once running, you will see:
```text
Gaming Center Management API listening on port 4000
```

Open your web browser and navigate to:
```text
http://localhost:4000
```

> **Optional Development Mode (with hot-reload):**
> If making frontend changes, run `npm run server` (or `node server/src/server.js`) in one terminal and `npm run dev` in a second terminal, then visit `http://localhost:3000`.

---

## 2. Station Setup & Configuration

Before serving customers, set up the stations (gaming PCs, consoles, VR rigs) available in your center.

### How to Add a Gaming Station:
1. In the top navigation bar, click the blue **`+ Add Station`** button.
2. In the modal, fill in:
   - **Station Name / Number:** E.g., `PC-01`, `PC-VIP-01`, `PS5-01`, `VR-01`.
   - **Station Type:**
     - `PC Standard`: General gaming PCs (e.g., RTX 3060/4060).
     - `PC VIP`: High-end simulation or 240Hz/4K setups (e.g., RTX 4080/4090).
     - `PlayStation 5`: Console lounge booths.
     - `Xbox Series X`: Console setups.
     - `VR Simulator`: Virtual reality setups.
   - **Hourly Rate (₹):** The standard rate per hour (e.g., ₹100/hr, ₹150/hr, ₹200/hr).
3. Click **`Create Station`**. The station immediately appears on the cashier dashboard grid ready for bookings.

---

## 3. Dashboard Walkthrough & Color Codes

The main dashboard is the cashier's control tower. Every station card displays real-time hardware status and billing indicators:

### Station Card Visual Color States

| Card Color & Border | Status Badge | Operational Meaning |
| :--- | :--- | :--- |
| **Dark Slate / Subtle Border** | <span style="color:#34d399">● Available</span> | Station is free, cleaned, and ready for a new customer. |
| **Blue Accent Glow** | <span style="color:#60a5fa">● In Session</span> | Customer is actively playing. A live `HH:MM:SS` countdown timer shows time remaining. |
| **Amber / Pulsing Glow** | <span style="color:#fbbf24">▲ Expiring Soon</span> | **5 minutes or less remaining.** Alerts staff to approach customer for extension or wrap-up. |
| **Red / Pulsing Glow** | <span style="color:#f87171">🚨 Overtime Alert</span> | Scheduled time has elapsed! The timer flips to a positive overtime count (`+00:12:45`) and calculates the accrued overtime fee in real time. |
| **Purple Accent** | <span style="color:#c084fc">⏸ Paused</span> | Session is temporarily paused (snack break, game update). Countdown is frozen; station remains occupied. |
| **Muted Grey / Wrench** | <span style="color:#94a3b8">🔧 Maintenance</span> | Station is out of service (hardware repair, cleaning, peripheral issue). New sessions are blocked. |

---

## 4. Cashier Workflows & Session Management

### A. Starting a New Session
When a customer arrives at the counter:
1. Find any **Available** station card (green badge).
2. Click **`Start Session`**.
3. In the popup modal:
   - **Customer Name:** Enter their name (or leave blank to default to `Guest`).
   - **Customer Phone:** Optional, useful for customer records.
   - **Session Duration:** Choose a quick package (**30m**, **1h**, **2h**, **3h**) or type custom minutes (e.g., 45 mins).
   - Review the **Estimated Base Cost** displayed automatically.
4. Click **`Confirm & Start`**.
5. The station instantly transitions to **In Session (Blue)** with the live ticking countdown.

---

### B. Extending an Active or Expired Session
If a customer wants to play longer (either before their time ends or while in overtime):
1. Locate the customer's station card.
2. Click the **`Extend`** button.
3. Select extra time: **`+15m`**, **`+30m`**, **`+1h`**, or **`+2h`**.
4. Click **`Add Time`**.
5. The scheduled end time is automatically pushed forward by the added minutes, and if the card was in Overtime Alert (Red), it immediately reverts to **In Session (Blue)**.

---

### C. Pausing and Resuming a Session
Customers often need to step out for food, prayers, phone calls, or encounter a game patch/crash.
- **To Pause:** Click **`Pause`** on the station card. The countdown stops ticking, and the station transitions to purple. The exact pause start timestamp is recorded on the server.
- **To Resume:** When the customer returns, click **`Resume`**. The system computes the exact duration the player was away, logs the paused segment, and pushes the customer's scheduled end time forward by that exact paused amount. The customer loses zero paid time!

---

### D. Transferring a Session to Another Station
If a customer wants to switch stations (e.g., move next to friends, or switch from PC to PS5, or due to a mouse/keyboard issue):
1. Click **`Transfer`** on their station card.
2. Select any currently **Available** destination station from the dropdown.
3. Enter an optional reason (e.g., *"Customer wanted VIP setup"* or *"Faulty headphone jack"*).
4. Click **`Confirm Transfer`**.
5. The old station is immediately freed to `AVAILABLE` for the next customer.
6. The new station becomes `OCCUPIED`.
7. All elapsed time and billing history carry forward seamlessly into a single combined receipt.

---

### E. Checking Out & Collecting Payment (Cash & UPI)
When a customer finishes playing:
1. Click **`Checkout`** (green or red button) on the station card.
2. The **Checkout & Settle** dialog opens displaying an itemized bill:
   - **Base Package Fee:** Initial booked duration cost.
   - **Overtime Surcharges:** Any billable overtime beyond the 5-minute grace period.
   - **Discount (₹):** Enter any promotional or manager discount (optional).
   - **Total Payable:** Net amount due.
3. Choose the **Payment Method**:
   - **Cash:**
     - Select `Cash`.
     - Enter the amount tendered by the customer. The system automatically computes the exact **Change to Return** to prevent cashier calculation mistakes.
   - **UPI (GPay / PhonePe / Paytm / QR):**
     - Select `UPI`.
     - Enter the customer's UPI transaction reference ID (e.g., `UPI9823481239`) for audit reconciliation.
4. Click **`Settle & Release`**.
5. The payment is recorded, an audit entry is created, and the physical station is **atomically released to AVAILABLE** ready for the next player.

---

### F. 5-Minute Warning Popup & Owner Email Notifications

When any active gaming session has **exactly 5 minutes remaining**, the system automatically performs two actions:

1. **Staff Dashboard Warning Modal (High Priority Overlay):**
   - Automatically pops up on the cashier's screen, even if the cashier is currently looking at another section (such as Shift Report or Customer History).
   - Prominently displays:
     > **"Only 5 minutes left for [Customer Name] on PC [PC Number]."**
   - Displays a live ticking countdown (`04:59`, `04:58`, ...).
   - Allows the cashier to either **Acknowledge** or directly click **Extend Session (+30m)** with 1 click.
   - If multiple customers reach the 5-minute mark at the same time, each warning is displayed separately with selector tabs so no customer is missed.
   - Automatically cleans up if a session is extended, checked out, or cancelled.
   - Audio alert ping plays through the browser.

2. **Automated Email to the Center Owner:**
   - The backend immediately dispatches an email to the owner's email address (`OWNER_EMAIL`).
   - Subject: `Gaming Session Ending Soon - PC [PC Number]`
   - Body contains:
     - Customer Name
     - PC Number / Name
     - Session Start Time & Scheduled End Time
     - Remaining Time (5 minutes)
   - Deduplicated: An email is sent only once per session warning.
   - Fail-safe: If the email server is offline or fails, the cashier popup still works seamlessly.

---

### G. Customer History Dashboard & Player Ledger

In the top navigation bar, click the **`Customer History`** button to open the full player ledger:
- **Top Analytics Cards:**
  - Unique Customers Count
  - Total Sessions Logged
  - Total Gaming Hours Consumed
  - Total Revenue Spent
- **Real-Time Search & Filters:**
  - Search by customer name (e.g. `Alex`) or phone number (`9898123456`).
  - Filter pills: `All Sessions`, `Completed`, `In-Play (Active)`, `Cancelled`.
- **Itemized History Table:**
  - Customer name and phone.
  - PC / Station used and hourly rate.
  - Session date & start time.
  - Playing duration (booked minutes vs. actual elapsed time).
  - Amount charged (including base fee, overtime, and discounts).
  - Payment status badge: `PAID` (green), `PARTIALLY_PAID` (amber), `UNPAID` (red).
  - Session status badge: `COMPLETED`, `ACTIVE`, `CANCELLED`.
  - Responsive design with smooth scrolling on mobile, tablet, and desktop.

---

## 5. Understanding Overtime & Grace Period Rules

The software applies strict, fair, deterministic business rules to ensure customer satisfaction while protecting business revenue:

```
[ Scheduled End Time ] 
       |
       |--- 0 to 5 Minutes Over: GRACE PERIOD (Charge: ₹0)
       |    Customer leaves within 5 mins -> Overtime is waived!
       |
       |--- > 5 Minutes Over: OVERTIME CHARGES BEGIN
            Billed in 15-minute blocks at station's pro-rata rate.
```

### Examples (Station Rate: ₹120/hr = ₹2/min):
- **Customer leaves 3 minutes late:** Overtime = 3 mins $\le 5$ mins grace period $\implies$ **₹0 Overtime Surcharge**.
- **Customer leaves 7 minutes late:** Exceeds 5-minute grace $\implies$ rounded to first 15-minute block ($15 \text{ mins} \times \text{₹}2/\text{min}$) $\implies$ **₹30 Overtime Surcharge**.
- **Customer leaves 22 minutes late:** Exceeds grace $\implies$ rounded to two 15-minute blocks (30 mins billable) $\implies$ **₹60 Overtime Surcharge**.

---

## 6. Hardware Maintenance Workflow

If a computer, monitor, console, or controller develops an issue:
1. On any `Available` station, click the **Wrench** icon.
2. The station status changes to **Maintenance (Grey)**.
3. Cashiers cannot accidentally book or assign customers to this station.
4. Once the issue is resolved or the station is cleaned, click **`Mark Ready (Available)`** to return it to active service.

---

## 7. Shift Reconciliation & Register Closing

At the end of a cashier's shift or at daily business closing:
1. In the top navigation bar, click the **`Shift Report`** button.
2. The **Shift Reconciliation & Register Closing** modal opens:
   - **Total Shift Revenue:** Overall revenue collected across all completed sessions.
   - **Cash in Drawer:** Exact physical cash that must be physically present in the cash drawer.
   - **UPI Settlements:** Total digital payments collected via UPI/QR codes.
   - **Overtime Surcharges:** Total revenue captured purely through overtime detection.
   - **Gaming Hours Analysis:**
     - Hours Sold (initial bookings).
     - Actual Hours Consumed (real playing time).
     - Completed vs. Cancelled sessions.
   - **Station Utilization Table:** Shows which stations generated the most revenue and logged the most hours.
3. Click **`Print Summary`** to print a formal register closing receipt for the store owner.

---

## 8. Audit Trail & Accountability

To eliminate cashier discrepancies, unrecorded cash handoffs, unauthorized price overrides, or suspicious cancellations:
1. In the navigation bar, click the **`Audit Trail`** button (or open the **Audit Trail** tab in Shift Report).
2. The redesigned Audit Trail features:
   - **Search Bar:** Real-time search by customer name, PC number, cashier, action, or reason.
   - **Action Filter Pills:** Filter by `Started`, `Checkout`, `Extended`, `Transferred`, `Paused`, `Cancelled`.
   - **Clear Operational Cards:**
     - Action badge with color and icon (`Session Started`, `Session Extended`, `Checkout / Paid`, `Station Transferred`, etc.).
     - Station / PC number (e.g. `PC-01` or `PC-01 -> PS5-02`).
     - Customer name (e.g. `Alex` or `Guest`).
     - Exact timestamp (date and time down to the second).
     - Staff / Cashier actor identifier.
     - Action reason and financial details (e.g. `+30m extended (Fee: ₹50)`, `Tendered ₹150 via UPI`, `Transferred: Mouse issue`).

---

## 9. Email Configuration for Owner Alerts

To configure real email delivery to the gaming center owner, update the `.env` file in the project root:

```env
# Owner Notification Email
OWNER_EMAIL=owner@gamingcenter.com

# SMTP Provider Settings (Gmail, SendGrid, Amazon SES, Brevo, or cPanel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
EMAIL_FROM="GameDash Gaming Center" <notifications@gamingcenter.com>
```

> **Note:** If SMTP credentials are not configured, the system logs simulated mock deliveries to the server console and the cashier 5-minute warning popup continues to function normally.

---

## 10. Edge Cases & Fail-Safe Recovery

| Potential Operational Risk | How the Software Protects You |
| :--- | :--- |
| **Power cut or accidental PC reboot** | Timers are **not** stored in browser memory. They are calculated dynamically from authoritative server UTC timestamps. When power returns and the browser is reloaded, all sessions restore their exact remaining or overtime status automatically. |
| **Browser accidental refresh / close** | Reopening `http://localhost:4000` immediately re-syncs state via Server-Sent Events (SSE) with zero data loss. |
| **Two cashiers book the same station at the same time** | The database executes an atomic lock (`findOneAndUpdate` with `status: AVAILABLE`). The first cashier succeeds; the second cashier receives an instant `409 Conflict: Station already claimed` error. |
| **Cashier double-clicks "Confirm Payment"** | The frontend generates a unique `idempotencyKey` per checkout. Retried or duplicate submissions return the existing receipt without double-charging or corrupting the financial ledger. |
| **Server restarts during active session** | Session records in the database store `warningNotificationSent: true` so the 5-minute warning and owner email are never sent twice after a restart. |

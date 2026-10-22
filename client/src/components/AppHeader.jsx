
import React, { useState, useEffect } from "react";
import {
  Menu,
  Clock,
  Radio,
  Plus,
  RefreshCw,
  Bell,
  Gamepad2,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Button } from "./ui";

export function AppHeader({
  currentView,
  onOpenMobileMenu,
  onNewStationClick,
  onQuickStartClick,
  onRefresh,
  isRefreshing,
  isLiveConnected,
  urgentAlertsCount = 0,
  currentUser,
  onLogout,
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const viewTitles = {
    floor: {
      name: "Computers & Floor",
      desc: "Live status of all computers, timers, and quick start controls",
    },
    sessions: {
      name: "Active Players",
      desc: "Current players, time left, and overtime tracking",
    },
    customers: {
      name: "Customer History",
      desc: "Customer records, time played, and 30-day history",
    },
    reports: {
      name: "Daily Sales & Reports",
      desc: "Cash drawer totals, online UPI payments, and daily revenue",
    },
    audit: {
      name: "Activity Log",
      desc: "History of actions taken by staff (starts, extensions, payments)",
    },
    inventory: {
      name: "Prices & Computers",
      desc: "List of computers, hourly rates, and maintenance toggles",
    },
  };

  const current = viewTitles[currentView] || viewTitles.floor;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-outline-variant/40 bg-surface-container-low">
      <div className="mx-auto max-w-7xl px-3 py-2 sm:px-6 sm:py-2.5">
        {/* Desktop / tablet header */}
        <div className="hidden sm:flex min-w-0 items-center justify-between gap-3 lg:gap-4">
          {/* Left: navigation and page title */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              aria-label="Open navigation menu"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-on-surface/8 hover:text-on-surface lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate text-label-small text-on-surface-variant">
                <span>GameDashboard</span>
                <ChevronRight className="h-3 w-3 shrink-0 text-outline" />
                <span className="truncate font-semibold text-on-surface">
                  {current.name}
                </span>
              </div>
              <p className="truncate text-sm text-on-surface-variant">
                {current.desc}
              </p>
            </div>
          </div>

          {/* Right: desktop actions */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-surface-container px-3 py-1.5 text-label-small text-on-surface-variant xl:flex">
              <Clock className="h-3.5 w-3.5 shrink-0 text-outline" />
              <span className="font-mono font-medium tabular-nums text-on-surface">
                {time.toLocaleTimeString()}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {time.toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <ConnectionStatus isLiveConnected={isLiveConnected} />

            <UrgentAlerts count={urgentAlertsCount} />

            {onQuickStartClick && (
              <Button
                variant="filled"
                size="sm"
                onClick={onQuickStartClick}
                className="shrink-0 whitespace-nowrap px-3 text-xs font-semibold"
              >
                <Gamepad2 className="h-3.5 w-3.5 shrink-0" />
                <span>Start Session</span>
              </Button>
            )}

            <Button
              variant="outlined"
              size="sm"
              onClick={onNewStationClick}
              className="shrink-0 whitespace-nowrap px-3 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>Add Computer</span>
            </Button>

            <RefreshButton
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
            />

            {currentUser && (
              <div className="flex shrink-0 items-center gap-2 border-l border-outline-variant/40 pl-2">
                <div className="hidden max-w-[130px] flex-col text-right lg:flex">
                  <span className="truncate text-label-small font-medium text-on-surface">
                    {currentUser.name || currentUser.username}
                  </span>
                  <span className="truncate text-[10px] leading-none text-on-surface-variant">
                    {currentUser.centerName || "GameDash"}
                  </span>
                </div>
                <LogoutButton onLogout={onLogout} />
              </div>
            )}
          </div>
        </div>

        {/* Mobile header */}
        <div className="flex flex-col gap-2 sm:hidden">
          {/* Row 1: menu, branding, status, and secondary controls */}
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={onOpenMobileMenu}
                aria-label="Open navigation menu"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-on-surface/8 hover:text-on-surface"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex min-w-0 items-center gap-1.5">
                <Gamepad2 className="h-5 w-5 shrink-0 text-primary" />
                <span className="truncate text-sm font-bold tracking-tight text-on-surface">
                  GameDash
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <ConnectionStatus isLiveConnected={isLiveConnected} />

              <UrgentAlerts count={urgentAlertsCount} />

              <RefreshButton
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
              />

              {currentUser && <LogoutButton onLogout={onLogout} />}
            </div>
          </div>

          {/* Row 2: primary actions */}
          <div className="flex w-full items-center gap-2">
            {onQuickStartClick && (
              <Button
                variant="filled"
                size="sm"
                onClick={onQuickStartClick}
                className="h-10 min-w-0 flex-1 justify-center gap-1.5 whitespace-nowrap px-2 text-xs font-semibold"
              >
                <Gamepad2 className="h-4 w-4 shrink-0" />
                <span>Start Session</span>
              </Button>
            )}

            <Button
              variant="outlined"
              size="sm"
              onClick={onNewStationClick}
              className="h-10 min-w-0 flex-1 justify-center gap-1.5 whitespace-nowrap px-2 text-xs font-semibold"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Add PC</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function ConnectionStatus({ isLiveConnected }) {
  return (
    <div
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-container px-2 py-1.5"
      title={isLiveConnected ? "Connected" : "Reconnecting"}
      aria-label={isLiveConnected ? "Online" : "Reconnecting"}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          isLiveConnected ? "bg-success" : "bg-warning"
        }`}
      />
      <span
        className={`hidden text-label-small font-medium md:inline ${
          isLiveConnected ? "text-success" : "text-warning"
        }`}
      >
        {isLiveConnected ? "Online" : "Reconnecting"}
      </span>
    </div>
  );
}

function UrgentAlerts({ count }) {
  if (count <= 0) return null;

  return (
    <div
      className="flex shrink-0 items-center gap-1 rounded-full bg-warning-container px-2 py-1.5 text-label-small font-semibold text-on-warning-container"
      title={`${count} computer(s) need attention`}
      aria-label={`${count} urgent alerts`}
    >
      <Bell className="h-3.5 w-3.5 shrink-0" />
      <span className="tabular-nums">{count}</span>
    </div>
  );
}

function RefreshButton({ onRefresh, isRefreshing }) {
  return (
    <button
      onClick={onRefresh}
      title="Refresh status"
      aria-label="Refresh status"
      disabled={isRefreshing}
      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-wait"
    >
      <RefreshCw
        className={`h-4 w-4 ${isRefreshing ? "animate-spin text-primary" : ""}`}
      />
    </button>
  );
}

function LogoutButton({ onLogout }) {
  return (
    <button
      onClick={onLogout}
      title="Log out of account"
      aria-label="Log out of account"
      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}

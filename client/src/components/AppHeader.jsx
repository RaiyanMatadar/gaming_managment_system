
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
  User,
  Smartphone,
  Zap
} from "lucide-react";
import { Button } from "./ui";
import { AudioControls } from "./AudioControls.jsx";

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
  onProfileClick,
  onWhatsAppClick,
  isEmergencyFrozen = false,
  onTriggerUPSFreeze,
  onResumeUPSFreeze
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
    home: {
      name: "Arena Showcase & Home",
      desc: "Public-facing gaming lounge display, battlestation specs, and rates",
    },
  };

  const current = viewTitles[currentView] || viewTitles.floor;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-primary/20 bg-surface/85 backdrop-blur-xl shadow-lg shadow-black/20">
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

            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center p-1 shadow-sm shrink-0">
              <img
                src="/images/gamedash_esports_logo.svg"
                alt="GameDash"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate text-label-small text-on-surface-variant font-mono">
                <span className="font-bold text-on-surface">GameDash</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-bold">PRO</span>
                <ChevronRight className="h-3 w-3 shrink-0 text-outline" />
                <span className="truncate font-semibold text-primary">
                  {current.name}
                </span>
              </div>
              <p className="truncate text-xs text-on-surface-variant font-medium">
                {current.desc}
              </p>
            </div>
          </div>

          {/* Right: desktop actions */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-surface-container border border-outline-variant/30 px-3 py-1.5 text-label-small xl:flex shadow-xs">
              <Clock className="h-3.5 w-3.5 shrink-0 text-primary animate-pulse" />
              <span className="font-mono font-bold tabular-nums text-on-surface tracking-wider">
                {time.toLocaleTimeString()}
              </span>
              <span className="text-[10px] uppercase font-semibold text-on-surface-variant border-l border-outline-variant/40 pl-2">
                {time.toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <ConnectionStatus isLiveConnected={isLiveConnected} />

            <UrgentAlerts count={urgentAlertsCount} />

            <AudioControls />

            {onQuickStartClick && (
              <Button
                variant="filled"
                size="sm"
                onClick={onQuickStartClick}
                className="shrink-0 whitespace-nowrap px-3.5 text-xs font-bold shadow-md cyber-glow-primary"
              >
                <Gamepad2 className="h-3.5 w-3.5 shrink-0" />
                <span>Quick Play</span>
              </Button>
            )}

            <Button
              variant="tonal"
              size="sm"
              onClick={onNewStationClick}
              className="shrink-0 whitespace-nowrap px-3 text-xs font-semibold backdrop-blur-md"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>Add Rig</span>
            </Button>

            {onWhatsAppClick && (
              <Button
                variant="outlined"
                size="sm"
                onClick={onWhatsAppClick}
                title="WhatsApp Device Connection & QR Link"
                className="shrink-0 whitespace-nowrap px-2.5 text-xs font-semibold"
              >
                <Smartphone className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="hidden md:inline">WhatsApp</span>
              </Button>
            )}

            {(onTriggerUPSFreeze || onResumeUPSFreeze) && (
              <Button
                variant={isEmergencyFrozen ? 'filled' : 'outlined'}
                size="sm"
                onClick={isEmergencyFrozen ? onResumeUPSFreeze : onTriggerUPSFreeze}
                title={isEmergencyFrozen ? 'Resume floor clocks' : 'Freeze all clocks for power cut / UPS generator change'}
                className={`shrink-0 whitespace-nowrap px-2.5 text-xs font-semibold ${
                  isEmergencyFrozen
                    ? 'bg-warning text-on-warning animate-pulse'
                    : 'text-warning border-warning/40 hover:bg-warning-container/30'
                }`}
              >
                <Zap className="h-3.5 w-3.5 shrink-0 fill-current" />
                <span className="hidden md:inline">{isEmergencyFrozen ? 'Resume Clocks' : 'UPS Freeze'}</span>
              </Button>
            )}

            <RefreshButton
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
            />

            {currentUser && (
              <div className="flex shrink-0 items-center gap-2 border-l border-outline-variant/40 pl-2">
                <button
                  type="button"
                  onClick={onProfileClick}
                  title="Edit Profile & WhatsApp Alert Number"
                  className="hidden max-w-[140px] items-center gap-2 text-right lg:flex cursor-pointer hover:opacity-85 transition-opacity px-2.5 py-1 rounded-xl bg-surface-container border border-outline-variant/30 shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <span className="truncate text-xs font-bold text-on-surface block leading-tight">
                      {currentUser.name || currentUser.username}
                    </span>
                    <span className="truncate text-[10px] leading-tight text-primary font-semibold block capitalize">
                      {currentUser.role || 'Operator'}
                    </span>
                  </div>
                </button>
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
                <img src="/images/gamedash_esports_logo.svg" alt="GameDash" className="h-6 w-6 shrink-0 object-contain" />
                <span className="truncate text-sm font-black tracking-tight text-on-surface">
                  GameDash
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <ConnectionStatus isLiveConnected={isLiveConnected} />

              <UrgentAlerts count={urgentAlertsCount} />
              <AudioControls />

              <RefreshButton
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
              />

              {onWhatsAppClick && (
                <button
                  type="button"
                  onClick={onWhatsAppClick}
                  title="WhatsApp Device Connection & QR"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  <Smartphone className="h-4 w-4 text-primary" />
                </button>
              )}

              {currentUser && (
                <button
                  type="button"
                  onClick={onProfileClick}
                  title="WhatsApp & Profile Settings"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  <User className="h-4 w-4" />
                </button>
              )}

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
      className="flex shrink-0 items-center gap-2 rounded-full bg-surface-container border border-outline-variant/40 px-2.5 py-1 shadow-xs"
      title={isLiveConnected ? "Arena Live Sync Active" : "Reconnecting to Arena"}
      aria-label={isLiveConnected ? "Live Arena" : "Reconnecting"}
    >
      <span className="relative flex h-2 w-2">
        {isLiveConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isLiveConnected ? "bg-success" : "bg-warning"
          }`}
        />
      </span>
      <span
        className={`hidden text-[10px] font-bold tracking-wider uppercase md:inline ${
          isLiveConnected ? "text-success" : "text-warning"
        }`}
      >
        {isLiveConnected ? "ARENA LIVE" : "SYNCING"}
      </span>
      {isLiveConnected && (
        <div className="hidden lg:flex items-end gap-0.5 h-3 px-1 rounded bg-surface-container-high/60" title="Telemetry Stream">
          <span className="w-0.5 bg-success rounded-full animate-eq-1" />
          <span className="w-0.5 bg-success rounded-full animate-eq-2" />
          <span className="w-0.5 bg-success rounded-full animate-eq-3" />
        </div>
      )}
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

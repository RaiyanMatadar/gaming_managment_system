import React, { useState, useEffect } from 'react';
import {
  Menu,
  Clock,
  Radio,
  Plus,
  RefreshCw,
  Bell,
  Gamepad2,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui';

export function AppHeader({
  currentView,
  onOpenMobileMenu,
  onNewStationClick,
  onQuickStartClick,
  onRefresh,
  isRefreshing,
  isLiveConnected,
  urgentAlertsCount = 0
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const viewTitles = {
    floor: {
      name: 'Floor grid',
      desc: 'Real-time station status, active timers, and walk-in controls'
    },
    sessions: {
      name: 'Active sessions',
      desc: 'Ongoing gaming sessions and overtime tracking'
    },
    customers: {
      name: 'Customer ledger',
      desc: 'Player visits, logged time, and thirty-day history'
    },
    reports: {
      name: 'Shift reconciliation',
      desc: 'Cash drawer totals, UPI collections, and daily revenue'
    },
    audit: {
      name: 'Audit trail',
      desc: 'Chronological activity log of cashier actions and billing events'
    },
    inventory: {
      name: 'Station inventory',
      desc: 'Gaming hardware configurations, rates, and maintenance toggles'
    }
  };

  const current = viewTitles[currentView] || viewTitles.floor;

  return (
    <header className="sticky top-0 z-30 bg-surface-container-low border-b border-outline-variant/40 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Navigation Button & View Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-lg bg-surface-container border border-outline-variant/60 text-on-surface-variant hover:text-on-surface"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="font-medium text-on-surface-variant">CyberArena</span>
              <ChevronRight className="w-3 h-3 text-on-surface-variant" />
              <span className="text-on-surface font-semibold">{current.name}</span>
            </div>
            <p className="text-[11px] text-on-surface-variant hidden md:block mt-0.5">
              {current.desc}
            </p>
          </div>
        </div>

        {/* Right: Clock, Status Indicator & Direct Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Wall Clock & Date */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/60 text-xs text-on-surface-variant">
            <Clock className="w-3.5 h-3.5 text-outline" />
            <span className="font-mono tabular-nums font-medium text-on-surface">{time.toLocaleTimeString()}</span>
            <span className="text-on-surface-variant text-[11px]">
              {time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Real-time Connection Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/60 text-xs">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`text-[11px] font-medium hidden md:inline ${isLiveConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isLiveConnected ? 'Live' : 'Connecting'}
            </span>
          </div>

          {/* Urgent Alerts Tag */}
          {urgentAlertsCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-600/50 text-amber-300 text-xs font-semibold"
              title={`${urgentAlertsCount} station(s) needing attention`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="tabular-nums">{urgentAlertsCount}</span>
            </div>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            title="Refresh station status"
            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </button>

          {/* Primary Quick Start Action */}
          {onQuickStartClick && (
            <Button
              variant="filled"
              size="sm"
              onClick={onQuickStartClick}
              className="hidden sm:inline-flex"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Start session</span>
            </Button>
          )}

          {/* Add Station Action */}
          <Button
            variant="outlined"
            size="sm"
            onClick={onNewStationClick}
          >
            <Plus className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>Add station</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

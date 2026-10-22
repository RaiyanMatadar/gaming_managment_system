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
      name: 'Computers & Floor',
      desc: 'Live status of all computers, timers, and quick start controls'
    },
    sessions: {
      name: 'Active Players',
      desc: 'Current players, time left, and overtime tracking'
    },
    customers: {
      name: 'Customer History',
      desc: 'Customer records, time played, and 30-day history'
    },
    reports: {
      name: 'Daily Sales & Reports',
      desc: 'Cash drawer totals, online UPI payments, and daily revenue'
    },
    audit: {
      name: 'Activity Log',
      desc: 'History of actions taken by staff (starts, extensions, payments)'
    },
    inventory: {
      name: 'Prices & Computers',
      desc: 'List of computers, hourly rates, and maintenance toggles'
    }
  };

  const current = viewTitles[currentView] || viewTitles.floor;

  return (
    <header className="sticky top-0 z-30 bg-surface-container-low border-b border-outline-variant/40 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Navigation Button & View Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-label-small text-on-surface-variant">
              <span>GameDash</span>
              <ChevronRight className="w-3 h-3 text-outline" />
              <span className="text-on-surface font-semibold">{current.name}</span>
            </div>
            <p className="body-small text-on-surface-variant hidden md:block">
              {current.desc}
            </p>
          </div>
        </div>

        {/* Right: Clock, Status Indicator & Direct Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Wall Clock & Date */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-label-small text-on-surface-variant">
            <Clock className="w-3.5 h-3.5 text-outline" />
            <span className="font-mono tabular-nums font-medium text-on-surface">{time.toLocaleTimeString()}</span>
            <span className="text-on-surface-variant text-[11px]">
              {time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Real-time Connection Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-xs">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-success' : 'bg-warning'}`} />
            <span className={`text-label-small font-medium hidden md:inline ${isLiveConnected ? 'text-success' : 'text-warning'}`}>
              {isLiveConnected ? 'Online' : 'Reconnecting'}
            </span>
          </div>

          {/* Urgent Alerts Tag */}
          {urgentAlertsCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-container text-on-warning-container text-label-small font-semibold"
              title={`${urgentAlertsCount} computer(s) need attention`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="tabular-nums">{urgentAlertsCount}</span>
            </div>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            title="Refresh status"
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
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
              <span>Start Session</span>
            </Button>
          )}

          {/* Add Station Action */}
          <Button
            variant="outlined"
            size="sm"
            onClick={onNewStationClick}
          >
            <Plus className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>Add Computer</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

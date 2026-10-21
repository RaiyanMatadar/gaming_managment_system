import React, { useState, useEffect } from 'react';
import {
  Menu,
  Clock,
  Radio,
  Plus,
  RefreshCw,
  Bell,
  Gamepad2,
  Calendar
} from 'lucide-react';

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

  const titles = {
    floor: {
      name: 'Live Floor Grid',
      desc: 'Real-time gaming stations, live timers & quick cashier controls'
    },
    sessions: {
      name: 'Active Sessions',
      desc: 'Live countdowns, overtime meters & fast session actions'
    },
    customers: {
      name: 'Customer Ledger & History',
      desc: 'Player visits, playing durations & 30-day monthly auto-pruned history'
    },
    reports: {
      name: 'Shift Reconciliation & Daily Close',
      desc: 'Cash in drawer, UPI collections, overtime fees & station revenue'
    },
    audit: {
      name: 'Operational Audit Trail',
      desc: 'Comprehensive staff activity log tracking sessions, extensions & payments'
    },
    inventory: {
      name: 'Station Inventory & Rates',
      desc: 'Manage PCs, consoles, VR simulators, hourly pricing & maintenance'
    }
  };

  const current = titles[currentView] || titles.floor;

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle + Breadcrumb Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                CyberArena
              </span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {current.name}
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              {current.desc}
            </p>
          </div>
        </div>

        {/* Right: Clock, Live Pulse, Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wall Clock & Date */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono font-medium">{time.toLocaleTimeString()}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-[11px]">
              {time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* SSE Live Gateway Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <Radio className={`w-3.5 h-3.5 ${isLiveConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className={`text-[11px] font-semibold hidden md:inline ${isLiveConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isLiveConnected ? 'Live' : 'Connecting'}
            </span>
          </div>

          {/* Urgent Alerts Bell Indicator */}
          {urgentAlertsCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs animate-pulse font-bold"
              title={`${urgentAlertsCount} stations requiring attention`}
            >
              <Bell className="w-3.5 h-3.5 text-red-400" />
              <span>{urgentAlertsCount}</span>
            </div>
          )}

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            title="Refresh Station Status"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* Quick Start Session Action (if provided) */}
          {onQuickStartClick && (
            <button
              onClick={onQuickStartClick}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all hidden sm:flex items-center gap-1.5"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Start Session</span>
            </button>
          )}

          {/* Add Station Action */}
          <button
            onClick={onNewStationClick}
            className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Station</span>
          </button>
        </div>
      </div>
    </header>
  );
}

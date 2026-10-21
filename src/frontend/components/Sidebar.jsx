import React from 'react';
import {
  LayoutGrid,
  Gamepad2,
  Clock,
  Users,
  BarChart3,
  ShieldCheck,
  SlidersHorizontal,
  Radio,
  Trash2,
  UserCheck,
  X
} from 'lucide-react';

export function Sidebar({
  currentView,
  onSelectView,
  stations = [],
  isLiveConnected,
  isOpen,
  onClose
}) {
  const occupiedCount = stations.filter(s => s.status === 'OCCUPIED').length;
  const alertCount = stations.filter(s => s.liveSession && (s.liveSession.isWarning || s.liveSession.isOvertime)).length;

  const navItems = [
    {
      id: 'floor',
      label: 'Live Floor Grid',
      icon: LayoutGrid,
      badge: stations.length > 0 ? stations.length : null
    },
    {
      id: 'sessions',
      label: 'Active Sessions',
      icon: Gamepad2,
      badge: occupiedCount > 0 ? occupiedCount : null,
      badgeColor: 'bg-blue-600 text-white'
    },
    {
      id: 'customers',
      label: 'Customer Ledger',
      icon: Users
    },
    {
      id: 'reports',
      label: 'Shift Reconciliation',
      icon: BarChart3
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: ShieldCheck
    },
    {
      id: 'inventory',
      label: 'Station Inventory',
      icon: SlidersHorizontal
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight">CyberArena</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400">
                  POS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Gaming Center Controller</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Pill if Overtime/Warnings Exist */}
        {alertCount > 0 && (
          <div className="mx-4 mt-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-red-300">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span className="font-semibold">{alertCount} Urgent Alert{alertCount > 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={() => {
                onSelectView('floor');
                onClose?.();
              }}
              className="text-[10px] font-bold text-red-300 underline hover:text-white"
            >
              View
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Operations Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onClose?.();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer System Health & Cashier Status */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
          {/* SSE Live Gateway */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className={`w-3.5 h-3.5 ${isLiveConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              Gateway Stream:
            </span>
            <span className={`text-[11px] font-bold ${isLiveConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isLiveConnected ? 'Live Real-time' : 'Reconnecting...'}
            </span>
          </div>

          {/* Retention Policy */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-400">
              <Trash2 className="w-3 h-3 text-slate-500" />
              Retention:
            </span>
            <span className="text-slate-300 font-medium">30-Day Auto Purge</span>
          </div>

          {/* Cashier Badge */}
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[11px] font-bold text-white truncate">Admin / Lead Cashier</span>
              <span className="block text-[10px] text-emerald-400 font-medium">Shift Active</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

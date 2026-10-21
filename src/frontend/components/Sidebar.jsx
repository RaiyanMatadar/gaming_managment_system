import React from 'react';
import {
  LayoutGrid,
  Gamepad2,
  Users,
  BarChart3,
  ShieldCheck,
  SlidersHorizontal,
  Radio,
  UserCheck,
  X,
  AlertTriangle
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
      label: 'Computers & Floor',
      icon: LayoutGrid,
      count: stations.length > 0 ? stations.length : null
    },
    {
      id: 'sessions',
      label: 'Active Players',
      icon: Gamepad2,
      count: occupiedCount > 0 ? occupiedCount : null,
      highlight: occupiedCount > 0
    },
    {
      id: 'customers',
      label: 'Customer History',
      icon: Users
    },
    {
      id: 'reports',
      label: 'Daily Sales & Reports',
      icon: BarChart3
    },
    {
      id: 'audit',
      label: 'Activity Log',
      icon: ShieldCheck
    },
    {
      id: 'inventory',
      label: 'Prices & Computers',
      icon: SlidersHorizontal
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/80 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-surface-container-low border-r border-outline-variant/40 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="px-5 py-4 border-b border-outline-variant/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-container/40 border border-primary/30 flex items-center justify-center text-primary">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-on-surface tracking-tight block">CyberArena</span>
                <span className="text-[11px] text-on-surface-variant font-normal block leading-tight">Management System</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alert Notice Strip (Rendered when computers need attention) */}
          {alertCount > 0 && (
            <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-600/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-medium text-[11px]">{alertCount} computer{alertCount > 1 ? 's' : ''} need attention</span>
              </div>
              <button
                onClick={() => {
                  onSelectView('floor');
                  onClose?.();
                }}
                className="text-[11px] font-semibold text-amber-400 hover:text-on-surface transition-colors"
              >
                View
              </button>
            </div>
          )}

          {/* Navigation Section */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <span className="px-2 pb-2 block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Menu
            </span>

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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container border border-primary/30 font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== null && item.count !== undefined && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-primary/20 text-on-primary-container'
                          : item.highlight
                          ? 'bg-primary-container text-primary border border-primary/40'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer: Staff & Connection Status */}
        <div className="p-3 border-t border-outline-variant/40 space-y-2.5 bg-surface-container-lowest">
          {/* Connection Status */}
          <div className="flex items-center justify-between px-1 text-[11px]">
            <span className="text-on-surface-variant flex items-center gap-1.5">
              <Radio className={`w-3 h-3 ${isLiveConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              System Status:
            </span>
            <span className={`font-medium ${isLiveConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isLiveConnected ? 'Online' : 'Reconnecting'}
            </span>
          </div>

          {/* Active Staff Card */}
          <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-on-surface truncate">Cashier</span>
              <span className="block text-[10px] text-emerald-400 font-medium leading-none mt-0.5">On Duty</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

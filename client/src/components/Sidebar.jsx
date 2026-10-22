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
  AlertTriangle,
  Menu
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
      shortLabel: 'Computers',
      icon: LayoutGrid,
      count: stations.length > 0 ? stations.length : null
    },
    {
      id: 'sessions',
      label: 'Active Players',
      shortLabel: 'Players',
      icon: Gamepad2,
      count: occupiedCount > 0 ? occupiedCount : null,
      highlight: occupiedCount > 0
    },
    {
      id: 'customers',
      label: 'Customer History',
      shortLabel: 'Customers',
      icon: Users
    },
    {
      id: 'reports',
      label: 'Daily Sales & Reports',
      shortLabel: 'Reports',
      icon: BarChart3
    },
    {
      id: 'audit',
      label: 'Activity Log',
      shortLabel: 'Activity',
      icon: ShieldCheck
    },
    {
      id: 'inventory',
      label: 'Prices & Computers',
      shortLabel: 'Prices',
      icon: SlidersHorizontal
    }
  ];

  return (
    <>
      {/* 1. Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 bg-scrim/60 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* 2. M3 Navigation Drawer (Desktop Permanent + Mobile Modal) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-surface-container-low flex flex-col justify-between transition-transform duration-250 ease-m3-standard lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-m3-3' : '-translate-x-full lg:shadow-none'
        } ${isOpen ? 'flex' : 'hidden lg:flex'}`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <span className="title-medium text-on-surface font-medium block leading-tight">GameDash</span>
                <span className="body-small text-on-surface-variant block mt-0.5">Management System</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Attention Banner */}
          {alertCount > 0 && (
            <div className="mx-4 mb-3 p-3 rounded-[12px] bg-warning-container text-on-warning-container flex items-center justify-between text-body-small">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{alertCount} computer{alertCount > 1 ? 's' : ''} need attention</span>
              </div>
              <button
                onClick={() => {
                  onSelectView('floor');
                  onClose?.();
                }}
                className="font-bold underline hover:opacity-80"
              >
                View
              </button>
            </div>
          )}

          {/* Drawer Nav Items */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            <span className="px-4 py-2 block label-small text-on-surface-variant font-medium">
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
                  className={`m3-state-layer w-full min-h-[48px] h-12 flex items-center justify-between px-4 rounded-full text-label-large font-medium transition-colors duration-200 select-none cursor-pointer ${
                    isActive
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-on-secondary-container' : 'text-on-surface-variant'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== null && item.count !== undefined && (
                    <span
                      className={`text-label-small font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                        isActive
                          ? 'bg-on-secondary-container/15 text-on-secondary-container'
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

        {/* Footer */}
        <div className="p-4 mx-3 mb-3 rounded-[16px] bg-surface-container space-y-2">
          {/* Connection Status */}
          <div className="flex items-center justify-between text-body-small px-1">
            <span className="text-on-surface-variant flex items-center gap-2">
              <Radio className={`w-3.5 h-3.5 ${isLiveConnected ? 'text-success' : 'text-warning'}`} />
              System Status:
            </span>
            <span className={`font-medium ${isLiveConnected ? 'text-success' : 'text-warning'}`}>
              {isLiveConnected ? 'Online' : 'Reconnecting'}
            </span>
          </div>

          {/* Active Staff */}
          <div className="flex items-center gap-2.5 pt-1">
            <div className="w-8 h-8 rounded-full bg-success-container text-on-success-container flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-label-medium font-medium text-on-surface truncate">Cashier</span>
              <span className="block text-[11px] text-success font-medium leading-none">On Duty</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. M3 Navigation Rail (Tablet md:flex lg:hidden) */}
      <aside className="hidden md:flex lg:hidden fixed top-0 bottom-0 left-0 w-20 z-40 bg-surface-container-low flex-col items-center justify-between py-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
            <Gamepad2 className="w-5 h-5" />
          </div>

          <div className="w-12 h-px bg-outline-variant/30 my-1" />

          {/* Nav Rail Buttons */}
          <div className="flex flex-col items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  title={item.label}
                  className="flex flex-col items-center gap-1 group cursor-pointer focus-visible:outline-none"
                >
                  <div
                    className={`m3-state-layer w-14 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                      isActive
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'text-on-surface-variant group-hover:bg-on-surface/8 group-hover:text-on-surface'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-medium transition-colors ${
                    isActive ? 'text-on-surface font-semibold' : 'text-on-surface-variant'
                  }`}>
                    {item.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live indicator in rail */}
        <div className="w-2.5 h-2.5 rounded-full bg-success" title="System Online" />
      </aside>

      {/* 4. M3 Bottom Navigation Bar (Mobile only < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-surface-container-high border-t border-outline-variant/20 flex items-center justify-around px-2 shadow-m3-2">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className="flex flex-col items-center gap-1 min-w-[56px] py-1 select-none focus-visible:outline-none"
            >
              <div
                className={`m3-state-layer w-14 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface-variant'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-medium leading-none ${
                isActive ? 'text-on-surface font-semibold' : 'text-on-surface-variant'
              }`}>
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

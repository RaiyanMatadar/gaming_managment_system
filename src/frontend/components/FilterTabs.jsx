import React from 'react';

export function FilterTabs({ activeFilter, onSelectFilter, counts }) {
  const tabs = [
    { id: 'ALL', label: 'All', count: counts.all },
    { id: 'AVAILABLE', label: 'Available', count: counts.available, dot: 'bg-emerald-400' },
    { id: 'ACTIVE', label: 'In Use', count: counts.occupied, dot: 'bg-primary' },
    { id: 'ALERTS', label: 'Alerts', count: counts.alerts, isAlert: counts.alerts > 0, dot: 'bg-amber-400' },
    { id: 'MAINTENANCE', label: 'In Repair', count: counts.maintenance, dot: 'bg-outline' }
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-none">
      {tabs.map(tab => {
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 border ${
              isActive
                ? 'bg-primary-container text-on-primary-container border-primary/40 font-semibold'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/60 hover:text-on-surface hover:border-outline'
            }`}
          >
            {tab.dot && (
              <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
            )}
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold tabular-nums ${
                tab.isAlert
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : isActive
                  ? 'bg-primary/20 text-on-primary-container'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

import React from 'react';

export function FilterTabs({ activeFilter, onSelectFilter, counts }) {
  const tabs = [
    { id: 'ALL', label: 'All Stations', count: counts.all },
    { id: 'AVAILABLE', label: 'Available', count: counts.available, highlight: 'emerald' },
    { id: 'ACTIVE', label: 'In Play', count: counts.occupied, highlight: 'blue' },
    { id: 'ALERTS', label: 'Alerts', count: counts.alerts, isAlert: counts.alerts > 0 },
    { id: 'MAINTENANCE', label: 'Maintenance', count: counts.maintenance }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6 scrollbar-none">
      {tabs.map(tab => {
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
              isActive
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                tab.isAlert
                  ? 'bg-red-500 text-white animate-pulse'
                  : isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-800 text-slate-400'
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

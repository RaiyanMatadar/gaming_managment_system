import React from 'react';

export function FilterTabs({ activeFilter, onSelectFilter, counts }) {
  const tabs = [
    { id: 'ALL', label: 'All Stations', count: counts.all },
    { id: 'AVAILABLE', label: 'Available', count: counts.available },
    { id: 'ACTIVE', label: 'In Session', count: counts.occupied },
    { id: 'ALERTS', label: 'Expiring / Overtime', count: counts.alerts },
    { id: 'MAINTENANCE', label: 'Maintenance', count: counts.maintenance }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
      {tabs.map(tab => {
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
              isActive
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
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

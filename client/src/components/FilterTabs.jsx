import React from 'react';
import { Chip } from './ui/index.js';

export function FilterTabs({ activeFilter, onSelectFilter, counts }) {
  const tabs = [
    { id: 'ALL', label: 'All Stations', count: counts.all },
    { id: 'AVAILABLE', label: 'Available', count: counts.available, dot: 'bg-success' },
    { id: 'ACTIVE', label: 'In Use', count: counts.occupied, dot: 'bg-primary' },
    { id: 'ALERTS', label: 'Alerts', count: counts.alerts, isAlert: counts.alerts > 0, dot: 'bg-warning' },
    { id: 'MAINTENANCE', label: 'In Repair', count: counts.maintenance, dot: 'bg-outline' }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6 scrollbar-none">
      {tabs.map(tab => {
        const isActive = activeFilter === tab.id;
        return (
          <Chip
            key={tab.id}
            selected={isActive}
            onClick={() => onSelectFilter(tab.id)}
            label={tab.label}
            count={tab.count}
            avatar={
              tab.dot ? (
                <span className={`w-2 h-2 rounded-full shrink-0 ${tab.dot}`} />
              ) : null
            }
          />
        );
      })}
    </div>
  );
}

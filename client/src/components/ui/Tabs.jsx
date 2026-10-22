import React from 'react';

/**
 * Material Design 3 Tabs
 * Supports Primary and Secondary tabs with pill or underline indicators.
 */
export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'primary', // 'primary' | 'pill'
  className = ''
}) {
  return (
    <div className={`flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === 'pill') {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`m3-state-layer h-10 px-4 rounded-full text-label-large font-medium whitespace-nowrap transition-all duration-200 ease-m3-standard flex items-center gap-2 ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== null && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold tabular-nums ${
                  isActive ? 'bg-on-secondary-container/15 text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`m3-state-layer relative h-12 px-4 text-title-small font-medium whitespace-nowrap transition-colors duration-200 flex items-center gap-2 ${
              isActive
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-label-small px-1.5 py-0.5 rounded-full font-semibold ${
                isActive ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

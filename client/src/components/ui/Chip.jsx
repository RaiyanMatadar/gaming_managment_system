import React from 'react';

/**
 * Material Design 3 Chip Primitive
 * Used for filters, tags, suggestions, and compact selections.
 */
export function Chip({
  selected = false,
  icon,
  avatar,
  label,
  count,
  onClick,
  className = '',
  children,
  ...props
}) {
  const base = 'm3-state-layer inline-flex items-center gap-1.5 sm:gap-2 h-7 sm:h-8 px-2.5 sm:px-3 rounded-full text-xs sm:text-label-large font-medium select-none cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-150 ease-m3-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  const style = selected
    ? 'bg-secondary-container text-on-secondary-container border-none'
    : 'bg-transparent text-on-surface-variant border border-outline-variant/60 hover:bg-surface-container-high hover:text-on-surface';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${style} ${className}`.trim()}
      {...props}
    >
      {avatar}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label || children}</span>
      {count !== undefined && count !== null && (
        <span className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full tabular-nums ${
          selected ? 'bg-on-secondary-container/15 text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

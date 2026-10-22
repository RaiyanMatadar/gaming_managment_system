import React from 'react';

/**
 * Material Design 3 Top App Bar
 */
export function TopAppBar({
  title,
  subtitle,
  leadingIcon,
  onLeadingIconClick,
  trailingActions,
  className = ''
}) {
  return (
    <header className={`sticky top-0 z-30 h-16 bg-surface-container-low text-on-surface px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors duration-200 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {leadingIcon && (
          <button
            onClick={onLeadingIconClick}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8 transition-colors shrink-0"
            aria-label="Navigation button"
          >
            {leadingIcon}
          </button>
        )}
        <div className="min-w-0">
          <h1 className="title-large font-normal text-on-surface tracking-normal truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="body-small text-on-surface-variant truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {trailingActions && (
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {trailingActions}
        </div>
      )}
    </header>
  );
}

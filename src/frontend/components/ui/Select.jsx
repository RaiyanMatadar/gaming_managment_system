import React from 'react';

export function Select({
  size = 'md',
  fullWidth = true,
  className = '',
  children,
  ...props
}) {
  const base = 'bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer';
  const sizeClass = size === 'sm' ? 'text-xs py-1.5 px-3 rounded-lg' : 'text-xs sm:text-sm py-2 px-3.5 rounded-xl';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <select
      className={`${base} ${sizeClass} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  );
}

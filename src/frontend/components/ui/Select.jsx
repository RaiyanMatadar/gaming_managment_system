import React from 'react';

export function Select({
  size = 'md',
  fullWidth = true,
  className = '',
  children,
  ...props
}) {
  const base = 'bg-surface-container-lowest border border-outline-variant/60 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-[10px] cursor-pointer';
  const sizeClass = size === 'sm' ? 'text-xs h-9 px-3' : 'text-sm h-11 px-3.5';
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

import React from 'react';

export function Select({
  size = 'md',
  fullWidth = true,
  className = '',
  children,
  ...props
}) {
  const base = 'bg-surface-container-highest/50 border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all rounded-[4px] cursor-pointer';
  const sizeClass = size === 'sm' ? 'text-xs h-10 px-3' : 'text-body-medium h-12 px-4';
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

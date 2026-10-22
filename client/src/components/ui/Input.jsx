import React from 'react';

export function Input({
  size = 'md',
  fullWidth = true,
  error = false,
  className = '',
  ...props
}) {
  const base = 'bg-surface-container-lowest border text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-[10px]';
  const sizeClass = size === 'sm' ? 'text-xs h-9 px-3' : 'text-sm h-11 px-3.5';
  const borderClass = error ? 'border-error focus:ring-error' : 'border-outline-variant/60 focus:border-primary';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <input
      className={`${base} ${sizeClass} ${borderClass} ${widthClass} ${className}`.trim()}
      {...props}
    />
  );
}

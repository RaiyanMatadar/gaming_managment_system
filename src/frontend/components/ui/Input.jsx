import React from 'react';

export function Input({
  size = 'md',
  fullWidth = true,
  error = false,
  className = '',
  ...props
}) {
  const base = 'bg-surface-container-highest/50 border text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all rounded-[4px]';
  const sizeClass = size === 'sm' ? 'text-xs h-10 px-3' : 'text-body-medium h-12 px-4';
  const borderClass = error ? 'border-error focus:ring-error' : 'border-outline focus:ring-primary';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <input
      className={`${base} ${sizeClass} ${borderClass} ${widthClass} ${className}`.trim()}
      {...props}
    />
  );
}

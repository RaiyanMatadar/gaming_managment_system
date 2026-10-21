import React from 'react';

export function Input({
  size = 'md',
  fullWidth = true,
  error = false,
  className = '',
  ...props
}) {
  const base = 'bg-surface-container-lowest border text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors';
  const sizeClass = size === 'sm' ? 'text-xs py-1.5 px-3 rounded-lg' : 'text-xs sm:text-sm py-2 px-3.5 rounded-xl';
  const borderClass = error ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <input
      className={`${base} ${sizeClass} ${borderClass} ${widthClass} ${className}`.trim()}
      {...props}
    />
  );
}

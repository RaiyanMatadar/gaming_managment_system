import React from 'react';

const variantClasses = {
  primary: 'bg-primary-container/40 text-primary border border-primary/40',
  secondary: 'bg-secondary-container/40 text-on-secondary-container border border-secondary/30',
  tertiary: 'bg-tertiary-container/30 text-tertiary border border-tertiary/40',
  success: 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30',
  warning: 'bg-amber-950/40 text-amber-300 border border-amber-500/40',
  error: 'bg-error-container/50 text-on-error-container border border-error/40',
  neutral: 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40'
};

const sizeClasses = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded',
  sm: 'text-[11px] px-2 py-0.5 rounded-md',
  md: 'text-xs px-2.5 py-1 rounded-md',
  pill: 'text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full'
};

export function Badge({
  variant = 'primary',
  size = 'sm',
  className = '',
  children,
  ...props
}) {
  const vClass = variantClasses[variant] || variantClasses.primary;
  const sClass = sizeClasses[size] || sizeClasses.sm;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium whitespace-nowrap ${vClass} ${sClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}

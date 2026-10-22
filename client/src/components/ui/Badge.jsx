import React from 'react';

const variantClasses = {
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  success: 'bg-success-container text-on-success-container',
  warning: 'bg-warning-container text-on-warning-container',
  error: 'bg-error-container text-on-error-container',
  neutral: 'bg-surface-container-high text-on-surface-variant'
};

const sizeClasses = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded-full',
  sm: 'text-label-small px-2 py-0.5 rounded-full',
  md: 'text-label-medium px-2.5 py-1 rounded-full',
  pill: 'text-label-small px-3 py-1 rounded-full'
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

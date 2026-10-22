import React from 'react';

const variantClasses = {
  filled: 'bg-primary text-on-primary shadow-none hover:shadow-m3-1 active:shadow-none',
  tonal: 'bg-secondary-container text-on-secondary-container shadow-none hover:shadow-m3-1 active:shadow-none',
  outlined: 'border border-outline text-primary bg-transparent hover:bg-primary/8 active:bg-primary/10',
  text: 'text-primary bg-transparent hover:bg-primary/8 active:bg-primary/10',
  error: 'bg-error text-on-error shadow-none hover:shadow-m3-1 active:shadow-none',
  success: 'bg-success text-on-success shadow-none hover:shadow-m3-1 active:shadow-none'
};

const sizeClasses = {
  sm: 'h-8 px-3 text-label-small gap-1.5 shrink-0',
  md: 'h-10 px-4 text-label-large gap-2 shrink-0',
  lg: 'h-12 px-6 text-label-large gap-2.5 shrink-0',
  icon: 'w-8 h-8 p-0 text-center shrink-0',
  'icon-md': 'w-10 h-10 p-0 text-center shrink-0',
  'icon-lg': 'w-12 h-12 p-0 text-center shrink-0'
};

export function Button({
  variant = 'filled',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  children,
  ...props
}) {
  const base = 'm3-state-layer inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 rounded-full transition-all duration-200 ease-m3-standard select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-38 disabled:pointer-events-none cursor-pointer';
  const vClass = variantClasses[variant] || variantClasses.filled;
  const sClass = sizeClasses[size] || sizeClasses.md;
  const wClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${base} ${vClass} ${sClass} ${wClass} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

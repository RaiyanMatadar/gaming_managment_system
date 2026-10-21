import React from 'react';

const variantClasses = {
  filled: 'bg-primary text-on-primary hover:opacity-90 active:scale-[0.99] shadow-sm',
  tonal: 'bg-secondary-container text-on-secondary-container hover:opacity-90 active:scale-[0.99]',
  outlined: 'border border-outline-variant text-on-surface hover:bg-surface-container-high active:scale-[0.99]',
  text: 'text-primary hover:bg-surface-container-high active:scale-[0.99]',
  error: 'bg-error-container text-on-error-container border border-error/30 hover:opacity-90 active:scale-[0.99]',
  success: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:opacity-90 active:scale-[0.99]'
};

const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-xs rounded-lg',
  md: 'px-3.5 py-2 text-xs font-semibold rounded-xl',
  lg: 'px-4 py-2.5 text-sm font-semibold rounded-xl',
  icon: 'p-1.5 rounded-lg',
  'icon-md': 'p-2 rounded-xl'
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
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none select-none';
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

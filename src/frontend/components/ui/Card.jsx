import React from 'react';

const variantClasses = {
  container: 'bg-surface-container border border-outline-variant/60',
  low: 'bg-surface-container-low border border-outline-variant/40',
  lowest: 'bg-surface-container-lowest border border-outline-variant/50',
  high: 'bg-surface-container-high border border-outline-variant',
  outlined: 'bg-transparent border border-outline-variant'
};

export function Card({
  variant = 'container',
  rounded = 'rounded-xl',
  className = '',
  children,
  ...props
}) {
  const vClass = variantClasses[variant] || variantClasses.container;

  return (
    <div
      className={`${vClass} ${rounded} transition-colors ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

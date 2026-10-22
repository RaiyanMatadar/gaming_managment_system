import React from 'react';

/**
 * Material Design 3 Card Primitive
 * @param {'filled' | 'elevated' | 'outlined' | 'low' | 'lowest' | 'high'} variant
 */
const variantClasses = {
  filled: 'bg-surface-container text-on-surface border-none',
  container: 'bg-surface-container text-on-surface border-none',
  elevated: 'bg-surface-container-low text-on-surface shadow-m3-1 hover:shadow-m3-2 border-none',
  outlined: 'bg-surface text-on-surface border border-outline-variant/50',
  low: 'bg-surface-container-low text-on-surface border-none',
  lowest: 'bg-surface-container-lowest text-on-surface border-none',
  high: 'bg-surface-container-high text-on-surface border-none'
};

export function Card({
  variant = 'filled',
  rounded = 'rounded-[20px]',
  className = '',
  children,
  ...props
}) {
  const vClass = variantClasses[variant] || variantClasses.filled;

  return (
    <div
      className={`${vClass} ${rounded} transition-colors duration-200 ease-m3-standard ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

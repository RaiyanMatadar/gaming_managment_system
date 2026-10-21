import React from 'react';

/**
 * Material Design 3 Floating Action Button (FAB)
 * @param {'surface' | 'primary' | 'secondary' | 'tertiary'} color - M3 container color
 * @param {'sm' | 'md' | 'lg' | 'extended'} size - FAB size
 * @param {string} icon - Material symbol name or React element
 * @param {string} label - Optional label for extended FAB
 */
export function FAB({
  color = 'primary',
  size = 'md',
  className = '',
  icon,
  label,
  children,
  ...props
}) {
  const colorClasses = {
    primary: 'bg-primary-container text-on-primary-container hover:shadow-m3-4',
    secondary: 'bg-secondary-container text-on-secondary-container hover:shadow-m3-4',
    tertiary: 'bg-tertiary-container text-on-tertiary-container hover:shadow-m3-4',
    surface: 'bg-surface-container-high text-primary hover:shadow-m3-4'
  };

  const isExtended = Boolean(label);

  const sizeClasses = isExtended
    ? 'h-14 px-4 rounded-[16px] gap-3 text-label-large'
    : {
        sm: 'w-10 h-10 rounded-[12px] p-2',
        md: 'w-14 h-14 rounded-[16px] p-4',
        lg: 'w-24 h-24 rounded-[28px] p-6'
      }[size] || 'w-14 h-14 rounded-[16px] p-4';

  const cClass = colorClasses[color] || colorClasses.primary;

  return (
    <button
      className={`m3-state-layer inline-flex items-center justify-center font-medium shadow-m3-3 transition-all duration-200 ease-m3-standard cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-38 disabled:pointer-events-none ${cClass} ${sizeClasses} ${className}`.trim()}
      {...props}
    >
      {icon}
      {label && <span>{label}</span>}
      {children}
    </button>
  );
}

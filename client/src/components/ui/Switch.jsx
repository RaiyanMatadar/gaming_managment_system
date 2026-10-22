import React from 'react';

/**
 * Material Design 3 Switch Primitive
 */
export function Switch({
  checked,
  onChange,
  disabled = false,
  className = '',
  id,
  ...props
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      className={`relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-m3-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-38 ${
        checked ? 'bg-primary' : 'bg-surface-container-highest border-2 border-outline'
      } ${className}`}
      {...props}
    >
      <span
        className={`pointer-events-none inline-block transform rounded-full transition-all duration-200 ease-m3-standard ${
          checked
            ? 'translate-x-5 h-6 w-6 bg-on-primary'
            : 'translate-x-0 h-4 w-4 bg-outline my-auto'
        }`}
      />
    </button>
  );
}

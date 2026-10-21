import React from 'react';

/**
 * Material Symbols (Rounded) Icon component
 * @param {string} name - Ligature name for the Material Symbol (e.g., 'play_arrow', 'person')
 * @param {boolean} filled - Whether to use the filled variant
 * @param {number|string} size - Font size in px or CSS string
 */
export function Icon({ name, filled = false, size = 20, className = '', ...props }) {
  if (!name) return null;

  return (
    <span
      className={`material-symbols-rounded leading-none select-none shrink-0 ${className}`.trim()}
      style={{
        fontSize: typeof size === 'number' ? `${size}px` : size,
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
      }}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
}

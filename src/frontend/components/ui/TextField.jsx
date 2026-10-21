import React, { useState } from 'react';

/**
 * Material Design 3 Text Field
 * Supports outlined and filled variants, label, leading/trailing icons, and error states.
 */
export function TextField({
  variant = 'outlined',
  label,
  value,
  onChange,
  error,
  helperText,
  leadingIcon,
  trailingIcon,
  fullWidth = true,
  className = '',
  id,
  type = 'text',
  placeholder,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `m3-input-${Math.random().toString(36).substr(2, 9)}`;

  const isFilled = variant === 'filled';
  const hasValue = value !== undefined && value !== null && String(value).length > 0;

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-label-medium font-medium mb-1.5 transition-colors ${
            error ? 'text-error' : isFocused ? 'text-primary' : 'text-on-surface-variant'
          }`}
        >
          {label}
        </label>
      )}

      <div
        className={`relative flex items-center min-h-[48px] px-3.5 transition-all duration-200 ease-m3-standard ${
          isFilled
            ? 'bg-surface-container-highest rounded-t-[4px] border-b-2'
            : 'bg-transparent rounded-[4px] border'
        } ${
          error
            ? 'border-error text-error'
            : isFocused
            ? 'border-primary ring-1 ring-primary'
            : 'border-outline hover:border-on-surface'
        }`}
      >
        {leadingIcon && (
          <span className="mr-3 text-on-surface-variant shrink-0 flex items-center">
            {leadingIcon}
          </span>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent text-body-large text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
          {...props}
        />

        {trailingIcon && (
          <span className="ml-3 text-on-surface-variant shrink-0 flex items-center">
            {trailingIcon}
          </span>
        )}
      </div>

      {(error || helperText) && (
        <p className={`mt-1 text-label-small px-3.5 ${error ? 'text-error font-medium' : 'text-on-surface-variant'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

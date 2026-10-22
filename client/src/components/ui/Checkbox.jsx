import React from 'react';
import { Check } from 'lucide-react';

/**
 * Material Design 3 Checkbox Primitive
 */
export function Checkbox({
  checked,
  onChange,
  disabled = false,
  label,
  id,
  className = '',
  ...props
}) {
  const checkboxId = id || `m3-chk-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-center gap-3 cursor-pointer select-none text-body-medium text-on-surface ${
        disabled ? 'opacity-38 pointer-events-none' : ''
      } ${className}`}
    >
      <div className="relative flex items-center justify-center w-5 h-5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange && onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <div
          className={`w-[18px] h-[18px] rounded-[2px] transition-all duration-150 ease-m3-standard flex items-center justify-center ${
            checked
              ? 'bg-primary text-on-primary'
              : 'border-2 border-outline hover:border-on-surface'
          } peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2`}
        >
          {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>
      {label && <span>{label}</span>}
    </label>
  );
}

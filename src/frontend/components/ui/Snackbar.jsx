import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Material Design 3 Snackbar Component
 * Used for toasts and brief system feedback.
 */
export function Snackbar({
  message,
  type = 'info', // 'info' | 'error' | 'warning' | 'success'
  actionLabel,
  onAction,
  onClose,
  className = ''
}) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 min-h-[48px] px-4 py-3 rounded-[8px] bg-inverse-surface text-inverse-on-surface shadow-m3-3 text-body-medium animate-in slide-in-from-bottom-3 duration-200 ease-m3-standard max-w-md ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {type === 'error' && (
          <span className="material-symbols-rounded text-error text-[20px]">error</span>
        )}
        {type === 'warning' && (
          <span className="material-symbols-rounded text-amber-300 text-[20px]">warning</span>
        )}
        {type === 'success' && (
          <span className="material-symbols-rounded text-emerald-300 text-[20px]">check_circle</span>
        )}
        <span>{message}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {actionLabel && (
          <Button
            variant="text"
            size="sm"
            onClick={onAction}
            className="text-inverse-primary hover:bg-inverse-on-surface/8 px-2"
          >
            {actionLabel}
          </Button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full text-inverse-on-surface/80 hover:text-inverse-on-surface hover:bg-inverse-on-surface/10 transition-colors"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

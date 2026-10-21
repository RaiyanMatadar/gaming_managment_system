import React from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen = true,
  onClose,
  maxWidth = 'max-w-md',
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary bg-primary-container/30 border-primary/30',
  headerBadge,
  children
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-surface-container border border-outline-variant/70 rounded-xl w-full ${maxWidth} p-6 shadow-2xl relative transition-all`}
        role="dialog"
        aria-modal="true"
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {(title || Icon) && (
          <div className="flex items-center justify-between gap-3 mb-5 pb-3.5 border-b border-outline-variant/40">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <div>
                {title && <h3 className="text-base font-bold text-on-surface tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {headerBadge && <div>{headerBadge}</div>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Material Design 3 Dialog / Modal Primitive
 * Features 28px rounded corners, tonal surface-container-high surface, soft elevation, and generous padding.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: IconComponent,
  iconColor = 'text-primary bg-primary-container',
  maxWidth = 'max-w-md',
  children,
  footer
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-scrim/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* M3 Dialog Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} bg-surface-container-high text-on-surface rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 shadow-m3-3 z-10 animate-in fade-in zoom-in-95 duration-200 ease-m3-standard max-h-[calc(100vh-2rem)] overflow-y-auto`}
      >
        {/* Header */}
        {(title || IconComponent) && (
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-4">
              {IconComponent && (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
                  {typeof IconComponent === 'string' ? (
                    <span className="material-symbols-rounded text-[20px]">{IconComponent}</span>
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="headline-small text-on-surface font-normal">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="body-medium text-on-surface-variant mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="text"
              size="icon"
              onClick={onClose}
              aria-label="Close dialog"
              className="text-on-surface-variant hover:text-on-surface shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Content Body */}
        <div className="body-medium text-on-surface-variant">
          {children}
        </div>

        {/* Actions Footer */}
        {footer && (
          <div className="mt-6 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

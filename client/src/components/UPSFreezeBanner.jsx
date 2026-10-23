import React, { useState } from 'react';
import { Zap, Play, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button, Card, Modal } from './ui';

export function UPSFreezeBanner({
  isEmergencyFrozen,
  frozenCount,
  onTriggerFreeze,
  onResumeAll,
  isSubmitting
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!isEmergencyFrozen) return null;

  return (
    <>
      <div className="bg-warning-container text-on-warning-container border-b border-warning/40 px-3 py-2.5 sm:px-6 shadow-md animate-in slide-in-from-top duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="p-1 rounded-full bg-warning text-on-warning animate-pulse">
              <Zap className="w-4 h-4 fill-current" />
            </span>
            <div>
              <span className="font-black uppercase tracking-wider text-warning">
                UPS Power Cut Mode Active:
              </span>{' '}
              <span>
                {frozenCount} {frozenCount === 1 ? 'session' : 'sessions'} paused. Overtime clock accumulation is frozen.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="filled"
              size="sm"
              onClick={onResumeAll}
              disabled={isSubmitting}
              className="bg-warning hover:bg-warning/90 text-on-warning font-bold text-xs shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSubmitting ? 'Resuming...' : '⚡ Resume Floor Clocks'}</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function UPSFreezeModal({ isOpen, onClose, onConfirm, isSubmitting, activeCount }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title="Power Cut / UPS Emergency Freeze"
      subtitle="Immediate Floor Protection"
      icon={Zap}
      iconColor="text-warning bg-warning-container"
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-[16px] bg-warning-container/30 border border-warning/40 text-xs text-on-surface space-y-2">
          <p className="font-semibold text-warning flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Protect Customers from Unfair Overtime</span>
          </p>
          <p className="text-on-surface-variant">
            During power grid drops or generator changeovers, triggering UPS Freeze immediately pauses all {activeCount} active sessions across the arena.
          </p>
          <p className="text-on-surface-variant">
            Once main electricity or generator power is stable, click <strong>"Resume Floor Clocks"</strong> to resume gameplay countdowns seamlessly.
          </p>
        </div>

        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="tonal" onClick={onClose} className="flex-1" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-warning text-on-warning font-bold text-xs"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{isSubmitting ? 'Freezing...' : 'Freeze All Clocks Now'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}

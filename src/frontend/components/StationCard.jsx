import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Tv,
  Glasses,
  Play,
  Pause,
  ArrowRightLeft,
  Clock,
  Plus,
  CreditCard,
  Wrench,
  User,
  XCircle,
  Phone
} from 'lucide-react';
import { Button, Badge } from './ui';

function getHardwareBadge(type) {
  switch (type) {
    case 'PS5':
      return { label: 'PlayStation 5', icon: Tv, color: 'text-tertiary bg-tertiary-container/30 border-tertiary/40' };
    case 'XBOX':
      return { label: 'Xbox Series X', icon: Tv, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' };
    case 'VR':
      return { label: 'VR Simulator', icon: Glasses, color: 'text-secondary bg-secondary-container/30 border-secondary/40' };
    case 'PC_VIP':
      return { label: 'VIP PC', icon: Monitor, color: 'text-amber-400 bg-amber-950/40 border-amber-500/30' };
    case 'PC_STANDARD':
    default:
      return { label: 'PC Standard', icon: Monitor, color: 'text-primary bg-primary-container/30 border-primary/30' };
  }
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  }
  return [
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
}

export function StationCard({
  station,
  onStart,
  onStartSession,
  onPause,
  onPauseSession,
  onResume,
  onResumeSession,
  onExtend,
  onExtendSession,
  onTransfer,
  onTransferSession,
  onCheckout,
  onCheckoutSession,
  onCancel,
  onCancelSession,
  onToggleMaintenance
}) {
  const startSession = onStart || onStartSession;
  const pauseSession = onPause || onPauseSession;
  const resumeSession = onResume || onResumeSession;
  const extendSession = onExtend || onExtendSession;
  const transferSession = onTransfer || onTransferSession;
  const checkoutSession = onCheckout || onCheckoutSession;
  const cancelSession = onCancel || onCancelSession;

  const live = station.liveSession;
  const isOccupied = station.status === 'OCCUPIED' && live;
  const isMaintenance = station.status === 'MAINTENANCE';

  // 1-second ticker for real-time countdown / overtime display
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isOccupied) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOccupied]);

  // Compute live time delta
  let remainingMs = 0;
  let overtimeMs = 0;
  let isWarning = false;
  let isOvertime = false;
  let currentStatus = station.status;

  if (isOccupied && live) {
    if (live.status === 'PAUSED') {
      currentStatus = 'PAUSED';
    } else {
      const scheduledEndMs = new Date(live.scheduledEndTime).getTime();
      const diffMs = scheduledEndMs - now;

      if (diffMs > 0) {
        remainingMs = diffMs;
        if (diffMs <= 5 * 60 * 1000) {
          isWarning = true;
          currentStatus = 'WARNING';
        } else {
          currentStatus = 'ACTIVE';
        }
      } else {
        overtimeMs = Math.abs(diffMs);
        isOvertime = true;
        currentStatus = 'EXPIRED_UNSETTLED';
      }
    }
  }

  const hardware = getHardwareBadge(station.type);
  const HardwareIcon = hardware.icon;

  // Station card terminal styling
  let borderStyles = 'border-outline-variant/60 bg-surface-container';
  let badgeStyles = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  let badgeLabel = 'Ready for walk-in';

  if (isMaintenance) {
    borderStyles = 'border-outline-variant/40 bg-surface-container-low opacity-75';
    badgeStyles = 'bg-surface-container-high text-on-surface-variant border-outline-variant';
    badgeLabel = 'Under maintenance';
  } else if (currentStatus === 'EXPIRED_UNSETTLED') {
    borderStyles = 'border-error/70 bg-error-container/30 shadow-sm';
    badgeStyles = 'bg-error-container text-on-error-container border-error/40 font-semibold';
    badgeLabel = 'Overtime accruing';
  } else if (currentStatus === 'WARNING') {
    borderStyles = 'border-amber-500/70 bg-amber-950/40 shadow-sm';
    badgeStyles = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold';
    badgeLabel = 'Expiring soon';
  } else if (currentStatus === 'PAUSED') {
    borderStyles = 'border-tertiary/50 bg-tertiary-container/20';
    badgeStyles = 'bg-tertiary-container text-tertiary border-tertiary/40 font-semibold';
    badgeLabel = 'Timer paused';
  } else if (isOccupied) {
    borderStyles = 'border-primary/40 bg-surface-container-high';
    badgeStyles = 'bg-primary-container text-on-primary-container border-primary/30 font-medium';
    badgeLabel = 'In play';
  }

  return (
    <div className={`rounded-xl border p-4 sm:p-5 flex flex-col justify-between transition-colors ${borderStyles}`}>
      <div>
        {/* Terminal Header: Station Name & Hardware Tag */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-outline-variant/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-on-surface tracking-tight">
                {station.name}
              </h3>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded border inline-flex items-center gap-1 ${hardware.color}`}>
                <HardwareIcon className="w-3 h-3" />
                {hardware.label}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              ₹{station.hourlyRate} per hour
            </p>
          </div>

          <span className={`text-[11px] px-2.5 py-1 rounded-md border font-medium whitespace-nowrap ${badgeStyles}`}>
            {badgeLabel}
          </span>
        </div>

        {/* Live Session Body (Occupied Station) */}
        {isOccupied && (
          <div className="my-3.5 space-y-3">
            {/* Player Information */}
            <div className="flex items-center justify-between text-xs py-1 border-b border-outline-variant/40">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-outline" />
                Player:
              </span>
              <span className="font-semibold text-on-surface truncate max-w-[150px]">
                {live.customerName}
              </span>
            </div>

            {live.customerPhone && (
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-outline" />
                  Phone:
                </span>
                <span className="font-mono tabular-nums text-on-surface">{live.customerPhone}</span>
              </div>
            )}

            {/* Time Countdown / Overtime Meter */}
            <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-between">
              <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-outline" />
                <span>{isOvertime ? 'Overtime:' : 'Remaining:'}</span>
              </div>

              {isOvertime ? (
                <div className="text-right">
                  <span className="font-mono tabular-nums text-base font-bold text-error">
                    +{formatDuration(overtimeMs)}
                  </span>
                  {live.overtimeFee > 0 && (
                    <span className="block text-[11px] text-error font-semibold">
                      Accrued: ₹{live.overtimeFee}
                    </span>
                  )}
                </div>
              ) : currentStatus === 'PAUSED' ? (
                <span className="text-xs font-semibold text-tertiary">
                  Timer paused
                </span>
              ) : (
                <span className={`font-mono tabular-nums text-lg font-bold ${isWarning ? 'text-amber-400' : 'text-primary'}`}>
                  {formatDuration(remainingMs)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Maintenance State */}
        {isMaintenance && (
          <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 my-3 text-xs text-on-surface-variant flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Station temporarily offline for service</span>
          </div>
        )}

        {/* Available State Ready Prompt */}
        {station.status === 'AVAILABLE' && (
          <div className="py-5 my-2 text-center border border-dashed border-outline-variant/60 rounded-lg bg-surface-container-lowest/50">
            <p className="text-xs text-on-surface-variant">
              Ready for immediate player assignment
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-outline-variant/40 flex flex-wrap gap-2">
        {/* Available Actions */}
        {station.status === 'AVAILABLE' && (
          <>
            <Button
              variant="filled"
              size="sm"
              onClick={() => startSession && startSession(station)}
              className="flex-1"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start session</span>
            </Button>
            <Button
              variant="outlined"
              size="sm"
              onClick={() => onToggleMaintenance(station._id, 'MAINTENANCE')}
              title="Set to maintenance"
              aria-label="Maintenance toggle"
            >
              <Wrench className="w-3.5 h-3.5" />
            </Button>
          </>
        )}

        {/* Occupied Actions: Extend, Pause, Transfer, Cancel, Checkout */}
        {isOccupied && (
          <>
            {/* Extend */}
            <Button
              variant="outlined"
              size="sm"
              onClick={() => extendSession && extendSession(live.sessionId, station.name)}
              title="Add 15, 30, or 60 minutes"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Extend</span>
            </Button>

            {/* Pause / Resume */}
            {currentStatus === 'PAUSED' ? (
              <Button
                variant="success"
                size="sm"
                onClick={() => resumeSession && resumeSession(live.sessionId)}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="sm"
                onClick={() => pauseSession && pauseSession(live.sessionId)}
                title="Pause billing timer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </Button>
            )}

            {/* Transfer */}
            <Button
              variant="outlined"
              size="sm"
              onClick={() => transferSession && transferSession(live.sessionId, station.name)}
              title="Transfer customer to another PC"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-on-surface-variant" />
              <span>Transfer</span>
            </Button>

            {/* Cancel Session */}
            {cancelSession && (
              <Button
                variant="error"
                size="sm"
                onClick={() => cancelSession(live.sessionId, station.name)}
                title="Cancel session if customer decides not to play"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </Button>
            )}

            {/* Checkout */}
            <Button
              variant="filled"
              size="sm"
              onClick={() => checkoutSession && checkoutSession(live.sessionId, station.name)}
              className={`flex-1 ${
                isOvertime
                  ? 'bg-error text-on-error hover:opacity-90'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Checkout</span>
            </Button>
          </>
        )}

        {/* Maintenance Actions */}
        {isMaintenance && (
          <Button
            variant="outlined"
            size="sm"
            fullWidth
            onClick={() => onToggleMaintenance(station._id, 'AVAILABLE')}
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark ready for walk-in</span>
          </Button>
        )}
      </div>
    </div>
  );
}

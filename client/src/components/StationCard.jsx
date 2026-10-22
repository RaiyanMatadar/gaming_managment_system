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
  Phone,
  Trash2
} from 'lucide-react';
import { Button, Badge, Card } from './ui';

function getHardwareBadge(type) {
  switch (type) {
    case 'PS5':
      return { label: 'PS5', icon: Tv, variant: 'tertiary' };
    case 'XBOX':
      return { label: 'Xbox', icon: Tv, variant: 'success' };
    case 'VR':
      return { label: 'VR', icon: Glasses, variant: 'secondary' };
    case 'PC_VIP':
      return { label: 'VIP PC', icon: Monitor, variant: 'warning' };
    case 'PC_STANDARD':
    default:
      return { label: 'Standard PC', icon: Monitor, variant: 'primary' };
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
  onToggleMaintenance,
  onDelete,
  onDeleteStation
}) {
  const startSession = onStart || onStartSession;
  const pauseSession = onPause || onPauseSession;
  const resumeSession = onResume || onResumeSession;
  const extendSession = onExtend || onExtendSession;
  const transferSession = onTransfer || onTransferSession;
  const checkoutSession = onCheckout || onCheckoutSession;
  const cancelSession = onCancel || onCancelSession;
  const deleteStation = onDelete || onDeleteStation;

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

  // Station card styling
  let cardVariant = 'container';
  let badgeVariant = 'success';
  let badgeLabel = 'Available';

  if (isMaintenance) {
    cardVariant = 'low';
    badgeVariant = 'neutral';
    badgeLabel = 'In Repair';
  } else if (currentStatus === 'EXPIRED_UNSETTLED') {
    cardVariant = 'high';
    badgeVariant = 'error';
    badgeLabel = 'Extra Time';
  } else if (currentStatus === 'WARNING') {
    cardVariant = 'high';
    badgeVariant = 'warning';
    badgeLabel = 'Ending Soon';
  } else if (currentStatus === 'PAUSED') {
    cardVariant = 'container';
    badgeVariant = 'tertiary';
    badgeLabel = 'Paused';
  } else if (isOccupied) {
    cardVariant = 'high';
    badgeVariant = 'primary';
    badgeLabel = 'In Use';
  }

  return (
    <Card variant={cardVariant} className="p-3.5 sm:p-4 flex flex-col justify-between h-full border border-outline-variant/40 hover:border-outline-variant/70 transition-all overflow-hidden">
      <div>
        {/* Header: Station Name, Type, Price, Status */}
        <div className="pb-2 sm:pb-2.5 border-b border-outline-variant/40">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h3
              className="title-medium font-bold text-on-surface tracking-tight truncate flex-1 min-w-0"
              title={station.name}
            >
              {station.name}
            </h3>
            <Badge variant={badgeVariant} size="sm" className="shrink-0">
              {badgeLabel}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-2 mt-1 text-xs text-on-surface-variant">
            <Badge variant={hardware.variant} size="xs" className="inline-flex items-center gap-1">
              <HardwareIcon className="w-3 h-3" />
              <span>{hardware.label}</span>
            </Badge>
            <span className="font-semibold text-on-surface">
              ₹{station.hourlyRate}/hr
            </span>
          </div>
        </div>

        {/* Live Session Body (Occupied Station) */}
        {isOccupied && (
          <div className="my-2.5 space-y-2 min-h-[72px] flex flex-col justify-center">
            {/* Player Information */}
            <div className="flex items-center justify-between text-xs py-0.5 border-b border-outline-variant/30">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-outline" />
                Player:
              </span>
              <span className="font-semibold text-on-surface truncate max-w-[130px]" title={live.customerName}>
                {live.customerName}
              </span>
            </div>

            {live.customerPhone ? (
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-outline" />
                  Phone:
                </span>
                <span className="font-mono tabular-nums text-on-surface">{live.customerPhone}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-on-surface-variant/50">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-outline/50" />
                  Phone:
                </span>
                <span>Not set</span>
              </div>
            )}

            {/* Time Countdown / Overtime Meter */}
            <div className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-between">
              <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-outline" />
                <span>{isOvertime ? 'Extra time:' : 'Time left:'}</span>
              </div>

              {isOvertime ? (
                <div className="text-right">
                  <span className="font-mono tabular-nums text-sm font-bold text-error">
                    +{formatDuration(overtimeMs)}
                  </span>
                  {live.overtimeFee > 0 && (
                    <span className="block text-[10px] text-error font-semibold">
                      Extra: ₹{live.overtimeFee}
                    </span>
                  )}
                </div>
              ) : currentStatus === 'PAUSED' ? (
                <span className="text-xs font-semibold text-tertiary">
                  Paused
                </span>
              ) : (
                <span className={`font-mono tabular-nums text-sm sm:text-base font-bold ${isWarning ? 'text-warning' : 'text-primary'}`}>
                  {formatDuration(remainingMs)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Maintenance State */}
        {isMaintenance && (
          <div className="my-2.5 py-3.5 px-3 text-center border border-outline-variant/50 rounded-xl bg-surface-container-lowest/40 flex flex-col items-center justify-center min-h-[72px] text-xs text-on-surface-variant">
            <Wrench className="w-4 h-4 text-warning mb-1" />
            <p className="text-xs font-semibold text-warning">In Repair</p>
            <p className="text-[11px] text-on-surface-variant">Offline for maintenance</p>
          </div>
        )}

        {/* Available State Prompt */}
        {station.status === 'AVAILABLE' && (
          <div className="my-2.5 py-3.5 px-3 text-center border border-dashed border-outline-variant/60 rounded-xl bg-surface-container-lowest/40 flex flex-col items-center justify-center min-h-[72px]">
            <Monitor className="w-4 h-4 text-outline mb-1 opacity-70" />
            <p className="text-xs font-semibold text-on-surface">Ready to Play</p>
            <p className="text-[11px] text-on-surface-variant">Click Start Session below</p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2.5 border-t border-outline-variant/40 space-y-1.5">
        {/* Available Actions: Prominent Full-Width Start + Secondary Row */}
        {station.status === 'AVAILABLE' && (
          <div className="space-y-1.5">
            <Button
              variant="filled"
              size="md"
              fullWidth
              onClick={() => startSession && startSession(station)}
              className="font-medium whitespace-nowrap shadow-sm hover:shadow-md"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>Start Session</span>
            </Button>
            <div className={`grid ${deleteStation ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
              <Button
                variant="outlined"
                size="sm"
                onClick={() => onToggleMaintenance(station._id, 'MAINTENANCE')}
                title="Mark for repair"
                aria-label="Maintenance toggle"
                className="text-xs text-on-surface-variant hover:text-on-surface border-outline-variant/60 w-full justify-center px-1"
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Maintenance</span>
              </Button>
              {deleteStation && (
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => deleteStation(station)}
                  title="Delete this computer"
                  aria-label="Delete computer"
                  className="text-xs text-error hover:bg-error-container/20 border-outline-variant/60 w-full justify-center px-1"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Delete PC</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Occupied Actions: Balanced 2x2 + 1 Layout */}
        {isOccupied && (
          <div className="space-y-1.5">
            {/* Row 1: Pause/Resume (50%) + Add Time (50%) */}
            <div className="flex gap-1.5">
              {currentStatus === 'PAUSED' ? (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => resumeSession && resumeSession(live.sessionId)}
                  className="flex-1 text-xs"
                  title="Resume countdown"
                >
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Resume</span>
                </Button>
              ) : (
                <Button
                  variant="tonal"
                  size="sm"
                  onClick={() => pauseSession && pauseSession(live.sessionId)}
                  className="flex-1 text-xs"
                  title="Pause countdown"
                >
                  <Pause className="w-3.5 h-3.5 shrink-0" />
                  <span>Pause</span>
                </Button>
              )}

              <Button
                variant="tonal"
                size="sm"
                onClick={() => extendSession && extendSession(live.sessionId, station.name)}
                className="flex-1 text-xs"
                title="Add 15, 30, or 60 minutes"
              >
                <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Add Time</span>
              </Button>
            </div>

            {/* Row 2: Move PC (50%) + Cancel Session (50%) */}
            <div className="flex gap-1.5">
              <Button
                variant="outlined"
                size="sm"
                onClick={() => transferSession && transferSession(live.sessionId, station.name)}
                className="flex-1 text-xs"
                title="Move player to another computer"
              >
                <ArrowRightLeft className="w-3 h-3 text-on-surface-variant shrink-0" />
                <span>Move</span>
              </Button>

              {cancelSession && (
                <Button
                  variant="error"
                  size="sm"
                  onClick={() => cancelSession(live.sessionId, station.name, live.customerName)}
                  className="flex-1 text-xs"
                  title="Cancel active session and release computer"
                >
                  <XCircle className="w-3 h-3 shrink-0" />
                  <span>Cancel</span>
                </Button>
              )}
            </div>

            {/* Row 3: Checkout & Settle (100% full-width) */}
            <Button
              variant={isOvertime ? 'error' : 'success'}
              size="sm"
              fullWidth
              onClick={() => checkoutSession && checkoutSession(live.sessionId, station.name)}
              className="mt-0.5"
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span>Checkout & Settle</span>
            </Button>
          </div>
        )}

        {/* Maintenance Actions */}
        {isMaintenance && (
          <div className="space-y-1.5">
            <Button
              variant="tonal"
              size="md"
              fullWidth
              onClick={() => onToggleMaintenance(station._id, 'AVAILABLE')}
              className="font-medium whitespace-nowrap text-success"
            >
              <Wrench className="w-4 h-4 text-success shrink-0" />
              <span>Mark Available</span>
            </Button>
            {deleteStation && (
              <Button
                variant="outlined"
                size="sm"
                fullWidth
                onClick={() => deleteStation(station)}
                title="Delete this computer"
                aria-label="Delete computer"
                className="text-xs text-error hover:bg-error-container/20 border-outline-variant/60"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Delete PC</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

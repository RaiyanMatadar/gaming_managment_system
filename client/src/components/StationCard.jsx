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
  Trash2,
  Zap,
  Flame,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { Button, Badge, Card } from './ui';

function getHardwareBadge(type) {
  switch (type) {
    case 'PS5':
      return {
        label: 'PlayStation 5',
        icon: Tv,
        variant: 'tertiary',
        image: '/images/ps5_console_station.jpg',
        specs: 'PS5 • 4K 120Hz HDR'
      };
    case 'XBOX':
      return {
        label: 'Xbox Series X',
        icon: Tv,
        variant: 'success',
        image: '/images/xbox_controller_lounge.jpg',
        specs: 'Series X • Game Pass'
      };
    case 'VR':
      return {
        label: 'VR Arena',
        icon: Glasses,
        variant: 'secondary',
        image: '/images/vr_player_experience.jpg',
        specs: '6-DOF VR • Immersive 120Hz'
      };
    case 'PC_VIP':
      return {
        label: 'VIP Battlestation',
        icon: Monitor,
        variant: 'warning',
        image: '/images/cyberpunk_battlestation.jpg',
        specs: 'RTX 4080 • Liquid-Cooled 240Hz'
      };
    case 'PC_STANDARD':
    default:
      return {
        label: 'Gaming PC',
        icon: Monitor,
        variant: 'primary',
        image: '/images/pc_gaming_rig.jpg',
        specs: 'RTX Rig • Mechanical RGB'
      };
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
  onDeleteStation,
  onDeskQR
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

  // Compute live time delta & progress percentage
  let remainingMs = 0;
  let overtimeMs = 0;
  let isWarning = false;
  let isOvertime = false;
  let currentStatus = station.status;
  let progressPercent = 0;

  if (isOccupied && live) {
    if (live.status === 'PAUSED') {
      currentStatus = 'PAUSED';
    } else {
      const scheduledEndMs = new Date(live.scheduledEndTime).getTime();
      const diffMs = scheduledEndMs - now;

      const startMs = new Date(live.startTime).getTime();
      const totalDurationMs = Math.max(1, scheduledEndMs - startMs);
      const elapsedMs = Math.max(0, now - startMs);
      progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

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
        progressPercent = 100;
      }
    }
  }

  const hardware = getHardwareBadge(station.type);
  const HardwareIcon = hardware.icon;

  // Station card styling & pulse classes
  let cardVariant = 'container';
  let badgeVariant = 'success';
  let badgeLabel = 'Available';
  let borderPulseClass = 'border-outline-variant/40 hover:border-success/60 hover:cyber-glow-state-available';

  if (isMaintenance) {
    cardVariant = 'low';
    badgeVariant = 'neutral';
    badgeLabel = 'In Repair';
    borderPulseClass = 'border-outline-variant/40 opacity-80';
  } else if (currentStatus === 'EXPIRED_UNSETTLED') {
    cardVariant = 'high';
    badgeVariant = 'error';
    badgeLabel = 'Extra Time';
    borderPulseClass = 'border-error animate-pulse-red cyber-glow-state-error';
  } else if (currentStatus === 'WARNING') {
    cardVariant = 'high';
    badgeVariant = 'warning';
    badgeLabel = 'Ending Soon';
    borderPulseClass = 'border-warning animate-pulse-amber cyber-glow-state-warning';
  } else if (currentStatus === 'PAUSED') {
    cardVariant = 'container';
    badgeVariant = 'tertiary';
    badgeLabel = 'Paused';
    borderPulseClass = 'border-tertiary/60';
  } else if (isOccupied) {
    cardVariant = 'high';
    badgeVariant = 'primary';
    badgeLabel = 'In Use';
    borderPulseClass = 'border-primary/60 animate-pulse-blue cyber-glow-state-active';
  }

  return (
    <Card
      variant={cardVariant}
      className={`gaming-station-card flex flex-col justify-between h-full border ${borderPulseClass} transition-all overflow-hidden rounded-2xl group`}
    >
      <div>
        {/* Gaming Visual Banner Header */}
        <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-surface-container-lowest">
          <img
            src={hardware.image}
            alt={station.name}
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Subtle Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-black/50" />

          {/* Top Status Indicators & Hardware Type */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-background/85 text-on-surface backdrop-blur-md border border-outline-variant/30 shadow-sm">
              <HardwareIcon className="w-3 h-3 text-primary shrink-0" />
              <span className="truncate max-w-[90px]">{hardware.label}</span>
            </span>

            <Badge variant={badgeVariant} size="xs" className="shrink-0 font-bold tracking-wider backdrop-blur-md shadow-sm">
              {currentStatus === 'ACTIVE' && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping mr-1 inline-block" />
              )}
              {currentStatus === 'WARNING' && (
                <AlertTriangle className="w-3 h-3 text-warning inline mr-0.5" />
              )}
              {currentStatus === 'EXPIRED_UNSETTLED' && (
                <Flame className="w-3 h-3 text-error inline mr-0.5" />
              )}
              {badgeLabel}
            </Badge>
          </div>

          {/* Bottom Specs & Hourly Rate Badge */}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between z-10 text-[11px]">
            <span className="font-mono text-on-surface font-medium truncate max-w-[160px] drop-shadow-sm opacity-90">
              {hardware.specs}
            </span>
            <span className="font-bold text-on-surface bg-surface-container-high/90 px-2 py-0.5 rounded-md backdrop-blur-sm border border-outline-variant/40 tabular-nums shadow-sm">
              ₹{station.hourlyRate}/hr
            </span>
          </div>
        </div>

        {/* Station Title & Live Info */}
        <div className="p-3 sm:p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h3
              className="title-medium font-bold text-on-surface tracking-tight truncate flex-1 min-w-0 flex items-center gap-1.5"
              title={station.name}
            >
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <span>{station.name}</span>
            </h3>

            {/* Live Audio / In-Game Equalizer Feedback */}
            {isOccupied && currentStatus !== 'PAUSED' && (
              <div
                className="flex items-end gap-0.5 h-4 px-1.5 py-0.5 rounded-md bg-primary-container/40 border border-primary/30 shrink-0"
                title="Live Gameplay Telemetry"
              >
                <span className="w-1 bg-primary rounded-full animate-eq-1" />
                <span className="w-1 bg-primary rounded-full animate-eq-2" />
                <span className="w-1 bg-primary rounded-full animate-eq-3" />
                <span className="w-1 bg-primary rounded-full animate-eq-4" />
              </div>
            )}

            {/* Ready Radar Ping for Available Rigs */}
            {!isOccupied && !isMaintenance && (
              <div className="flex items-center gap-1.5 shrink-0" title="Station Ready">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
              </div>
            )}

            {onDeskQR && (
              <button
                type="button"
                onClick={() => onDeskQR(station)}
                title="Desk QR Code & In-Seat Self-Service Portal"
                aria-label="Desk QR Code"
                className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4 shrink-0" />
              </button>
            )}
          </div>

          {/* Live Session Body (Occupied Station) */}
          {isOccupied && (
            <div className="space-y-2 pt-1 border-t border-outline-variant/30">
              {/* Player Information */}
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-outline" />
                  Player:
                </span>
                <span className="font-semibold text-on-surface truncate max-w-[140px]" title={live.customerName}>
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
                  <span>Walk-in</span>
                </div>
              )}

              {/* Time Countdown / Overtime Meter */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 flex flex-col gap-1.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-outline" />
                    <span>{isOvertime ? 'Overtime:' : 'Remaining:'}</span>
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

                {/* Cyber Progress Bar for Active Countdown */}
                {!isOvertime && currentStatus !== 'PAUSED' && (
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isWarning ? 'bg-warning' : 'bg-primary'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Maintenance State */}
          {isMaintenance && (
            <div className="py-3 px-3 text-center border border-outline-variant/50 rounded-xl bg-surface-container-lowest/40 flex flex-col items-center justify-center min-h-[64px] text-xs text-on-surface-variant">
              <Wrench className="w-4 h-4 text-warning mb-1" />
              <p className="text-xs font-semibold text-warning">Bench / Maintenance</p>
              <p className="text-[11px] text-on-surface-variant">Station hardware offline</p>
            </div>
          )}

          {/* Available State Prompt */}
          {station.status === 'AVAILABLE' && (
            <div className="py-2.5 px-3 text-center border border-dashed border-outline-variant/60 rounded-xl bg-surface-container-lowest/40 flex items-center justify-between min-h-[52px]">
              <div className="text-left">
                <p className="text-xs font-semibold text-on-surface flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success inline-block animate-pulse" />
                  Ready For Gamer
                </p>
                <p className="text-[10px] text-on-surface-variant">Instant check-in ready</p>
              </div>
              <Badge variant="success" size="xs">0 min waiting</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 sm:p-3.5 pt-0 space-y-1.5">
        {/* Available Actions: Prominent Full-Width Start + Secondary Row */}
        {station.status === 'AVAILABLE' && (
          <div className="space-y-1.5">
            <Button
              variant="filled"
              size="md"
              fullWidth
              onClick={() => startSession && startSession(station)}
              className="font-medium whitespace-nowrap shadow-sm hover:shadow-md cyber-glow-primary"
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

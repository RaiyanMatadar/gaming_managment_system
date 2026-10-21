import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Tv,
  Glasses,
  Play,
  Pause,
  ArrowRightLeft,
  Clock,
  PlusCircle,
  CreditCard,
  Wrench,
  AlertTriangle,
  User,
  CheckCircle2,
  XCircle
} from 'lucide-react';

function getStationIcon(type) {
  switch (type) {
    case 'PS5':
      return <Tv className="w-5 h-5 text-indigo-400" />;
    case 'XBOX':
      return <Tv className="w-5 h-5 text-emerald-400" />;
    case 'VR':
      return <Glasses className="w-5 h-5 text-fuchsia-400" />;
    case 'PC_VIP':
      return <Monitor className="w-5 h-5 text-amber-400" />;
    case 'PC_STANDARD':
    default:
      return <Monitor className="w-5 h-5 text-blue-400" />;
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

  // Card theme styling
  let cardStyles = 'bg-slate-900 border-slate-800 hover:border-slate-700/80 shadow-sm';
  let badgeStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let badgeLabel = 'Available';

  if (isMaintenance) {
    cardStyles = 'bg-slate-950/80 border-slate-800/80 opacity-80';
    badgeStyles = 'bg-slate-800 text-slate-400 border-slate-700';
    badgeLabel = 'Maintenance';
  } else if (currentStatus === 'EXPIRED_UNSETTLED') {
    cardStyles = 'bg-red-950/20 border-red-500/70 shadow-lg shadow-red-900/20 animate-pulse-glow';
    badgeStyles = 'bg-red-500/20 text-red-300 border-red-500/50 font-bold';
    badgeLabel = 'Overtime Active';
  } else if (currentStatus === 'WARNING') {
    cardStyles = 'bg-amber-950/20 border-amber-500/70 shadow-lg shadow-amber-900/20';
    badgeStyles = 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold animate-pulse';
    badgeLabel = 'Expiring in < 5m';
  } else if (currentStatus === 'PAUSED') {
    cardStyles = 'bg-purple-950/20 border-purple-500/50';
    badgeStyles = 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold';
    badgeLabel = 'Timer Paused';
  } else if (isOccupied) {
    cardStyles = 'bg-slate-900 border-blue-500/30 hover:border-blue-500/50 shadow-md shadow-blue-900/10';
    badgeStyles = 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-semibold';
    badgeLabel = 'In Session';
  }

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${cardStyles}`}>
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0">
              {getStationIcon(station.type)}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                {station.name}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                ₹{station.hourlyRate}/hr • <span className="capitalize">{station.type.replace('_', ' ').toLowerCase()}</span>
              </p>
            </div>
          </div>

          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold tracking-wide ${badgeStyles}`}>
            {badgeLabel}
          </span>
        </div>

        {/* Live Session Body */}
        {isOccupied && (
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 my-3 space-y-2.5">
            {/* Customer Info */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Player:
              </span>
              <span className="font-bold text-white truncate max-w-[150px]">
                {live.customerName}
              </span>
            </div>

            {/* Countdown / Overtime Meter */}
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isOvertime ? 'Overtime:' : 'Remaining:'}</span>
              </div>

              {isOvertime ? (
                <div className="text-right">
                  <span className="font-mono text-base font-black text-red-400 tracking-tight">
                    +{formatDuration(overtimeMs)}
                  </span>
                  {live.overtimeFee > 0 && (
                    <span className="block text-[10px] text-red-300 font-bold">
                      Fee: ₹{live.overtimeFee}
                    </span>
                  )}
                </div>
              ) : currentStatus === 'PAUSED' ? (
                <span className="font-mono text-xs font-bold text-purple-400">
                  Timer Paused
                </span>
              ) : (
                <span className={`font-mono text-base font-black tracking-tight ${isWarning ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                  {formatDuration(remainingMs)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Maintenance Message */}
        {isMaintenance && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 my-3 text-xs text-slate-400 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="truncate">Station down for service / maintenance</span>
          </div>
        )}

        {/* Available Empty Message */}
        {station.status === 'AVAILABLE' && (
          <div className="bg-slate-950/40 border border-dashed border-slate-800/80 rounded-xl p-3 my-3 text-center">
            <span className="text-[11px] text-emerald-400/90 font-medium flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ready for immediate walk-in
            </span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800/60 flex flex-wrap gap-2">
        {/* Available Actions */}
        {station.status === 'AVAILABLE' && (
          <>
            <button
              onClick={() => startSession && startSession(station)}
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Session</span>
            </button>
            <button
              onClick={() => onToggleMaintenance(station._id, 'MAINTENANCE')}
              title="Mark for maintenance"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all border border-slate-700/60"
            >
              <Wrench className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Occupied Actions */}
        {isOccupied && (
          <>
            {/* Extend */}
            <button
              onClick={() => extendSession && extendSession(live.sessionId, station.name)}
              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all flex items-center gap-1 border border-slate-700/60"
              title="Add 15, 30, or 60 minutes"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Extend</span>
            </button>

            {/* Pause / Resume */}
            {currentStatus === 'PAUSED' ? (
              <button
                onClick={() => resumeSession && resumeSession(live.sessionId)}
                className="py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={() => pauseSession && pauseSession(live.sessionId)}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center gap-1 border border-slate-700/60"
                title="Pause billing timer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}

            {/* Transfer */}
            <button
              onClick={() => transferSession && transferSession(live.sessionId, station.name)}
              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center gap-1 border border-slate-700/60"
              title="Transfer customer to another PC"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Transfer</span>
            </button>

            {/* Cancel Session */}
            {cancelSession && (
              <button
                onClick={() => cancelSession(live.sessionId, station.name)}
                className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-all flex items-center gap-1"
                title="Cancel session if customer decides not to play"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}

            {/* Checkout & Settle */}
            <button
              onClick={() => checkoutSession && checkoutSession(live.sessionId, station.name)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 ${
                isOvertime
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Checkout</span>
            </button>
          </>
        )}

        {/* Maintenance Actions */}
        {isMaintenance && (
          <button
            onClick={() => onToggleMaintenance(station._id, 'AVAILABLE')}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-slate-700/60"
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark Ready (Available)</span>
          </button>
        )}
      </div>
    </div>
  );
}

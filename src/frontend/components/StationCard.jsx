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
  AlertTriangle
} from 'lucide-react';

function getStationIcon(type) {
  switch (type) {
    case 'PS5':
    case 'XBOX':
      return <Tv className="w-5 h-5 text-indigo-400" />;
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
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
}

export function StationCard({
  station,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onExtendSession,
  onTransferSession,
  onCheckoutSession,
  onToggleMaintenance
}) {
  const live = station.liveSession;
  const isOccupied = station.status === 'OCCUPIED' && live;
  const isMaintenance = station.status === 'MAINTENANCE';

  // Local 1-second ticker for smooth countdown / overtime display
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

  // Card border and background styles based on status
  let cardStyles = 'bg-slate-900/90 border-slate-800 hover:border-slate-700';
  let badgeStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let badgeLabel = 'Available';

  if (isMaintenance) {
    cardStyles = 'bg-slate-950 border-slate-800/80 opacity-75';
    badgeStyles = 'bg-slate-800 text-slate-400 border-slate-700';
    badgeLabel = 'Maintenance';
  } else if (currentStatus === 'EXPIRED_UNSETTLED') {
    cardStyles = 'bg-red-950/20 border-red-500/60 animate-pulse-glow';
    badgeStyles = 'bg-red-500/20 text-red-300 border-red-500/50 font-bold';
    badgeLabel = 'Overtime Alert';
  } else if (currentStatus === 'WARNING') {
    cardStyles = 'bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-500/10';
    badgeStyles = 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold animate-pulse';
    badgeLabel = 'Expiring Soon';
  } else if (currentStatus === 'PAUSED') {
    cardStyles = 'bg-purple-950/20 border-purple-500/50';
    badgeStyles = 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold';
    badgeLabel = 'Paused';
  } else if (isOccupied) {
    cardStyles = 'bg-slate-900 border-blue-500/40 shadow-md shadow-blue-500/5';
    badgeStyles = 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-semibold';
    badgeLabel = 'In Session';
  }

  return (
    <div className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${cardStyles}`}>
      {/* Top Header: Station Name, Type, Status Badge */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
              {getStationIcon(station.type)}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                {station.name}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                ₹{station.hourlyRate}/hr • {station.type.replace('_', ' ')}
              </p>
            </div>
          </div>
          <span className={`text-[11px] px-2.5 py-1 rounded-full border ${badgeStyles}`}>
            {badgeLabel}
          </span>
        </div>

        {/* Content Details: If Occupied */}
        {isOccupied && (
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 my-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Customer:</span>
              <span className="font-semibold text-white">{live.customerName}</span>
            </div>

            {/* Live Timer Section */}
            <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isOvertime ? 'Overtime Elapsed:' : 'Time Left:'}</span>
              </div>

              {isOvertime ? (
                <div className="text-right">
                  <span className="font-mono text-base font-black text-red-400">
                    +{formatDuration(overtimeMs)}
                  </span>
                  {live.overtimeFee > 0 && (
                    <span className="block text-[10px] text-red-300 font-bold">
                      Est. Overtime: ₹{live.overtimeFee}
                    </span>
                  )}
                </div>
              ) : currentStatus === 'PAUSED' ? (
                <span className="font-mono text-sm font-bold text-purple-400">
                  Timer Paused
                </span>
              ) : (
                <span className={`font-mono text-base font-bold ${isWarning ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                  {formatDuration(remainingMs)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* If Maintenance */}
        {isMaintenance && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 my-3 text-xs text-slate-400 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Station down for maintenance: {station.notes || 'Routine check'}</span>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="pt-3 border-t border-slate-800/60 flex flex-wrap gap-2">
        {/* Available State Actions */}
        {station.status === 'AVAILABLE' && (
          <>
            <button
              onClick={() => onStartSession(station)}
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Session</span>
            </button>
            <button
              onClick={() => onToggleMaintenance(station._id, 'MAINTENANCE')}
              title="Mark for maintenance"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all"
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
              onClick={() => onExtendSession(live.sessionId, station.name)}
              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Extend</span>
            </button>

            {/* Pause / Resume */}
            {currentStatus === 'PAUSED' ? (
              <button
                onClick={() => onResumeSession(live.sessionId)}
                className="py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={() => onPauseSession(live.sessionId)}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center gap-1"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}

            {/* Transfer */}
            <button
              onClick={() => onTransferSession(live.sessionId, station.name)}
              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center gap-1"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Transfer</span>
            </button>

            {/* Checkout & Settle */}
            <button
              onClick={() => onCheckoutSession(live.sessionId, station.name)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 ${
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
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark Ready (Available)</span>
          </button>
        )}
      </div>
    </div>
  );
}

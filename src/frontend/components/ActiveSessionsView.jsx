import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Clock,
  Search,
  Plus,
  Pause,
  Play,
  ArrowRightLeft,
  CreditCard,
  AlertTriangle,
  User,
  Phone,
  Monitor,
  XCircle
} from 'lucide-react';
import { Button, Card, Badge } from './ui';

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

export function ActiveSessionsView({
  stations = [],
  onExtend,
  onExtendSession,
  onPause,
  onPauseSession,
  onResume,
  onResumeSession,
  onTransfer,
  onTransferSession,
  onCheckout,
  onCheckoutSession,
  onCancel,
  onCancelSession,
  onQuickStart
}) {
  const extendSession = onExtend || onExtendSession;
  const pauseSession = onPause || onPauseSession;
  const resumeSession = onResume || onResumeSession;
  const transferSession = onTransfer || onTransferSession;
  const checkoutSession = onCheckout || onCheckoutSession;
  const cancelSession = onCancel || onCancelSession;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter occupied stations with live sessions
  const activeStations = stations.filter(
    (s) => s.status === 'OCCUPIED' && s.liveSession
  );

  const enrichedSessions = activeStations.map((st) => {
    const live = st.liveSession;
    let remainingMs = 0;
    let overtimeMs = 0;
    let isWarning = false;
    let isOvertime = false;
    let status = live.status;

    if (live.status !== 'PAUSED') {
      const scheduledEndMs = new Date(live.scheduledEndTime).getTime();
      const diffMs = scheduledEndMs - now;

      if (diffMs > 0) {
        remainingMs = diffMs;
        if (diffMs <= 5 * 60 * 1000) {
          isWarning = true;
          status = 'WARNING';
        } else {
          status = 'ACTIVE';
        }
      } else {
        overtimeMs = Math.abs(diffMs);
        isOvertime = true;
        status = 'EXPIRED_UNSETTLED';
      }
    }

    return {
      station: st,
      live,
      remainingMs,
      overtimeMs,
      isWarning,
      isOvertime,
      computedStatus: status
    };
  });

  // Apply filters
  const filtered = enrichedSessions.filter((item) => {
    const matchesSearch =
      item.live.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.live.customerPhone && item.live.customerPhone.includes(searchTerm));

    if (!matchesSearch) return false;

    if (filterType === 'WARNING') return item.isWarning;
    if (filterType === 'OVERTIME') return item.isOvertime;
    if (filterType === 'PAUSED') return item.computedStatus === 'PAUSED';

    return true;
  });

  const warningCount = enrichedSessions.filter((s) => s.isWarning).length;
  const overtimeCount = enrichedSessions.filter((s) => s.isOvertime).length;

  return (
    <div className="space-y-6">
      {/* Top Session Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card variant="container" className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-on-surface-variant">Currently Playing</span>
            <div className="text-xl font-bold text-on-surface tabular-nums mt-0.5">{activeStations.length} players</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary-container/40 border border-primary/30 flex items-center justify-center text-primary">
            <Gamepad2 className="w-4 h-4" />
          </div>
        </Card>

        <div className={`rounded-xl p-4 flex items-center justify-between border ${
          warningCount > 0
            ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
            : 'bg-surface-container border-outline-variant/60'
        }`}>
          <div>
            <span className="text-xs font-medium text-on-surface-variant">Ending Soon (5 mins)</span>
            <div className={`text-xl font-bold tabular-nums mt-0.5 ${warningCount > 0 ? 'text-amber-300' : 'text-on-surface'}`}>
              {warningCount} players
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className={`rounded-xl p-4 flex items-center justify-between border ${
          overtimeCount > 0
            ? 'bg-error-container/40 border-error/50 text-on-error-container'
            : 'bg-surface-container border-outline-variant/60'
        }`}>
          <div>
            <span className="text-xs font-medium text-on-surface-variant">In Extra Time</span>
            <div className={`text-xl font-bold tabular-nums mt-0.5 ${overtimeCount > 0 ? 'text-on-error-container' : 'text-on-surface'}`}>
              {overtimeCount} players
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-error-container/60 border border-error/40 flex items-center justify-center text-error">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === 'ALL'
                ? 'bg-primary-container text-on-primary-container border border-primary/40 font-semibold'
                : 'bg-surface-container text-on-surface-variant border border-outline-variant/60 hover:text-on-surface'
            }`}
          >
            All Active ({activeStations.length})
          </button>
          <button
            onClick={() => setFilterType('WARNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filterType === 'WARNING'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 font-semibold'
                : 'bg-surface-container text-amber-400 border border-outline-variant/60 hover:text-on-surface'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Ending Soon ({warningCount})
          </button>
          <button
            onClick={() => setFilterType('OVERTIME')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filterType === 'OVERTIME'
                ? 'bg-error-container/40 text-on-error-container border border-error/50 font-semibold'
                : 'bg-surface-container text-error border border-outline-variant/60 hover:text-on-surface'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            Extra Time ({overtimeCount})
          </button>
          <button
            onClick={() => setFilterType('PAUSED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === 'PAUSED'
                ? 'bg-tertiary-container text-tertiary border border-tertiary/50 font-semibold'
                : 'bg-surface-container text-tertiary border border-outline-variant/60 hover:text-on-surface'
            }`}
          >
            Paused
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by player or computer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant/60 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Grid of Active Sessions */}
      {filtered.length === 0 ? (
        <Card variant="container" className="p-10 text-center">
          <Gamepad2 className="w-8 h-8 text-outline mx-auto mb-2" />
          <p className="text-sm font-semibold text-on-surface">No active players found</p>
          <p className="text-xs text-on-surface-variant mt-1">
            {searchTerm ? 'Try a different search query' : 'Start a session from the Computers tab'}
          </p>
          {onQuickStart && (
            <Button
              variant="filled"
              size="sm"
              onClick={onQuickStart}
              className="mt-3"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Session</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const { station, live, remainingMs, overtimeMs, isWarning, isOvertime, computedStatus } = item;

            let cardBorder = 'border-outline-variant/60 bg-surface-container';
            if (isOvertime) cardBorder = 'border-error/60 bg-error-container/30';
            else if (isWarning) cardBorder = 'border-amber-500/60 bg-amber-950/40';
            else if (computedStatus === 'PAUSED') cardBorder = 'border-tertiary/40 bg-tertiary-container/20';

            return (
              <div
                key={live.sessionId}
                className={`rounded-xl border p-4 sm:p-5 flex flex-col justify-between h-full transition-colors ${cardBorder}`}
              >
                <div>
                  {/* Header: Station & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-center text-primary shrink-0">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-on-surface tracking-tight truncate" title={station.name}>{station.name}</h4>
                        <span className="text-[11px] text-on-surface-variant font-medium">₹{station.hourlyRate}/hr</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 ${
                        isOvertime
                          ? 'bg-error-container text-on-error-container border-error/40 font-semibold'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                          : computedStatus === 'PAUSED'
                          ? 'bg-tertiary-container text-tertiary border-tertiary/30'
                          : 'bg-primary-container text-on-primary-container border-primary/30'
                      }`}
                    >
                      {isOvertime ? 'Extra Time' : isWarning ? 'Ending Soon' : computedStatus === 'PAUSED' ? 'Paused' : 'In Use'}
                    </span>
                  </div>

                  {/* Customer Details */}
                  <div className="my-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-outline" />
                        Player:
                      </span>
                      <span className="font-semibold text-on-surface truncate max-w-[130px]">{live.customerName}</span>
                    </div>

                    {live.customerPhone && (
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-outline" />
                          Phone:
                        </span>
                        <span className="font-mono tabular-nums text-on-surface">{live.customerPhone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span>Booked Time:</span>
                      <span className="font-semibold text-on-surface">{live.bookedMinutes} mins</span>
                    </div>
                  </div>

                  {/* Timer Display */}
                  <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 my-3 flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-outline" />
                      {isOvertime ? 'Extra time:' : 'Time left:'}
                    </span>

                    {isOvertime ? (
                      <div className="text-right">
                        <span className="font-mono tabular-nums text-base font-bold text-error">
                          +{formatDuration(overtimeMs)}
                        </span>
                        {live.overtimeFee > 0 && (
                          <span className="block text-[11px] text-error font-medium">
                            Extra: ₹{live.overtimeFee}
                          </span>
                        )}
                      </div>
                    ) : computedStatus === 'PAUSED' ? (
                      <span className="text-xs font-semibold text-tertiary">
                        Paused
                      </span>
                    ) : (
                      <span className={`font-mono tabular-nums text-base font-bold ${isWarning ? 'text-amber-400' : 'text-primary'}`}>
                        {formatDuration(remainingMs)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Session Action Controls */}
                <div className="pt-3 border-t border-outline-variant/40 space-y-2">
                  <div className="grid grid-cols-4 gap-1.5">
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => extendSession && extendSession(live.sessionId, station.name)}
                      className="px-1 text-[11px]"
                      title="Add 15, 30, or 60 minutes"
                    >
                      <Plus className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">Add</span>
                    </Button>

                    {computedStatus === 'PAUSED' ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => resumeSession && resumeSession(live.sessionId)}
                        className="px-1 text-[11px]"
                      >
                        <Play className="w-3 h-3 fill-current shrink-0" />
                        <span className="truncate">Play</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => pauseSession && pauseSession(live.sessionId)}
                        className="px-1 text-[11px]"
                        title="Pause time"
                      >
                        <Pause className="w-3 h-3 shrink-0" />
                        <span className="truncate">Pause</span>
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => transferSession && transferSession(live.sessionId, station.name)}
                      className="px-1 text-[11px]"
                      title="Move to another computer"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-on-surface-variant shrink-0" />
                      <span className="truncate">Move</span>
                    </Button>

                    {cancelSession && (
                      <Button
                        variant="error"
                        size="sm"
                        onClick={() => cancelSession(live.sessionId, station.name)}
                        title="Cancel session if customer doesn't want to play"
                        className="px-1 text-[11px]"
                      >
                        <XCircle className="w-3 h-3 shrink-0" />
                        <span className="truncate">Cancel</span>
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="filled"
                    size="sm"
                    fullWidth
                    onClick={() => checkoutSession && checkoutSession(live.sessionId, station.name)}
                    className={
                      isOvertime
                        ? 'bg-error text-on-error hover:opacity-90'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Checkout & Settle</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

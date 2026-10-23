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

function getStationImage(type) {
  switch (type) {
    case 'PS5':
      return '/images/ps5_console_station.jpg';
    case 'XBOX':
      return '/images/xbox_controller_lounge.jpg';
    case 'VR':
      return '/images/vr_player_experience.jpg';
    case 'PC_VIP':
      return '/images/cyberpunk_battlestation.jpg';
    case 'PC_STANDARD':
    default:
      return '/images/pc_gaming_rig.jpg';
  }
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
    <div className="space-y-3 sm:space-y-6">
      {/* Top Session Metrics (Compact 3-column row on mobile, full cards on desktop) */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5 sm:gap-3">
        <Card variant="container" className="p-2 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
          <div>
            <span className="text-[10px] sm:text-xs font-medium text-on-surface-variant block truncate">Playing</span>
            <div className="text-sm sm:text-xl font-bold text-on-surface tabular-nums mt-0.5">{activeStations.length} <span className="hidden sm:inline text-xs font-normal text-on-surface-variant">players</span></div>
          </div>
          <div className="hidden sm:flex w-9 h-9 rounded-lg bg-primary-container/40 border border-primary/30 items-center justify-center text-primary shrink-0">
            <Gamepad2 className="w-4 h-4" />
          </div>
        </Card>

        <Card variant={warningCount > 0 ? "high" : "container"} className={`p-2 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 border ${
          warningCount > 0
            ? 'bg-warning-container text-on-warning-container border-warning/40'
            : 'border-outline-variant/40'
        }`}>
          <div>
            <span className="text-[10px] sm:text-xs font-medium text-on-surface-variant block truncate">Ending Soon</span>
            <div className={`text-sm sm:text-xl font-bold tabular-nums mt-0.5 ${warningCount > 0 ? 'text-warning' : 'text-on-surface'}`}>
              {warningCount} <span className="hidden sm:inline text-xs font-normal text-on-surface-variant">players</span>
            </div>
          </div>
          <div className="hidden sm:flex w-9 h-9 rounded-full bg-warning/20 items-center justify-center text-warning shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </Card>

        <div className={`rounded-xl p-2 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 border ${
          overtimeCount > 0
            ? 'bg-error-container/40 border-error/50 text-on-error-container'
            : 'bg-surface-container border-outline-variant/60'
        }`}>
          <div>
            <span className="text-[10px] sm:text-xs font-medium text-on-surface-variant block truncate">Extra Time</span>
            <div className={`text-sm sm:text-xl font-bold tabular-nums mt-0.5 ${overtimeCount > 0 ? 'text-on-error-container' : 'text-on-surface'}`}>
              {overtimeCount} <span className="hidden sm:inline text-xs font-normal text-on-surface-variant">players</span>
            </div>
          </div>
          <div className="hidden sm:flex w-9 h-9 rounded-lg bg-error-container/60 border border-error/40 items-center justify-center text-error shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none py-0.5">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              filterType === 'ALL'
                ? 'bg-primary-container text-on-primary-container border border-primary/40 font-semibold shadow-xs'
                : 'bg-surface-container text-on-surface-variant border border-outline-variant/60 hover:text-on-surface'
            }`}
          >
            All Active ({activeStations.length})
          </button>
          <button
            onClick={() => setFilterType('WARNING')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 ${
              filterType === 'WARNING'
                ? 'bg-warning-container text-on-warning-container border border-warning/40 font-semibold shadow-xs'
                : 'bg-surface-container text-warning border border-outline-variant/60 hover:text-on-surface'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
            <span>Ending Soon ({warningCount})</span>
          </button>
          <button
            onClick={() => setFilterType('OVERTIME')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 ${
              filterType === 'OVERTIME'
                ? 'bg-error-container/40 text-on-error-container border border-error/50 font-semibold shadow-xs'
                : 'bg-surface-container text-error border border-outline-variant/60 hover:text-on-surface'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
            <span>Extra Time ({overtimeCount})</span>
          </button>
          <button
            onClick={() => setFilterType('PAUSED')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              filterType === 'PAUSED'
                ? 'bg-tertiary-container text-tertiary border border-tertiary/50 font-semibold shadow-xs'
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

            let cardVariant = 'container';
            let badgeVariant = 'primary';
            let badgeLabel = 'In Use';

            if (isOvertime) {
              cardVariant = 'high';
              badgeVariant = 'error';
              badgeLabel = 'Extra Time';
            } else if (isWarning) {
              cardVariant = 'high';
              badgeVariant = 'warning';
              badgeLabel = 'Ending Soon';
            } else if (computedStatus === 'PAUSED') {
              cardVariant = 'container';
              badgeVariant = 'tertiary';
              badgeLabel = 'Paused';
            }

            const stationImg = getStationImage(station.type);
            const startMs = new Date(live.startTime).getTime();
            const scheduledEndMs = new Date(live.scheduledEndTime).getTime();
            const totalDurationMs = Math.max(1, scheduledEndMs - startMs);
            const elapsedMs = Math.max(0, now - startMs);
            const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

            let borderPulseClass = 'border-primary/60 animate-pulse-blue cyber-glow-state-active';
            if (isOvertime) {
              borderPulseClass = 'border-error animate-pulse-red cyber-glow-state-error';
            } else if (isWarning) {
              borderPulseClass = 'border-warning animate-pulse-amber cyber-glow-state-warning';
            } else if (computedStatus === 'PAUSED') {
              borderPulseClass = 'border-tertiary/60';
            }

            return (
              <Card
                key={live.sessionId}
                variant={cardVariant}
                className={`gaming-station-card flex flex-col justify-between h-full border ${borderPulseClass} transition-all rounded-2xl overflow-hidden group`}
              >
                <div>
                  {/* Station Visual Thumbnail */}
                  <div className="relative h-20 w-full overflow-hidden bg-surface-container-lowest">
                    <img
                      src={stationImg}
                      alt={station.name}
                      className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-black/50" />
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-on-surface bg-background/80 px-2 py-0.5 rounded-full backdrop-blur-md border border-outline-variant/30 flex items-center gap-1">
                          <Gamepad2 className="w-3 h-3 text-primary" />
                          <span>{station.name}</span>
                        </span>
                        {computedStatus !== 'PAUSED' && (
                          <div className="flex items-end gap-0.5 h-3 px-1 py-0.5 rounded bg-black/40 backdrop-blur-sm border border-primary/40" title="Active Gameplay">
                            <span className="w-0.5 bg-primary rounded-full animate-eq-1" />
                            <span className="w-0.5 bg-primary rounded-full animate-eq-2" />
                            <span className="w-0.5 bg-primary rounded-full animate-eq-3" />
                          </div>
                        )}
                      </div>
                      <Badge variant={badgeVariant} size="xs" className="font-bold tracking-wider backdrop-blur-md">
                        {badgeLabel}
                      </Badge>
                    </div>
                    <div className="absolute bottom-1 right-2 text-[10px] font-semibold text-on-surface bg-surface-container-high/90 px-1.5 py-0.2 rounded backdrop-blur-sm">
                      ₹{station.hourlyRate}/hr
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-outline" />
                        Player:
                      </span>
                      <span className="font-semibold text-on-surface truncate max-w-[140px]">{live.customerName}</span>
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

                    {/* Timer Display & Cyber Progress */}
                    <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 flex flex-col gap-1.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-outline" />
                          {isOvertime ? 'Overtime:' : 'Remaining:'}
                        </span>

                        {isOvertime ? (
                          <div className="text-right">
                            <span className="font-mono tabular-nums text-sm font-bold text-error">
                              +{formatDuration(overtimeMs)}
                            </span>
                            {live.overtimeFee > 0 && (
                              <span className="block text-[10px] text-error font-medium">
                                Extra: ₹{live.overtimeFee}
                              </span>
                            )}
                          </div>
                        ) : computedStatus === 'PAUSED' ? (
                          <span className="text-xs font-semibold text-tertiary">
                            Paused
                          </span>
                        ) : (
                          <span className={`font-mono tabular-nums text-sm sm:text-base font-bold ${isWarning ? 'text-warning' : 'text-primary'}`}>
                            {formatDuration(remainingMs)}
                          </span>
                        )}
                      </div>

                      {/* Animated Progress Bar */}
                      {!isOvertime && computedStatus !== 'PAUSED' && (
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
                </div>

                {/* Session Action Controls: Balanced 2x2 + 1 Layout */}
                <div className="pt-3 border-t border-outline-variant/40 space-y-1.5">
                  {/* Row 1: Pause/Resume (50%) + Add Time (50%) */}
                  <div className="flex gap-1.5">
                    {computedStatus === 'PAUSED' ? (
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

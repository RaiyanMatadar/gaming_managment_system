import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Clock,
  Search,
  PlusCircle,
  Pause,
  Play,
  ArrowRightLeft,
  CreditCard,
  AlertTriangle,
  User,
  Phone,
  Monitor,
  CheckCircle2,
  XCircle
} from 'lucide-react';

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
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Active Players</span>
            <p className="text-2xl font-black text-white mt-1">{enrichedSessions.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-900/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-400">5-Minute Warnings</span>
            <p className="text-2xl font-black text-amber-300 mt-1">{warningCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-red-900/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-red-400">Overtime Alerts</span>
            <p className="text-2xl font-black text-red-400 mt-1">{overtimeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player, PC, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Active', count: enrichedSessions.length },
            { id: 'WARNING', label: '5m Warning', count: warningCount },
            { id: 'OVERTIME', label: 'Overtime', count: overtimeCount },
            { id: 'PAUSED', label: 'Paused', count: enrichedSessions.filter((s) => s.computedStatus === 'PAUSED').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Sessions Grid / Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
          <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No active gaming sessions match</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Try modifying your search or filter options.'
              : 'All stations are currently idle. Start a new session from the Live Floor.'}
          </p>
          {onQuickStart && (
            <button
              onClick={onQuickStart}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 inline-flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start New Session</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const { station, live, remainingMs, overtimeMs, isWarning, isOvertime, computedStatus } = item;

            let cardBorder = 'border-slate-800 bg-slate-900';
            if (isOvertime) cardBorder = 'border-red-500/60 bg-red-950/20 animate-pulse-glow';
            else if (isWarning) cardBorder = 'border-amber-500/60 bg-amber-950/20';
            else if (computedStatus === 'PAUSED') cardBorder = 'border-purple-500/40 bg-purple-950/20';

            return (
              <div
                key={live.sessionId}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-sm ${cardBorder}`}
              >
                <div>
                  {/* Header: Station & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-400">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">{station.name}</h4>
                        <span className="text-[11px] text-slate-400 font-medium">₹{station.hourlyRate}/hr</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        isOvertime
                          ? 'bg-red-500/20 text-red-300 border-red-500/50'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                          : computedStatus === 'PAUSED'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {isOvertime ? 'Overtime' : isWarning ? '5m Warning' : computedStatus === 'PAUSED' ? 'Paused' : 'In Session'}
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div className="my-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Player:
                      </span>
                      <span className="font-bold text-white">{live.customerName}</span>
                    </div>

                    {live.customerPhone && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          Phone:
                        </span>
                        <span className="font-mono text-slate-300">{live.customerPhone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Booked Duration:</span>
                      <span className="font-semibold text-slate-200">{live.bookedMinutes} minutes</span>
                    </div>
                  </div>

                  {/* Timer Display Box */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 my-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {isOvertime ? 'Overtime Accruing:' : 'Time Left:'}
                    </span>

                    {isOvertime ? (
                      <div className="text-right">
                        <span className="font-mono text-base font-black text-red-400">
                          +{formatDuration(overtimeMs)}
                        </span>
                        {live.overtimeFee > 0 && (
                          <span className="block text-[10px] text-red-300 font-bold">
                            OT Charge: ₹{live.overtimeFee}
                          </span>
                        )}
                      </div>
                    ) : computedStatus === 'PAUSED' ? (
                      <span className="font-mono text-xs font-bold text-purple-400">
                        Timer Paused
                      </span>
                    ) : (
                      <span className={`font-mono text-base font-black ${isWarning ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                        {formatDuration(remainingMs)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Session Action Controls */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                  <button
                    onClick={() => extendSession && extendSession(live.sessionId, station.name)}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all flex items-center gap-1 border border-slate-700/60"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                    <span>Extend</span>
                  </button>

                  {computedStatus === 'PAUSED' ? (
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
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    onClick={() => transferSession && transferSession(live.sessionId, station.name)}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center gap-1 border border-slate-700/60"
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

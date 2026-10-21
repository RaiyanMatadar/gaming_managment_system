import React, { useState, useEffect } from 'react';
import { Gamepad2, Radio, User, Clock, FileText, Users, ShieldCheck } from 'lucide-react';

export function Navbar({
  isLiveConnected,
  onNewStationClick,
  onShiftReportClick,
  onCustomerHistoryClick,
  onAuditTrailClick
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              CyberArena
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium">
                POS & Management
              </span>
            </h1>
            <p className="text-xs text-slate-400">Gaming Center Session & Billing Controller</p>
          </div>
        </div>

        {/* Live Status, Clock & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
          {/* Live Stream Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <Radio className={`w-3.5 h-3.5 ${isLiveConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className={isLiveConnected ? 'text-emerald-300' : 'text-amber-300'}>
              {isLiveConnected ? 'Live' : 'Connecting...'}
            </span>
          </div>

          {/* Wall Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono">{time.toLocaleTimeString()}</span>
          </div>

          {/* Customer History Button */}
          <button
            onClick={onCustomerHistoryClick}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Customer History</span>
          </button>

          {/* Audit Trail Button */}
          <button
            onClick={onAuditTrailClick}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit Trail</span>
          </button>

          {/* Shift Report Button */}
          <button
            onClick={onShiftReportClick}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Shift Report</span>
          </button>

          {/* Add Station Button */}
          <button
            onClick={onNewStationClick}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <span>+ Add Station</span>
          </button>
        </div>
      </div>
    </header>
  );
}

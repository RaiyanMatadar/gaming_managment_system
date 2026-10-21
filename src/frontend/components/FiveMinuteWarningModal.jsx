import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, PlusCircle, CheckCircle, Monitor, User } from 'lucide-react';

export function FiveMinuteWarningModal({ warnings = [], onDismiss, onExtend }) {
  if (!warnings || warnings.length === 0) return null;

  // Selected warning index when multiple customers reach 5 minutes
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeWarning = warnings[Math.min(selectedIndex, warnings.length - 1)] || warnings[0];

  // Local ticker for smooth second-by-second countdown
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Subtle web audio beep on mount to alert staff
  useEffect(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }, [warnings.length]);

  if (!activeWarning) return null;

  const scheduledEndMs = new Date(activeWarning.scheduledEndTime).getTime();
  const diffMs = Math.max(0, scheduledEndMs - now);
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl w-full max-w-lg p-6 shadow-2xl shadow-amber-500/20 relative animate-pulse-glow">
        
        {/* Header Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Staff Alert • 5-Minute Warning
              </span>
              <h2 className="text-xl font-black text-white">
                Session Ending Soon
              </h2>
            </div>
          </div>

          {/* Multiple Warnings Badge */}
          {warnings.length > 1 && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              {warnings.length} Active Alerts
            </span>
          )}
        </div>

        {/* Tab switcher if multiple customers have 5-min warnings */}
        {warnings.length > 1 && (
          <div className="flex gap-2 overflow-x-auto py-3 border-b border-slate-800/80 scrollbar-none">
            {warnings.map((w, idx) => (
              <button
                key={w.sessionId}
                onClick={() => setSelectedIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  idx === selectedIndex
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {w.stationName} ({w.customerName})
              </button>
            ))}
          </div>
        )}

        {/* Core Message Callout */}
        <div className="my-5 bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 text-center">
          <p className="text-lg font-extrabold text-amber-200">
            "Only 5 minutes left for <span className="text-white underline decoration-amber-400">{activeWarning.customerName}</span> on PC <span className="text-white underline decoration-amber-400">{activeWarning.stationName}</span>."
          </p>
        </div>

        {/* Detail Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              Station / PC
            </span>
            <p className="text-sm font-bold text-white">{activeWarning.stationName}</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
              <User className="w-3.5 h-3.5 text-blue-400" />
              Customer
            </span>
            <p className="text-sm font-bold text-white truncate">{activeWarning.customerName}</p>
          </div>

          <div className="bg-slate-950 border border-amber-900/40 rounded-xl p-3 text-center">
            <span className="text-[11px] text-amber-400 flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Time Left
            </span>
            <p className="text-sm font-black font-mono text-amber-400 animate-pulse">
              {timeFormatted}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mb-6">
          An automated notification email has also been sent to the center owner. Please ask the customer if they wish to extend before overtime rules apply.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onDismiss(activeWarning.sessionId)}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-slate-400" />
            <span>Acknowledge</span>
          </button>

          <button
            onClick={() => {
              const sessId = activeWarning.sessionId;
              const stName = activeWarning.stationName;
              onDismiss(sessId);
              onExtend(sessId, stName);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Extend Session</span>
          </button>
        </div>

      </div>
    </div>
  );
}

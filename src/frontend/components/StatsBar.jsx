import React from 'react';
import {
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Percent
} from 'lucide-react';

export function StatsBar({ stations = [] }) {
  const total = stations.length;
  const available = stations.filter(s => s.status === 'AVAILABLE').length;
  const occupied = stations.filter(s => s.status === 'OCCUPIED').length;
  const maintenance = stations.filter(s => s.status === 'MAINTENANCE').length;

  const expiring = stations.filter(s => s.liveSession && s.liveSession.isWarning).length;
  const overtime = stations.filter(s => s.liveSession && s.liveSession.isOvertime).length;

  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* 1. Total Fleet */}
      <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold">Total Fleet</span>
          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Monitor className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-black text-white">{total}</span>
          <span className="text-[11px] text-slate-500 font-medium">Configured Units</span>
        </div>
      </div>

      {/* 2. Available for Walk-ins */}
      <div className="bg-slate-900 border border-emerald-900/30 hover:border-emerald-500/40 rounded-2xl p-4 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-400">
          <span className="text-xs font-semibold">Available Units</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-black text-emerald-300">{available}</span>
          <span className="text-[11px] text-emerald-400/80 font-medium">Ready to Assign</span>
        </div>
      </div>

      {/* 3. In Play / Occupied */}
      <div className="bg-slate-900 border border-blue-900/30 hover:border-blue-500/40 rounded-2xl p-4 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-blue-400">
          <span className="text-xs font-semibold">Active Sessions</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-black text-blue-300">{occupied}</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold">
            {occupancyRate}% Floor Load
          </span>
        </div>
      </div>

      {/* 4. Floor Alerts (5-Min Warning & Overtime) */}
      <div className="bg-slate-900 border border-amber-900/30 hover:border-amber-500/40 rounded-2xl p-4 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-400">
          <span className="text-xs font-semibold">Alerts (5m / Over)</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black text-amber-300">{expiring}</span>
            <span className="text-slate-600 font-bold">/</span>
            <span className="text-2xl font-black text-red-400">{overtime}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {overtime > 0 ? 'Action Needed' : 'Normal'}
          </span>
        </div>
      </div>

      {/* 5. Maintenance */}
      <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold">Maintenance</span>
          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
            <Wrench className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-black text-slate-300">{maintenance}</span>
          <span className="text-[11px] text-slate-500 font-medium">Hardware Check</span>
        </div>
      </div>
    </div>
  );
}

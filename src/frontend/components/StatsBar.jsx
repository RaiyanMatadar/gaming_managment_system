import React from 'react';
import { Monitor, CheckCircle, AlertTriangle, AlertCircle, Wrench } from 'lucide-react';

export function StatsBar({ stations = [] }) {
  const total = stations.length;
  const available = stations.filter(s => s.status === 'AVAILABLE').length;
  const occupied = stations.filter(s => s.status === 'OCCUPIED').length;
  const maintenance = stations.filter(s => s.status === 'MAINTENANCE').length;

  const expiring = stations.filter(s => s.liveSession && s.liveSession.isWarning).length;
  const overtime = stations.filter(s => s.liveSession && s.liveSession.isOvertime).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* Total Stations */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Total Stations</p>
          <p className="text-2xl font-bold text-white mt-0.5">{total}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
          <Monitor className="w-5 h-5" />
        </div>
      </div>

      {/* Available Stations */}
      <div className="bg-slate-900/80 border border-emerald-900/30 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-400">Available</p>
          <p className="text-2xl font-bold text-emerald-300 mt-0.5">{available}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Occupied Stations */}
      <div className="bg-slate-900/80 border border-blue-900/30 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-blue-400">In Play (Occupied)</p>
          <p className="text-2xl font-bold text-blue-300 mt-0.5">{occupied}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Monitor className="w-5 h-5" />
        </div>
      </div>

      {/* Expiring / Overtime */}
      <div className="bg-slate-900/80 border border-red-900/40 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-amber-400">Alerts (Warn / Over)</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-2xl font-bold text-amber-300">{expiring}</span>
            <span className="text-xs text-slate-500">/</span>
            <span className="text-2xl font-bold text-red-400">{overtime}</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Maintenance */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between col-span-2 sm:col-span-1">
        <div>
          <p className="text-xs font-medium text-slate-400">Maintenance</p>
          <p className="text-2xl font-bold text-slate-300 mt-0.5">{maintenance}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400">
          <Wrench className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

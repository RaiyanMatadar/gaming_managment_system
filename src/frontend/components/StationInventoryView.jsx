import React, { useState } from 'react';
import {
  Monitor,
  Tv,
  Glasses,
  Plus,
  Wrench,
  CheckCircle2,
  Play,
  Clock,
  Search,
  Filter
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

export function StationInventoryView({
  stations = [],
  onNewStationClick,
  onStartSession,
  onToggleMaintenance
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const pcStandard = stations.filter((s) => s.type === 'PC_STANDARD').length;
  const pcVip = stations.filter((s) => s.type === 'PC_VIP').length;
  const consoles = stations.filter((s) => s.type === 'PS5' || s.type === 'XBOX').length;
  const vrUnits = stations.filter((s) => s.type === 'VR').length;

  const avgRate =
    stations.length > 0
      ? Math.round(stations.reduce((sum, s) => sum + (s.hourlyRate || 0), 0) / stations.length)
      : 0;

  const filteredStations = stations.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (typeFilter !== 'ALL' && s.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-semibold text-slate-400">Total Fleet</span>
          <p className="text-2xl font-black text-white mt-1">{stations.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">All Gaming Units</span>
        </div>

        <div className="bg-slate-900 border border-blue-900/30 rounded-2xl p-4">
          <span className="text-xs font-semibold text-blue-400">Standard PCs</span>
          <p className="text-2xl font-black text-white mt-1">{pcStandard}</p>
          <span className="text-[11px] text-slate-500 font-medium">Competitions / LAN</span>
        </div>

        <div className="bg-slate-900 border border-amber-900/30 rounded-2xl p-4">
          <span className="text-xs font-semibold text-amber-400">VIP PCs</span>
          <p className="text-2xl font-black text-white mt-1">{pcVip}</p>
          <span className="text-[11px] text-slate-500 font-medium">High-FPS / 240Hz</span>
        </div>

        <div className="bg-slate-900 border border-indigo-900/30 rounded-2xl p-4">
          <span className="text-xs font-semibold text-indigo-400">Consoles & VR</span>
          <p className="text-2xl font-black text-white mt-1">{consoles + vrUnits}</p>
          <span className="text-[11px] text-slate-500 font-medium">PS5, Xbox & VR</span>
        </div>

        <div className="bg-slate-900 border border-emerald-900/30 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-emerald-400">Avg. Rate</span>
          <p className="text-2xl font-black text-emerald-300 mt-1">₹{avgRate}/hr</p>
          <span className="text-[11px] text-slate-500 font-medium">Base Hourly Mean</span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by station name (e.g. PC-01)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Type Filter & Add Station */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="PC_STANDARD">PC Standard</option>
            <option value="PC_VIP">PC VIP</option>
            <option value="PS5">PlayStation 5</option>
            <option value="XBOX">Xbox Series X</option>
            <option value="VR">VR Simulator</option>
          </select>

          <button
            onClick={onNewStationClick}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Station</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Station Name</th>
              <th className="py-3.5 px-4 font-semibold">Hardware Type</th>
              <th className="py-3.5 px-4 font-semibold text-center">Hourly Rate</th>
              <th className="py-3.5 px-4 font-semibold text-center">Current Status</th>
              <th className="py-3.5 px-4 font-semibold">Current Activity</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredStations.map((st) => {
              const isOccupied = st.status === 'OCCUPIED' && st.liveSession;
              const isMaintenance = st.status === 'MAINTENANCE';

              let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
              let badgeText = 'Available';

              if (isMaintenance) {
                badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';
                badgeText = 'Maintenance';
              } else if (isOccupied) {
                badgeStyle = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
                badgeText = 'In Session';
              }

              return (
                <tr key={st._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0">
                        {getStationIcon(st.type)}
                      </div>
                      <span className="font-bold text-white text-sm">{st.name}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-300">
                    {st.type.replace('_', ' ')}
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400 text-sm">
                    ₹{st.hourlyRate}/hr
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                      {badgeText}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {isOccupied ? (
                      <div>
                        <span className="text-white font-semibold">{st.liveSession.customerName}</span>
                        <span className="block text-[10px] text-slate-400">{st.liveSession.bookedMinutes}m booked</span>
                      </div>
                    ) : isMaintenance ? (
                      <span className="text-amber-400/90 text-[11px] font-medium flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        Down for service
                      </span>
                    ) : (
                      <span className="text-emerald-400/80 text-[11px]">Ready to allocate</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {st.status === 'AVAILABLE' && (
                        <button
                          onClick={() => onStartSession(st)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start</span>
                        </button>
                      )}

                      {isMaintenance ? (
                        <button
                          onClick={() => onToggleMaintenance(st._id, 'AVAILABLE')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                        >
                          Mark Ready
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleMaintenance(st._id, 'MAINTENANCE')}
                          disabled={isOccupied}
                          title={isOccupied ? 'Cannot put occupied station in maintenance' : 'Put in maintenance'}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-400 hover:text-slate-200 border border-slate-700/60 text-xs font-medium"
                        >
                          Service
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

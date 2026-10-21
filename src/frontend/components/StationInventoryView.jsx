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
import { Card, Button, Badge, Input, Select } from './ui';

function getStationIcon(type) {
  switch (type) {
    case 'PS5':
      return <Tv className="w-5 h-5 text-tertiary" />;
    case 'XBOX':
      return <Tv className="w-5 h-5 text-success" />;
    case 'VR':
      return <Glasses className="w-5 h-5 text-secondary" />;
    case 'PC_VIP':
      return <Monitor className="w-5 h-5 text-warning" />;
    case 'PC_STANDARD':
    default:
      return <Monitor className="w-5 h-5 text-primary" />;
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
        <Card variant="container" className="p-4">
          <span className="text-xs font-semibold text-on-surface-variant">Total Computers</span>
          <p className="text-2xl font-black text-on-surface mt-1">{stations.length}</p>
          <span className="text-[11px] text-on-surface-variant font-medium">All Gaming Units</span>
        </Card>

        <Card variant="container" className="p-4 border-primary/30">
          <span className="text-xs font-semibold text-primary">Standard PCs</span>
          <p className="text-2xl font-black text-on-surface mt-1">{pcStandard}</p>
          <span className="text-[11px] text-on-surface-variant font-medium">Regular PCs</span>
        </Card>

        <Card variant="container" className="p-4 border border-warning/30">
          <span className="text-xs font-semibold text-warning">VIP PCs</span>
          <p className="text-2xl font-black text-on-surface mt-1">{pcVip}</p>
          <span className="text-[11px] text-on-surface-variant font-medium">High-end Rigs</span>
        </Card>

        <Card variant="container" className="p-4 border border-tertiary/30">
          <span className="text-xs font-semibold text-tertiary">Consoles & VR</span>
          <p className="text-2xl font-black text-on-surface mt-1">{consoles + vrUnits}</p>
          <span className="text-[11px] text-on-surface-variant font-medium">PS5, Xbox & VR</span>
        </Card>

        <Card variant="container" className="p-4 border border-success/30 col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-success">Average Rate</span>
          <p className="text-2xl font-black text-success mt-1">₹{avgRate}/hr</p>
          <span className="text-[11px] text-on-surface-variant font-medium">Average per hour</span>
        </Card>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by computer name (e.g. PC-01)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/60 rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />
        </div>

        {/* Type Filter & Add Station */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-container border border-outline-variant/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Types</option>
            <option value="PC_STANDARD">Standard PC</option>
            <option value="PC_VIP">VIP PC</option>
            <option value="PS5">PlayStation 5</option>
            <option value="XBOX">Xbox Series X</option>
            <option value="VR">VR Simulator</option>
          </select>

          <Button
            variant="filled"
            size="md"
            onClick={onNewStationClick}
            className="whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Computer</span>
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card variant="container" className="overflow-hidden shadow-inner">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-lowest text-on-surface-variant border-b border-outline-variant/40">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Computer</th>
              <th className="py-3.5 px-4 font-semibold">Type</th>
              <th className="py-3.5 px-4 font-semibold text-center">Hourly Rate</th>
              <th className="py-3.5 px-4 font-semibold text-center">Status</th>
              <th className="py-3.5 px-4 font-semibold">Current Activity</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-on-surface-variant">
            {filteredStations.map((st) => {
              const isOccupied = st.status === 'OCCUPIED' && st.liveSession;
              const isMaintenance = st.status === 'MAINTENANCE';

              let badgeVariant = 'success';
              let badgeText = 'Available';

              if (isMaintenance) {
                badgeVariant = 'neutral';
                badgeText = 'In Repair';
              } else if (isOccupied) {
                badgeVariant = 'primary';
                badgeText = 'In Use';
              }

              return (
                <tr key={st._id} className="hover:bg-surface-container-high transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-center flex-shrink-0">
                        {getStationIcon(st.type)}
                      </div>
                      <span className="font-bold text-on-surface text-sm">{st.name}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-on-surface-variant">
                    {st.type.replace('_', ' ')}
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-success text-sm">
                    ₹{st.hourlyRate}/hr
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={badgeVariant} size="sm">
                      {badgeText}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4">
                    {isOccupied ? (
                      <div>
                        <span className="text-on-surface font-semibold">{st.liveSession.customerName}</span>
                        <span className="block text-[10px] text-on-surface-variant">{st.liveSession.bookedMinutes}m booked</span>
                      </div>
                    ) : isMaintenance ? (
                      <span className="text-warning text-[11px] font-medium flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        Down for repair
                      </span>
                    ) : (
                      <span className="text-success text-[11px]">Ready to play</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {st.status === 'AVAILABLE' && (
                        <Button
                          variant="filled"
                          size="sm"
                          onClick={() => onStartSession(st)}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start</span>
                        </Button>
                      )}

                      {isMaintenance ? (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => onToggleMaintenance(st._id, 'AVAILABLE')}
                        >
                          Mark Available
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          size="sm"
                          disabled={isOccupied}
                          onClick={() => onToggleMaintenance(st._id, 'MAINTENANCE')}
                          title={isOccupied ? 'Cannot put occupied computer in repair' : 'Put in repair'}
                        >
                          Repair
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

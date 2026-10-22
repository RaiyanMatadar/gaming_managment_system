import React from 'react';
import {
  Monitor,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Card, Badge } from './ui';

export function StatsBar({ stations = [] }) {
  const total = stations.length;
  const available = stations.filter(s => s.status === 'AVAILABLE').length;
  const occupied = stations.filter(s => s.status === 'OCCUPIED').length;
  const maintenance = stations.filter(s => s.status === 'MAINTENANCE').length;

  const expiring = stations.filter(s => s.liveSession && s.liveSession.isWarning).length;
  const overtime = stations.filter(s => s.liveSession && s.liveSession.isOvertime).length;
  const hasAlerts = expiring > 0 || overtime > 0;

  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <Card variant="container" className="p-3 sm:px-4 sm:py-2.5 mb-3 sm:mb-4 border border-outline-variant/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Section Header & Mini Occupancy Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
              <Monitor className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-on-surface">Floor Overview</span>
                <span className="text-[11px] text-on-surface-variant font-medium">({total} units)</span>
              </div>
            </div>
          </div>

          {/* Mini Segmented Bar */}
          {total > 0 && (
            <div className="hidden sm:flex items-center gap-0.5 w-24 sm:w-28 h-2 bg-surface-container-high rounded-full overflow-hidden shrink-0">
              {available > 0 && (
                <div
                  className="bg-success h-full transition-all"
                  style={{ width: `${(available / total) * 100}%` }}
                  title={`${available} available`}
                />
              )}
              {occupied > 0 && (
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${(occupied / total) * 100}%` }}
                  title={`${occupied} in use`}
                />
              )}
              {maintenance > 0 && (
                <div
                  className="bg-outline h-full transition-all"
                  style={{ width: `${(maintenance / total) * 100}%` }}
                  title={`${maintenance} in repair`}
                />
              )}
            </div>
          )}
        </div>

        {/* Center/Right: High-density Metrics & Status Badge */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs">
          {/* Available Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-lowest border border-outline-variant/30">
            <span className="w-2 h-2 rounded-full bg-success shrink-0" />
            <span className="text-on-surface-variant text-[11px]">Available:</span>
            <span className="font-bold text-on-surface tabular-nums">{available}</span>
          </div>

          {/* Occupied Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-lowest border border-outline-variant/30">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-on-surface-variant text-[11px]">In Use:</span>
            <span className="font-bold text-on-surface tabular-nums">
              {occupied} <span className="font-normal text-on-surface-variant text-[10px]">({occupancyRate}%)</span>
            </span>
          </div>

          {/* Maintenance Pill */}
          {maintenance > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-lowest border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-outline shrink-0" />
              <span className="text-on-surface-variant text-[11px]">In Repair:</span>
              <span className="font-bold text-on-surface tabular-nums">{maintenance}</span>
            </div>
          )}

          {/* Attention Badge */}
          {hasAlerts ? (
            <Badge variant="warning" size="sm" className="shrink-0">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{overtime > 0 ? `${overtime} extra time` : `${expiring} ending soon`}</span>
            </Badge>
          ) : (
            <Badge variant="success" size="sm" className="shrink-0 hidden xs:inline-flex">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>All on time</span>
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

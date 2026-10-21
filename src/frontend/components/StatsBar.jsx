import React from 'react';
import {
  Monitor,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench
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
    <Card variant="container" className="p-4 sm:p-5 mb-6">
      {/* Top Floor Summary Heading & Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/40">
        <div>
          <h2 className="text-sm font-bold text-on-surface tracking-tight flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            <span>Floor capacity overview</span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {total} total gaming rigs configured in arena fleet
          </p>
        </div>

        {/* Operational Attention Badge */}
        {hasAlerts ? (
          <Badge variant="warning" size="md" className="self-start sm:self-auto">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {overtime > 0 ? `${overtime} session in overtime` : `${expiring} session expiring within 5 minutes`}
            </span>
          </Badge>
        ) : (
          <Badge variant="success" size="md" className="self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>All sessions running on schedule</span>
          </Badge>
        )}
      </div>

      {/* Capacity Breakdown Gauge Strip */}
      {total > 0 && (
        <div className="pt-4">
          {/* Segmented Capacity Bar */}
          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden flex gap-0.5">
            {available > 0 && (
              <div
                className="bg-emerald-500 h-full rounded-sm transition-all"
                style={{ width: `${(available / total) * 100}%` }}
                title={`${available} available`}
              />
            )}
            {occupied > 0 && (
              <div
                className="bg-primary h-full rounded-sm transition-all"
                style={{ width: `${(occupied / total) * 100}%` }}
                title={`${occupied} in play`}
              />
            )}
            {maintenance > 0 && (
              <div
                className="bg-outline h-full rounded-sm transition-all"
                style={{ width: `${(maintenance / total) * 100}%` }}
                title={`${maintenance} in maintenance`}
              />
            )}
          </div>

          {/* Operational Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-2">
            {/* Available */}
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
              <div>
                <span className="text-lg font-bold text-on-surface tabular-nums leading-none block">
                  {available}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">Ready for walk-in</span>
              </div>
            </div>

            {/* In Play / Active */}
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0" />
              <div>
                <span className="text-lg font-bold text-on-surface tabular-nums leading-none block">
                  {occupied} <span className="text-xs font-normal text-on-surface-variant">({occupancyRate}% load)</span>
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">Active gaming sessions</span>
              </div>
            </div>

            {/* Expiring / Overtime */}
            <div className="flex items-start gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${hasAlerts ? 'bg-amber-400' : 'bg-outline'}`} />
              <div>
                <span className={`text-lg font-bold tabular-nums leading-none block ${hasAlerts ? 'text-amber-300' : 'text-on-surface-variant'}`}>
                  {expiring + overtime}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">Alerts (5m warning / overtime)</span>
              </div>
            </div>

            {/* Maintenance */}
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-outline mt-1 shrink-0" />
              <div>
                <span className="text-lg font-bold text-on-surface tabular-nums leading-none block">
                  {maintenance}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">Under maintenance</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

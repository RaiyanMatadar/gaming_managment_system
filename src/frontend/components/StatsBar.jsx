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
      {/* Top Summary Heading & Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/40">
        <div>
          <h2 className="text-sm font-bold text-on-surface tracking-tight flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            <span>Computers & Stations Overview</span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {total} total computers and consoles
          </p>
        </div>

        {/* Attention Badge */}
        {hasAlerts ? (
          <Badge variant="warning" size="md" className="self-start sm:self-auto">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {overtime > 0 ? `${overtime} in extra time` : `${expiring} ending in 5 minutes`}
            </span>
          </Badge>
        ) : (
          <Badge variant="success" size="md" className="self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>All sessions running on time</span>
          </Badge>
        )}
      </div>

      {/* Breakdown Strip */}
      {total > 0 && (
        <div className="pt-4">
          {/* Segmented Bar */}
          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden flex gap-0.5">
            {available > 0 && (
              <div
                className="bg-success h-full rounded-full transition-all"
                style={{ width: `${(available / total) * 100}%` }}
                title={`${available} available`}
              />
            )}
            {occupied > 0 && (
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${(occupied / total) * 100}%` }}
                title={`${occupied} in use`}
              />
            )}
            {maintenance > 0 && (
              <div
                className="bg-outline h-full rounded-full transition-all"
                style={{ width: `${(maintenance / total) * 100}%` }}
                title={`${maintenance} in repair`}
              />
            )}
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-2">
            {/* Available */}
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success mt-1 shrink-0" />
              <div>
                <span className="headline-small font-bold text-on-surface tabular-nums leading-none block">
                  {available}
                </span>
                <span className="label-medium text-on-surface-variant font-medium">Available</span>
              </div>
            </div>

            {/* In Play / Active */}
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0" />
              <div>
                <span className="headline-small font-bold text-on-surface tabular-nums leading-none block">
                  {occupied} <span className="body-small font-normal text-on-surface-variant">({occupancyRate}%)</span>
                </span>
                <span className="label-medium text-on-surface-variant font-medium">Currently In Use</span>
              </div>
            </div>

            {/* Expiring / Overtime */}
            <div className="flex items-start gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${hasAlerts ? 'bg-warning' : 'bg-outline'}`} />
              <div>
                <span className={`headline-small font-bold tabular-nums leading-none block ${hasAlerts ? 'text-warning' : 'text-on-surface-variant'}`}>
                  {expiring + overtime}
                </span>
                <span className="label-medium text-on-surface-variant font-medium">Ending Soon / Extra Time</span>
              </div>
            </div>

            {/* Maintenance */}
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-outline mt-1 shrink-0" />
              <div>
                <span className="headline-small font-bold text-on-surface tabular-nums leading-none block">
                  {maintenance}
                </span>
                <span className="label-medium text-on-surface-variant font-medium">In Repair</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

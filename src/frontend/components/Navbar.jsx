import React, { useState, useEffect } from 'react';
import { Gamepad2, Radio, User, Clock, FileText, Users, ShieldCheck, Plus } from 'lucide-react';
import { Button, Card, Badge } from './ui';

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
    <header className="bg-surface-container-low border-b border-outline-variant/40 px-6 py-4 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-lg">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
              CyberArena
              <Badge variant="primary" size="pill">
                POS & Management
              </Badge>
            </h1>
            <p className="text-xs text-on-surface-variant">Gaming Center Session & Billing Controller</p>
          </div>
        </div>

        {/* Live Status, Clock & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
          {/* Live Stream Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/60 text-xs">
            <Radio className={`w-3.5 h-3.5 ${isLiveConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className={isLiveConnected ? 'text-emerald-300' : 'text-amber-300'}>
              {isLiveConnected ? 'Live' : 'Connecting...'}
            </span>
          </div>

          {/* Wall Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/60 text-xs text-on-surface-variant">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-on-surface">{time.toLocaleTimeString()}</span>
          </div>

          {/* Customer History Button */}
          <Button
            variant="outlined"
            size="sm"
            onClick={onCustomerHistoryClick}
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Customer History</span>
          </Button>

          {/* Audit Trail Button */}
          <Button
            variant="outlined"
            size="sm"
            onClick={onAuditTrailClick}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
            <span>Audit Trail</span>
          </Button>

          {/* Shift Report Button */}
          <Button
            variant="outlined"
            size="sm"
            onClick={onShiftReportClick}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Shift Report</span>
          </Button>

          {/* Add Station Button */}
          <Button
            variant="filled"
            size="sm"
            onClick={onNewStationClick}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Station</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

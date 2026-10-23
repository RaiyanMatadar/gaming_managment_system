import React, { useState, useEffect } from 'react';
import { Gamepad2, Radio, User, Clock, FileText, Users, ShieldCheck, Plus, Sparkles } from 'lucide-react';
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
    <header className="bg-surface/85 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-black/20 px-4 sm:px-6 py-3 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center p-1.5 shadow-md shrink-0">
            <img
              src="/images/gamedash_esports_logo.svg"
              alt="GameDash"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-on-surface flex items-center gap-2">
              GameDash
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/40 tracking-wider">
                ESPORTS
              </span>
            </h1>
            <p className="text-xs text-on-surface-variant font-medium">Gaming Center Session & Billing Controller</p>
          </div>
        </div>

        {/* Live Status, Clock & Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          {/* Live Arena Sync Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 text-xs shadow-xs">
            <Radio className={`w-3.5 h-3.5 ${isLiveConnected ? 'text-success animate-pulse' : 'text-warning'}`} />
            <span className={`font-bold tracking-wider text-[11px] uppercase ${isLiveConnected ? 'text-success' : 'text-warning'}`}>
              {isLiveConnected ? 'LIVE ARENA' : 'CONNECTING...'}
            </span>
          </div>

          {/* Wall Clock */}
          <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 text-xs shadow-xs">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono font-bold tabular-nums text-on-surface">{time.toLocaleTimeString()}</span>
          </div>

          {/* Customer History Button */}
          {onCustomerHistoryClick && (
            <Button
              variant="outlined"
              size="sm"
              onClick={onCustomerHistoryClick}
              className="text-xs"
            >
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>Customers</span>
            </Button>
          )}

          {/* Shift Report Button */}
          {onShiftReportClick && (
            <Button
              variant="outlined"
              size="sm"
              onClick={onShiftReportClick}
              className="text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-success" />
              <span>Reports</span>
            </Button>
          )}

          {/* Add Station Button */}
          {onNewStationClick && (
            <Button
              variant="filled"
              size="sm"
              onClick={onNewStationClick}
              className="text-xs font-bold shadow-md cyber-glow-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Rig</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Plus, Check, Monitor, User } from 'lucide-react';
import { Button, Card, Badge } from './ui';

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
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio autoplay fallback
    }
  }, [warnings.length]);

  if (!activeWarning) return null;

  const scheduledEndMs = new Date(activeWarning.scheduledEndTime).getTime();
  const diffMs = Math.max(0, scheduledEndMs - now);
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[100] bg-scrim/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <Card variant="container" rounded="rounded-[28px]" className="w-full max-w-lg p-6 shadow-m3-3 relative border border-warning/40">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning-container text-on-warning-container flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-label-small font-semibold text-warning block leading-tight">
                Staff Alert
              </span>
              <h2 className="title-medium font-bold text-on-surface tracking-tight mt-0.5">
                Session Ending Soon
              </h2>
            </div>
          </div>

          {/* Multiple Warnings Count */}
          {warnings.length > 1 && (
            <Badge variant="warning" size="md">
              {warnings.length} ending soon
            </Badge>
          )}
        </div>

        {/* Tab switcher if multiple stations have 5-min warnings */}
        {warnings.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto py-2.5 border-b border-outline-variant/40 scrollbar-none">
            {warnings.map((w, idx) => (
              <button
                key={w.sessionId}
                onClick={() => setSelectedIndex(idx)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  idx === selectedIndex
                    ? 'bg-warning-container text-on-warning-container border-warning/40 font-semibold'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:text-on-surface'
                }`}
              >
                {w.stationName} ({w.customerName})
              </button>
            ))}
          </div>
        )}

        {/* Warning Notification Message */}
        <div className="my-4 bg-warning-container text-on-warning-container rounded-[12px] p-3.5 text-center border border-warning/30">
          <p className="text-body-medium font-medium">
            Only 5 minutes left for <span className="font-bold underline">{activeWarning.customerName}</span> on <span className="font-bold underline">{activeWarning.stationName}</span>.
          </p>
        </div>

        {/* Detail Cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <Card variant="lowest" className="p-3 text-center">
            <span className="text-[11px] text-on-surface-variant flex items-center justify-center gap-1 mb-1">
              <Monitor className="w-3.5 h-3.5 text-outline" />
              Computer
            </span>
            <p className="text-sm font-bold text-on-surface">{activeWarning.stationName}</p>
          </Card>

          <Card variant="lowest" className="p-3 text-center">
            <span className="text-[11px] text-on-surface-variant flex items-center justify-center gap-1 mb-1">
              <User className="w-3.5 h-3.5 text-outline" />
              Player
            </span>
            <p className="text-sm font-bold text-on-surface truncate">{activeWarning.customerName}</p>
          </Card>

          <div className="bg-warning-container text-on-warning-container rounded-xl p-3 text-center border border-warning/30">
            <span className="text-[11px] flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5" />
              Time Left
            </span>
            <p className="text-base font-bold font-mono tabular-nums">
              {timeFormatted}
            </p>
          </div>
        </div>

        <p className="body-small text-on-surface-variant text-center mb-5">
          Ask the customer if they wish to add more time before extra time charges begin.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="tonal"
            onClick={() => onDismiss(activeWarning.sessionId)}
            className="flex-1"
          >
            <Check className="w-4 h-4" />
            <span>Dismiss</span>
          </Button>

          <Button
            variant="filled"
            onClick={() => {
              const sessId = activeWarning.sessionId;
              const stName = activeWarning.stationName;
              onDismiss(sessId);
              onExtend(sessId, stName);
            }}
            className="flex-1 bg-warning text-on-warning hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            <span>Add More Time</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Volume1, VolumeX, Music, Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine.js';

export function AudioControls() {
  const [volume, setVolume] = useState(soundEngine.getVolume());
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = soundEngine.subscribe(({ volume: v, muted: m }) => {
      setVolume(v);
      setIsMuted(m);
    });
    return unsubscribe;
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggleMute = (e) => {
    e.stopPropagation();
    soundEngine.toggleMute();
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    soundEngine.setVolume(val);
    if (isMuted && val > 0) {
      soundEngine.setMuted(false);
    }
  };

  const volumePercent = Math.round(volume * 100);

  const VolumeIcon = isMuted || volume === 0
    ? VolumeX
    : volume < 0.5
      ? Volume1
      : Volume2;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={isMuted ? 'Audio alerts muted' : `Audio alerts (${volumePercent}%)`}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
          isMuted
            ? 'bg-surface-container border-outline-variant/40 text-on-surface-variant hover:text-on-surface'
            : 'bg-primary-container text-on-primary-container border-primary/20 hover:bg-primary-container/80 shadow-xs'
        }`}
      >
        <VolumeIcon className="w-3.5 h-3.5 shrink-0" />
        {!isMuted && (
          <span className="flex items-end gap-0.5 h-3 w-2.5">
            <span className="w-0.5 h-full bg-current rounded-full animate-pulse" />
            <span className="w-0.5 h-2/3 bg-current rounded-full animate-pulse delay-75" />
            <span className="w-0.5 h-4/5 bg-current rounded-full animate-pulse delay-150" />
          </span>
        )}
        <span className="hidden xl:inline tabular-nums">
          {isMuted ? 'Muted' : `${volumePercent}%`}
        </span>
      </button>

      {/* Popover Settings Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-[20px] bg-surface-container-high border border-outline-variant/40 p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-[10px] bg-primary-container text-on-primary-container">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-on-surface">Floor Audio Alerts</h4>
                <p className="text-[10px] text-on-surface-variant">Synthesized live ambient sound cues</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="py-3 space-y-1.5">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>Alert Volume</span>
              <span className="font-semibold text-on-surface tabular-nums">
                {isMuted ? 'Muted' : `${volumePercent}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              disabled={isMuted}
              className="w-full h-1.5 bg-surface-container-lowest rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Sound Preview Buttons */}
          <div className="pt-2 border-t border-outline-variant/30 space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-outline">
              Test Audio Cues
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => soundEngine.playChime()}
                className="flex flex-col items-center justify-center p-2 rounded-[12px] bg-surface-container-lowest border border-outline-variant/30 hover:border-warning/60 hover:bg-warning-container/20 transition-all cursor-pointer group"
              >
                <Bell className="w-3.5 h-3.5 text-warning mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-on-surface text-center">5-Min Warning</span>
              </button>

              <button
                type="button"
                onClick={() => soundEngine.playOvertimeBuzzer()}
                className="flex flex-col items-center justify-center p-2 rounded-[12px] bg-surface-container-lowest border border-outline-variant/30 hover:border-error/60 hover:bg-error-container/20 transition-all cursor-pointer group"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-error mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-on-surface text-center">Overtime</span>
              </button>

              <button
                type="button"
                onClick={() => soundEngine.playSuccessDing()}
                className="flex flex-col items-center justify-center p-2 rounded-[12px] bg-surface-container-lowest border border-outline-variant/30 hover:border-success/60 hover:bg-success-container/20 transition-all cursor-pointer group"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-success mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-on-surface text-center">Checkout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

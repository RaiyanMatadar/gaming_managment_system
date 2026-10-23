import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Zap,
  Flame,
  ChevronDown,
  ChevronUp,
  Monitor,
  Tv,
  Glasses,
  Play,
  Sparkles,
  Radio,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button, Badge } from './ui';
import { CyberMatrixCanvas } from './CyberMatrixCanvas.jsx';

const ARENA_SCENES = [
  {
    image: '/images/gaming_lounge_banner.jpg',
    title: 'Cyber Arena Floor',
    subtitle: 'High performance liquid-cooled rigs and next-gen console setups',
    badge: 'ESPORTS ARENA GRID'
  },
  {
    image: '/images/esports_stage_arena.jpg',
    title: 'Championship Tournament Stage',
    subtitle: 'Live synchronized match timers and instant gamer check-in telemetry',
    badge: 'TOURNAMENT STAGE'
  },
  {
    image: '/images/cyberpunk_battlestation.jpg',
    title: 'VIP 240Hz Battlestations',
    subtitle: 'Ultra-low latency curved OLED screens with mechanical RGB rigs',
    badge: 'VIP BATTLESTATIONS'
  },
  {
    image: '/images/arcade_lounge.jpg',
    title: 'Next-Gen Arcade & VR Lounge',
    subtitle: 'PS5 4K 120Hz, Xbox Series X, and 6-DOF spatial virtual reality',
    badge: 'CONSOLES & VR'
  }
];

export function GamingHeroBanner({
  stations = [],
  onQuickStart,
  onNewStation
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const total = stations.length;
  const occupied = stations.filter(s => s.status === 'OCCUPIED').length;
  const available = stations.filter(s => s.status === 'AVAILABLE').length;

  // Station hardware breakdown
  const psCount = stations.filter(s => s.type === 'PS5').length;
  const xboxCount = stations.filter(s => s.type === 'XBOX').length;
  const pcCount = stations.filter(s => s.type === 'PC_STANDARD' || s.type === 'PC_VIP').length;
  const vrCount = stations.filter(s => s.type === 'VR').length;

  // Auto-cycle through scenes every 6 seconds if not collapsed
  useEffect(() => {
    if (isCollapsed || !isAutoPlay) return;
    const interval = setInterval(() => {
      setActiveSceneIndex((prev) => (prev + 1) % ARENA_SCENES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isCollapsed, isAutoPlay]);

  const currentScene = ARENA_SCENES[activeSceneIndex];

  return (
    <div
      className="relative rounded-[24px] overflow-hidden border border-primary/20 shadow-2xl mb-4 bg-surface-container group"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      {/* Background Visual Container with Smooth Cross-Fade */}
      <div className={`relative w-full overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-16' : 'h-48 sm:h-56'}`}>
        {ARENA_SCENES.map((scene, idx) => (
          <div
            key={scene.image}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === activeSceneIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
            style={{ transitionProperty: 'opacity, transform' }}
          >
            <img
              src={scene.image}
              alt={scene.title}
              className="w-full h-full object-cover object-center transform transition-transform duration-1000"
            />
          </div>
        ))}

        {/* Cyber Neon Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-black/50 z-10" />

        {/* Real-time 60fps Cyber Matrix & Laser Scan Canvas Layer */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-80">
          <CyberMatrixCanvas particleCount={40} interactive={false} />
        </div>

        {/* Banner Overlay Content */}
        <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-20">
          {/* Top Row: Arena Live Beacon, Scene Pager, & Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-background/85 text-on-surface backdrop-blur-md border border-outline-variant/40 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                <span className="tracking-wider uppercase">{currentScene.badge}</span>
              </span>

              {occupied > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-container/85 text-on-primary-container backdrop-blur-md shadow-sm">
                  <Flame className="w-3.5 h-3.5 text-primary" />
                  <span>{occupied} Active {occupied === 1 ? 'Player' : 'Players'}</span>
                </span>
              )}
            </div>

            {/* Top Right Scene Controls & Minimize Button */}
            <div className="flex items-center gap-1.5">
              {!isCollapsed && (
                <div className="hidden sm:flex items-center gap-1 mr-1">
                  <button
                    onClick={() =>
                      setActiveSceneIndex(
                        (prev) => (prev - 1 + ARENA_SCENES.length) % ARENA_SCENES.length
                      )
                    }
                    className="p-1.5 rounded-full bg-background/60 hover:bg-background/90 text-on-surface-variant hover:text-on-surface backdrop-blur-md transition-colors"
                    title="Previous arena scene"
                    aria-label="Previous scene"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveSceneIndex((prev) => (prev + 1) % ARENA_SCENES.length)
                    }
                    className="p-1.5 rounded-full bg-background/60 hover:bg-background/90 text-on-surface-variant hover:text-on-surface backdrop-blur-md transition-colors"
                    title="Next arena scene"
                    aria-label="Next scene"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? 'Expand arena banner' : 'Collapse arena banner'}
                className="p-1.5 rounded-full bg-background/70 hover:bg-background text-on-surface-variant hover:text-on-surface backdrop-blur-md transition-colors"
                title={isCollapsed ? 'Expand banner' : 'Minimize banner'}
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Bottom Row / Main Title, Hardware Mix & Live Actions */}
          {!isCollapsed && (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface flex items-center gap-2">
                  <span>{currentScene.title}</span>
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5 max-w-lg hidden sm:block">
                  {currentScene.subtitle}
                </p>

                {/* Hardware Breakdown Badges */}
                <div className="flex items-center flex-wrap gap-1.5 mt-2.5 text-[11px]">
                  {pcCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface/85 text-on-surface border border-outline-variant/30 backdrop-blur-sm shadow-xs font-medium">
                      <Monitor className="w-3 h-3 text-primary" />
                      <span>{pcCount} Rigs</span>
                    </span>
                  )}
                  {psCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface/85 text-on-surface border border-outline-variant/30 backdrop-blur-sm shadow-xs font-medium">
                      <Tv className="w-3 h-3 text-tertiary" />
                      <span>{psCount} PS5</span>
                    </span>
                  )}
                  {xboxCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface/85 text-on-surface border border-outline-variant/30 backdrop-blur-sm shadow-xs font-medium">
                      <Tv className="w-3 h-3 text-success" />
                      <span>{xboxCount} Xbox</span>
                    </span>
                  )}
                  {vrCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface/85 text-on-surface border border-outline-variant/30 backdrop-blur-sm shadow-xs font-medium">
                      <Glasses className="w-3 h-3 text-secondary" />
                      <span>{vrCount} VR</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons & Scene Indicator Dots */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  {available > 0 && onQuickStart && (
                    <Button
                      variant="filled"
                      size="sm"
                      onClick={onQuickStart}
                      className="font-bold shadow-lg cyber-glow-primary px-3.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                      <span>Quick Play</span>
                    </Button>
                  )}
                  {onNewStation && (
                    <Button
                      variant="tonal"
                      size="sm"
                      onClick={onNewStation}
                      className="font-semibold text-xs backdrop-blur-md px-3"
                    >
                      <span>+ Add Rig</span>
                    </Button>
                  )}
                </div>

                {/* Scene Indicator Dots */}
                <div className="flex items-center gap-1.5 pt-1">
                  {ARENA_SCENES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSceneIndex(i)}
                      aria-label={`Switch to scene ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeSceneIndex ? 'w-6 bg-primary' : 'w-1.5 bg-outline-variant/60 hover:bg-outline'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

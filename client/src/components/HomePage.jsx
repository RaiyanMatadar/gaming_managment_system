import React, { useState } from 'react';
import {
  Gamepad2,
  Monitor,
  Tv,
  Glasses,
  Zap,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  CheckCircle2,
  Coffee,
  MapPin,
  Phone,
  ChevronRight,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  Award
} from 'lucide-react';
import { Button, Card, Badge } from './ui';
import { CyberMatrixCanvas } from './CyberMatrixCanvas.jsx';

const GAMING_RIGS = [
  {
    title: 'VIP RTX 4080 Battlestation',
    category: 'PC_VIP',
    image: '/images/cyberpunk_battlestation.jpg',
    specs: 'RTX 4080 16GB • Ryzen 9 • 240Hz 1ms OLED',
    rate: '₹80/hr',
    badge: 'FLAGSHIP RIG',
    badgeVariant: 'warning',
    features: ['Curved 240Hz OLED Display', 'Optical Mechanical Keyboard', 'Ultra-Low Latency Mouse', 'Dedicated 1Gbps Fiber Line']
  },
  {
    title: 'PlayStation 5 4K Kiosks',
    category: 'PS5',
    image: '/images/ps5_console_station.jpg',
    specs: 'PS5 • 4K 120Hz HDR • DualSense Haptic',
    rate: '₹70/hr',
    badge: 'NEXT-GEN CONSOLE',
    badgeVariant: 'tertiary',
    features: ['DualSense Adaptive Triggers', '55" 4K 120Hz Gaming OLED', 'Pulse 3D Spatial Audio', 'Latest EA FC 25 & Tekken 8']
  },
  {
    title: 'Xbox Series X Monolith',
    category: 'XBOX',
    image: '/images/xbox_controller_lounge.jpg',
    specs: '12 Teraflops • 4K 120FPS • Game Pass',
    rate: '₹70/hr',
    badge: 'GAME PASS 400+',
    badgeVariant: 'success',
    features: ['Xbox Wireless Elite Controller', 'Instant Quick Resume Gaming', '400+ Game Pass Ultimate Titles', 'Forza Horizon & Halo Arena']
  },
  {
    title: 'VR 6-DOF Holo Arena',
    category: 'VR',
    image: '/images/vr_player_experience.jpg',
    specs: '120Hz Spatial VR • Dual Motion Touch',
    rate: '₹120/hr',
    badge: 'VIRTUAL REALITY',
    badgeVariant: 'secondary',
    features: ['6-Degrees-of-Freedom Tracking', 'Beat Saber & Half-Life Alyx', 'Haptic Motion Controllers', '360° Free Motion Padded Cage']
  },
  {
    title: 'Esports High-FPS Rig',
    category: 'PC_STANDARD',
    image: '/images/pc_gaming_rig.jpg',
    specs: 'RTX 4060 Ti • i7 14th Gen • 165Hz IPS',
    rate: '₹50/hr',
    badge: 'ESPORTS VALUE',
    badgeVariant: 'primary',
    features: ['165Hz Fast IPS Monitor', 'Tournament RGB Keyboard', 'Preloaded Valorant & CS2', 'Sub-5ms Server Ping']
  },
  {
    title: 'Retro & Modern Arcade Lounge',
    category: 'ARCADE',
    image: '/images/arcade_lounge.jpg',
    specs: 'Multiplayer Couch Gaming • 4-Player',
    rate: '₹60/hr',
    badge: 'COUCH CO-OP',
    badgeVariant: 'warning',
    features: ['4-Player Couch Multiplayer', 'Smash Bros & Mario Kart', 'Custom Arcade Fight Sticks', 'Chilled Lounge Sofa Setup']
  }
];

const GAMER_PASSES = [
  {
    name: 'Quick Warmup Pass',
    duration: '1 Hour',
    price: '₹50',
    popular: false,
    description: 'Perfect for quick competitive ranked matches and warmup games.',
    features: ['Access to Standard Esports Rig', 'Gigabit Low-Ping Fiber', '5-Minute Grace Period']
  },
  {
    name: 'Pro Squad Night Pass',
    duration: '3 Hours',
    price: '₹140',
    popular: true,
    description: 'Our most popular session for group grinds and ranked marathons.',
    features: ['VIP Battlestation or PS5 Access', 'Free Chilled Energy Drink', 'Zero Disconnect Guarantee', 'Reserved Gaming Chair']
  },
  {
    name: 'All-Night Lockdown Pass',
    duration: '6 Hours',
    price: '₹260',
    popular: false,
    description: 'Deep overnight grind from 11 PM to morning for hardcore clans.',
    features: ['VIP Battlestation Access', 'Unlimited Game Pass Access', '20% Snack Bar Discount', 'Overtime Shield Protection']
  }
];

const FEATURED_GAMES = [
  { title: 'Valorant', genre: 'Tactical Shooter', platform: 'PC 240Hz', players: '5v5 Ranked', hot: true },
  { title: 'Cyberpunk 2077', genre: 'Ray Traced RPG', platform: 'RTX 4080', players: 'Single Player', hot: true },
  { title: 'EA Sports FC 25', genre: 'Sports / Soccer', platform: 'PS5 & Xbox', players: '1v1 & 2v2 Local', hot: true },
  { title: 'Tekken 8', genre: 'Fighting Arcade', platform: 'PS5 Kiosks', players: 'Fight Stick Ready', hot: false },
  { title: 'Call of Duty: Warzone', genre: 'Battle Royale', platform: 'PC & Console', players: 'Crossplay Squads', hot: true },
  { title: 'Forza Horizon 5', genre: 'Racing Simulator', platform: 'Xbox & PC', players: 'Steering Wheel Rig', hot: false },
  { title: 'Beat Saber VR', genre: 'Rhythm / VR', platform: 'VR Arena', players: 'Immersive 6-DOF', hot: true },
  { title: 'GTA Online', genre: 'Action Sandbox', platform: 'PC Rigs', players: 'Clan Heists', hot: false }
];

const SNACK_BAR = [
  { name: 'Red Bull Energy (250ml)', price: '₹125', icon: '⚡' },
  { name: 'Monster Energy (350ml)', price: '₹130', icon: '🥤' },
  { name: 'Spicy Korean Shin Ramyun', price: '₹95', icon: '🍜' },
  { name: 'Iced Cold Brew Latte', price: '₹90', icon: '☕' },
  { name: 'Doritos Nacho Cheese', price: '₹40', icon: '🧀' },
  { name: 'Chilled Mineral Water (1L)', price: '₹20', icon: '💧' }
];

export function HomePage({
  onOpenLogin,
  isLoggedIn = false,
  onOpenDashboard,
  stations = []
}) {
  const [activeTab, setActiveTab] = useState('ALL');

  const totalStations = stations.length || 12;
  const availableCount = stations.length > 0 ? stations.filter(s => s.status === 'AVAILABLE').length : 8;
  const occupiedCount = stations.length > 0 ? stations.filter(s => s.status === 'OCCUPIED').length : 4;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-primary selection:text-on-primary cyber-arena-grid relative overflow-x-hidden">
      
      {/* 1. Cyber Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-primary/20 bg-surface/85 backdrop-blur-xl shadow-lg shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center p-1.5 shadow-md">
              <img
                src="/images/gamedash_esports_logo.svg"
                alt="GameDash Esports Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-on-surface flex items-center gap-1.5">
                GameDash
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/40 tracking-wider">
                  ARENA
                </span>
              </span>
              <p className="text-[11px] text-on-surface-variant font-medium hidden sm:block">
                Esports Lounge & Gaming Center
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-on-surface-variant">
            <button
              onClick={() => scrollToSection('hardware')}
              className="px-3 py-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Battlestations
            </button>
            <button
              onClick={() => scrollToSection('rates')}
              className="px-3 py-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Passes & Rates
            </button>
            <button
              onClick={() => scrollToSection('games')}
              className="px-3 py-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Games Library
            </button>
            <button
              onClick={() => scrollToSection('snacks')}
              className="px-3 py-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Snack Bar
            </button>
          </nav>

          {/* Right Action: Arena Status & Login / Dashboard Button */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-xs">
              <span className="w-2 h-2 rounded-full bg-success animate-ping" />
              <span className="font-bold text-success text-[11px] tracking-wide uppercase">Open 24/7</span>
            </div>

            {isLoggedIn ? (
              <Button
                variant="filled"
                size="sm"
                onClick={onOpenDashboard}
                className="font-bold shadow-md cyber-glow-primary text-xs px-3.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                <span>Open Terminal</span>
              </Button>
            ) : (
              <Button
                variant="filled"
                size="sm"
                onClick={onOpenLogin}
                className="font-bold shadow-md cyber-glow-primary text-xs px-3.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                <span>Staff Terminal</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Real-Time Animated Canvas */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Animated Cyber Particle & Scanline Canvas Layer */}
        <CyberMatrixCanvas particleCount={48} interactive={true} className="opacity-60" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            {/* Live Arena Status Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container/90 border border-primary/30 backdrop-blur-md shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-bold text-on-surface tracking-wider uppercase font-mono">
                {availableCount} of {totalStations} Rigs Ready To Play Right Now
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-on-surface leading-tight sm:leading-none">
              The Next-Gen <br />
              <span className="bg-gradient-to-r from-primary via-tertiary to-success bg-clip-text text-transparent">
                Gaming Lounge & Arena
              </span>
            </h1>

            <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Step into high-FPS liquid-cooled RTX 4080 battlestations, PlayStation 5 4K 120Hz kiosks,
              Xbox Series X monoliths, and immersive 6-DOF VR cages with sub-5ms fiber ping.
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center flex-wrap gap-3 pt-2">
              <Button
                variant="filled"
                size="lg"
                onClick={() => scrollToSection('hardware')}
                className="font-bold shadow-lg cyber-glow-primary px-6"
              >
                <span>Explore Battlestations</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              <Button
                variant="outlined"
                size="lg"
                onClick={() => scrollToSection('rates')}
                className="font-semibold px-6 border-outline-variant/60"
              >
                <span>View Gamer Passes</span>
              </Button>
            </div>
          </div>

          {/* Hero Arena Showcase Cards */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="relative rounded-2xl overflow-hidden border border-outline-variant/40 shadow-xl group h-64">
              <img
                src="/images/gaming_lounge_banner.jpg"
                alt="Esports Arena Floor"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-on-primary uppercase tracking-wider">
                  240Hz Battle Rigs
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Liquid-Cooled Esports Arena</h3>
                <p className="text-xs text-white/80 mt-0.5">Competitive tournament environment with ergonomic Secretlab chairs.</p>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-outline-variant/40 shadow-xl group h-64">
              <img
                src="/images/esports_stage_arena.jpg"
                alt="Championship Tournament Stage"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-tertiary text-on-tertiary uppercase tracking-wider">
                  Live Stage
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Championship Mainstage</h3>
                <p className="text-xs text-white/80 mt-0.5">Local LAN tournaments, spectator lounges, and live stream setups.</p>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-outline-variant/40 shadow-xl group h-64">
              <img
                src="/images/cyberpunk_battlestation.jpg"
                alt="Cyberpunk VIP Rig"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-success text-on-success uppercase tracking-wider">
                  Ray Traced
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Custom RTX 4080 Battlestations</h3>
                <p className="text-xs text-white/80 mt-0.5">Ultra settings ray tracing on curved high-refresh OLED panels.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Hardware & Battlestations Grid */}
      <section id="hardware" className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              Hardware Fleet
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              Pro Gaming Battlestations
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-md">
              Every rig is meticulously calibrated for peak framerates and zero frame drops.
            </p>
          </div>

          <Badge variant="success" size="md" className="shrink-0 self-start sm:self-auto font-bold">
            <span className="w-2 h-2 rounded-full bg-success animate-ping mr-1 inline-block" />
            {availableCount} Available Now
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAMING_RIGS.map((rig) => (
            <Card
              key={rig.title}
              variant="container"
              className="gaming-station-card flex flex-col justify-between overflow-hidden border border-outline-variant/40 rounded-2xl group shadow-md"
            >
              <div>
                {/* Image Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-surface-container-lowest">
                  <img
                    src={rig.image}
                    alt={rig.title}
                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-black/40" />
                  
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <Badge variant={rig.badgeVariant} size="xs" className="font-bold tracking-wider backdrop-blur-md">
                      {rig.badge}
                    </Badge>
                    <span className="font-bold text-xs text-on-surface bg-surface-container-high/90 px-2 py-0.5 rounded-md backdrop-blur-md border border-outline-variant/40 shadow-xs">
                      {rig.rate}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-[11px] font-mono text-white drop-shadow-sm font-semibold truncate">
                      {rig.specs}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <h3 className="title-medium font-bold text-on-surface tracking-tight">
                    {rig.title}
                  </h3>

                  <ul className="space-y-1.5 text-xs text-on-surface-variant">
                    {rig.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 pt-0">
                <Button
                  variant="tonal"
                  size="sm"
                  fullWidth
                  onClick={() => scrollToSection('rates')}
                  className="font-medium text-xs justify-center"
                >
                  <span>View Pass Rates</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Pricing & Gamer Passes */}
      <section id="rates" className="py-12 sm:py-16 px-4 sm:px-6 bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Affordable Esports Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mt-1">
              Pick Your Gaming Pass
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5">
              Transparent hourly rates with built-in 5-minute grace periods and automatic overtime billing protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {GAMER_PASSES.map((pass) => (
              <Card
                key={pass.name}
                variant={pass.popular ? 'high' : 'container'}
                className={`p-6 rounded-2xl flex flex-col justify-between border ${
                  pass.popular ? 'border-primary shadow-xl cyber-glow-primary relative' : 'border-outline-variant/40'
                }`}
              >
                {pass.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-black uppercase tracking-wider shadow-sm">
                    Most Popular Choice
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                    <div>
                      <h3 className="title-medium font-bold text-on-surface">{pass.name}</h3>
                      <span className="text-xs text-on-surface-variant">{pass.duration} Playtime</span>
                    </div>
                    <span className="text-2xl font-black text-on-surface tracking-tight">
                      {pass.price}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant my-4 leading-relaxed">
                    {pass.description}
                  </p>

                  <ul className="space-y-2 text-xs text-on-surface mb-6">
                    {pass.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant={pass.popular ? 'filled' : 'outlined'}
                  size="md"
                  fullWidth
                  onClick={onOpenLogin}
                  className="font-bold text-xs"
                >
                  <span>Walk-in & Play</span>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Popular Games Library */}
      <section id="games" className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Ready to Launch
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mt-1">
            400+ Pre-Installed Games
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5">
            Zero wait time. All games updated daily with high-speed local LAN servers.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {FEATURED_GAMES.map((game) => (
            <Card
              key={game.title}
              variant="container"
              className="p-3 sm:p-4 rounded-xl border border-outline-variant/40 hover:border-primary/50 transition-colors flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono">
                    {game.platform}
                  </span>
                  {game.hot && (
                    <span className="text-[10px] font-bold text-error flex items-center gap-0.5">
                      <Flame className="w-3 h-3" />
                      HOT
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                  {game.title}
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5">{game.genre}</p>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 mt-3 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>{game.players}</span>
                <span className="text-primary font-semibold">Ready</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. Arena Fuel & Snack Bar */}
      <section id="snacks" className="py-12 sm:py-16 px-4 sm:px-6 bg-surface-container-low border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Coffee className="w-4 h-4" />
                Lounge Refreshments
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mt-1">
                Gamer Fuel & Snack Bar
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-md">
                Delivered right to your battle station while you play.
              </p>
            </div>
            <Badge variant="primary" size="sm" className="shrink-0 self-start sm:self-auto">
              Delivered To Rig
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {SNACK_BAR.map((snk) => (
              <Card
                key={snk.name}
                variant="container"
                className="p-3 sm:p-4 text-center rounded-xl border border-outline-variant/40 flex flex-col items-center justify-between"
              >
                <div className="text-3xl mb-2">{snk.icon}</div>
                <h4 className="text-xs font-bold text-on-surface leading-tight min-h-[32px] flex items-center justify-center">
                  {snk.name}
                </h4>
                <span className="font-bold text-xs text-primary mt-2 tabular-nums">
                  {snk.price}
                </span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Footer & Arena Details */}
      <footer className="py-10 px-4 sm:px-6 border-t border-outline-variant/40 bg-surface-container text-xs text-on-surface-variant">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center p-1 shrink-0">
              <img
                src="/images/gamedash_esports_logo.svg"
                alt="GameDash"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-on-surface">GameDash Esports Arena</span>
              <p className="text-[11px] text-on-surface-variant">High-Performance Gaming Center Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Cyber Hub, Downtown Arena
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-success" />
              Open 24 Hours / 7 Days
            </span>
          </div>

          <div>
            <button
              onClick={onOpenLogin}
              className="text-primary hover:underline font-semibold"
            >
              Operator & Cashier Terminal Sign In →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

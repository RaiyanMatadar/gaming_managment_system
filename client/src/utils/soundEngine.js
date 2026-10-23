/**
 * Web Audio API Sound Engine for GameDash
 * 
 * Provides crisp, zero-latency synthesizer audio cues directly in the browser:
 * - 5-minute warning melodic chime
 * - Urgent overtime alert buzzer/pulse
 * - Payment checkout success ding
 * 
 * Includes volume control and mute persistence via localStorage.
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.volume = 0.7;
    this.muted = false;
    this.subscribers = new Set();

    // Load saved preferences
    try {
      const savedVol = localStorage.getItem('gamedash_audio_volume');
      if (savedVol !== null) {
        this.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
      }
      const savedMute = localStorage.getItem('gamedash_audio_muted');
      if (savedMute !== null) {
        this.muted = savedMute === 'true';
      }
    } catch {
      // LocalStorage unavailable
    }
  }

  // Subscribe to volume/mute state updates
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach((cb) => {
      try {
        cb({ volume: this.volume, muted: this.muted });
      } catch (err) {
        console.error('SoundEngine subscriber error:', err);
      }
    });
  }

  // Lazy-initialize AudioContext on first user interaction
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  getVolume() {
    return this.volume;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('gamedash_audio_volume', String(this.volume));
    } catch {}
    this.notify();
  }

  isMuted() {
    return this.muted;
  }

  setMuted(val) {
    this.muted = Boolean(val);
    try {
      localStorage.setItem('gamedash_audio_muted', String(this.muted));
    } catch {}
    this.notify();
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * 1. 5-Minute Warning Chime
   * Pleasant ascending two-tone melodic chime (D5 -> A5) with gentle decay
   */
  playChime() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.4, now);
    masterGain.connect(ctx.destination);

    // Tone 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.7, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.55);

    // Tone 2: A5 (880.00 Hz) - delayed by 180ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.18);
    gain2.gain.setValueAtTime(0, now + 0.18);
    gain2.gain.linearRampToValueAtTime(0.8, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.85);
  }

  /**
   * 2. Overtime Urgent Alert Buzzer
   * Distinct low-pulse double warning (330Hz -> 220Hz)
   */
  playOvertimeBuzzer() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.45, now);
    masterGain.connect(ctx.destination);

    // Filter to soften the buzz
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.connect(masterGain);

    // Pulse 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(320, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.6, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain1);
    gain1.connect(filter);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Pulse 2 (lower frequency alert drop)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(240, now + 0.26);
    gain2.gain.setValueAtTime(0, now + 0.26);
    gain2.gain.linearRampToValueAtTime(0.7, now + 0.29);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

    osc2.connect(gain2);
    gain2.connect(filter);
    osc2.start(now + 0.26);
    osc2.stop(now + 0.58);
  }

  /**
   * 3. Payment Success Ding
   * Bright, triumphant multi-harmonic bell chime (C6 + E6 + G6)
   */
  playSuccessDing() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.5, now);
    masterGain.connect(ctx.destination);

    const notes = [
      { freq: 1046.5, delay: 0.0, gain: 0.6, duration: 0.7 },    // C6
      { freq: 1318.5, delay: 0.08, gain: 0.65, duration: 0.8 },  // E6
      { freq: 1567.98, delay: 0.16, gain: 0.7, duration: 1.1 },  // G6
      { freq: 2093.0, delay: 0.24, gain: 0.4, duration: 1.2 }    // C7 sparkle
    ];

    notes.forEach(({ freq, delay, gain, duration }) => {
      const start = now + delay;
      const osc = ctx.createOscillator();
      const nodeGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      nodeGain.gain.setValueAtTime(0, start);
      nodeGain.gain.linearRampToValueAtTime(gain, start + 0.02);
      nodeGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(nodeGain);
      nodeGain.connect(masterGain);
      osc.start(start);
      osc.stop(start + duration);
    });
  }
}

export const soundEngine = new SoundEngine();

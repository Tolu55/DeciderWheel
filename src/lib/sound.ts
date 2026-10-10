// Web Audio API Synthesizer - No external audio assets needed!

class SoundEffects {
  private ctx: AudioContext | null = null;
  private muted = false;

  constructor() {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("decider_wheel_muted");
      this.muted = savedMute === "true";
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("decider_wheel_muted", String(muted));
    }
  }

  public playTick(pegIndex = 0): void {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Slightly modulate frequency so ticks sound organic and alive
      const baseFreq = 540 + (pegIndex % 5) * 35;
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // Audio autoplay policy or device fallback
    }
  }

  public playWinFanfare(): void {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [
        { freq: 523.25, delay: 0 },    // C5
        { freq: 659.25, delay: 0.12 }, // E5
        { freq: 783.99, delay: 0.24 }, // G5
        { freq: 1046.5, delay: 0.38 }, // C6
        { freq: 1318.5, delay: 0.54 }, // E6
      ];

      notes.forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.48);
      });
    } catch {
      // Audio fallback
    }
  }

  public vibrate(pattern: number[] = [60, 40, 80]): void {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Haptics not allowed or supported
      }
    }
  }
}

export const sounds = new SoundEffects();

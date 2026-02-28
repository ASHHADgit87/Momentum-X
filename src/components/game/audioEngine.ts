/** Procedural audio engine using Web Audio API — no external files needed */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private initialized = false;

  /** Initialize the audio context and start the engine oscillator */
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      // Engine sound: low sawtooth wave
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 60;
      this.engineGain.gain.value = 0;
      // Low-pass filter for warmer engine tone
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
      this.initialized = true;
    } catch {
      // Audio not available
    }
  }

  /** Update engine sound pitch and volume based on car speed */
  updateEngine(speed: number) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    const abs = Math.abs(speed);
    this.engineOsc.frequency.value = 55 + abs * 4;
    this.engineGain.gain.value = Math.min(abs * 0.008, 0.12);
  }

  /** Play a short ascending tone for lap completion */
  playLapSound() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.linearRampToValueAtTime(1320, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  /** Play a noise burst for collisions with barriers */
  playCrashSound() {
    if (!this.ctx) return;
    const len = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.1;
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
  }

  /** Play a UI click sound */
  playClick() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /** Play a victory fanfare */
  playFinishSound() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  /** Stop all audio and clean up */
  stop() {
    try {
      this.engineOsc?.stop();
    } catch { /* already stopped */ }
    this.ctx?.close();
    this.ctx = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.initialized = false;
  }
}

export const audioEngine = new AudioEngine();

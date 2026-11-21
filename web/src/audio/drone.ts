// SPEC §6.8 — Web Audio ile sentez (ses dosyası yok). AudioContext yalnızca "Başla" dokunuşundan sonra kurulur.
export class Drone {
  ctx = new AudioContext();
  master = this.ctx.createGain();
  filter = this.ctx.createBiquadFilter();
  shimmer = this.ctx.createGain();
  sub = this.ctx.createGain();
  wet = this.ctx.createGain();
  whoosh = this.ctx.createGain();
  reverb = this.ctx.createConvolver();

  constructor() {
    this.master.gain.value = 0;
    this.filter.type = "lowpass"; this.filter.frequency.value = 320; this.filter.Q.value = 0.7;
    this.reverb.buffer = makeImpulse(this.ctx, 4.0, 2.5);
    this.wet.gain.value = 0.35;
    this.filter.connect(this.master);
    this.filter.connect(this.reverb); this.reverb.connect(this.wet); this.wet.connect(this.master);
    this.master.connect(this.ctx.destination);
    const voices: [number, OscillatorType, number][] = [[55, "triangle", 0.10], [82.41, "sine", 0.08], [110, "sine", 0.04]];
    for (const [f, type, g] of voices) for (const det of [-4, 4]) {
      const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det;
      const og = this.ctx.createGain(); og.gain.value = g;
      o.connect(og).connect(this.filter); o.start();
    }
    for (const f of [880, 1318.51, 1760]) {
      const o = this.ctx.createOscillator(); o.frequency.value = f; o.connect(this.shimmer); o.start();
    }
    this.shimmer.gain.value = 0; this.shimmer.connect(this.reverb);
    const s = this.ctx.createOscillator(); s.frequency.value = 41.2; s.connect(this.sub); s.start();   // alt ses (E1)
    this.sub.gain.value = 0; this.sub.connect(this.master);
    const noise = this.ctx.createBufferSource(); noise.buffer = makeNoise(this.ctx, 2); noise.loop = true;
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 350; bp.Q.value = 0.8;
    noise.connect(bp).connect(this.whoosh); noise.start();
    this.whoosh.gain.value = 0; this.whoosh.connect(this.master);
  }

  private level = 0.5;
  muted = false;

  async start() { await this.ctx.resume(); this.master.gain.setTargetAtTime(this.level, this.ctx.currentTime, 1.5); }

  /** M: master hedefi 0 ↔ önceki değer */
  toggleMute() {
    this.muted = !this.muted;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.level, this.ctx.currentTime, 0.2);
  }

  /** Kalkış: filtre 2.120 → 900 Hz (1,5 sn) */
  takeoff() { this.filter.frequency.setTargetAtTime(900, this.ctx.currentTime, 0.5); }

  /** A3_LIGHTS sonu: master 6 sn'de 0,3'e */
  settle() { this.level = 0.3; if (!this.muted) this.master.gain.setTargetAtTime(0.3, this.ctx.currentTime, 2.0); }

  suspend() { return this.ctx.suspend(); }
  resume() { return this.ctx.resume(); }

  setProgress(q: number) {                                   // Perde 1 ve 3
    const t = this.ctx.currentTime;
    this.filter.frequency.setTargetAtTime(320 + 1800 * q * q, t, 0.15);
    this.shimmer.gain.setTargetAtTime(q > 0.6 ? 0.025 * (q - 0.6) / 0.4 : 0, t, 0.3);
  }

  setFlight(z: number, speed: number) {                      // Perde 2
    const t = this.ctx.currentTime, k = Math.min(1, Math.max(0, (z - 4) / 15));
    this.filter.frequency.setTargetAtTime(900 - 400 * k, t, 0.3);
    const s = Math.min(1, Math.max(0, (z - 13) / 6));
    this.sub.gain.setTargetAtTime(0.08 * s * s * (3 - 2 * s), t, 0.5);
    this.wet.gain.setTargetAtTime(0.35 + 0.25 * k, t, 0.5);
    this.whoosh.gain.setTargetAtTime(0.06 * Math.min(1, Math.abs(speed) / 0.8), t, 0.1);
  }

  chime() {                                                   // durak kartı
    const t = this.ctx.currentTime;
    for (const f of [523.25, 783.99]) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.value = f; g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.035, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
      o.connect(g).connect(this.reverb); o.start(t); o.stop(t + 2.6);
    }
  }

  swell() {
    if (this.muted) return;
    const g = this.master.gain, t = this.ctx.currentTime;
    g.setTargetAtTime(0.8, t, 0.7);
    g.setTargetAtTime(0.55, t + 2, 2.0);
  }
}

function makeImpulse(ctx: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function makeNoise(ctx: AudioContext, seconds: number) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

'use strict';

/* ====================== Zvuky (WebAudio) ====================== */
const Sound = {
  ctx: null, on: lsGet(LS_SOUND, true),
  init() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; } }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur, type = 'sine', vol = .2, when = 0, slideTo = null) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + .02);
  },
  noise(dur, vol) {
    if (!this.on || !this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1800;
    s.buffer = buf; g.gain.value = vol; s.connect(f).connect(g).connect(this.ctx.destination); s.start();
  },
  shot() { this.noise(.18, .5); this.tone(160, .12, 'square', .08, 0, 50); },
  hit() { this.tone(660, .12, 'triangle', .25); this.tone(880, .12, 'triangle', .25, .08); this.tone(1320, .3, 'triangle', .25, .16); },
  wrong() { this.tone(220, .45, 'sawtooth', .15, 0, 80); this.tone(180, .45, 'square', .06, .05, 70); },
  level() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, .22, 'triangle', .22, i * .09)); },
  over() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, .4, 'sawtooth', .12, i * .25)); },
};

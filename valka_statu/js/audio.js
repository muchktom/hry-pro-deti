'use strict';
// Zvuky (WebAudio, bez souborů)

let AC = null, lastShotSnd = 0;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, d, type, vol, f2) {
  const a = ac(); if (!a || muted) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.02);
}
function noise(d, vol) {
  const a = ac(); if (!a || muted) return;
  const len = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, len, a.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 900;
  s.buffer = buf; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(a.destination); s.start();
}
const SFX = {
  shoot()  { if (time - lastShotSnd < 0.06) return; lastShotSnd = time; tone(700, 0.06, 'square', 0.025, 250); },
  boom()   { noise(0.5, 0.35); },
  small()  { noise(0.12, 0.12); },
  deploy() { tone(330, 0.08, 'triangle', 0.08, 500); setTimeout(() => tone(500, 0.08, 'triangle', 0.08, 700), 70); },
  pick()   { tone(600, 0.07, 'sine', 0.08, 900); },
  drop()   { tone(800, 0.08, 'sine', 0.08, 400); },
  heal()   { tone(520, 0.1, 'sine', 0.08); setTimeout(() => tone(660, 0.1, 'sine', 0.08), 90); setTimeout(() => tone(880, 0.15, 'sine', 0.08), 180); },
  no()     { tone(200, 0.15, 'sawtooth', 0.05, 120); },
  click()  { tone(900, 0.03, 'square', 0.03); },
  coin()   { tone(1200, 0.06, 'square', 0.03); setTimeout(() => tone(1600, 0.08, 'square', 0.03), 60); },
  win()    { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.1), i * 150)); },
  lose()   { [400, 340, 280, 200].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sawtooth', 0.06), i * 200)); },
};

'use strict';
// Bleskík a kamarádi – 2D skákačka. Plain canvas, no libraries.
(() => {
const INK = '#1d1b2c';
const G = 2000;          // gravity, px/s²
const GROUND = 400;      // base ground height (world y grows downwards)
const TAN = '#ffe0b5';
const PI = Math.PI, TAU = PI * 2;

const HEROES = [
  { id: 'blesk', name: 'Sonic', kind: 'hedgehog', body: '#2f7bff', dark: '#1a4fb8', shoe: '#ffb703', speed: 480, jump: 840, glide: false },
  { id: 'uhlik', name: 'Shadow', kind: 'hedgehog', body: '#43434f', dark: '#1f1f27', shoe: '#3fc75a', speed: 420, jump: 950, glide: false },
  { id: 'pampa', name: 'Tails', kind: 'cat', body: '#ffd21f', dark: '#c99700', shoe: '#ff5fa2', speed: 410, jump: 840, glide: true },
];

const THEMES = [
  { name: 'Zelená louka', sky: ['#5ab8ff', '#cdf1ff'], far: '#9ad98a', near: '#62bf5b', grass: '#58c449', grassDark: '#2f8a2f', dirt: '#c07d3f', dirt2: '#a3652f', kind: 'louka' },
  { name: 'Slunečná pláž', sky: ['#ff9f6b', '#ffe9a8'], far: '#3fb6e0', near: '#f7d98b', grass: '#ffe08a', grassDark: '#d9a53c', dirt: '#e9b863', dirt2: '#d29d47', kind: 'plaz' },
  { name: 'Měsíční hory', sky: ['#17153f', '#4b3a8f'], far: '#3a3274', near: '#2a2459', grass: '#9d8cf0', grassDark: '#5f4fc0', dirt: '#5a4c9e', dirt2: '#4a3d88', kind: 'noc' },
];

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const cv = $('game'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, scale = 1, viewW = 0, viewH = 0;
let isTouch = matchMedia('(pointer: coarse)').matches;
if (isTouch) document.body.classList.add('touch');

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  scale = Math.min(H / 450, W / 620);
  viewW = W / scale; viewH = H / scale;
}
addEventListener('resize', resize);
resize();

// ---------- Sound ----------
let AC = null, muted = false;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume();
}
function tone(f1, f2, dur, type = 'square', vol = 0.07, delay = 0) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(AC.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  jump: () => tone(380, 760, 0.16, 'square', 0.045),
  star: () => { tone(1320, 1320, 0.07, 'triangle', 0.07); tone(1760, 1760, 0.1, 'triangle', 0.07, 0.06); },
  stomp: () => { tone(300, 90, 0.18, 'square', 0.08); tone(900, 1400, 0.1, 'triangle', 0.05, 0.08); },
  hurt: () => tone(440, 110, 0.4, 'sawtooth', 0.07),
  lose: () => { for (let i = 0; i < 6; i++) tone(1500 - i * 140, 1300 - i * 140, 0.06, 'triangle', 0.06, i * 0.04); },
  spring: () => tone(220, 1100, 0.3, 'triangle', 0.09),
  check: () => { tone(660, 660, 0.1, 'square', 0.05); tone(990, 990, 0.15, 'square', 0.05, 0.1); },
  boss: () => { tone(160, 60, 0.35, 'sawtooth', 0.1); tone(700, 300, 0.2, 'square', 0.05, 0.05); },
  boom: () => tone(120, 40, 0.3, 'sawtooth', 0.08),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, f, 0.18, 'square', 0.055, i * 0.13)),
  life: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, f, 0.1, 'triangle', 0.07, i * 0.07)),
  over: () => [392, 330, 262].forEach((f, i) => tone(f, f * 0.97, 0.25, 'triangle', 0.08, i * 0.22)),
};

// ---------- Input ----------
const keys = { left: false, right: false, jump: false };
const touch = { left: false, right: false, jump: false };
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump' };
const held = k => keys[k] || touch[k];
function jumpEdge() { if (S.p) S.p.buffer = 0.14; }

addEventListener('keydown', e => {
  audio();
  if (S.mode === 'menu') {
    const cards = [...document.querySelectorAll('.card')];
    const i = cards.indexOf(document.activeElement);
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      e.preventDefault();
      const d = e.code === 'ArrowRight' ? 1 : -1;
      cards[(Math.max(0, i) + d + cards.length) % cards.length].focus();
    } else if (/^Digit[123]$/.test(e.code)) startGame(+e.code.slice(5) - 1);
    return;
  }
  const k = KEYMAP[e.code];
  if (S.mode === 'play') {
    if (k) { e.preventDefault(); if (k === 'jump' && !keys.jump) jumpEdge(); keys[k] = true; }
    if (e.code === 'Escape' || e.code === 'KeyP') pause();
  } else if (S.mode === 'pause' && (e.code === 'Escape' || e.code === 'KeyP')) resume();
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
addEventListener('blur', () => { keys.left = keys.right = keys.jump = false; });

// Touch pad: left/right decided by the finger's position, so sliding between arrows works.
const padLR = $('padLR'), padJump = $('padJump');
const lrPointers = new Map();
function lrUpdate() {
  let l = false, r = false;
  for (const d of lrPointers.values()) { if (d < 0) l = true; else r = true; }
  touch.left = l; touch.right = r;
  padLR.children[0].classList.toggle('on', l);
  padLR.children[1].classList.toggle('on', r);
}
function lrDir(e) { const b = padLR.getBoundingClientRect(); return e.clientX < b.left + b.width / 2 ? -1 : 1; }
padLR.addEventListener('pointerdown', e => { e.preventDefault(); audio(); padLR.setPointerCapture(e.pointerId); lrPointers.set(e.pointerId, lrDir(e)); lrUpdate(); });
padLR.addEventListener('pointermove', e => { if (lrPointers.has(e.pointerId)) { lrPointers.set(e.pointerId, lrDir(e)); lrUpdate(); } });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) padLR.addEventListener(ev, e => { lrPointers.delete(e.pointerId); lrUpdate(); });
const jumpPointers = new Set();
padJump.addEventListener('pointerdown', e => {
  e.preventDefault(); audio(); padJump.setPointerCapture(e.pointerId);
  if (!jumpPointers.size) jumpEdge();
  jumpPointers.add(e.pointerId); touch.jump = true; padJump.classList.add('on');
});
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) padJump.addEventListener(ev, e => {
  jumpPointers.delete(e.pointerId); touch.jump = jumpPointers.size > 0; padJump.classList.toggle('on', touch.jump);
});
addEventListener('touchstart', () => { if (!isTouch) { isTouch = true; document.body.classList.add('touch'); } }, { passive: true });
document.addEventListener('contextmenu', e => e.preventDefault());

// ---------- Helpers ----------
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rand = (a, b) => a + Math.random() * (b - a);
function ell(c, x, y, rx, ry, fill, lw = 3) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
}
function poly(c, pts, fill, lw = 3) {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
}
function line(c, x1, y1, x2, y2, lw = 3, col = INK) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); }
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function starPath(c, x, y, R, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, rr = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath();
}

// ---------- Drawing: heroes ----------
// (x, y) = feet. o: { face, t, mode: stand|run|jump|ball|glide|hurt, ph }
function drawHero(c, h, x, y, o) {
  c.save(); c.translate(x, y); c.scale(o.face, 1);
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (o.mode === 'ball') {
    c.translate(0, -21); c.rotate(o.t * 20);
    ell(c, 0, 0, 21, 21, h.body);
    c.strokeStyle = h.dark; c.lineWidth = 3.5;
    for (let i = 0; i < 3; i++) { c.rotate(TAU / 3); c.beginPath(); c.arc(0, 0, 13, 0, 1.7); c.stroke(); }
    ell(c, 9, 6, 7, 5, TAN, 2);
    ell(c, 8, -6, 4, 5, '#fff', 2);
    c.restore(); return;
  }
  const ph = o.ph || 0;
  const run = o.mode === 'run';
  const bob = o.mode === 'stand' ? Math.sin(o.t * 3) * 1 : run ? -Math.abs(Math.sin(ph)) * 3 : 0;
  c.translate(0, bob);
  const air = o.mode === 'jump' || o.mode === 'glide' || o.mode === 'hurt';

  // tail (cat) or spikes (hedgehog), behind everything
  if (h.kind === 'cat') {
    const sw = Math.sin(o.t * 4) * 4;
    c.beginPath(); c.moveTo(-6, -14); c.quadraticCurveTo(-32, -10 + sw, -28, -36 + sw);
    c.lineWidth = 10; c.strokeStyle = INK; c.stroke(); c.lineWidth = 5; c.strokeStyle = h.body; c.stroke();
  } else {
    poly(c, [2, -50, -30, -54, -12, -43, -38, -38, -14, -31, -32, -18, -8, -21], h.body);
    line(c, -22, -48, -12, -45, 2.5, h.dark); line(c, -26, -35, -14, -34, 2.5, h.dark);
  }
  // legs + shoes
  let f1 = 0, f2 = 0, l1 = 0, l2 = 0;
  if (run) { f1 = Math.sin(ph) * 11; f2 = -f1; l1 = -Math.max(0, Math.cos(ph)) * 6; l2 = -Math.max(0, -Math.cos(ph)) * 6; }
  if (air) { f1 = -6; f2 = 8; l1 = -6; l2 = -2; }
  const leg = (fx, ly, back) => {
    line(c, back ? -3 : 3, -11, fx, -6 + ly, 4.5);
    ell(c, fx + 4, -5 + ly, 9, 5.5, h.shoe);
    line(c, fx + 1, -8 + ly, fx + 1, -2 + ly, 2.5, '#fff');
  };
  leg(f2, l2, true);
  // back arm
  const sw = run ? Math.sin(ph) * 9 : 0;
  let ha = [-8 - sw, -14], hb = [10 + sw, -14];
  if (o.mode === 'glide') { ha = [-16, -44]; hb = [18, -46]; }
  else if (air) { ha = [-12, -34]; hb = [14, -36]; }
  line(c, -2, -21, ha[0], ha[1], 4); ell(c, ha[0], ha[1], 4.5, 4.5, '#fff', 2.5);
  // body
  ell(c, 0, -17, 11, 9.5, h.body);
  ell(c, 3, -16, 6, 6.5, TAN, 0);
  leg(f1, l1, false);
  // cat ears (behind head)
  if (h.kind === 'cat') {
    poly(c, [-13, -44, -16, -63, -2, -50], h.body); poly(c, [3, -50, 10, -65, 13, -45], h.body);
    poly(c, [-11, -48, -13, -57, -6, -50], '#ff9ec6', 0); poly(c, [5, -50, 9, -59, 11, -48], '#ff9ec6', 0);
  }
  // head
  ell(c, 0, -34, 17, 17, h.body);
  ell(c, 8, -28.5, 9.5, 6.5, TAN, 2.5);
  if (o.mode === 'hurt') {
    line(c, 2, -42, 10, -35, 2.5); line(c, 10, -42, 2, -35, 2.5);
  } else {
    ell(c, 6, -38, 6, 7.5, '#fff', 2.5);
    ell(c, 8.5, -37.5, 2.8, 3.4, INK, 0);
    ell(c, 9.3, -39, 1, 1, '#fff', 0);
  }
  ell(c, 16.5, -31, 2.8, 2.4, INK, 0);
  c.beginPath(); c.arc(9, -29, 5, 0.3, 2.4); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
  if (h.kind === 'cat') { line(c, 13, -27, 24, -29, 1.5); line(c, 13, -25, 24, -23, 1.5); }
  // front arm
  line(c, 2, -20, hb[0], hb[1], 4); ell(c, hb[0], hb[1], 4.5, 4.5, '#fff', 2.5);
  c.restore();
}

// ---------- Drawing: enemies ----------
function drawEnemy(c, e, t) {
  c.save(); c.translate(e.x, e.y); c.scale(e.face, 1);
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (e.type === 'brouk') {           // ladybug robot on wheels
    for (const wx of [-13, 13]) {
      ell(c, wx, -8, 8, 8, '#777');
      c.save(); c.translate(wx, -8); c.rotate(e.x * -0.12 * e.face); line(c, -6, 0, 6, 0, 2, '#ddd'); line(c, 0, -6, 0, 6, 2, '#ddd'); c.restore();
    }
    rrect(c, -22, -20, 44, 9, 4); c.fillStyle = '#9aa3b5'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.ellipse(-2, -20, 22, 19, 0, PI, TAU); c.closePath(); c.fillStyle = '#e8322a'; c.fill(); c.stroke();
    line(c, -2, -38, -2, -20, 2.5);
    ell(c, -12, -27, 4, 4, INK, 0); ell(c, 8, -28, 4, 4, INK, 0); ell(c, -4, -33, 3, 3, INK, 0);
    ell(c, 20, -22, 9, 9, '#3a3a48');
    ell(c, 23, -23, 4.5, 4.5, '#ffe14d', 2); ell(c, 24.5, -23, 1.8, 1.8, INK, 0);
    line(c, 18, -30, 14, -40, 2); ell(c, 14, -41, 2.5, 2.5, '#ff4d4d', 1.5);
  } else if (e.type === 'krab') {     // crab robot
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const k = Math.sin(t * 10 + i * 2) * 3;
      line(c, s * (8 + i * 6), -12, s * (14 + i * 7), 0 + k * 0.3, 3);
    }
    ell(c, 0, -20, 27, 14, '#ff7a2a');
    line(c, -20, -16, 20, -16, 2.5, '#c24e10');
    for (const s of [-1, 1]) {
      const k = Math.sin(t * 6 + s) * 4;
      line(c, s * 22, -24, s * 30, -34 + k, 4);
      ell(c, s * 31, -38 + k, 9, 9, '#ff7a2a');
      line(c, s * 31, -38 + k, s * 39, -44 + k, 3);
      line(c, s * 6, -32, s * 8, -40, 3);
      ell(c, s * 8, -43, 5, 5, '#fff', 2.5); ell(c, s * 8 + 1.5, -43, 2, 2, INK, 0);
    }
  } else if (e.type === 'vcela') {    // bee robot with propeller
    const fl = Math.sin(t * 40);
    c.globalAlpha = 0.75;
    ell(c, -4, -36, 10, 6 + fl * 2, '#d8f3ff', 2);
    c.globalAlpha = 1;
    poly(c, [-20, -18, -31, -15, -20, -12], '#3a3a48', 2.5);
    c.save(); c.beginPath(); c.ellipse(0, -17, 20, 14, 0, 0, TAU); c.fillStyle = '#ffd21f'; c.fill(); c.clip();
    c.fillStyle = INK; c.fillRect(-12, -32, 6, 30); c.fillRect(-1, -32, 6, 30); c.restore();
    ell(c, 0, -17, 20, 14, null);
    ell(c, 12, -20, 5.5, 6, '#fff', 2.5); ell(c, 14, -20, 2.4, 2.4, INK, 0);
    line(c, 0, -31, 0, -40, 3);
    c.save(); c.translate(0, -41); c.scale(Math.cos(t * 30), 1); line(c, -13, 0, 13, 0, 4, '#9aa3b5'); c.restore();
  } else if (e.type === 'cervik') {   // the red one-eyed creature from the drawing
    const sq = e.squash || 0;
    c.scale(1 + sq * 0.15, 1 - sq * 0.2);
    rrect(c, -14, -12, 10, 12, 4); c.fillStyle = '#c21f18'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    rrect(c, 4, -12, 10, 12, 4); c.fill(); c.stroke();
    for (let i = 0; i < 3; i++) {
      c.beginPath(); c.moveTo(-8, -40 + i * 7); c.quadraticCurveTo(-24, -44 + i * 9, -28, -30 + i * 10);
      c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#d8261f'; c.stroke();
    }
    ell(c, 0, -26, 17, 18, '#d8261f');
    for (const ax of [6, 16]) { line(c, ax - 4, -30, ax + 2, -48, 5); line(c, ax - 4, -30, ax + 2, -48, 2, '#d8261f'); ell(c, ax + 3, -50, 4.5, 4.5, '#d8261f', 2.5); }
    ell(c, 5, -32, 8, 8, '#fff', 2.5); ell(c, 7, -32, 5, 5, '#4aa3ff', 0); ell(c, 8, -32, 2.2, 2.2, INK, 0);
    c.beginPath(); c.arc(4, -21, 7, 0.2, 2.6); c.fillStyle = INK; c.fill();
    c.fillStyle = '#fff'; c.fillRect(4, -18, 4, 3);
  }
  c.restore();
}

function enemyBox(e) {
  const s = ENEMY_SIZE[e.type];
  return { l: e.x - s.w / 2, r: e.x + s.w / 2, t: e.y - s.h, b: e.y };
}
const ENEMY_SIZE = { brouk: { w: 44, h: 36 }, krab: { w: 52, h: 34 }, vcela: { w: 40, h: 30 }, cervik: { w: 34, h: 44 } };

// ---------- Drawing: boss (Doktor Brejloun in his hover pod) ----------
function drawBoss(c, b, t, lookX) {
  c.save(); c.translate(b.x, b.y);
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (b.inv > 0 && Math.floor(t * 16) % 2) c.globalAlpha = 0.45;
  // jet flame
  const fl = 10 + Math.sin(t * 40) * 4;
  poly(c, [-14, 46, 0, 58 + fl, 14, 46], '#ffb703', 2);
  poly(c, [-7, 48, 0, 52 + fl * 0.6, 7, 48], '#fff3b0', 0);
  // doctor
  const look = clamp((lookX - b.x) / 200, -1, 1) * 2.5;
  const hurt = b.inv > 0;
  ell(c, 0, -20, 31, 27, '#e8322a');
  line(c, 0, -44, 0, -4, 2.5, '#a8160f');
  for (const s of [-1, 1]) { line(c, s * 26, -24, s * 40, -6, 6); line(c, s * 26, -24, s * 40, -6, 3, '#e8322a'); ell(c, s * 40, -5, 6, 6, '#fff', 2.5); }
  ell(c, 0, -60, 24, 24, '#ffd9b0');
  for (const s of [-1, 1]) {
    ell(c, s * 10, -64, 10, 10, '#d8f3ff', 3.5);
    if (hurt) { line(c, s * 10 - 4, -68, s * 10 + 4, -60, 2.5); line(c, s * 10 + 4, -68, s * 10 - 4, -60, 2.5); }
    else ell(c, s * 10 + look, -63, 3.5, 3.5, INK, 0);
    for (let i = 0; i < 3; i++) line(c, s * 7, -50 + i * 2, s * (22 + i * 2), -54 + i * 5, 2);
  }
  line(c, -2, -64, 2, -64, 3);
  ell(c, 0, -53, 4, 3.2, '#f0a37a', 2);
  c.beginPath(); c.arc(0, -47, 6, hurt ? 3.6 : 0.3, hurt ? 5.8 : 2.8); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
  // pod cup in front
  c.beginPath(); c.arc(0, 0, 50, 0, PI); c.closePath(); c.fillStyle = '#b8c0cc'; c.fill(); c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
  rrect(c, -56, -7, 112, 13, 6); c.fillStyle = '#e8eef5'; c.fill(); c.stroke();
  for (let i = -2; i <= 2; i++) ell(c, i * 18, 22, 4, 4, (Math.floor(t * 4) + i) % 3 === 0 ? '#ff4d4d' : '#ffe14d', 2);
  c.restore();
}

// ---------- Level ----------
function buildLevel(n) {
  const r = mulberry32(7 + n * 131);
  const pick = a => a[Math.floor(r() * a.length)];
  const L = { n, theme: THEMES[n], solids: [], plats: [], stars: [], enemies: [], springs: [], checks: [], deco: [] };
  const ground = (x, w, y) => L.solids.push({ x, y, w, h: 3000 });
  const star = (x, y) => L.stars.push({ x, y, taken: false, ph: r() * 6 });
  const enemy = (type, x, gy, x0, x1) => {
    const e = { type, x, y: gy, gy, x0, x1, vx: 0, vy: 0, t: r() * 6, alive: true, face: -1, squash: 0 };
    if (type === 'brouk') e.vx = -(70 + n * 15);
    if (type === 'krab') e.vx = -(45 + n * 10);
    if (type === 'vcela') { e.vx = -(80 + n * 15); e.baseY = gy - 115 - r() * 40; e.y = e.baseY; }
    if (type === 'cervik') { e.vx = -(55 + n * 10); e.hopT = r(); }
    L.enemies.push(e);
  };
  L.solids.push({ x: -400, y: -3000, w: 200, h: 6000, wall: true });
  ground(-200, 1000, GROUND);
  for (let i = 0; i < 5; i++) star(380 + i * 50, GROUND - 45);
  const pool = [
    ['brouk', 'brouk', 'cervik', 'brouk', 'vcela'],
    ['brouk', 'krab', 'cervik', 'vcela', 'krab'],
    ['brouk', 'krab', 'cervik', 'vcela', 'vcela', 'cervik'],
  ][n];
  const len = 6500 + n * 1500;
  const cps = [len * 0.36, len * 0.7];
  let x = 800, h = GROUND, last = '';
  while (x < len) {
    const w = 520 + Math.floor(r() * 420);
    if (r() < 0.6) {
      const opts = [];
      if (h > GROUND - 110) opts.push(h - 55);
      if (h < GROUND) opts.push(h + 55);
      h = pick(opts);
    }
    ground(x, w, h);
    if (cps.length && x > cps[0]) { cps.shift(); L.checks.push({ x: x + 70, y: h, on: false }); }
    let kind = pick(['enemy', 'enemy', 'plat', 'spring', 'stars', 'enemy']);
    if (kind === last && kind !== 'enemy') kind = 'enemy';
    last = kind;
    const a = x + 160, b = x + w - 50;
    if (kind === 'enemy') {
      const cnt = 1 + (r() < 0.25 + n * 0.2 ? 1 : 0);
      for (let i = 0; i < cnt; i++) {
        const type = pick(pool);
        enemy(type, a + (b - a) * (0.3 + i * 0.5), h, a, b);
      }
      for (let i = 0; i < 4; i++) star(a + 20 + i * 45, h - 45);
    } else if (kind === 'plat') {
      const px = x + w * 0.25;
      L.plats.push({ x: px, y: h - 125, w: 180 });
      for (let i = 0; i < 4; i++) star(px + 30 + i * 40, h - 165);
      if (r() < 0.6) {
        L.plats.push({ x: px + 190, y: h - 240, w: 170 });
        for (let i = 0; i < 3; i++) star(px + 225 + i * 50, h - 280);
      }
      if (r() < 0.4 + n * 0.25) enemy(r() < 0.5 ? 'vcela' : pick(pool), x + w * 0.8, h, x + w * 0.5, b);
    } else if (kind === 'spring') {
      const sx = x + w * 0.3;
      L.springs.push({ x: sx, y: h, t: 0 });
      for (let i = 0; i < 4; i++) star(sx, h - 120 - i * 55);
      L.plats.push({ x: sx + 70, y: h - 320, w: 220 });
      for (let i = 0; i < 5; i++) star(sx + 100 + i * 40, h - 360);
      if (r() < 0.5) enemy(pick(pool), x + w * 0.75, h, x + w * 0.55, b);
    } else {
      for (let i = 0; i < 7; i++) star(a + i * 50, h - 50 - Math.sin(i / 6 * PI) * 110);
      if (n > 0) enemy(pick(pool), x + w * 0.85, h, x + w * 0.6, b);
    }
    x += w;
  }
  // flat approach + boss arena
  ground(x, 2400, GROUND);
  for (let i = 0; i < 6; i++) star(x + 80 + i * 45, GROUND - 45);
  L.arenaX0 = x + 500; L.arenaX1 = L.arenaX0 + 1100; L.end = x + 2400;
  L.checks.push({ x: x + 60, y: GROUND, on: false });
  L.solids.push({ x: L.end, y: -3000, w: 300, h: 6000, wall: true });
  // decorations
  for (let dx = -150; dx < L.end - 50; dx += 90 + r() * 180) {
    const gy = groundTopAt(L, dx);
    if (gy != null) L.deco.push({ x: dx, y: gy, v: r(), s: 0.8 + r() * 0.5 });
  }
  return L;
}
function groundTopAt(L, x) {
  for (const s of L.solids) if (!s.wall && x >= s.x && x < s.x + s.w) return s.y;
  return null;
}

// ---------- State ----------
const S = { mode: 'menu', hero: HEROES[0], heroIdx: 0, level: 0, lv: null, p: null, camX: 0, camY: 0, stars: 0, total: 0, lifeStars: 0,
  hearts: 3, parts: [], loose: [], bombs: [], boss: null, locked: false, cp: null, t: 0, overT: 0, clearT: 0 };

function newPlayer(x, y) {
  return { x, y, prevY: y, vx: 0, vy: 0, w: 28, h: 42, face: 1, onGround: true, coyote: 0, buffer: 0, ball: false, glide: false, spring: false,
    inv: 0, hurtT: 0, t: 0, ph: 0, dead: false };
}
function newBoss(n) { return { x: 0, y: -400, hp: 3 + n, max: 3 + n, state: 'wait', t: 0, inv: 0, dir: -1, drops: 0, done: false }; }

function startGame(i) {
  audio();
  S.heroIdx = i; S.hero = HEROES[i];
  S.hearts = 3; S.total = 0; S.lifeStars = 0;
  startLevel(0);
}
function startLevel(n) {
  S.level = n; S.lv = buildLevel(n);
  S.stars = 0; S.hearts = Math.max(S.hearts, 3);
  S.cp = { x: 80, y: GROUND }; S.locked = false; S.boss = newBoss(n);
  S.bombs = []; S.parts = []; S.loose = [];
  spawnPlayer();
  setMode('play');
  banner(`${n + 1}. ${S.lv.theme.name}`);
  $('levelName').textContent = `${n + 1}. ${S.lv.theme.name}`;
}
function spawnPlayer() {
  S.p = newPlayer(S.cp.x, S.cp.y); S.p.inv = 1.5;
  keys.left = keys.right = keys.jump = false;
  updateCam(0, true); updateHud();
}
function retry() {
  S.hearts = 3; S.stars = 0;
  if (!S.boss.done) { S.boss = newBoss(S.level); S.locked = false; S.bombs = []; }
  S.loose = [];
  spawnPlayer(); setMode('play');
}

function setMode(m) {
  S.mode = m;
  document.body.classList.toggle('playing', m === 'play');
  $('hud').classList.toggle('hidden', m === 'menu');
  const ov = { menu: 'menu', pause: 'pause', over: 'end', clear: 'end', win: 'end' }[m] || null;
  for (const o of document.querySelectorAll('.overlay')) o.classList.toggle('hidden', o.id !== ov);
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  if (ov) { const f = $(ov).querySelector('[data-focus]'); if (f && !isTouch) f.focus({ preventScroll: true }); }
  if (m !== 'play') { touch.left = touch.right = touch.jump = false; lrPointers.clear(); jumpPointers.clear(); lrUpdate(); padJump.classList.remove('on'); }
}
function pause() { if (S.mode === 'play') setMode('pause'); }
function resume() { if (S.mode === 'pause') { keys.left = keys.right = keys.jump = false; setMode('play'); } }

function banner(txt) {
  const b = $('banner'); b.textContent = txt;
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
function updateHud() {
  $('hearts').textContent = '❤️'.repeat(Math.max(0, S.hearts)) || '–';
  $('starCount').textContent = S.stars;
}

function showEnd(kind) {
  const pic = $('endPic').getContext('2d');
  pic.setTransform(1, 0, 0, 1, 0, 0); pic.clearRect(0, 0, 220, 130);
  if (kind === 'over') {
    $('endTitle').textContent = 'Au, au!';
    $('endText').textContent = 'Nevadí, zkus to znovu!';
    $('endPrimary').textContent = '↻ Zkusit znovu';
    pic.setTransform(2, 0, 0, 2, 0, 0); drawHero(pic, S.hero, 55, 60, { face: 1, t: 0, mode: 'hurt' });
    setMode('over');
  } else {
    S.total += S.stars;
    const last = S.level >= THEMES.length - 1;
    $('endTitle').textContent = last ? 'Hurá! Vyhráno!' : 'Hurá!';
    $('endText').textContent = last ? `Doktor Brejloun utekl! ⭐ ${S.total}` : `Úroveň ${S.level + 1} hotová! ⭐ ${S.stars}`;
    $('endPrimary').textContent = last ? '↻ Hrát znovu' : 'Další úroveň ▶';
    pic.setTransform(1.8, 0, 0, 1.8, 0, 0);
    for (let i = 0; i < 3; i++) { pic.save(); pic.translate(20 + i * 42, 18); starPath(pic, 0, 0, 13, 6); pic.fillStyle = '#ffd21f'; pic.fill(); pic.lineWidth = 2.5; pic.strokeStyle = INK; pic.stroke(); pic.restore(); }
    drawHero(pic, S.hero, 60, 70, { face: 1, t: 0, mode: 'glide' });
    setMode(last ? 'win' : 'clear');
  }
}
$('endPrimary').addEventListener('click', () => {
  if (S.mode === 'over') retry();
  else if (S.mode === 'win') startGame(S.heroIdx);
  else if (S.mode === 'clear') startLevel(S.level + 1);
});
$('endChoose').addEventListener('click', toMenu);
$('btnChoose').addEventListener('click', toMenu);
$('btnPause').addEventListener('click', () => { audio(); pause(); });
$('btnResume').addEventListener('click', resume);
$('btnSound').addEventListener('click', () => { muted = !muted; $('btnSound').textContent = muted ? '🔇 Zvuk vypnutý' : '🔊 Zvuk zapnutý'; });
document.querySelectorAll('.card').forEach(b => b.addEventListener('click', () => startGame(+b.dataset.hero)));
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

function toMenu() {
  S.lv = buildLevel(0); S.p = null; S.camX = 0; S.camY = GROUND + 90 - viewH;
  S.parts = []; S.bombs = []; S.loose = [];
  setMode('menu');
}

// ---------- Update ----------
function hurt() {
  const p = S.p;
  if (p.inv > 0 || p.dead) return;
  p.inv = 2; p.hurtT = 0.45; p.vy = -480; p.vx = -p.face * 260; p.ball = false; p.onGround = false;
  if (S.stars > 0) {
    const n = Math.min(S.stars, 12);
    for (let i = 0; i < n; i++) {
      const a = -PI / 2 + (i / Math.max(1, n - 1) - 0.5) * 2.4;
      S.loose.push({ x: p.x, y: p.y - 25, vx: Math.cos(a) * 280, vy: Math.sin(a) * 380 - 150, t: 0 });
    }
    S.stars = 0; sfx.lose();
  } else {
    S.hearts--; sfx.hurt();
    if (S.hearts <= 0) { p.dead = true; p.vy = -700; p.vx = 0; S.overT = 1.3; sfx.over(); }
  }
  updateHud();
}

function addStar() {
  S.stars++; S.lifeStars++;
  if (S.lifeStars >= 50) {
    S.lifeStars = 0;
    if (S.hearts < 5) { S.hearts++; sfx.life(); banner('+1 ❤️'); }
  }
  updateHud();
}

function puff(x, y, n = 8, col = '#fff') {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), sp = rand(60, 200);
    S.parts.push({ k: 'puff', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, max: 0.5, r: rand(6, 12), col });
  }
}
function sparkle(x, y) {
  for (let i = 0; i < 5; i++) {
    const a = rand(0, TAU);
    S.parts.push({ k: 'spark', x, y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.4, max: 0.4 });
  }
}
const BIRD_COLS = ['#4aa3ff', '#ff6fa8', '#7ad35b', '#ffb703', '#b07cff'];
function freeCritter(x, y) {
  S.parts.push({ k: 'bird', x, y, vx: rand(-90, 90), vy: -140, life: 2.2, max: 2.2, col: BIRD_COLS[Math.floor(Math.random() * BIRD_COLS.length)] });
}

function updPlayer(dt) {
  const p = S.p, hero = S.hero, lv = S.lv;
  const ctl = !p.dead && p.hurtT <= 0;
  const L = ctl && held('left'), R = ctl && held('right'), J = held('jump');
  p.t += dt;
  p.inv = Math.max(0, p.inv - dt); p.hurtT = Math.max(0, p.hurtT - dt); p.buffer = Math.max(0, p.buffer - dt);
  p.coyote = p.onGround ? 0.1 : Math.max(0, p.coyote - dt);

  const dir = (R ? 1 : 0) - (L ? 1 : 0);
  if (dir) {
    const turning = p.vx !== 0 && Math.sign(p.vx) !== dir;
    p.vx += dir * (turning ? 2600 : p.onGround ? 1150 : 850) * dt;
    p.face = dir;
  } else if (!p.dead) {
    const f = p.onGround ? 1700 : 350;
    p.vx = Math.abs(p.vx) <= f * dt ? 0 : p.vx - Math.sign(p.vx) * f * dt;
  }
  p.vx = clamp(p.vx, -hero.speed, hero.speed);

  if (ctl && p.buffer > 0 && (p.onGround || p.coyote > 0)) {
    p.vy = -hero.jump; p.onGround = false; p.coyote = 0; p.buffer = 0; p.ball = true; p.spring = false; sfx.jump();
  }
  if (!J && p.ball && !p.spring && p.vy < -380) p.vy = -380;   // short hop when the button is released early
  p.vy += G * dt;
  p.glide = false;
  if (hero.glide && J && ctl && !p.onGround && p.vy > 110) { p.vy = 110; p.glide = true; p.ball = false; }
  if (p.vy > 1100) p.vy = 1100;

  if (p.dead) { p.x += p.vx * dt; p.y += p.vy * dt; return; }

  // horizontal move + collisions
  p.x += p.vx * dt;
  if (S.locked) p.x = clamp(p.x, lv.arenaX0 + 20, lv.arenaX1 - 20);
  for (const s of lv.solids) {
    if (p.x + p.w / 2 > s.x && p.x - p.w / 2 < s.x + s.w && p.y - p.h < s.y + s.h && p.y > s.y + 0.01) {
      if (p.x < s.x + s.w / 2) p.x = s.x - p.w / 2 - 0.01; else p.x = s.x + s.w + p.w / 2 + 0.01;
      p.vx = 0;
    }
  }
  // vertical move + collisions
  p.prevY = p.y;
  p.y += p.vy * dt;
  const wasGround = p.onGround;
  p.onGround = false;
  for (const s of lv.solids) {
    if (p.x + p.w / 2 > s.x && p.x - p.w / 2 < s.x + s.w && p.y - p.h < s.y + s.h && p.y > s.y) {
      if (p.vy >= 0) { p.y = s.y; p.vy = 0; p.onGround = true; }
      else { p.y = s.y + s.h + p.h; p.vy = 0; }
    }
  }
  if (p.vy >= 0) for (const pl of lv.plats) {
    if (p.prevY <= pl.y + 0.5 && p.y >= pl.y && p.x + p.w / 2 > pl.x + 4 && p.x - p.w / 2 < pl.x + pl.w - 4) { p.y = pl.y; p.vy = 0; p.onGround = true; }
  }
  if (p.onGround) {
    if (!wasGround && p.ball) puff(p.x, p.y, 3);
    p.ball = false; p.spring = false;
  }
  // springs
  for (const sp of lv.springs) {
    if (p.vy > 0 && Math.abs(p.x - sp.x) < 28 && p.y >= sp.y - 22 && p.prevY <= sp.y - 12) {
      p.y = sp.y - 22; p.vy = -1380; p.ball = true; p.spring = true; p.onGround = false; sp.t = 0.3; sfx.spring();
    }
  }
  if (p.y > 2000) { p.y = S.cp.y; p.x = S.cp.x; p.vy = 0; }

  p.ph += Math.abs(p.vx) * dt * 0.05;

  // stars
  const cy = p.y - p.h / 2;
  for (const st of lv.stars) {
    if (!st.taken && Math.abs(st.x - p.x) < 28 && Math.abs(st.y - cy) < 34) { st.taken = true; addStar(); sfx.star(); sparkle(st.x, st.y); }
  }
  for (const st of S.loose) {
    if (st.t > 0.45 && !st.gone && Math.abs(st.x - p.x) < 30 && Math.abs(st.y - cy) < 36) { st.gone = true; addStar(); sfx.star(); }
  }
  // checkpoints
  for (const c of lv.checks) {
    if (!c.on && p.x > c.x) { c.on = true; S.cp = { x: c.x, y: c.y }; sfx.check(); sparkle(c.x, c.y - 80); }
  }
  // boss arena
  if (!S.locked && !S.boss.done && p.x > lv.arenaX0 + 170) {
    S.locked = true; S.cp = { x: lv.arenaX0 + 120, y: GROUND };
    Object.assign(S.boss, { state: 'enter', t: 0, x: lv.arenaX1 + 200, y: GROUND - 420 });
    banner('Doktor Brejloun!');
  }
}

function updEnemies(dt) {
  const p = S.p, lv = S.lv;
  for (const e of lv.enemies) {
    if (!e.alive || Math.abs(e.x - (S.camX + viewW / 2)) > viewW * 0.5 + 400) continue;
    e.t += dt;
    if (e.type === 'cervik') {
      e.hopT -= dt;
      e.squash = Math.max(0, e.squash - dt * 4);
      if (e.y >= e.gy && e.hopT <= 0) { e.vy = -520; e.hopT = 1.1 + Math.random() * 0.6; e.squash = 0; }
      e.vy += G * 0.8 * dt; e.y += e.vy * dt;
      if (e.y >= e.gy) { if (e.vy > 200) e.squash = 1; e.y = e.gy; e.vy = 0; }
      if (e.y < e.gy) e.x += e.vx * dt;
    } else {
      e.x += e.vx * dt;
      if (e.type === 'vcela') e.y = e.baseY + Math.sin(e.t * 2.2) * 32;
    }
    if (e.x < e.x0) { e.x = e.x0; e.vx = Math.abs(e.vx); }
    if (e.x > e.x1) { e.x = e.x1; e.vx = -Math.abs(e.vx); }
    if (e.vx) e.face = Math.sign(e.vx);

    if (p.dead) continue;
    const b = enemyBox(e);
    const pl = p.x - p.w / 2, pr = p.x + p.w / 2, pt = p.y - p.h;
    if (pr > b.l + 4 && pl < b.r - 4 && p.y > b.t + 2 && pt < b.b - 2) {
      const stomp = p.vy > 0 && (p.prevY <= b.t + 20 || p.y < b.t + (b.b - b.t) * 0.55);
      if (stomp || (p.inv > 0 && p.vy > 0)) {
        e.alive = false;
        p.vy = held('jump') ? -780 : -560; p.ball = true; p.spring = true; p.onGround = false;
        sfx.stomp(); puff(e.x, e.y - 18, 10); freeCritter(e.x, e.y - 18);
      } else hurt();
    }
  }
}

function updBoss(dt) {
  const b = S.boss, lv = S.lv, p = S.p;
  if (b.state === 'wait') return;
  const a0 = lv.arenaX0, a1 = lv.arenaX1, HY = GROUND - 235, LY = GROUND - 58;
  b.t += dt; b.inv = Math.max(0, b.inv - dt);
  const go = (s) => { b.state = s; b.t = 0; };
  switch (b.state) {
    case 'enter':
      b.x += (a1 - 250 - b.x) * Math.min(1, dt * 2.2); b.y += (HY - b.y) * Math.min(1, dt * 2.2);
      if (b.t > 1.8) { go('hover'); b.drops = 0; }
      break;
    case 'hover': {
      b.x += b.dir * (140 + lv.n * 25) * dt;
      if (b.x < a0 + 160) b.dir = 1; if (b.x > a1 - 160) b.dir = -1;
      b.y += (HY + Math.sin(b.t * 3) * 10 - b.y) * Math.min(1, dt * 4);
      const nBombs = 2 + lv.n;
      if (b.drops < nBombs && b.t > 0.8 + b.drops * 0.9) { b.drops++; S.bombs.push({ x: b.x, y: b.y + 40, vy: 0 }); }
      if (b.t > 1.2 + nBombs * 0.9) go('down');
      break;
    }
    case 'down':
      b.y += (LY - b.y) * Math.min(1, dt * 4);
      if (b.t > 0.9) { go('sweep'); b.dir = p.x < b.x ? -1 : 1; }
      break;
    case 'sweep':
      b.x += b.dir * (210 + lv.n * 35) * dt; b.y = LY + Math.sin(b.t * 8) * 4;
      if ((b.dir < 0 && b.x < a0 + 90) || (b.dir > 0 && b.x > a1 - 90)) { b.dir = -b.dir; go('up'); }
      break;
    case 'up':
      b.y += (HY - b.y) * Math.min(1, dt * 3);
      if (b.t > 1.1) { go('hover'); b.drops = 0; }
      break;
    case 'flee':
      b.x += 220 * dt; b.y -= 170 * dt;
      if (Math.random() < dt * 20) S.parts.push({ k: 'puff', x: b.x + rand(-30, 30), y: b.y + rand(-20, 30), vx: rand(-40, 40), vy: rand(-60, 0), life: 0.8, max: 0.8, r: rand(8, 16), col: '#8a8a99' });
      if (b.t > 2.6 && S.mode === 'play') { sfx.win(); showEnd('clear'); }
      return;
  }
  // collision with player
  if (p.dead || b.inv > 0 || b.state === 'enter') return;
  const cx = b.x, cy = b.y - 25, R = 52;
  const nx = clamp(cx, p.x - p.w / 2, p.x + p.w / 2), ny = clamp(cy, p.y - p.h, p.y);
  if ((nx - cx) ** 2 + (ny - cy) ** 2 < R * R) {
    if (p.vy > 0 && p.y < cy) {
      b.hp--; b.inv = 1.3; sfx.boss(); puff(p.x, p.y, 10, '#ffe14d');
      p.vy = -760; p.vx = (p.x < b.x ? -1 : 1) * 220; p.ball = true; p.spring = true;
      if (b.hp <= 0) { b.done = true; go('flee'); S.locked = false; S.bombs = []; for (let i = 0; i < 6; i++) freeCritter(b.x + rand(-40, 40), b.y); banner('Hurá!'); }
      else { go('up'); b.drops = 0; }
    } else if (b.state === 'sweep' || b.state === 'down') {
      hurt();
    } else {
      if (p.vy < 0) p.vy = 200;
      p.x += (p.x < cx ? -1 : 1) * 4;
    }
  }
}

function updBombs(dt) {
  const p = S.p;
  for (const bm of S.bombs) {
    bm.vy += 650 * dt; bm.y += bm.vy * dt;
    const gy = groundTopAt(S.lv, bm.x) ?? GROUND;
    let boom = bm.y + 12 >= gy;
    if (!p.dead && Math.abs(bm.x - p.x) < 26 && bm.y > p.y - p.h - 10 && bm.y < p.y + 10) boom = true;
    if (boom) {
      bm.gone = true; sfx.boom();
      S.parts.push({ k: 'boom', x: bm.x, y: Math.min(bm.y, gy - 10), life: 0.4, max: 0.4 });
      puff(bm.x, gy - 10, 6, '#ffb703');
      if (!p.dead && Math.abs(p.x - bm.x) < 52 && p.y > gy - 70 - 10 && p.y - p.h < bm.y + 30) hurt();
    }
  }
  S.bombs = S.bombs.filter(b => !b.gone);
}

function updParts(dt) {
  for (const q of S.parts) {
    q.life -= dt; q.x += q.vx * dt || 0; q.y += q.vy * dt || 0;
    if (q.k === 'puff') { q.vx *= 0.9; q.vy *= 0.9; }
    if (q.k === 'bird') { q.vy -= 30 * dt; }
  }
  S.parts = S.parts.filter(q => q.life > 0);
  for (const st of S.loose) {
    st.t += dt; st.vy += 1300 * dt; st.x += st.vx * dt; st.y += st.vy * dt;
    const gy = groundTopAt(S.lv, st.x);
    if (gy != null && st.y > gy - 12) { st.y = gy - 12; st.vy = -Math.abs(st.vy) * 0.55; st.vx *= 0.8; }
  }
  S.loose = S.loose.filter(st => !st.gone && st.t < 4);
  for (const sp of S.lv.springs) sp.t = Math.max(0, sp.t - dt);
}

function updateCam(dt, snap) {
  const lv = S.lv, p = S.p;
  // on touch devices keep the ground line just above the on-screen buttons
  const bottom = isTouch ? GROUND + 100 / scale : GROUND + 95;
  let tx, ty;
  if (p) {
    S.lead = (S.lead || 0) + (clamp(p.vx * 0.35, -viewW * 0.14, viewW * 0.14) - (S.lead || 0)) * Math.min(1, dt * 2);
    tx = p.x - viewW * 0.42 + S.lead;
    tx = clamp(tx, -200, lv.end - viewW);
    if (S.locked) {
      const aw = lv.arenaX1 - lv.arenaX0;
      tx = viewW >= aw ? (lv.arenaX0 + lv.arenaX1) / 2 - viewW / 2 : clamp(tx, lv.arenaX0, lv.arenaX1 - viewW);
    }
    ty = Math.min(p.y - p.h - viewH * 0.28, bottom - viewH);
  } else {
    tx = S.camX + 70 * dt; if (tx > lv.end - viewW - 2000) tx = 0;
    ty = bottom - viewH;
  }
  if (snap) { S.camX = tx; S.camY = ty; }
  else { S.camX += (tx - S.camX) * Math.min(1, dt * 7); S.camY += (ty - S.camY) * Math.min(1, dt * 5); }
}

function update(dt) {
  S.t += dt;
  if (S.mode === 'play') {
    updPlayer(dt);
    updEnemies(dt);
    updBoss(dt);
    updBombs(dt);
    if (S.p.dead) { S.overT -= dt; if (S.overT <= 0) showEnd('over'); }
  }
  if (S.mode === 'play' || S.mode === 'menu') updParts(dt);
  if (S.mode === 'play' || S.mode === 'menu') updateCam(dt, false);
}

// ---------- Render ----------
function drawBackground(th) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(DPR * scale, 0, 0, DPR * scale, 0, 0);
  const gS = GROUND - S.camY;               // ground line on screen (world units)
  const t = S.t;
  // sun / moon / stars
  if (th.kind === 'noc') {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137.5 - S.camX * 0.05) % (viewW + 40) + viewW + 40) % (viewW + 40) - 20, sy = (i * 71) % (gS * 0.7);
      const tw = 1 + Math.sin(t * 2 + i) * 0.6;
      ctx.fillRect(sx, sy, tw * 1.6, tw * 1.6);
    }
    ell(ctx, viewW * 0.78, gS * 0.22, 34, 34, '#fff6c9', 0);
    ell(ctx, viewW * 0.78 + 12, gS * 0.22 - 8, 28, 28, th.sky[0], 0);
  } else {
    ell(ctx, viewW * 0.8, gS * 0.2, 40, 40, th.kind === 'plaz' ? '#fff1a8' : '#fff59a', 0);
    // clouds
    for (let i = 0; i < 6; i++) {
      const span = viewW + 300;
      const cx = (((i * 420 - S.camX * 0.12 - t * 8) % span) + span) % span - 150, cy = 40 + (i * 53) % 120 + (gS - 300) * 0.3;
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (const [dx, dy, r] of [[0, 0, 26], [28, -10, 32], [58, 0, 24], [30, 8, 24]]) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, TAU); ctx.fill(); }
    }
  }
  // far layer
  const farY = gS - 150 + (S.camY - (GROUND + 95 - viewH)) * 0.0;
  ctx.fillStyle = th.far; ctx.beginPath(); ctx.moveTo(0, viewH);
  for (let sx = 0; sx <= viewW + 20; sx += 20) {
    const wx = sx + S.camX * 0.2;
    let y;
    if (th.kind === 'plaz') y = farY + 60;
    else if (th.kind === 'noc') y = farY - 20 - Math.abs(Math.sin(wx * 0.006)) * 110 - Math.abs(Math.sin(wx * 0.017)) * 30;
    else y = farY - Math.sin(wx * 0.005) * 50 - Math.sin(wx * 0.013) * 22;
    ctx.lineTo(sx, y);
  }
  ctx.lineTo(viewW + 20, viewH); ctx.fill();
  if (th.kind === 'plaz') {
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      const sx = ((i * 97 - S.camX * 0.2) % viewW + viewW) % viewW, sy = farY + 75 + (i % 4) * 16;
      ctx.beginPath(); ctx.arc(sx, sy, 10, PI * 1.1, PI * 1.9); ctx.stroke();
    }
  }
  // near layer
  ctx.fillStyle = th.near; ctx.beginPath(); ctx.moveTo(0, viewH);
  for (let sx = 0; sx <= viewW + 20; sx += 20) {
    const wx = sx + S.camX * 0.45;
    ctx.lineTo(sx, gS - 50 - Math.sin(wx * 0.008) * 30 - Math.sin(wx * 0.021 + 1) * 12);
  }
  ctx.lineTo(viewW + 20, viewH); ctx.fill();
}

function drawDeco(d, th) {
  const c = ctx;
  c.save(); c.translate(d.x, d.y); c.scale(d.s, d.s);
  if (th.kind === 'louka') {
    if (d.v < 0.55) {
      line(c, 0, 0, 0, -26, 3, '#2f8a2f');
      const col = ['#ff6fa8', '#ffd21f', '#fff', '#b07cff'][Math.floor(d.v * 7) % 4];
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5; ell(c, Math.cos(a) * 7, -28 + Math.sin(a) * 7, 5.5, 5.5, col, 2); }
      ell(c, 0, -28, 4, 4, '#ffb703', 2);
    } else {
      for (const [dx, r] of [[-18, 16], [0, 22], [18, 15]]) { c.beginPath(); c.arc(dx, 0, r, PI, TAU); c.fillStyle = '#3fae4a'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); }
    }
  } else if (th.kind === 'plaz') {
    if (d.v < 0.4) {
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-6, -50, 8, -95); c.lineWidth = 11; c.strokeStyle = INK; c.stroke(); c.lineWidth = 7; c.strokeStyle = '#b5743a'; c.stroke();
      for (let i = 0; i < 5; i++) {
        const a = -PI + i * PI / 4 + 0.0;
        c.beginPath(); c.moveTo(8, -95); c.quadraticCurveTo(8 + Math.cos(a) * 30, -112 + Math.sin(a) * 10, 8 + Math.cos(a) * 52, -88 + Math.sin(a) * 14 + 22);
        c.lineWidth = 12; c.strokeStyle = INK; c.stroke(); c.lineWidth = 8; c.strokeStyle = '#3fae4a'; c.stroke();
      }
    } else if (d.v < 0.7) {
      c.beginPath(); c.arc(0, -2, 10, PI, TAU); c.closePath(); c.fillStyle = '#ff9ec6'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
      line(c, -4, -2, -2, -10, 2); line(c, 4, -2, 2, -10, 2);
    }
  } else {
    if (d.v < 0.5) {
      poly(c, [-14, 0, -8, -34, 0, -48, 8, -30, 14, 0], d.v < 0.25 ? '#6ee7ff' : '#ff8ae2');
      line(c, 0, -46, 0, -4, 2, 'rgba(255,255,255,.6)');
    } else if (d.v < 0.8) {
      line(c, 0, 0, 0, -18, 5, '#e8e0ff');
      c.beginPath(); c.arc(0, -18, 14, PI, TAU); c.closePath(); c.fillStyle = '#7dff9b'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    }
  }
  c.restore();
}

function drawWorld() {
  const lv = S.lv, th = lv.theme, t = S.t;
  const x0 = S.camX - 120, x1 = S.camX + viewW + 120;
  ctx.setTransform(DPR * scale, 0, 0, DPR * scale, -S.camX * DPR * scale, -S.camY * DPR * scale);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  for (const d of lv.deco) if (d.x > x0 && d.x < x1) drawDeco(d, th);

  // ground
  const bottom = S.camY + viewH + 10;
  for (const s of lv.solids) {
    if (s.wall || s.x > x1 || s.x + s.w < x0) continue;
    const bot = Math.min(s.y + s.h, bottom);
    ctx.fillStyle = th.dirt; ctx.fillRect(s.x, s.y, s.w + 1, bot - s.y);
    ctx.fillStyle = th.dirt2;
    for (let yy = s.y + 34; yy < bot; yy += 40) ctx.fillRect(s.x, yy, s.w + 1, 14);
    ctx.fillStyle = th.grass; ctx.fillRect(s.x, s.y, s.w + 1, 14);
    for (let xx = s.x; xx < s.x + s.w; xx += 20) { ctx.beginPath(); ctx.arc(xx + 10, s.y + 14, 10, 0, PI); ctx.fill(); }
    ctx.lineWidth = 3; ctx.strokeStyle = INK;
    const lt = groundTopAt(lv, s.x - 1) ?? -1e4, rt = groundTopAt(lv, s.x + s.w + 1) ?? -1e4;
    ctx.beginPath();
    ctx.moveTo(s.x, Math.min(bot, Math.max(s.y, lt))); ctx.lineTo(s.x, s.y); ctx.lineTo(s.x + s.w, s.y);
    ctx.lineTo(s.x + s.w, Math.min(bot, Math.max(s.y, rt))); ctx.stroke();
  }
  for (const pl of lv.plats) {
    if (pl.x > x1 || pl.x + pl.w < x0) continue;
    rrect(ctx, pl.x, pl.y, pl.w, 26, 10); ctx.fillStyle = th.dirt; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = th.grass; ctx.fillRect(pl.x, pl.y, pl.w, 11);
    for (let xx = pl.x; xx < pl.x + pl.w; xx += 18) { ctx.beginPath(); ctx.arc(xx + 9, pl.y + 11, 9, 0, PI); ctx.fill(); }
    ctx.restore();
    rrect(ctx, pl.x, pl.y, pl.w, 26, 10); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
  // springs
  for (const sp of lv.springs) {
    if (sp.x < x0 || sp.x > x1) continue;
    const comp = sp.t > 0 ? -8 : 0;
    rrect(ctx, sp.x - 22, sp.y - 10, 44, 10, 3); ctx.fillStyle = '#e8322a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); for (let i = 0; i <= 4; i++) ctx.lineTo(sp.x + (i % 2 ? 10 : -10), sp.y - 10 - i * (3 + comp / 4) - (sp.t > 0 ? -2 : 0)); ctx.lineWidth = 3.5; ctx.strokeStyle = '#555'; ctx.stroke();
    rrect(ctx, sp.x - 24, sp.y - 30 - comp * 0.5 + (sp.t > 0 ? 6 : 0), 48, 10, 4); ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
  // checkpoints
  for (const c of lv.checks) {
    if (c.x < x0 || c.x > x1) continue;
    line(ctx, c.x, c.y, c.x, c.y - 84, 5); line(ctx, c.x, c.y, c.x, c.y - 84, 2, '#ccd');
    const wv = Math.sin(t * 6) * 4;
    poly(ctx, [c.x + 2, c.y - 84, c.x + 44, c.y - 74 + (c.on ? wv : 0), c.x + 2, c.y - 62], c.on ? '#3fc75a' : '#e8322a');
    ell(ctx, c.x, c.y - 87, 6, 6, '#ffd21f', 2.5);
  }
  // stars
  for (const st of lv.stars) {
    if (st.taken || st.x < x0 || st.x > x1) continue;
    drawStar(st.x, st.y + Math.sin(t * 3 + st.ph) * 3, t + st.ph, 1);
  }
  for (const st of S.loose) {
    if (st.t > 3 && Math.floor(st.t * 12) % 2) continue;
    drawStar(st.x, st.y, t * 2, 0.85);
  }
  // enemies
  for (const e of lv.enemies) if (e.alive && e.x > x0 && e.x < x1) drawEnemy(ctx, e, e.t);
  // bombs + warning marks
  for (const bm of S.bombs) {
    const gy = groundTopAt(lv, bm.x) ?? GROUND;
    ctx.globalAlpha = 0.5 + Math.sin(t * 20) * 0.3; ell(ctx, bm.x, gy - 2, 18, 5, '#ff4d4d', 0); ctx.globalAlpha = 1;
    line(ctx, bm.x + 6, bm.y - 10, bm.x + 12, bm.y - 18, 3, '#8a6a3a');
    ell(ctx, bm.x, bm.y, 13, 13, '#2c2c38');
    ell(ctx, bm.x - 4, bm.y - 4, 4, 4, Math.floor(t * 10) % 2 ? '#ff4d4d' : '#ffe14d', 0);
  }
  // boss
  if (S.boss && S.boss.state !== 'wait') drawBoss(ctx, S.boss, t, S.p ? S.p.x : S.boss.x);
  // player
  const p = S.p;
  if (p && !(p.inv > 0 && !p.dead && Math.floor(p.t * 14) % 2)) {
    let mode = 'stand';
    if (p.dead || p.hurtT > 0) mode = 'hurt';
    else if (p.glide) mode = 'glide';
    else if (!p.onGround) mode = p.ball ? 'ball' : 'jump';
    else if (Math.abs(p.vx) > 15) mode = 'run';
    drawHero(ctx, S.hero, p.x, p.y, { face: p.face, t: p.t, mode, ph: p.ph });
  }
  // particles
  for (const q of S.parts) {
    const a = q.life / q.max;
    if (q.k === 'puff') { ctx.globalAlpha = a; ell(ctx, q.x, q.y, q.r * (1.6 - a * 0.6), q.r * (1.6 - a * 0.6), q.col, 0); }
    else if (q.k === 'spark') { ctx.globalAlpha = a; starPath(ctx, q.x, q.y, 6, 2.5); ctx.fillStyle = '#fff59a'; ctx.fill(); }
    else if (q.k === 'boom') { ctx.globalAlpha = a; ell(ctx, q.x, q.y, 60 * (1.2 - a), 50 * (1.2 - a), '#ff9a2a', 0); ell(ctx, q.x, q.y, 34 * (1.2 - a), 28 * (1.2 - a), '#fff3b0', 0); }
    else if (q.k === 'bird') {
      ctx.globalAlpha = Math.min(1, a * 3);
      const fl = Math.sin(q.life * 30) * 7;
      ell(ctx, q.x, q.y, 9, 8, q.col, 2.5);
      poly(ctx, [q.x - 2, q.y - 2, q.x - 12, q.y - 8 - fl, q.x + 4, q.y - 4], q.col, 2);
      ell(ctx, q.x + 4, q.y - 3, 1.8, 1.8, INK, 0);
      poly(ctx, [q.x + 8, q.y - 1, q.x + 13, q.y + 1, q.x + 8, q.y + 3], '#ffb703', 1.5);
    }
    ctx.globalAlpha = 1;
  }
  // boss health
  if (S.locked && S.boss && S.boss.hp > 0) {
    ctx.setTransform(DPR * scale, 0, 0, DPR * scale, 0, 0);
    const bw = 34 * S.boss.max;
    const bx = viewW / 2 - bw / 2, by = 62;
    for (let i = 0; i < S.boss.max; i++) {
      ell(ctx, bx + 17 + i * 34, by, 13, 13, i < S.boss.hp ? '#e8322a' : '#bbb', 3);
    }
  }
}
function drawStar(x, y, t, s) {
  const sx = Math.cos(t * 2.5);
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.25, Math.abs(sx)) * s, s);
  starPath(ctx, 0, 0, 14, 6.5); ctx.fillStyle = sx > 0 ? '#ffd21f' : '#ffb703'; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

function render() {
  if (!S.lv) return;
  drawBackground(S.lv.theme);
  drawWorld();
}

// menu character previews
const previews = [...document.querySelectorAll('.card canvas')].map(c => c.getContext('2d'));
function renderPreviews() {
  previews.forEach((c, i) => {
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 150, 130);
    c.setTransform(2.1, 0, 0, 2.1, 0, 0);
    ell(c, 36, 58, 22, 4, 'rgba(0,0,0,.12)', 0);
    drawHero(c, HEROES[i], 34, 57, { face: 1, t: S.t + i, mode: 'run', ph: S.t * 9 + i });
  });
}

// ---------- Loop ----------
let last = performance.now(), acc = 0;
const STEP = 1 / 120;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  acc += dt;
  while (acc >= STEP) { update(STEP); acc -= STEP; }
  render();
  if (S.mode === 'menu') renderPreviews();
  requestAnimationFrame(frame);
}
toMenu();
requestAnimationFrame(frame);
})();

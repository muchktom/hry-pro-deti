'use strict';

/* ====================== Stav hry ====================== */
const field = $('field'), game = $('game');
const S = {
  running: false, paused: false,
  level: 1, startLevel: 1, score: 0, lives: MAX_LIVES, combo: 0, hitsInLevel: 0,
  target: null, clocks: [], spawnTimer: 0, sinceTarget: 0, taskTime: 0, lastT: 0,
  W: 0, H: 0, size: 120,
};
let selectedLevel = 1;

function measure() {
  S.W = field.clientWidth; S.H = field.clientHeight;
  S.size = Math.round(Math.max(95, Math.min(175, Math.min(S.W, S.H * 1.4) * 0.15)));
}
window.addEventListener('resize', measure);

/* ---------- čas ---------- */
function makeTarget() {
  const cfg = levelCfg(S.level);
  let h, m, tries = 0;
  do {
    m = randInt(0, 60 / cfg.step - 1) * cfg.step;
    h = cfg.h24 ? randInt(0, 23) : randInt(1, 12);
    tries++;
  } while (S.target && (h % 12) === (S.target.h % 12) && m === S.target.m && tries < 20);
  S.target = { h, m };
  $('taskTime').textContent = `${h}:${pad(m)}`;
  const tt = $('taskTime'); tt.classList.remove('pulse'); void tt.offsetWidth; tt.classList.add('pulse');
  S.sinceTarget = 0;
  S.taskTime = 0;
  S.spawnTimer = Math.min(S.spawnTimer, 0.4);
}
const matches = c => c.h === S.target.h % 12 && c.m === S.target.m;

function makeDistractor() {
  const cfg = levelCfg(S.level), th = S.target.h % 12, tm = S.target.m;
  for (let i = 0; i < 30; i++) {
    let h = th, m = tm;
    if (cfg.tricky && Math.random() < 0.6) {
      switch (randInt(0, 4)) {
        case 0: h = (th + (Math.random() < .5 ? 1 : 11)) % 12; break;               // o hodinu vedle
        case 1: m = (tm + cfg.step * (Math.random() < .5 ? 1 : -1) * randInt(1, 3) + 120) % 60; break; // pár minut vedle
        case 2: h = Math.round(tm / 5) % 12; m = (th * 5) % 60; break;             // prohozené ručičky
        case 3: h = (12 - th) % 12; break;                                          // zrcadlově
        case 4: m = (60 - tm) % 60; break;                                          // zrcadlové minuty
      }
      if (m % cfg.step) continue;
    } else {
      h = randInt(0, 11); m = randInt(0, 60 / cfg.step - 1) * cfg.step;
    }
    if (!(h === th && m === tm)) return { h, m };
  }
  return { h: (th + 3) % 12, m: tm };
}

/* ---------- hodiny na obrazovce ---------- */
function spawnClock(forceTarget) {
  const cfg = levelCfg(S.level);
  const anyMatch = S.clocks.some(c => !c.dead && !c.wrong && matches(c));
  let t;
  if (forceTarget || (!anyMatch && Math.random() < 0.55) || (anyMatch && Math.random() < 0.08)) {
    t = { h: S.target.h % 12, m: S.target.m };
    S.sinceTarget = 0;
  } else t = makeDistractor();

  const w = S.size, hgt = Math.round(w * 160 / 120);
  // vyber místo, kde zrovna nepadají jiné hodiny
  const margin = 24 + 20;
  let best = null, bestScore = -Infinity;
  for (let i = 0; i < 14; i++) {
    const x = rand(margin, Math.max(margin, S.W - w - margin));
    let score = 1e9;
    for (const c of S.clocks) {
      if (c.dead) continue;
      const dx = Math.abs(c.baseX - x), dy = c.y + hgt; // čím níž je, tím méně překáží
      if (dx < w * 1.15) score = Math.min(score, dy);
    }
    if (score > bestScore) { bestScore = score; best = x; }
  }
  const el = document.createElement('div');
  el.className = 'clock';
  el.style.width = w + 'px'; el.style.height = hgt + 'px';
  el.innerHTML = `<div class="inner">${clockSVG(t.h, t.m, cfg)}</div>`;
  const c = {
    el, h: t.h, m: t.m, baseX: best, x: best, y: -hgt * 0.7 - rand(0, 20), w, hgt,
    vy: (S.H + hgt) / cfg.fallTime * rand(.85, 1.15),
    phase: rand(0, 6.28), sway: rand(8, 22), swaySpd: rand(1.2, 2.2), dead: false, wrong: false,
  };
  el._clock = c;
  field.appendChild(el);
  S.clocks.push(c);
}

function removeClock(c) { c.dead = true; c.el.remove(); }

/* ---------- efekty ---------- */
function fx(cls, x, y, html, life = 1400) {
  const d = document.createElement('div');
  d.className = cls; d.style.left = x + 'px'; d.style.top = y + 'px';
  if (html !== undefined) d.innerHTML = html;
  field.appendChild(d);
  setTimeout(() => d.remove(), life);
  return d;
}
function stars(x, y) {
  const items = ['⭐', '✨', '🌟', '💛'];
  for (let i = 0; i < 14; i++) {
    const a = rand(0, Math.PI * 2), r = rand(60, 150);
    const s = fx('star', x, y, pick(items), 900);
    s.style.setProperty('--dx', Math.cos(a) * r + 'px');
    s.style.setProperty('--dy', Math.sin(a) * r + 'px');
    s.style.setProperty('--rot', rand(-360, 360) + 'deg');
  }
}
function shakeScreen() { game.classList.remove('shake'); void game.offsetWidth; game.classList.add('shake'); }
function banner(text, sub) { fx('banner', 0, 0, text + (sub ? `<small>${sub}</small>` : ''), 2000).style.left = '50%'; }

/* ---------- HUD ---------- */
function renderHearts(breakIdx = -1) {
  const h = $('hearts'); h.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const s = document.createElement('span');
    s.textContent = '♥';
    if (i >= S.lives) s.classList.add('lost');
    if (i === breakIdx) s.classList.add('breaking');
    h.appendChild(s);
  }
}
function renderHud() {
  const sv = $('scoreVal');
  sv.textContent = S.score; sv.classList.remove('bump'); void sv.offsetWidth; sv.classList.add('bump');
  $('levelVal').textContent = S.level;
  $('combo').textContent = S.combo >= 2 ? `×${S.combo} 🔥` : '';
}
function fmt12(h, m) { return `${h === 0 ? 12 : h}:${pad(m)}`; }

/* ---------- střelba ---------- */
function onShoot(e) {
  Sound.init();
  if (!S.running || S.paused || S.lives <= 0) return;
  const rect = field.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  Sound.shot();
  fx('flash', x, y, undefined, 300);

  const el = e.target.closest && e.target.closest('.clock');
  const c = el && el._clock;
  if (!c || c.dead || c.wrong || c.hitDone || c.revealed) { fx('hole', x, y, undefined, 1300); return; }

  if (matches(c)) {
    // TREFA
    c.hitDone = true;
    el.classList.add('hit');
    setTimeout(() => removeClock(c), 450);
    Sound.hit();
    stars(c.x + c.w / 2, c.y + c.hgt * .62);
    S.combo++;
    const pts = 100 * S.level + 25 * S.level * Math.min(S.combo - 1, 10);
    S.score += pts;
    fx('popup good', x, y - 40, pick(['Trefa!', 'Výborně!', 'Super!', 'Bravo!', 'Paráda!', 'Přesně tak!']));
    fx('popup points', x, y + 10, `+${pts}`);
    S.hitsInLevel++;
    if (S.hitsInLevel >= HITS_PER_LEVEL) levelUp();
    renderHud();
    makeTarget();
  } else {
    // VEDLE
    c.wrong = true;
    el.classList.add('wrong');
    Sound.wrong();
    shakeScreen();
    S.combo = 0;
    S.lives--;
    renderHearts(S.lives);
    renderHud();
    fx('popup bad', x, y - 30, `NE!<small>Tohle je ${fmt12(c.h, c.m)}. Zkus to znovu!</small>`, 1400);
    if (S.lives <= 0) setTimeout(gameOver, 700);
  }
}

/* ---------- vypršel čas na úkol ---------- */
function taskTimeout() {
  // ukaž, které hodiny byly správně (pro učení), a už na ně nejde klikat
  for (const c of S.clocks) {
    if (!c.dead && !c.hitDone && !c.wrong && matches(c)) { c.revealed = true; c.el.classList.add('reveal'); }
  }
  Sound.wrong();
  shakeScreen();
  S.combo = 0;
  S.lives--;
  renderHearts(S.lives);
  renderHud();
  fx('popup bad', S.W / 2, S.H * 0.4,
    `Čas vypršel!<small>Hledali jsme ${$('taskTime').textContent}. Teď nový čas!</small>`, 1800);
  if (S.lives <= 0) { setTimeout(gameOver, 900); return; }
  makeTarget();
}
function renderTaskBar(cfg) {
  const left = Math.max(0, 1 - S.taskTime / cfg.taskLimit);
  const fill = $('taskBarFill');
  fill.style.width = (left * 100) + '%';
  fill.classList.toggle('low', left < 0.3);
}
field.addEventListener('pointerdown', onShoot);

function levelUp() {
  S.level++; S.hitsInLevel = 0;
  const maxL = lsGet(LS_MAXLVL, 1);
  if (S.level > maxL) lsSet(LS_MAXLVL, S.level);
  Sound.level();
  banner(`Úroveň ${S.level}!`, levelDesc(S.level));
  // staré hodiny dopadají rychleji
  const cfg = levelCfg(S.level);
  for (const c of S.clocks) c.vy = Math.max(c.vy, (S.H + c.hgt) / cfg.fallTime);
}

/* ---------- herní smyčka ---------- */
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - S.lastT) / 1000 || 0);
  S.lastT = t;
  if (!S.running || S.paused) return;

  const cfg = levelCfg(S.level);
  S.sinceTarget += dt;
  S.spawnTimer -= dt;
  if (S.lives > 0) {
    S.taskTime += dt;
    if (S.taskTime >= cfg.taskLimit) taskTimeout();
    renderTaskBar(cfg);
  }
  const alive = S.clocks.filter(c => !c.dead && !c.hitDone).length;
  if (S.spawnTimer <= 0 && alive < cfg.maxClocks) {
    const anyMatch = S.clocks.some(c => !c.dead && !c.wrong && matches(c));
    spawnClock(!anyMatch && S.sinceTarget > 0.8);
    S.spawnTimer = cfg.spawnEvery * rand(.75, 1.25);
  }

  for (const c of S.clocks) {
    if (c.dead) continue;
    if (!c.hitDone) c.y += c.vy * dt;
    c.phase += c.swaySpd * dt;
    c.x = c.baseX + Math.sin(c.phase) * c.sway;
    c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
    if (c.y > S.H + 10) removeClock(c);
  }
  if (S.clocks.length > 40) S.clocks = S.clocks.filter(c => !c.dead);
}
requestAnimationFrame(loop);

'use strict';
// Herní logika: nasazování, boj, léčení

function toast(text) { toasts.push({ text, t: 2.2 }); if (toasts.length > 3) toasts.shift(); }
function floatText(x, y, text, color) { floats.push({ x, y, text, color, life: 1 }); }

function deploy(si, type, lane) {
  const s = sides[si], T = TYPES[type];
  if (s.reserve[type] > 0) s.reserve[type]--;
  else if (s.money >= T.cost) s.money -= T.cost;
  else { if (si === 0) { toast('Málo peněz! 💰'); SFX.no(); } return false; }
  const dir = si === 0 ? 1 : -1;
  units.push({ id: nextId++, side: si, type, lane, dir,
    x: si === 0 ? FIELD_L + 14 : FIELD_R - 14, y: LANES[lane] + rnd(-30, 30),
    hp: T.hp, max: T.hp, cd: rnd(0, 0.4), flash: 0, recoil: 0, moving: false, retreatChecked: false });
  if (si === 0) SFX.deploy();
  return true;
}

function placeMine(si, lane, x) {
  const s = sides[si];
  if (s.money < MINE.cost) { if (si === 0) { toast('Málo peněz na minu! 💰'); SFX.no(); } return false; }
  s.money -= MINE.cost;
  mines.push({ side: si, lane, x, y: LANES[lane] + rnd(-25, 25), arm: 0.6 });
  if (si === 0) SFX.click();
  return true;
}

function upgradeTurret(si) {
  const s = sides[si], lvl = s.turret.lvl;
  if (lvl >= 4) { if (si === 0) toast('Věž je už na maximu! ⭐⭐⭐⭐'); return false; }
  const c = TURRET_COST[lvl];
  if (s.money < c) { if (si === 0) { toast('Málo peněz na vylepšení věže! 💰'); SFX.no(); } return false; }
  s.money -= c; s.turret.lvl++;
  const b = BLD[si].base;
  for (let i = 0; i < 20; i++) parts.push({ x: b.x, y: b.y - 50, vx: rnd(-80, 80), vy: rnd(-120, -20), life: 0.8, max: 0.8, size: 4, color: '#ffd34d', type: 'spark' });
  if (si === 0) { toast('Věž vylepšena! ⭐'); SFX.heal(); }
  return true;
}

function admit(si, u, key) {
  const s = sides[si];
  if (s[key].length >= CAP[key]) return false;
  s[key].push({ type: u.type, hp: u.hp, max: u.max });
  u.removed = true;
  poof(u.x, u.y, si);
  return true;
}

function poof(x, y, si) {
  for (let i = 0; i < 14; i++) parts.push({ x, y, vx: rnd(-60, 60), vy: rnd(-60, 30), life: 0.6, max: 0.6, size: rnd(6, 12), color: COL_LIGHT[si], type: 'smoke' });
}

function explosion(x, y, big) {
  const n = big ? 26 : 10;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = rnd(30, big ? 200 : 110);
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: rnd(0.3, 0.7), max: 0.7, size: rnd(3, big ? 9 : 5), color: ['#ffdf5e', '#ff8f2e', '#ff4b2e'][i % 3], type: 'fire' });
  }
  for (let i = 0; i < (big ? 10 : 3); i++) parts.push({ x: x + rnd(-10, 10), y: y + rnd(-10, 10), vx: rnd(-20, 20), vy: rnd(-50, -10), life: rnd(0.6, 1.2), max: 1.2, size: rnd(8, 16), color: '#555', type: 'smoke' });
  if (big) parts.push({ x, y, life: 0.35, max: 0.35, size: 50, type: 'ring', color: '#fff3' });
}

function hit(u, d) {
  if (u.hp <= 0 || u.removed) return;
  u.hp -= d; u.flash = 0.15;
  floatText(u.x, vy(u) - 30, '-' + d, '#ff5a5a');
  if (u.hp <= 0) {
    u.hp = 0; u.removed = true;
    explosion(u.x, vy(u), u.type !== 'vojak');
    SFX.boom();
    const killer = 1 - u.side, bounty = Math.round(TYPES[u.type].cost * 0.35);
    sides[killer].money += bounty;
    if (killer === 0) { floatText(u.x, vy(u) - 50, '+' + bounty + ' 💰', '#ffd34d'); SFX.coin(); }
    if (drag && drag.u === u) drag = null;
  }
}

function damageBase(si, d) {
  const s = sides[si];
  s.base = Math.max(0, s.base - d); s.flash = 0.2;
  const b = BLD[si].base;
  floatText(b.x + rnd(-30, 30), b.y - 20, '-' + d, '#ff5a5a');
}

function fire(u, tgt) {
  const T = TYPES[u.type];
  u.cd = T.cd; u.recoil = 1;
  const sx = u.x + u.dir * T.r, sy = T.air ? vy(u) + 10 : u.y - (u.type === 'delo' ? 12 : u.type === 'tank' ? 12 : 6);
  let tx, ty, target = null, base = -1;
  if (tgt === 'base') { base = 1 - u.side; const b = BLD[base].base; tx = b.x - u.dir * 30 + rnd(-15, 15); ty = b.y + rnd(-30, 30); }
  else { target = tgt; tx = tgt.x; ty = vy(tgt); }
  const shell = u.type === 'delo';
  const speed = shell ? 330 : 560;
  const dist = Math.hypot(tx - sx, ty - sy);
  projs.push({ sx, sy, x: sx, y: sy, tx, ty, t: 0, dur: Math.max(0.08, dist / speed), dmg: T.dmg, side: u.side, lane: u.lane,
    target, base, splash: T.splash || 0, kind: shell ? 'shell' : (u.type === 'tank' ? 'tankshot' : u.type === 'vrtulnik' ? 'rocket' : 'bullet'), arc: shell ? Math.min(140, dist * 0.35) : 0 });
  if (shell || u.type === 'tank' || T.air) { if (u.side === 0 || Math.random() < 0.5) tone(shell ? 140 : 200, 0.18, 'sawtooth', 0.05, 60); }
  else SFX.shoot();
  // záblesk z hlavně
  parts.push({ x: sx, y: sy, vx: 0, vy: 0, life: 0.08, max: 0.08, size: shell ? 10 : 6, color: '#fff2a0', type: 'fire' });
}

function update(dt) {
  time += dt;
  const D = DIFF[diff];
  sides[0].money += PLAYER_INCOME * dt;
  sides[1].money += D.inc * dt;

  // --- jednotky ---
  for (const u of units) {
    if (u.removed || u.dragging) continue;
    const T = TYPES[u.type];
    u.cd -= dt; u.flash = Math.max(0, u.flash - dt); u.recoil = Math.max(0, u.recoil - dt * 4);
    let tgt = null, best = 1e9;
    for (const e of units) {
      if (e.side === u.side || e.removed || e.dragging || e.lane !== u.lane) continue;
      if (TYPES[e.type].air && !T.antiAir) continue;
      const dx = (e.x - u.x) * u.dir; if (dx < -15) continue;
      const d = Math.abs(e.x - u.x);
      if (d <= T.range && d < best) { best = d; tgt = e; }
    }
    const edge = u.side === 0 ? FIELD_R : FIELD_L;
    const bd = (edge - u.x) * u.dir;
    u.moving = false;
    if (tgt) { if (u.cd <= 0) fire(u, tgt); }
    else if (bd <= T.range * 0.6 + 10) { if (u.cd <= 0) fire(u, 'base'); }
    else { u.x += u.dir * T.speed * dt; u.moving = true; }
  }

  // --- AI ustupuje se zraněnými ---
  for (const u of units) {
    if (u.side !== 1 || u.removed || u.retreatChecked || u.hp / u.max >= 0.4) continue;
    u.retreatChecked = true;
    if (Math.random() < D.retreat) {
      const key = kindKey(u.type);
      admit(1, u, key);
    }
  }

  // --- věže na základnách ---
  for (let si = 0; si < 2; si++) {
    const s = sides[si], b = BLD[si].base, tur = s.turret, st = TURRET[tur.lvl];
    tur.cd -= dt; tur.recoil = Math.max(0, tur.recoil - dt * 4); s.flash = Math.max(0, s.flash - dt);
    const ox = b.x, oy = b.y - 58;
    let tgt = null, best = 1e9;
    for (const e of units) {
      if (e.side === si || e.removed || e.dragging) continue;
      const d = Math.hypot(e.x - b.x, e.y - b.y);
      if (d <= TURRET_RANGE && d < best) { best = d; tgt = e; }
    }
    if (tgt) {
      tur.ang = Math.atan2(vy(tgt) - oy, tgt.x - ox);
      if (tur.cd <= 0) {
        tur.cd = st.cd; tur.recoil = 1;
        const sx = ox + Math.cos(tur.ang) * 26, sy = oy + Math.sin(tur.ang) * 26;
        projs.push({ sx, sy, x: sx, y: sy, tx: tgt.x, ty: vy(tgt), t: 0, dur: Math.max(0.08, best / 650), dmg: st.dmg, side: si, lane: tgt.lane, target: tgt, base: -1, splash: 0, kind: 'turret', arc: 0 });
        SFX.shoot();
      }
    } else tur.ang += (((si === 0 ? 0 : Math.PI) - tur.ang) * dt * 2);
  }

  // --- střely ---
  for (const p of projs) {
    p.t += dt;
    if (p.target && !p.target.removed && !p.target.dragging && p.kind !== 'shell') { p.tx = p.target.x; p.ty = vy(p.target); }
    const k = Math.min(1, p.t / p.dur);
    p.x = p.sx + (p.tx - p.sx) * k;
    p.y = p.sy + (p.ty - p.sy) * k - Math.sin(k * Math.PI) * p.arc;
    if (k >= 1) {
      p.done = true;
      if (p.base >= 0) { damageBase(p.base, p.dmg); explosion(p.tx, p.ty, p.splash > 0); SFX.small(); }
      else if (p.splash) {
        explosion(p.tx, p.ty, true); SFX.boom();
        for (const e of units) if (e.side !== p.side && !e.removed && !e.dragging && !TYPES[e.type].air && e.lane === p.lane && Math.abs(e.x - p.tx) <= p.splash) hit(e, p.dmg);
      } else if (p.target && !p.target.removed && !p.target.dragging) {
        hit(p.target, p.dmg);
        parts.push({ x: p.tx, y: p.ty, vx: 0, vy: 0, life: 0.15, max: 0.15, size: 7, color: '#fff', type: 'fire' });
      }
    }
  }

  // --- miny ---
  for (const m of mines) {
    m.arm -= dt;
    if (m.arm > 0) continue;
    for (const e of units) {
      if (e.side === m.side || e.removed || e.dragging || e.lane !== m.lane || TYPES[e.type].air) continue;
      if (Math.abs(e.x - m.x) < 24) {
        m.done = true; explosion(m.x, m.y, true); SFX.boom();
        for (const e2 of units) if (e2.side !== m.side && !e2.removed && !e2.dragging && !TYPES[e2.type].air && e2.lane === m.lane && Math.abs(e2.x - m.x) <= MINE.radius) hit(e2, MINE.dmg);
        break;
      }
    }
  }

  // --- ošetřovna a opravna ---
  for (let si = 0; si < 2; si++) {
    const s = sides[si];
    for (const key of ['ose', 'opr']) {
      for (const h of s[key]) {
        h.hp = Math.min(h.max, h.hp + HEAL[key] * dt);
        if (h.hp >= h.max) {
          h.done = true; s.reserve[h.type]++;
          if (si === 0) { toast(TYPES[h.type].name + (key === 'ose' ? ' je zdravý' : ' je opravený') + '! Čeká v záloze ✅'); SFX.heal(); }
        }
      }
      s[key] = s[key].filter(h => !h.done);
    }
  }

  // --- AI přemýšlí ---
  const ai = sides[1];
  ai.aiT -= dt;
  if (ai.aiT <= 0) { ai.aiT = rnd(D.think[0], D.think[1]); aiThink(); }

  // --- částice, texty ---
  for (const p of parts) { p.life -= dt; if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.type === 'fire' || p.type === 'spark') p.vy += 200 * dt; } }
  for (const f of floats) { f.life -= dt; f.y -= 35 * dt; }
  for (const t of toasts) t.t -= dt;

  units = units.filter(u => !u.removed);
  projs = projs.filter(p => !p.done);
  mines = mines.filter(m => !m.done);
  parts = parts.filter(p => p.life > 0);
  floats = floats.filter(f => f.life > 0);
  toasts = toasts.filter(t => t.t > 0);

  if (sides[1].base <= 0) endGame(true);
  else if (sides[0].base <= 0) endGame(false);
}

function endGame(win) {
  if (state !== 'play') return;
  state = 'over';
  const b = BLD[win ? 1 : 0].base;
  for (let i = 0; i < 5; i++) setTimeout(() => explosion(b.x + rnd(-50, 50), b.y + rnd(-50, 50), true), i * 150);
  win ? SFX.win() : SFX.lose();
  setTimeout(() => showOverlay(win ? 'win' : 'lose'), 1200);
}

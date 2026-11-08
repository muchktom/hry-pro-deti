'use strict';
// Vykreslení bojiště

const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
(function drawBg() {
  const c = bg.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#86c25a'); g.addColorStop(1, '#5f9e3e');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // trávička
  for (let i = 0; i < 700; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    c.strokeStyle = Math.random() < 0.5 ? '#4f8a33' : '#9fd46e'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + rnd(-3, 3), y - rnd(4, 9)); c.stroke();
  }
  for (let i = 0; i < 40; i++) { c.fillStyle = ['#fff', '#ffe14d', '#ff9ad5'][i % 3]; c.beginPath(); c.arc(rnd(FIELD_L, FIELD_R), rnd(0, H), 2.5, 0, 7); c.fill(); }
  // cesty
  for (const ly of LANES) {
    c.fillStyle = '#c9a26a'; rr(c, FIELD_L - 10, ly - 58, FIELD_R - FIELD_L + 20, 116, 30); c.fill();
    c.strokeStyle = '#a7814e'; c.lineWidth = 3; c.stroke();
    for (let i = 0; i < 160; i++) { c.fillStyle = Math.random() < 0.5 ? '#b38c55' : '#dbb77f'; c.beginPath(); c.arc(rnd(FIELD_L, FIELD_R), ly + rnd(-50, 50), rnd(1, 3), 0, 7); c.fill(); }
    c.strokeStyle = '#ad8750'; c.lineWidth = 2; c.setLineDash([12, 8]);
    c.beginPath(); c.moveTo(FIELD_L, ly - 18); c.lineTo(FIELD_R, ly - 18); c.moveTo(FIELD_L, ly + 18); c.lineTo(FIELD_R, ly + 18); c.stroke(); c.setLineDash([]);
  }
  // střed
  c.strokeStyle = '#ffffff55'; c.lineWidth = 3; c.setLineDash([10, 12]);
  c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke(); c.setLineDash([]);
  // zóny základen
  c.fillStyle = '#2f6fd62a'; c.fillRect(0, 0, FIELD_L, H);
  c.fillStyle = '#d63a2f2a'; c.fillRect(FIELD_R, 0, W - FIELD_R, H);
  // stromy
  const tree = (x, y, s) => { c.fillStyle = '#6b4a2b'; c.fillRect(x - 3 * s, y, 6 * s, 14 * s); c.fillStyle = '#3d7a2a'; c.beginPath(); c.arc(x, y - 4 * s, 13 * s, 0, 7); c.fill(); c.fillStyle = '#4f9637'; c.beginPath(); c.arc(x - 4 * s, y - 8 * s, 8 * s, 0, 7); c.fill(); };
  [[300, 70, 1], [420, 40, 0.8], [880, 60, 1.1], [990, 95, 0.8], [600, 50, 0.9], [330, 660, 1], [760, 680, 1.1], [520, 690, 0.8], [960, 665, 0.9], [700, 75, 0.7]].forEach(t => tree(...t));
})();

function drawBuilding(c, r, si, key) {
  const isOse = key === 'ose';
  c.save();
  c.fillStyle = isOse ? '#f4f1ea' : '#b7b9bd'; rr(c, r.x, r.y, r.w, r.h, 12); c.fill();
  c.strokeStyle = '#00000088'; c.lineWidth = 3; c.stroke();
  // střecha / nápis
  c.fillStyle = isOse ? '#e74c3c' : '#5d6670'; rr(c, r.x, r.y, r.w, 30, 12); c.fill();
  c.fillStyle = '#fff'; c.font = 'bold 18px "Comic Sans MS", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(isOse ? '✚ OŠETŘOVNA' : '🔧 OPRAVNA', r.x + r.w / 2, r.y + 16);
  // místa
  const cap = CAP[key], arr = sides[si][key];
  const sw = (r.w - 16) / cap;
  for (let i = 0; i < cap; i++) {
    const sx = r.x + 8 + i * sw, sy = r.y + 40;
    c.fillStyle = isOse ? '#dfe9f3' : '#8f949a'; rr(c, sx + 2, sy, sw - 4, r.h - 50, 8); c.fill();
    c.strokeStyle = '#0003'; c.lineWidth = 1.5; c.stroke();
    const h = arr[i];
    if (h) {
      c.save(); c.translate(sx + sw / 2, sy + 42); c.scale(0.85, 0.85);
      DRAW[h.type](c, 0, 0, si, si === 0 ? 1 : -1, false, 0);
      c.restore();
      const bw = sw - 14;
      c.fillStyle = '#0005'; c.fillRect(sx + 7, sy + r.h - 72, bw, 8);
      c.fillStyle = '#3ddc63'; c.fillRect(sx + 7, sy + r.h - 72, bw * h.hp / h.max, 8);
      if (isOse) { c.fillStyle = '#e74c3c'; c.font = '14px sans-serif'; c.fillText('💤', sx + sw / 2 + 14, sy + 14 + Math.sin(time * 3 + i) * 3); }
      else { c.save(); c.translate(sx + sw / 2 + 18, sy + 14); c.rotate(Math.sin(time * 10) * 0.5); c.font = '16px sans-serif'; c.fillText('🔧', 0, 0); c.restore(); }
    } else {
      c.fillStyle = '#0002'; c.font = '13px "Comic Sans MS", sans-serif'; c.fillText('volno', sx + sw / 2, sy + (r.h - 50) / 2);
    }
  }
  c.restore();
}

function drawBase(c, si) {
  const b = BLD[si].base, s = sides[si];
  c.save();
  c.fillStyle = '#00000033'; c.beginPath(); c.ellipse(b.x, b.y + b.r - 4, b.r, 14, 0, 0, 7); c.fill();
  const g = c.createRadialGradient(b.x - 20, b.y - 25, 10, b.x, b.y, b.r);
  g.addColorStop(0, s.flash > 0 ? '#fff' : COL_LIGHT[si]); g.addColorStop(1, COL[si]);
  c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
  c.strokeStyle = COL_DARK[si]; c.lineWidth = 4; c.stroke();
  // pruh s nápisem (jako na obrázku)
  c.save(); c.beginPath(); c.arc(b.x, b.y, b.r - 2, 0, 7); c.clip();
  c.fillStyle = '#ffffffdd'; c.fillRect(b.x - b.r, b.y - 2, b.r * 2, 30);
  c.restore();
  c.fillStyle = COL_DARK[si]; c.font = 'bold 17px "Comic Sans MS", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(si === 0 ? 'ZÁKLADNA' : 'NEPŘÍTEL', b.x, b.y + 13);
  // věž
  const ox = b.x, oy = b.y - 58, tur = s.turret;
  c.fillStyle = '#8d8d8d'; rr(c, ox - 18, oy - 4, 36, 30, 4); c.fill(); c.strokeStyle = '#444'; c.lineWidth = 2; c.stroke();
  c.save(); c.translate(ox, oy); c.rotate(tur.ang);
  c.fillStyle = '#333'; c.fillRect(4 - tur.recoil * 5, -4 - (tur.lvl > 2 ? 1 : 0), 24 + tur.lvl * 2, 8 + (tur.lvl > 2 ? 2 : 0));
  if (tur.lvl >= 4) c.fillRect(4 - tur.recoil * 5, 6, 20, 4);
  c.restore();
  c.fillStyle = COL[si]; c.beginPath(); c.arc(ox, oy, 12, 0, 7); c.fill(); c.strokeStyle = COL_DARK[si]; c.stroke();
  c.fillStyle = '#ffd34d'; c.font = 'bold 13px sans-serif'; c.fillText('★'.repeat(tur.lvl), ox, oy + 36 - 50);
  // životy základny
  c.fillStyle = '#0007'; rr(c, b.x - 60, b.y + b.r + 4, 120, 14, 7); c.fill();
  c.fillStyle = si === 0 ? '#5d95ff' : '#ff6f63'; rr(c, b.x - 58, b.y + b.r + 6, 116 * s.base / s.baseMax, 10, 5); c.fill();
  c.fillStyle = '#fff'; c.font = 'bold 12px sans-serif'; c.fillText('❤ ' + Math.ceil(s.base), b.x, b.y + b.r + 12);
  c.restore();
}

function drawPark(c, si) {
  const r = BLD[si].park, s = sides[si];
  c.save();
  c.fillStyle = '#4a4f55'; rr(c, r.x, r.y + 20, r.w, r.h - 22, 10); c.fill();
  c.strokeStyle = '#00000088'; c.lineWidth = 3; c.stroke();
  c.strokeStyle = '#ffffff55'; c.lineWidth = 2; c.setLineDash([6, 6]);
  for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(r.x + 8, r.y + 20 + i * (r.h - 22) / 3); c.lineTo(r.x + r.w - 8, r.y + 20 + i * (r.h - 22) / 3); c.stroke(); }
  c.setLineDash([]);
  c.fillStyle = '#fff'; c.font = 'bold 15px "Comic Sans MS", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('ZÁLOHA / PARKOVIŠTĚ', r.x + r.w / 2, r.y + 32);
  const order = ['vojak', 'tank', 'delo'];
  order.forEach((t, i) => {
    const y = r.y + 70 + i * 44, n = s.reserve[t];
    c.globalAlpha = n > 0 ? 1 : 0.3;
    const shown = Math.min(n, 3) || 1;
    for (let k = 0; k < shown; k++) {
      c.save(); c.translate(r.x + 30 + k * 36, y); c.scale(0.7, 0.7);
      DRAW[t](c, 0, 0, si, si === 0 ? 1 : -1, false, 0); c.restore();
    }
    c.globalAlpha = 1;
    c.fillStyle = n > 0 ? '#7dff8a' : '#aaa'; c.font = 'bold 16px sans-serif';
    c.fillText('×' + n, r.x + r.w - 22, y);
  });
  c.restore();
}

function render() {
  const c = ctx;
  c.drawImage(bg, 0, 0);

  // vybraná cesta
  if (state === 'play') {
    const ly = LANES[selLane];
    c.save(); c.strokeStyle = '#ffe14d'; c.lineWidth = 4; c.setLineDash([14, 10]); c.lineDashOffset = -time * 30;
    rr(c, FIELD_L - 6, ly - 62, (W / 2 - FIELD_L) + 6, 124, 30); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#ffe14d'; c.beginPath(); c.moveTo(FIELD_L + 2, ly - 14); c.lineTo(FIELD_L + 22, ly); c.lineTo(FIELD_L + 2, ly + 14); c.closePath(); c.fill();
    c.restore();
    // čísla cest
    c.save(); c.font = 'bold 16px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    LANES.forEach((ly2, i) => { c.fillStyle = '#0006'; c.beginPath(); c.arc(W / 2, ly2 - 70, 11, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillText(i + 1, W / 2, ly2 - 70); });
    c.restore();
  }
  if (mineMode) { c.fillStyle = '#ff000018'; c.fillRect(FIELD_L, 0, W / 2 - FIELD_L, H); }

  for (let si = 0; si < 2; si++) { drawBuilding(c, BLD[si].ose, si, 'ose'); drawBuilding(c, BLD[si].opr, si, 'opr'); drawPark(c, si); drawBase(c, si); }

  // dosah věže při přetahování / najetí
  // miny
  for (const m of mines) drawMineIcon(c, m.x, m.y, m.side, m.arm <= 0 && Math.sin(time * 8 + m.x) > 0);

  // zvýraznění budov při přetahování
  if (drag) {
    const need = kindKey(drag.u.type);
    for (const key of ['ose', 'opr']) {
      const r = BLD[0][key];
      const ok = key === need && sides[0][key].length < CAP[key];
      c.save(); c.strokeStyle = ok ? '#3ddc63' : '#ff3b3b'; c.lineWidth = 6; c.setLineDash(ok ? [] : [8, 6]);
      c.globalAlpha = 0.6 + Math.sin(time * 8) * 0.3;
      rr(c, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 14); c.stroke(); c.restore();
      if (key === need && ok) { c.save(); c.fillStyle = '#3ddc63'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.fillText('⬅', r.x + r.w + 26, r.y + r.h / 2 + Math.sin(time * 8) * 4); c.restore(); }
    }
  }

  // jednotky (seřazené podle y)
  const sorted = units.slice().sort((a, b) => a.y - b.y);
  for (const u of sorted) {
    const T = TYPES[u.type];
    c.save();
    c.fillStyle = '#0003'; c.beginPath(); c.ellipse(u.x, u.y + T.r - 2, T.r, 6, 0, 0, 7); c.fill();
    if (u.dragging) { c.translate(0, -8); c.globalAlpha = 0.9; }
    DRAW[u.type](c, u.x, u.y, u.side, u.dir, u.moving, u.recoil);
    if (u.flash > 0) { c.globalAlpha = 0.6; c.fillStyle = '#fff'; c.beginPath(); c.arc(u.x, u.y, T.r, 0, 7); c.fill(); c.globalAlpha = 1; }
    if (showHearts) drawHearts(c, u.x, u.y - T.r - 14, u.hp, u.max);
    else if (u.hp < u.max) {
      c.fillStyle = '#0007'; c.fillRect(u.x - 16, u.y - T.r - 12, 32, 5);
      c.fillStyle = u.hp / u.max > 0.5 ? '#3ddc63' : u.hp / u.max > 0.25 ? '#ffc93c' : '#ff3b3b';
      c.fillRect(u.x - 16, u.y - T.r - 12, 32 * u.hp / u.max, 5);
    }
    // nápověda: zraněný hráčův voják
    if (u.side === 0 && !u.dragging && u.hp / u.max <= 0.4) {
      c.font = '16px sans-serif'; c.textAlign = 'center';
      c.fillText(T.kind === 'bio' ? '🩹' : '🔧', u.x + T.r, u.y - T.r - 6 + Math.sin(time * 6) * 2);
    }
    c.restore();
  }

  // střely
  for (const p of projs) {
    c.save();
    if (p.kind === 'shell') { c.fillStyle = '#222'; c.beginPath(); c.arc(p.x, p.y, 6, 0, 7); c.fill(); }
    else if (p.kind === 'tankshot') { c.fillStyle = '#ffb02e'; c.beginPath(); c.arc(p.x, p.y, 4.5, 0, 7); c.fill(); }
    else if (p.kind === 'turret') { c.fillStyle = p.side === 0 ? '#bfe0ff' : '#ffd0c8'; c.beginPath(); c.arc(p.x, p.y, 4, 0, 7); c.fill(); }
    else { c.fillStyle = '#fff36b'; c.beginPath(); c.arc(p.x, p.y, 2.8, 0, 7); c.fill(); }
    c.restore();
  }

  // částice
  for (const p of parts) {
    const a = Math.max(0, p.life / p.max);
    c.globalAlpha = a;
    if (p.type === 'ring') { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(p.x, p.y, p.size * (1 - a) + 10, 0, 7); c.stroke(); }
    else { c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.type === 'smoke' ? p.size * (1.5 - a * 0.5) : p.size * a + 1, 0, 7); c.fill(); }
  }
  c.globalAlpha = 1;

  // létající texty
  c.save(); c.textAlign = 'center'; c.font = 'bold 18px "Comic Sans MS", sans-serif';
  for (const f of floats) { c.globalAlpha = Math.min(1, f.life * 2); c.lineWidth = 3; c.strokeStyle = '#000a'; c.strokeText(f.text, f.x, f.y); c.fillStyle = f.color; c.fillText(f.text, f.x, f.y); }
  c.restore();

  // náhled miny
  if (mineMode && hover && hover.x < W / 2 && hover.x > FIELD_L && laneAt(hover.y) >= 0) {
    c.globalAlpha = 0.6; drawMineIcon(c, hover.x, hover.y, 0, true);
    c.strokeStyle = '#ff3b3b'; c.lineWidth = 2; c.beginPath(); c.arc(hover.x, hover.y, MINE.radius, 0, 7); c.stroke(); c.globalAlpha = 1;
  }

  // hlášky
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 22px "Comic Sans MS", sans-serif';
  toasts.forEach((t, i) => {
    const y = 30 + i * 38, w = c.measureText(t.text).width + 30;
    c.globalAlpha = Math.min(1, t.t * 2);
    c.fillStyle = '#000b'; rr(c, W / 2 - w / 2, y - 16, w, 32, 16); c.fill();
    c.fillStyle = '#fff'; c.fillText(t.text, W / 2, y + 1);
  });
  c.restore();

  if (paused && state === 'play') {
    c.fillStyle = '#0008'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#fff'; c.font = 'bold 72px "Comic Sans MS", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('⏸ PAUZA', W / 2, H / 2);
  }
}

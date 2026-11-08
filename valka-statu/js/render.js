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

// Pevnost: kamenné hradby se zuby, dvě boční věže se střechou v barvě týmu, hlavní věž s kanónem,
// brána s cedulí a vlajka. Při poškození praskliny, při velkém poškození oheň a kouř.
function drawFortress(c, x, y, si, hpFrac, flash) {
  const out = si === 0 ? -1 : 1;           // vnější strana (dál od bojiště)
  const STONE = '#a7a29a', STONE_D = '#7d776f', STONE_L = '#c4bfb6', EDGE = '#4d4842';
  c.save();
  c.lineJoin = 'round';
  // stín
  c.fillStyle = '#00000033'; c.beginPath(); c.ellipse(x, y + 54, 82, 14, 0, 0, 7); c.fill();

  const bricks = (bx, by, bw, bh) => {
    c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
    c.strokeStyle = STONE_D; c.lineWidth = 1.2; c.globalAlpha = 0.55;
    for (let row = 0, yy = by + 11; yy < by + bh; yy += 11, row++) {
      c.beginPath(); c.moveTo(bx, yy); c.lineTo(bx + bw, yy); c.stroke();
      for (let xx = bx + (row % 2 ? 8 : 0); xx < bx + bw; xx += 16) { c.beginPath(); c.moveTo(xx, yy - 11); c.lineTo(xx, yy); c.stroke(); }
    }
    c.restore();
  };
  const merlons = (bx, by, bw, n, h, fill) => {
    const mw = bw / (n * 2 - 1);
    c.fillStyle = fill; c.strokeStyle = EDGE; c.lineWidth = 2;
    for (let i = 0; i < n; i++) { c.beginPath(); c.rect(bx + i * mw * 2, by - h, mw, h + 1); c.fill(); c.stroke(); }
  };
  const block = (bx, by, bw, bh, fill) => {
    c.fillStyle = fill; c.fillRect(bx, by, bw, bh);
    bricks(bx, by, bw, bh);
    c.strokeStyle = EDGE; c.lineWidth = 2.5; c.strokeRect(bx, by, bw, bh);
  };

  // hradba mezi věžemi
  merlons(x - 54, y - 14, 108, 6, 9, STONE);
  block(x - 54, y - 14, 108, 66, STONE);

  // boční věže se špičatou střechou
  for (const side of [-1, 1]) {
    const tx = x + side * 56, tw = 34, top = y - 46;
    block(tx - tw / 2, top, tw, 98, STONE_L);
    c.fillStyle = COL[si]; c.strokeStyle = COL_DARK[si]; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(tx - tw / 2 - 5, top + 1); c.lineTo(tx, top - 30); c.lineTo(tx + tw / 2 + 5, top + 1); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = COL_LIGHT[si]; c.globalAlpha = 0.5;
    c.beginPath(); c.moveTo(tx - 2, top - 26); c.lineTo(tx - tw / 2 + 2, top - 1); c.lineTo(tx - 6, top - 1); c.closePath(); c.fill(); c.globalAlpha = 1;
    // okénko
    c.fillStyle = '#2d2a26'; rr(c, tx - 4, top + 18, 8, 15, 4); c.fill();
    c.fillStyle = '#ffd34d55'; rr(c, tx - 2.5, top + 20, 5, 6, 2.5); c.fill();
    // vlajka na vnější věži
    if (side === out) {
      const px = tx, py = top - 30;
      c.strokeStyle = '#5a4630'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 26); c.stroke();
      c.fillStyle = COL[si]; c.strokeStyle = COL_DARK[si]; c.lineWidth = 1.5;
      const fw = 26 * -out, wv = Math.sin(time * 5) * 3;
      c.beginPath(); c.moveTo(px, py - 26);
      c.quadraticCurveTo(px + fw * 0.5, py - 29 + wv, px + fw, py - 24 + wv * 0.5);
      c.lineTo(px + fw, py - 13 + wv * 0.5);
      c.quadraticCurveTo(px + fw * 0.5, py - 16 + wv, px, py - 13);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('★', px + fw * 0.5, py - 19 + wv * 0.7);
    }
  }

  // hlavní věž (nese kanón)
  merlons(x - 30, y - 44, 60, 4, 8, STONE_L);
  block(x - 30, y - 44, 60, 96, STONE);
  c.fillStyle = COL[si]; c.fillRect(x - 30, y - 30, 60, 8);
  c.strokeStyle = COL_DARK[si]; c.lineWidth = 1.5; c.strokeRect(x - 30, y - 30, 60, 8);

  // brána
  c.fillStyle = '#6b4a2b'; c.strokeStyle = EDGE; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(x - 16, y + 52); c.lineTo(x - 16, y + 24); c.arc(x, y + 24, 16, Math.PI, 0); c.lineTo(x + 16, y + 52); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = '#4a3220'; c.lineWidth = 1.5;
  for (const dx of [-8, 0, 8]) { c.beginPath(); c.moveTo(x + dx, y + 52); c.lineTo(x + dx, y + 12 + Math.abs(dx) * 0.5); c.stroke(); }
  c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(x + 5, y + 36, 1.8, 0, 7); c.fill();

  // cedule s nápisem
  c.fillStyle = '#fffaf0'; c.strokeStyle = COL_DARK[si]; c.lineWidth = 2;
  rr(c, x - 44, y - 13, 88, 20, 6); c.fill(); c.stroke();
  c.fillStyle = COL_DARK[si]; c.font = 'bold 14px "Comic Sans MS", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(si === 0 ? 'ZÁKLADNA' : 'NEPŘÍTEL', x, y - 2);

  // poškození
  if (hpFrac < 0.5) {
    c.strokeStyle = '#3a342e'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x - 48, y + 4); c.lineTo(x - 40, y + 14); c.lineTo(x - 44, y + 24); c.lineTo(x - 36, y + 34); c.stroke();
    c.beginPath(); c.moveTo(x + 22, y - 40); c.lineTo(x + 16, y - 30); c.moveTo(x + 40, y + 20); c.lineTo(x + 48, y + 30); c.lineTo(x + 44, y + 40); c.stroke();
  }
  if (hpFrac < 0.25) {
    for (let i = 0; i < 3; i++) {
      const fx = x + [-50, 18, 44][i], fy = y + [-10, -46, 10][i], f = 1 + Math.sin(time * 12 + i * 2) * 0.25;
      c.fillStyle = '#ff7a1a'; c.beginPath(); c.ellipse(fx, fy - 6 * f, 6, 10 * f, 0, 0, 7); c.fill();
      c.fillStyle = '#ffd34d'; c.beginPath(); c.ellipse(fx, fy - 3 * f, 3, 6 * f, 0, 0, 7); c.fill();
      c.fillStyle = '#5558'; c.beginPath(); c.arc(fx + Math.sin(time * 2 + i) * 4, fy - 22 - ((time * 20 + i * 9) % 18), 6, 0, 7); c.fill();
    }
  }

  // záblesk při zásahu
  if (flash > 0) {
    c.globalAlpha = Math.min(0.6, flash * 3); c.fillStyle = '#fff';
    c.fillRect(x - 73, y - 46, 146, 98);
    c.globalAlpha = 1;
  }
  c.restore();
}

function drawBase(c, si) {
  const b = BLD[si].base, s = sides[si];
  c.save();
  drawFortress(c, b.x, b.y, si, s.base / s.baseMax, s.flash);
  // věž s kanónem na hlavní věži
  const ox = b.x, oy = b.y - 58, tur = s.turret;
  c.fillStyle = '#8d8d8d'; rr(c, ox - 18, oy - 4, 36, 14, 4); c.fill(); c.strokeStyle = '#444'; c.lineWidth = 2; c.stroke();
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
  UNIT_ORDER.forEach((t, i) => {
    const y = r.y + 64 + i * 34, n = s.reserve[t];
    c.globalAlpha = n > 0 ? 1 : 0.3;
    const shown = Math.min(n, 3) || 1;
    for (let k = 0; k < shown; k++) {
      c.save(); c.translate(r.x + 30 + k * 36, y); c.scale(0.6, 0.6);
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
    const uy = vy(u) + (T.air ? Math.sin(time * 3 + u.id) * 3 : 0);
    c.fillStyle = T.air ? '#0002' : '#0003'; c.beginPath(); c.ellipse(u.x, u.y + T.r - 2, T.air ? T.r * 0.8 : T.r, T.air ? 5 : 6, 0, 0, 7); c.fill();
    if (u.dragging) { c.translate(0, -8); c.globalAlpha = 0.9; }
    DRAW[u.type](c, u.x, uy, u.side, u.dir, u.moving, u.recoil);
    if (u.flash > 0) { c.globalAlpha = 0.6; c.fillStyle = '#fff'; c.beginPath(); c.arc(u.x, uy, T.r, 0, 7); c.fill(); c.globalAlpha = 1; }
    const top = uy - T.r - (T.air ? 6 : 0);
    if (showHearts) drawHearts(c, u.x, top - 14, u.hp, u.max);
    else if (u.hp < u.max) {
      c.fillStyle = '#0007'; c.fillRect(u.x - 16, top - 12, 32, 5);
      c.fillStyle = u.hp / u.max > 0.5 ? '#3ddc63' : u.hp / u.max > 0.25 ? '#ffc93c' : '#ff3b3b';
      c.fillRect(u.x - 16, top - 12, 32 * u.hp / u.max, 5);
    }
    // nápověda: zraněný hráčův voják
    if (u.side === 0 && !u.dragging && u.hp / u.max <= 0.4) {
      c.font = '16px sans-serif'; c.textAlign = 'center';
      c.fillText(T.kind === 'bio' ? '🩹' : '🔧', u.x + T.r, top - 6 + Math.sin(time * 6) * 2);
    }
    c.restore();
  }

  // střely
  for (const p of projs) {
    c.save();
    if (p.kind === 'shell') { c.fillStyle = '#222'; c.beginPath(); c.arc(p.x, p.y, 6, 0, 7); c.fill(); }
    else if (p.kind === 'rocket') {
      const ang = Math.atan2(p.ty - p.sy, p.tx - p.sx);
      c.translate(p.x, p.y); c.rotate(ang);
      c.fillStyle = '#ff9a2e'; c.beginPath(); c.moveTo(-12, 0); c.lineTo(-5, -2.5); c.lineTo(-5, 2.5); c.closePath(); c.fill();
      c.fillStyle = '#ddd'; c.fillRect(-5, -2, 10, 4); c.fillStyle = COL[p.side]; c.fillRect(3, -2, 3, 4);
    }
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

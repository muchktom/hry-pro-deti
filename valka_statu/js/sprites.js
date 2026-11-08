'use strict';
// Kreslení jednotek, srdíček a ikon

function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

function heart(c, x, y, r, full) {
  c.beginPath(); c.moveTo(x, y + r);
  c.bezierCurveTo(x - r * 1.7, y - r * 0.1, x - r * 0.7, y - r * 1.5, x, y - r * 0.45);
  c.bezierCurveTo(x + r * 0.7, y - r * 1.5, x + r * 1.7, y - r * 0.1, x, y + r);
  c.closePath();
  c.fillStyle = full ? '#ff2d4b' : 'rgba(0,0,0,.35)'; c.fill();
  c.lineWidth = 1; c.strokeStyle = '#5a0010'; c.stroke();
}

function drawSoldier(c, x, y, si, dir, moving, recoil) {
  const bob = moving ? Math.abs(Math.sin(time * 12)) * -3 : 0;
  c.save(); c.translate(x, y + bob);
  c.lineWidth = 1.5; c.strokeStyle = '#3a2615';
  // nohy
  const lg = moving ? Math.sin(time * 12) * 4 : 0;
  c.strokeStyle = '#333'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-4, 14); c.lineTo(-4 + lg, 22); c.moveTo(4, 14); c.lineTo(4 - lg, 22); c.stroke();
  // tělo
  c.fillStyle = COL[si]; rr(c, -9, 3, 18, 14, 5); c.fill();
  c.strokeStyle = COL_DARK[si]; c.lineWidth = 1.5; c.stroke();
  // puška
  c.strokeStyle = '#2b2b2b'; c.lineWidth = 3.5;
  c.beginPath(); c.moveTo(dir * (2 - recoil * 3), 10); c.lineTo(dir * (22 - recoil * 3), 7); c.stroke();
  // hlava
  c.fillStyle = '#ffd9b0'; c.beginPath(); c.arc(0, -6, 11, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#6b4526'; c.lineWidth = 1.5; c.stroke();
  // helma
  c.fillStyle = COL[si]; c.beginPath(); c.arc(0, -8, 12.5, Math.PI, 0); c.lineTo(15 * (dir > 0 ? 1 : 1), -7); c.lineTo(-15, -7); c.closePath(); c.fill();
  c.strokeStyle = COL_DARK[si]; c.stroke();
  // oči a úsměv
  c.fillStyle = '#222';
  c.beginPath(); c.arc(dir * 2 - 4, -3, 1.7, 0, 7); c.arc(dir * 2 + 4, -3, 1.7, 0, 7); c.fill();
  c.strokeStyle = '#222'; c.lineWidth = 1.5;
  c.beginPath(); c.arc(dir * 2, -1, 4.5, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
  c.restore();
}

function drawTank(c, x, y, si, dir, moving, recoil) {
  c.save(); c.translate(x, y);
  // pásy
  c.fillStyle = '#2d2d2d'; rr(c, -26, 2, 52, 16, 8); c.fill();
  c.fillStyle = '#777';
  const off = moving ? (time * 30 * dir) % 9 : 0;
  for (let i = -20; i <= 20; i += 10) { c.beginPath(); c.arc(i, 10, 4, 0, 7); c.fill(); }
  c.strokeStyle = '#555'; c.lineWidth = 2;
  for (let i = -24; i <= 24; i += 9) { const xx = ((i + off + 27) % 54) - 27; c.beginPath(); c.moveTo(xx, 2); c.lineTo(xx, 4); c.stroke(); }
  // korba
  c.fillStyle = COL[si]; c.beginPath(); c.moveTo(-23, 3); c.lineTo(-20, -9); c.lineTo(20, -9); c.lineTo(24, 3); c.closePath(); c.fill();
  c.strokeStyle = COL_DARK[si]; c.lineWidth = 2; c.stroke();
  // hlaveň
  c.fillStyle = '#3a3a3a';
  const bx = dir > 0 ? 4 - recoil * 5 : -32 + recoil * 5;
  c.fillRect(bx, -17, 28, 5);
  c.fillRect(dir > 0 ? bx + 26 : bx - 2, -18, 4, 7);
  // věž
  c.fillStyle = COL[si]; c.beginPath(); c.arc(-dir * 2, -9, 11, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = COL_LIGHT[si]; c.beginPath(); c.arc(-dir * 4, -14, 3, 0, 7); c.fill();
  c.restore();
}

function drawCannon(c, x, y, si, dir, moving, recoil) {
  c.save(); c.translate(x, y);
  // hlaveň
  c.save(); c.translate(-dir * 4, -2); c.rotate(dir > 0 ? -0.35 : 0.35);
  c.fillStyle = '#353535';
  if (dir > 0) { c.fillRect(-recoil * 6, -4.5, 36, 9); c.fillRect(34 - recoil * 6, -6, 5, 12); }
  else { c.fillRect(-36 + recoil * 6, -4.5, 36, 9); c.fillRect(-39 + recoil * 6, -6, 5, 12); }
  c.restore();
  // kulaté tělo (jako na obrázku)
  c.fillStyle = COL[si]; c.beginPath(); c.arc(-dir * 4, -2, 13, 0, 7); c.fill();
  c.strokeStyle = COL_DARK[si]; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#222'; c.beginPath(); c.arc(-dir * 4, -2, 4.5, 0, 7); c.fill();
  // kolo
  c.save(); c.translate(-dir * 4, 11); c.rotate(moving ? time * 3 * dir : 0);
  c.strokeStyle = '#5a3b1e'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.stroke();
  c.lineWidth = 2; c.beginPath();
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; c.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); c.lineTo(-Math.cos(a) * 9, -Math.sin(a) * 9); }
  c.stroke(); c.restore();
  c.restore();
}

function drawMineIcon(c, x, y, si, blink) {
  c.save(); c.translate(x, y);
  c.fillStyle = '#3b3b3b'; c.beginPath(); c.ellipse(0, 0, 13, 8, 0, 0, 7); c.fill();
  c.strokeStyle = COL[si]; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = blink ? '#ff2a2a' : '#702020'; c.beginPath(); c.arc(0, -2, 3.5, 0, 7); c.fill();
  c.restore();
}

function drawTowerIcon(c, x, y, si, lvl) {
  c.save(); c.translate(x, y);
  c.fillStyle = '#8d8d8d'; rr(c, -14, -6, 28, 26, 3); c.fill(); c.strokeStyle = '#444'; c.lineWidth = 2; c.stroke();
  c.fillStyle = COL[si]; c.beginPath(); c.arc(0, -6, 10, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#333'; c.fillRect(0, -9, 22, 6);
  c.fillStyle = '#ffd34d'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText('★'.repeat(lvl || 1), 0, 16);
  c.restore();
}

const DRAW = { vojak: drawSoldier, tank: drawTank, delo: drawCannon };

function drawHearts(c, x, y, hp, max) {
  const per = 5, s = 5.5, gap = 12;
  const full = Math.ceil(hp);
  const rows = Math.ceil(max / per);
  for (let i = 0; i < max; i++) {
    const row = Math.floor(i / per), col = i % per, n = Math.min(per, max - row * per);
    heart(c, x + (col - (n - 1) / 2) * gap, y - (rows - 1 - row) * 11, s, i < full);
  }
}

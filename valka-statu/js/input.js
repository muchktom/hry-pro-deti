'use strict';
// Myš, dotyk a klávesnice

function pos(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
function unitAt(p, side) {
  let hitU = null, bd = 1e9;
  for (const u of units) {
    if (u.side !== side || u.removed) continue;
    const d = Math.hypot(u.x - p.x, u.y - p.y);
    if (d < TYPES[u.type].r + 10 && d < bd) { bd = d; hitU = u; }
  }
  return hitU;
}

cv.addEventListener('pointerdown', e => {
  ac();
  if (state !== 'play' || paused) return;
  const p = pos(e);
  const u = unitAt(p, 0);
  if (u && !mineMode) {
    drag = { u, ox: u.x, oy: u.y, olane: u.lane, p };
    u.dragging = true;
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    SFX.pick();
    return;
  }
  const lane = laneAt(p.y);
  if (mineMode) {
    if (lane >= 0 && p.x > FIELD_L + 20 && p.x < W / 2) { if (placeMine(0, lane, p.x)) { mineMode = !!e.shiftKey; } }
    else if (inRect(p, { x: FIELD_L, y: 0, w: FIELD_R - FIELD_L, h: H })) { toast('Miny dávej na SVOU polovinu cesty 💣'); SFX.no(); }
    else { mineMode = false; }
    return;
  }
  if (lane >= 0 && p.x > FIELD_L && p.x < FIELD_R) { selLane = lane; updateLaneButtons(); SFX.click(); }
});

cv.addEventListener('pointermove', e => {
  const p = pos(e);
  if (drag) { drag.p = p; drag.u.x = p.x; drag.u.y = p.y; return; }
  hover = p;
  if (state === 'play') cv.style.cursor = mineMode ? 'crosshair' : unitAt(p, 0) ? 'grab' : 'pointer';
});

function endDrag(e) {
  if (!drag) return;
  const { u, ox, oy, olane } = drag;
  const p = e ? pos(e) : drag.p;
  drag = null;
  if (u.removed) return;
  u.dragging = false;
  const back = () => { u.x = ox; u.y = oy; u.lane = olane; };
  const b = BLD[0];
  const inOse = inRect(p, b.ose), inOpr = inRect(p, b.opr);
  if (inOse || inOpr) {
    const key = inOse ? 'ose' : 'opr', need = kindKey(u.type);
    if (key !== need) { toast(need === 'ose' ? 'Vojáci patří do OŠETŘOVNY 🩹' : 'Stroje patří do OPRAVNY 🔧'); SFX.no(); back(); }
    else if (u.hp >= u.max) { toast('Tomu nic není! Je úplně zdravý 💪'); SFX.no(); back(); }
    else if (sides[0][key].length >= CAP[key]) { toast('Plno! Počkej, až se někdo uzdraví ⏳'); SFX.no(); back(); }
    else { admit(0, u, key); SFX.drop(); toast(need === 'ose' ? 'Voják se léčí 🩹' : TYPES[u.type].name + ' se opravuje 🔧'); }
    return;
  }
  const lane = laneAt(p.y);
  if (lane >= 0 && p.x > FIELD_L - 20 && p.x < FIELD_R) {
    u.lane = lane;
    u.x = clamp(Math.min(p.x, ox), FIELD_L + 10, FIELD_R - 10);
    u.y = LANES[lane] + clamp(p.y - LANES[lane], -32, 32);
    if (p.x > ox + 20) toast('Dopředu přenést nejde, jen dozadu nebo na jinou cestu ↩️');
    SFX.drop();
  } else back();
}
cv.addEventListener('pointerup', endDrag);
cv.addEventListener('pointercancel', () => { if (drag) { const d = drag; drag = null; d.u.dragging = false; d.u.x = d.ox; d.u.y = d.oy; d.u.lane = d.olane; } });
cv.addEventListener('pointerleave', () => { hover = null; });

function cardAction(t) {
  ac();
  if (state !== 'play' || paused) return;
  if (t === 'mina') { mineMode = !mineMode; if (mineMode) toast('Klikni na svou polovinu cesty a polož minu 💣'); SFX.click(); return; }
  mineMode = false;
  if (t === 'vez') { upgradeTurret(0); return; }
  deploy(0, t, selLane);
}
document.querySelectorAll('.card').forEach(b => b.addEventListener('click', () => cardAction(b.dataset.t)));
document.querySelectorAll('.lanes button').forEach(b => b.addEventListener('click', () => { selLane = +b.dataset.lane; updateLaneButtons(); SFX.click(); }));
function updateLaneButtons() { document.querySelectorAll('.lanes button').forEach(b => b.classList.toggle('sel', +b.dataset.lane === selLane)); }

window.addEventListener('keydown', e => {
  if (state !== 'play') return;
  const k = e.key.toLowerCase();
  if (k === '1' || k === '2' || k === '3') { selLane = +k - 1; updateLaneButtons(); }
  else if (k === 'q') cardAction('vojak');
  else if (k === 'w') cardAction('tank');
  else if (k === 'e') cardAction('delo');
  else if (k === 'r') cardAction('mina');
  else if (k === 't') cardAction('vez');
  else if (k === 'arrowup') { selLane = Math.max(0, selLane - 1); updateLaneButtons(); e.preventDefault(); }
  else if (k === 'arrowdown') { selLane = Math.min(2, selLane + 1); updateLaneButtons(); e.preventDefault(); }
  else if (k === ' ') { togglePause(); e.preventDefault(); }
  else if (k === 'h') toggleHearts();
  else if (k === 'escape') mineMode = false;
});

function togglePause() { if (state !== 'play') return; paused = !paused; document.getElementById('btnPause').textContent = paused ? '▶️' : '⏸'; }
function toggleHearts() { showHearts = !showHearts; document.getElementById('btnHearts').classList.toggle('on', showHearts); document.getElementById('hearts').classList.toggle('hide', !showHearts); }
document.getElementById('btnPause').onclick = togglePause;
document.getElementById('btnHearts').onclick = toggleHearts;
document.getElementById('hearts').onclick = () => { document.getElementById('hearts').classList.add('hide'); };
document.getElementById('btnSound').onclick = e => { muted = !muted; e.currentTarget.textContent = muted ? '🔇' : '🔊'; };
document.getElementById('btnMenu').onclick = () => { if (state === 'play' && !confirm('Opravdu začít znovu?')) return; showOverlay('menu'); };

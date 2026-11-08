'use strict';
// Start hry a hlavní smyčka

function resize() {
  const top = document.getElementById('top').offsetHeight, bot = document.getElementById('bottom').offsetHeight;
  const aw = window.innerWidth - 12, ah = window.innerHeight - top - bot - 12;
  const s = Math.max(0.2, Math.min(aw / W, ah / H));
  cv.style.width = Math.floor(W * s) + 'px';
  cv.style.height = Math.floor(H * s) + 'px';
}
window.addEventListener('resize', resize);

let last = performance.now(), uiT = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state === 'play' && !paused) update(dt);
  else if (state === 'over') {
    time += dt;
    for (const p of parts) { p.life -= dt; if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; } }
    parts = parts.filter(p => p.life > 0);
  } else time += dt;
  render();
  uiT -= dt; if (uiT <= 0) { uiT = 0.1; updateUI(); }
  requestAnimationFrame(loop);
}

reset();
drawCardIcons();
buildHeartsTable();
resize();
showOverlay('menu');
requestAnimationFrame(loop);

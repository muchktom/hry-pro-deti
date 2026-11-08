// Bubliny s Rybočkou – praskání bublinek (volně, podle barvy, podle zvířátka)
const Bubbles = (() => {
  const { rnd, pickOne, say, quiet, praise } = GameKit;

  const COLORS = [
    { id: 'red', c: '#ff4d5e', one: 'červená', many: 'červené' },
    { id: 'blue', c: '#3b82f6', one: 'modrá', many: 'modré' },
    { id: 'green', c: '#22c55e', one: 'zelená', many: 'zelené' },
    { id: 'yellow', c: '#ffd21f', one: 'žlutá', many: 'žluté' },
    { id: 'purple', c: '#a855f7', one: 'fialová', many: 'fialové' },
    { id: 'pink', c: '#ff6fc0', one: 'růžová', many: 'růžové' },
  ];
  const ANIMALS = [
    { id: 'fish', e: '🐠', one: 'rybička', acc: 'rybičku' },
    { id: 'octo', e: '🐙', one: 'chobotnice', acc: 'chobotnici' },
    { id: 'crab', e: '🦀', one: 'krab', acc: 'kraba' },
    { id: 'turtle', e: '🐢', one: 'želva', acc: 'želvu' },
    { id: 'shell', e: '🐚', one: 'mušle', acc: 'mušli' },
    { id: 'whale', e: '🐳', one: 'velryba', acc: 'velrybu' },
    { id: 'dolphin', e: '🐬', one: 'delfín', acc: 'delfína' },
  ];
  const MODES = {
    free: { goal: 15, perTarget: 0 },
    color: { goal: 12, perTarget: 4 },
    animal: { goal: 12, perTarget: 3 },
  };
  const YAY = ['Blub! Paráda!', 'Šplouch! Výborně!', 'Ano! To je ono!', 'Super!', 'Hurá! Blub blub!', 'Ty jsi šikula!'];

  let el = {}, mode = 'free', bubbles = [], popped = 0, goal = 15, target = null, sinceTarget = 0;
  let raf = 0, last = 0, spawnIn = 0, running = false, lastHint = 0, lastWrongTalk = 0;

  const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');

  function init() {
    el = {
      setup: document.getElementById('bb-setup'), sea: document.getElementById('bb-sea'),
      stats: document.getElementById('bb-stats'), target: document.getElementById('bb-target'),
      ryba: document.getElementById('bb-ryba'), win: document.getElementById('bb-win'),
      winText: document.getElementById('bb-win-text'), setupArt: document.getElementById('bb-setup-art'),
    };
    document.querySelectorAll('.bb-mode').forEach(b => b.addEventListener('click', () => { Sound.play('tap'); start(b.dataset.mode); }));
    document.getElementById('bb-again').addEventListener('click', () => start(mode));
    document.getElementById('bb-other').addEventListener('click', showSetup);
    el.target.addEventListener('click', () => { if (target) announce(); });
    el.ryba.addEventListener('click', () => {
      if (target) announce();
      else say(el.ryba, 'rybocka', pickOne(['Blub blub! Praskej bublinky!', 'Šplouch! Ťukni na bublinku!']), { sfx: true });
    });
    el.sea.addEventListener('pointerdown', onTap);
  }

  function showSetup() {
    stop();
    el.win.classList.remove('on');
    el.sea.classList.remove('on');
    el.setup.style.display = '';
    el.stats.textContent = '';
    say(el.setupArt, 'rybocka', 'Blub blub! Ahoj! Pojď se mnou praskat bublinky! Jak si zahrajeme?', { sfx: true });
  }

  function start(m) {
    stop();
    mode = m; goal = MODES[m].goal; popped = 0; sinceTarget = 0; target = null;
    el.win.classList.remove('on');
    el.setup.style.display = 'none';
    el.sea.classList.add('on');
    el.sea.dataset.mode = m;
    el.sea.querySelectorAll('.bubble-b, .bb-drop, .bb-free').forEach(n => n.remove());
    bubbles = [];
    stats();
    if (m === 'free') {
      el.target.classList.remove('on');
      say(el.ryba, 'rybocka', 'Blub blub! Praskej bublinky! Ťukni na ně prstem!', { sfx: true });
    } else newTarget();
    running = true; last = performance.now(); spawnIn = 0;
    // pár bublinek hned na začátku, ať se nečeká
    for (let i = 0; i < 3; i++) spawn(rnd(0.35, 0.95));
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    quiet(el.ryba); quiet(el.setupArt);
  }

  function stats() { el.stats.textContent = `🫧 ${popped}/${goal}`; }

  function newTarget() {
    const pool = mode === 'color' ? COLORS : ANIMALS;
    let t; do { t = pickOne(pool); } while (target && t.id === target.id);
    target = t; sinceTarget = 0;
    el.target.innerHTML = mode === 'color'
      ? `<i class="bb-sample" style="--rgb:${hex(t.c)}"></i><span>${t.many}</span>`
      : `<i class="bb-sample"><b>${t.e}</b></i><span>${t.one}</span>`;
    el.target.classList.remove('on'); void el.target.offsetWidth; el.target.classList.add('on');
    announce();
    // ať je hledaná bublinka brzy vidět
    if (!bubbles.some(b => matches(b))) spawn(rnd(0.75, 0.95), true);
  }

  function announce() {
    lastHint = performance.now();
    const t = mode === 'color' ? `Praskni ${target.many} bublinky!` : `Najdi ${target.acc}!`;
    say(el.ryba, 'rybocka', t);
  }

  function matches(b) {
    if (!target) return true;
    return mode === 'color' ? b.color.id === target.id : b.animal && b.animal.id === target.id;
  }

  // ------------- bublinky -------------
  function spawn(startFrac = 1.1, forceTarget = false) {
    const W = el.sea.clientWidth, H = el.sea.clientHeight;
    if (!W || !H) return;
    const r = Math.max(40, Math.min(66, W * rnd(0.1, 0.14)));
    const b = { r, x0: rnd(r + 4, W - r - 4), y: H * startFrac + r, vy: H / rnd(7, 10), amp: rnd(8, 22), freq: rnd(0.8, 1.6), ph: rnd(0, 6.28) };
    const wantTarget = forceTarget || (target && Math.random() < 0.33);
    if (mode === 'color') b.color = wantTarget ? target : pickOne(COLORS);
    else if (mode === 'animal') b.animal = wantTarget ? target : pickOne(ANIMALS);
    else {
      b.color = Math.random() < 0.6 ? pickOne(COLORS) : null;
      if (Math.random() < 0.35) b.animal = pickOne(ANIMALS);
    }
    const d = document.createElement('div');
    d.className = 'bubble-b';
    d.style.width = d.style.height = 2 * r + 'px';
    if (b.color) { d.style.setProperty('--rgb', hex(b.color.c)); d.classList.add('tint'); }
    if (b.animal) d.innerHTML = `<b style="font-size:${Math.round(r * 0.95)}px">${b.animal.e}</b>`;
    b.el = d;
    el.sea.appendChild(d);
    bubbles.push(b);
    place(b, performance.now() / 1000);
  }

  function place(b, t) {
    b.x = b.x0 + Math.sin(t * b.freq + b.ph) * b.amp;
    b.el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px)`;
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const W = el.sea.clientWidth;
    const max = W > 600 ? 9 : 7;
    spawnIn -= dt;
    if (spawnIn <= 0 && bubbles.length < max && popped < goal) { spawn(); spawnIn = rnd(0.55, 0.95); }
    for (const b of bubbles) {
      if (b.dead) continue;
      b.y -= b.vy * dt;
      place(b, now / 1000);
      if (b.y + b.r < -10) { b.dead = true; b.el.remove(); }
    }
    bubbles = bubbles.filter(b => !b.dead);
    // dlouho nic? Rybočka připomene, co hledáme
    if (target && now - lastHint > 9000) announce();
    raf = requestAnimationFrame(loop);
  }

  function onTap(e) {
    if (!running) return;
    const rect = el.sea.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    // nejbližší bublinka pod prstem (s malou tolerancí pro malé prstíky)
    let best = null, bd = Infinity;
    for (const b of bubbles) {
      if (b.dead) continue;
      const d = Math.hypot(b.x - x, b.y - y);
      if (d < b.r + 14 && d < bd) { bd = d; best = b; }
    }
    if (!best) return;
    e.preventDefault();
    if (matches(best)) pop(best);
    else wrong(best);
  }

  function pop(b, quietly = false) {
    b.dead = true;
    const el0 = b.el;
    el0.classList.add('popping');
    setTimeout(() => el0.remove(), 260);
    drops(b);
    if (b.animal) freeAnimal(b);
    if (quietly) { Sound.play('pop'); return; }
    Sound.play('pop');
    popped++; sinceTarget++;
    stats();
    if (popped >= goal) { finish(); return; }
    if (target && sinceTarget >= MODES[mode].perTarget) { setTimeout(() => { if (running) newTarget(); }, 500); return; }
    if (target || popped % 4 === 0) say(el.ryba, 'rybocka', praise(YAY));
  }

  function drops(b) {
    const color = b.color ? b.color.c : '#bff4ff';
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('i');
      s.className = 'bb-drop';
      const a = i / 8 * Math.PI * 2;
      s.style.left = b.x + 'px'; s.style.top = b.y + 'px'; s.style.background = color;
      s.style.setProperty('--dx', Math.cos(a) * b.r * 1.4 + 'px');
      s.style.setProperty('--dy', Math.sin(a) * b.r * 1.4 + 'px');
      el.sea.appendChild(s);
      setTimeout(() => s.remove(), 600);
    }
  }

  function freeAnimal(b) {
    const f = document.createElement('div');
    f.className = 'bb-free';
    f.textContent = b.animal.e;
    f.style.left = b.x + 'px'; f.style.top = b.y + 'px'; f.style.fontSize = Math.round(b.r * 1.1) + 'px';
    el.sea.appendChild(f);
    setTimeout(() => f.remove(), 1400);
  }

  function wrong(b) {
    Sound.play('boing');
    b.el.classList.remove('nope'); void b.el.offsetWidth; b.el.classList.add('nope');
    const now = performance.now();
    if (now - lastWrongTalk < 2500) return;
    lastWrongTalk = now; lastHint = now;
    const what = mode === 'color' ? `To je ${b.color.one}.` : `To je ${b.animal.one}.`;
    const want = mode === 'color' ? `Hledáme ${target.many}!` : `Hledáme ${target.acc}!`;
    say(el.ryba, 'rybocka', `${what} ${want}`);
  }

  function finish() {
    running = false;
    cancelAnimationFrame(raf);
    el.target.classList.remove('on');
    // zbylé bublinky prasknou jedna po druhé
    bubbles.filter(b => !b.dead).forEach((b, i) => setTimeout(() => pop(b, true), 120 + i * 110));
    setTimeout(() => {
      if (!el.sea.classList.contains('on')) return;
      el.winText.textContent = `Prasklo ${goal} bublinek!`;
      el.win.classList.add('on');
      Sound.play('win');
      App.confetti();
      setTimeout(() => say(document.getElementById('bb-win-art'), 'rybocka', praise(['Blub blub! Hurá! To bylo bublinkové!', 'Šplouch! Jsi bublinkový šampion!', 'Páni! Tolik bublinek! Blub!']), { sfx: true }), 700);
    }, 900);
  }

  return { init, showSetup, leave: () => { stop(); el.win.classList.remove('on'); } };
})();

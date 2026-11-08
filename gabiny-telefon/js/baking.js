// Pečení s Dortě – přísady do mísy, míchání, trouba, poleva, zdobení
const Baking = (() => {
  const { rnd, pickOne, shuffle, say, quiet, praise } = GameKit;
  const OUT = '#3b2752';

  const sack = (fill, mark) => `<svg viewBox="0 0 60 60"><path d="M14,16 Q12,8 20,8 H40 Q48,8 46,16 L50,50 Q50,56 44,56 H16 Q10,56 10,50Z" fill="${fill}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/><path d="M18,16 H42" stroke="${OUT}" stroke-width="2.5"/>${mark}</svg>`;
  const ING = [
    { id: 'egg', name: 'vajíčko', acc: 'vajíčko', pic: '🥚', dough: '#ffe08a' },
    { id: 'milk', name: 'mléko', acc: 'mléko', pic: '🥛', dough: '#fff6e6' },
    { id: 'flour', name: 'mouka', acc: 'mouku', pic: sack('#fff', '<path d="M30,26 l-6,10 h12z M24,40 h12" stroke="#e2b04a" stroke-width="3" fill="#f6d27a"/>'), dough: '#f7efe0' },
    { id: 'sugar', name: 'cukr', acc: 'cukr', pic: sack('#ffd6ec', '<rect x="21" y="28" width="9" height="9" fill="#fff" stroke="#3b2752" stroke-width="2"/><rect x="31" y="34" width="9" height="9" fill="#fff" stroke="#3b2752" stroke-width="2"/><rect x="25" y="41" width="9" height="9" fill="#fff" stroke="#3b2752" stroke-width="2"/>'), dough: '#fff' },
    { id: 'butter', name: 'máslo', acc: 'máslo', pic: '🧈', dough: '#ffe9a0' },
  ];
  const CREAMS = [
    { id: 'straw', name: 'jahodová', c: '#ff8fc0', pic: '🍓' },
    { id: 'choco', name: 'čokoládová', c: '#8a5132', pic: '🍫' },
    { id: 'lemon', name: 'citronová', c: '#ffe45c', pic: '🍋' },
    { id: 'blue', name: 'borůvková', c: '#9b8cff', pic: '🫐' },
    { id: 'vanilla', name: 'vanilková', c: '#fffaf0', pic: '🍦' },
  ];
  const TOPS = ['🍓', '🍒', '🫐', '🍬', '⭐', '💖', '🍭', '🌸', '🕯️'];
  const STEPS = ['🥚', '🥄', '🔥', '🎨', '🍓'];

  let el = {}, kind = 'cupcake', step = -1, need = [], added = 0, stir = 0, cream = null, tops = 0, selTop = TOPS[0];
  let timers = [], stirLast = null, idleHint = 0, baking = false;

  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; clearInterval(idleHint); };
  const talk = (t, o) => { el.bubble.textContent = t; return say(el.dorte, 'dorte', t, o); };

  // ------------- kreslení -------------
  // stage: 'batter' (syrové těsto ve formě) | 'baked' | 'cream'
  function cakeSVG(k, stage, creamC = '#fff') {
    let s = `<svg viewBox="0 0 300 260" class="cake-svg">`;
    if (k === 'cupcake') {
      if (stage === 'batter') s += `<path d="M84,170 Q150,150 216,170 L214,180 H86Z" fill="#f7dca0" stroke="${OUT}" stroke-width="3"/>`;
      else s += `<path d="M72,172 Q66,96 150,92 Q234,96 228,172Z" fill="#e3a052" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>` +
        `<path d="M96,140 q8,-8 16,0 M170,128 q8,-8 16,0 M136,112 q8,-8 16,0" stroke="#c97d33" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M78,168 H222 L202,248 H98Z" fill="#ff8fc8" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>`;
      for (let i = 0; i < 6; i++) { const x = 100 + i * 20; s += `<path d="M${x},170 L${x + 2 - (i - 2.5) * 3},246" stroke="#ff5fa8" stroke-width="5"/>`; }
      if (stage === 'cream') s += `<g fill="${creamC}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round">
        <path d="M62,172 Q50,140 92,132 Q100,112 150,110 Q200,112 208,132 Q250,140 238,172 Q190,186 150,180 Q110,186 62,172Z"/>
        <path d="M86,132 Q80,104 118,100 Q124,80 150,80 Q178,80 182,100 Q220,104 214,132 Q180,142 150,136 Q120,142 86,132Z"/>
        <path d="M112,98 Q110,70 138,66 Q146,40 160,36 Q164,56 168,66 Q192,72 188,98 Q170,106 150,102 Q130,106 112,98Z"/></g>
        <path d="M120,92 q12,-10 24,-4 M96,124 q16,-10 30,-4 M170,122 q14,-8 28,0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>`;
    } else {
      s += `<ellipse cx="150" cy="236" rx="138" ry="20" fill="#fff" stroke="${OUT}" stroke-width="4"/>`;
      if (stage === 'batter') {
        s += `<path d="M44,150 V222 Q150,248 256,222 V150" fill="#c9ced8" stroke="${OUT}" stroke-width="4"/>` +
          `<ellipse cx="150" cy="186" rx="104" ry="22" fill="#f7dca0" stroke="${OUT}" stroke-width="3"/>` +
          `<path d="M44,150 Q150,176 256,150" fill="none" stroke="${OUT}" stroke-width="4"/>` +
          `<ellipse cx="150" cy="150" rx="106" ry="26" fill="none" stroke="${OUT}" stroke-width="4"/>`;
      } else {
        const top = stage === 'cream' ? creamC : '#f2bd72';
        s += `<path d="M50,124 V214 Q150,244 250,214 V124" fill="#e3a052" stroke="${OUT}" stroke-width="4"/>` +
          `<path d="M50,170 Q150,198 250,170" stroke="#fff3d6" stroke-width="10" fill="none"/>` +
          `<path d="M50,170 Q150,198 250,170" stroke="${OUT}" stroke-width="2" fill="none" opacity=".25"/>` +
          `<ellipse cx="150" cy="124" rx="100" ry="28" fill="${top}" stroke="${OUT}" stroke-width="4"/>`;
        if (stage === 'cream') s += `<path d="M50,124 Q150,160 250,124 V140 Q240,160 232,140 Q222,168 210,146 Q196,172 184,150 Q170,176 156,154 Q142,178 128,152 Q114,172 102,148 Q90,168 80,144 Q66,164 60,140 Q52,152 50,140Z" fill="${creamC}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>` +
          `<path d="M90,112 q30,-12 60,-10" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".55"/>`;
      }
    }
    return s + '</svg>';
  }
  // místo, kam se dají klást ozdoby (elipsa v souřadnicích 300×260)
  const zone = () => kind === 'cupcake' ? { cx: 150, cy: 132, rx: 78, ry: 46 } : { cx: 150, cy: 150, rx: 92, ry: 58 };

  function bowlSVG() {
    return `<svg viewBox="0 0 300 230" class="bowl-svg">
      <path d="M22,92 Q30,214 150,216 Q270,214 278,92Z" fill="#7cc8f5" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M60,150 Q90,190 140,196" stroke="#fff" stroke-width="7" fill="none" opacity=".45" stroke-linecap="round"/>
      <ellipse cx="150" cy="92" rx="128" ry="30" fill="#bfe6ff" stroke="${OUT}" stroke-width="5"/>
      <ellipse id="bk-dough" cx="150" cy="98" rx="0" ry="0" fill="#f7efe0" stroke="${OUT}" stroke-width="2" stroke-opacity=".3"/>
      <g id="bk-blobs"></g>
      <g id="bk-swirl" opacity="0"><g transform="translate(150,98) scale(1,.2)"><g id="bk-swirl-rot">
        <path d="M0,0 C20,-10 40,10 30,40 C15,80 -60,70 -70,10 C-80,-60 10,-95 60,-70 C100,-50 105,10 90,40" fill="none" stroke="#e8c98f" stroke-width="10" stroke-linecap="round"/>
      </g></g></g>
    </svg>`;
  }

  function init() {
    el = {
      stage: document.getElementById('bk-stage'), steps: document.getElementById('bk-steps'),
      dorte: document.getElementById('bk-dorte'), bubble: document.getElementById('bk-bubble'),
      area: document.getElementById('bk-area'), tray: document.getElementById('bk-tray'),
      done: document.getElementById('bk-done'), win: document.getElementById('bk-win'),
      winCake: document.getElementById('bk-win-cake'),
    };
    document.getElementById('bk-again').addEventListener('click', () => { el.win.classList.remove('on'); showSetup(); });
    el.dorte.addEventListener('click', repeatHint);
    el.done.addEventListener('click', finish);
  }

  function setStep(i) {
    step = i;
    el.steps.innerHTML = STEPS.map((s, k) => `<span class="${k < i ? 'ok' : k === i ? 'now' : ''}">${k < i ? '✔' : s}</span>`).join('');
    el.steps.style.visibility = i < 0 ? 'hidden' : '';
    el.done.classList.remove('on');
    el.tray.innerHTML = ''; el.tray.className = 'bk-tray';
    el.area.innerHTML = ''; el.area.className = 'bk-area';
    clearInterval(idleHint);
  }

  // ------------- 0: výběr -------------
  function showSetup() {
    clearTimers(); baking = false;
    el.win.classList.remove('on');
    setStep(-1);
    el.area.classList.add('choose');
    el.area.innerHTML = `
      <button class="bk-choice" data-k="cupcake">${cakeSVG('cupcake', 'cream', '#ff8fc0')}<b>Dortík</b></button>
      <button class="bk-choice" data-k="cake">${cakeSVG('cake', 'cream', '#8a5132')}<b>Velký dort</b></button>`;
    el.area.querySelectorAll('.bk-choice').forEach(b => b.addEventListener('click', () => {
      Sound.play('tap'); kind = b.dataset.k; startIngredients();
    }));
    talk(praise(['Ahoj! Pojď se mnou péct! Co upečeme?', 'Haló, kuchaři! Co dneska upečeme?']), { sfx: true });
  }

  // ------------- 1: přísady -------------
  function startIngredients() {
    setStep(0);
    need = shuffle([...ING]); added = 0;
    el.area.innerHTML = `<div class="bk-bowl">${bowlSVG()}</div>`;
    el.tray.classList.add('ing');
    el.tray.innerHTML = shuffle([...ING]).map(i => `<button class="bk-item" data-id="${i.id}" aria-label="${i.name}">${i.pic}</button>`).join('');
    el.tray.querySelectorAll('.bk-item').forEach(b => b.addEventListener('click', () => addIng(b)));
    askIng();
  }

  function askIng() {
    const n = need[added];
    el.tray.querySelectorAll('.bk-item').forEach(b => b.classList.toggle('want', b.dataset.id === n.id));
    talk(added === 0 ? `Nejdřív dáme do mísy ${n.acc}! Ťukni na ${n.acc === n.name ? 'něj' : 'ni'}.` : pickOne([`Teď ${n.acc}!`, `A ještě ${n.acc}!`, `Přidej ${n.acc}!`]));
    if (added === 0) el.bubble.textContent = `Dej do mísy: ${n.name}`;
    clearInterval(idleHint);
    idleHint = setInterval(() => {
      const b = el.tray.querySelector('.want');
      if (b) { b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); }
    }, 3500);
  }

  function addIng(b) {
    const n = need[added];
    if (!n || b.classList.contains('used')) return;
    if (b.dataset.id !== n.id) {
      Sound.play('boing');
      b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
      const it = ING.find(i => i.id === b.dataset.id);
      talk(`To je ${it.name}. Teď potřebujeme ${n.acc}!`);
      return;
    }
    Sound.play('tap');
    b.classList.add('used');
    // přísada přeletí do mísy
    const bowl = el.area.querySelector('.bk-bowl').getBoundingClientRect(), r = b.getBoundingClientRect();
    const fly = b.cloneNode(true);
    fly.className = 'bk-item bk-fly';
    const ph = document.getElementById('phone').getBoundingClientRect();
    Object.assign(fly.style, { left: r.left - ph.left + 'px', top: r.top - ph.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    document.getElementById('phone').appendChild(fly);
    requestAnimationFrame(() => {
      fly.style.transform = `translate(${bowl.left + bowl.width / 2 - r.left - r.width / 2}px, ${bowl.top + bowl.height * 0.3 - r.top - r.height / 2}px) scale(.6) rotate(200deg)`;
      fly.style.opacity = '0.2';
    });
    added++;
    const myAdded = added;
    later(() => {
      fly.remove();
      Sound.play('splash');
      const dough = document.getElementById('bk-dough');
      dough.setAttribute('rx', 40 + myAdded * 16); dough.setAttribute('ry', 8 + myAdded * 3.2);
      const blobs = document.getElementById('bk-blobs');
      const ang = rnd(0, 6.28), dist = rnd(0, 40);
      blobs.insertAdjacentHTML('beforeend', `<ellipse cx="${150 + Math.cos(ang) * dist}" cy="${98 + Math.sin(ang) * dist * 0.2}" rx="${rnd(14, 22)}" ry="${rnd(4, 6)}" fill="${n.dough}" stroke="${OUT}" stroke-width="1.5" stroke-opacity=".3"/>`);
      el.area.querySelector('.bk-bowl').classList.add('splash');
      later(() => el.area.querySelector('.bk-bowl') && el.area.querySelector('.bk-bowl').classList.remove('splash'), 400);
      if (myAdded >= need.length) {
        clearInterval(idleHint);
        talk(praise(['Výborně! Všechno je v míse!', 'Paráda! Máme všechno!']));
        later(startStir, 1700);
      } else askIng();
    }, 520);
  }

  // ------------- 2: míchání -------------
  function startStir() {
    setStep(1);
    stir = 0; stirLast = null;
    el.area.innerHTML = `<div class="bk-bowl stir">${bowlSVG()}<div class="bk-spoon">🥄</div><div class="bk-meter"><i></i></div></div>`;
    const dough = document.getElementById('bk-dough');
    dough.setAttribute('rx', 120); dough.setAttribute('ry', 24);
    const blobs = document.getElementById('bk-blobs');
    ING.forEach((n, i) => blobs.insertAdjacentHTML('beforeend', `<ellipse cx="${80 + i * 35}" cy="${96 + (i % 2) * 6}" rx="20" ry="5" fill="${n.dough}" stroke="${OUT}" stroke-width="1.5" stroke-opacity=".3"/>`));
    const bowl = el.area.querySelector('.bk-bowl');
    bowl.addEventListener('pointerdown', (e) => { stirLast = { x: e.clientX, y: e.clientY }; addStir(6); bowl.setPointerCapture && bowl.setPointerCapture(e.pointerId); });
    bowl.addEventListener('pointermove', (e) => {
      if (!stirLast) return;
      const d = Math.hypot(e.clientX - stirLast.x, e.clientY - stirLast.y);
      stirLast = { x: e.clientX, y: e.clientY };
      addStir(d / 9);
    });
    const up = () => { stirLast = null; };
    bowl.addEventListener('pointerup', up); bowl.addEventListener('pointercancel', up);
    talk('Teď to zamíchej! Krouž prstem v míse, nebo na ni ťukej!');
  }

  let lastStirSound = 0;
  function addStir(v) {
    if (step !== 1 || stir >= 100) return;
    stir = Math.min(100, stir + v);
    const rot = document.getElementById('bk-swirl-rot');
    rot.setAttribute('transform', `rotate(${stir * 14})`);
    document.getElementById('bk-swirl').setAttribute('opacity', Math.min(1, stir / 30));
    document.getElementById('bk-blobs').setAttribute('opacity', 1 - stir / 100);
    document.getElementById('bk-dough').setAttribute('fill', stir > 50 ? '#f6dfa6' : '#f7efe0');
    const spoon = el.area.querySelector('.bk-spoon');
    const a = stir * 0.35;
    spoon.style.transform = `translate(${Math.cos(a) * 60}px, ${Math.sin(a) * 14}px) rotate(${-30 + Math.sin(a) * 15}deg)`;
    el.area.querySelector('.bk-meter i').style.width = stir + '%';
    const now = performance.now();
    if (now - lastStirSound > 180) { Sound.play('stir'); lastStirSound = now; }
    if (stir >= 100) {
      Sound.play('match');
      talk(praise(['Těsto je hotové! Krásně hladké!', 'Výborně zamícháno!']));
      later(startBake, 1800);
    } else if (stir > 45 && stir - v <= 45) talk(pickOne(['Míchej, míchej!', 'Jen tak dál!']));
  }

  // ------------- 3: trouba -------------
  function startBake() {
    setStep(2);
    baking = false;
    el.area.innerHTML = `
      <button class="bk-oven" aria-label="Trouba">
        <div class="bk-knobs"><i></i><i></i><i></i><span class="bk-timer"></span></div>
        <div class="bk-window"><div class="bk-in">${cakeSVG(kind, 'batter')}</div></div>
        <div class="bk-handle"></div>
      </button>`;
    el.tray.innerHTML = `<button class="big-btn bk-go">🔥 Péct!</button>`;
    const go = () => { if (!baking) bake(); };
    el.area.querySelector('.bk-oven').addEventListener('click', () => baking ? peek() : go());
    el.tray.querySelector('.bk-go').addEventListener('click', go);
    talk('Těsto je ve formě. Ťukni na troubu a upečeme to!');
  }

  function bake() {
    baking = true;
    el.tray.innerHTML = '';
    const oven = el.area.querySelector('.bk-oven'), timer = oven.querySelector('.bk-timer');
    oven.classList.add('hot');
    Sound.play('magic');
    talk('Do trouby a čekáme! Tik ťak…');
    let left = 5;
    timer.textContent = left;
    const tick = () => {
      left--;
      if (left > 0) { timer.textContent = left; Sound.play('tick'); later(tick, 1000); return; }
      timer.textContent = '';
      oven.classList.remove('hot');
      oven.querySelector('.bk-in').innerHTML = cakeSVG(kind, 'baked');
      oven.querySelector('.bk-in').classList.add('risen');
      Sound.play('ding');
      talk('Ding! Je upečeno! Mňam, to voní!');
      later(startCream, 2200);
    };
    later(tick, 1000);
  }

  let lastPeek = 0;
  function peek() {
    const now = performance.now();
    if (now - lastPeek < 2500 || step !== 2) return;
    lastPeek = now;
    talk(pickOne(['Ještě chvilku! Už to roste!', 'Psst! Peče se to!', 'Hmm, to už voní!']));
  }

  // ------------- 4: poleva -------------
  function startCream() {
    setStep(3);
    cream = null;
    el.area.innerHTML = `<div class="bk-cake" id="bk-cake">${cakeSVG(kind, 'baked')}<div class="bk-tops"></div></div>`;
    el.tray.classList.add('creams');
    el.tray.innerHTML = CREAMS.map(c => `<button class="bk-cream" data-id="${c.id}" style="--cc:${c.c}" aria-label="${c.name}"><span>${c.pic}</span></button>`).join('');
    el.tray.querySelectorAll('.bk-cream').forEach(b => b.addEventListener('click', () => pickCream(b)));
    talk('Jakou dáme polevu? Vyber si barvu!');
  }

  function pickCream(b) {
    const c = CREAMS.find(x => x.id === b.dataset.id);
    const first = !cream;
    cream = c;
    Sound.play('splash');
    el.tray.querySelectorAll('.bk-cream').forEach(x => x.classList.toggle('sel', x === b));
    const cake = document.getElementById('bk-cake');
    cake.querySelector('svg').outerHTML = cakeSVG(kind, 'cream', c.c);
    cake.classList.remove('pour'); void cake.offsetWidth; cake.classList.add('pour');
    talk(`Mňam! ${c.name[0].toUpperCase() + c.name.slice(1)} poleva!`);
    if (first) {
      el.done.textContent = '➡️ Zdobit';
      el.done.classList.add('on');
    }
  }

  // ------------- 5: zdobení -------------
  function startDecor() {
    setStep(4);
    tops = 0;
    el.area.innerHTML = `<div class="bk-cake" id="bk-cake">${cakeSVG(kind, 'cream', cream.c)}<div class="bk-tops"></div></div>`;
    el.tray.classList.add('decor');
    el.tray.innerHTML = TOPS.map(t => `<button class="bk-top" data-t="${t}">${t}</button>`).join('');
    el.tray.querySelectorAll('.bk-top').forEach(b => b.addEventListener('click', () => {
      selTop = b.dataset.t;
      el.tray.querySelectorAll('.bk-top').forEach(x => x.classList.toggle('sel', x === b));
      const z = zone(), a = rnd(0, 6.28), d = Math.sqrt(Math.random()) * 0.85;
      addTop(z.cx + Math.cos(a) * z.rx * d, z.cy + Math.sin(a) * z.ry * d);
    }));
    el.tray.querySelector('.bk-top').classList.add('sel'); selTop = TOPS[0];
    document.getElementById('bk-cake').addEventListener('pointerdown', (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      let x = (e.clientX - r.left) / r.width * 300, y = (e.clientY - r.top) / r.height * 260;
      const z = zone(), dx = (x - z.cx) / z.rx, dy = (y - z.cy) / z.ry, k = Math.hypot(dx, dy);
      if (k > 1.6) return; // úplně mimo dort
      if (k > 1) { x = z.cx + dx / k * z.rx; y = z.cy + dy / k * z.ry; }
      addTop(x, y);
    });
    talk('Teď to ozdobíme! Ťukni na ozdobu a pak na dort!');
  }

  function addTop(x, y) {
    const box = document.querySelector('#bk-cake .bk-tops');
    if (!box) return;
    if (tops >= 40) box.firstElementChild && box.firstElementChild.remove();
    const t = document.createElement('span');
    t.textContent = selTop;
    t.style.left = (x / 300 * 100) + '%'; t.style.top = (y / 260 * 100) + '%';
    t.style.setProperty('--r', rnd(-20, 20) + 'deg');
    box.appendChild(t);
    tops++;
    Sound.play('plop');
    if (tops === 3) { el.done.textContent = '✅ Hotovo!'; el.done.classList.add('on'); }
    if (tops === 6 || tops === 14) talk(praise(['To je krása!', 'Páni, to je nádherný dort!', 'Ještě víc ozdob!']));
  }

  function next() {
    if (step === 3 && cream) { Sound.play('tap'); startDecor(); }
  }

  // ------------- konec -------------
  function finish() {
    if (step === 3) { next(); return; }
    if (step !== 4) return;
    el.done.classList.remove('on');
    el.winCake.innerHTML = document.getElementById('bk-cake').innerHTML;
    el.win.classList.add('on');
    Sound.play('win');
    App.confetti();
    later(() => {
      const w = document.getElementById('bk-win-art');
      say(w, 'dorte', praise(['Mňam mňam! To je ten nejlepší dort na světě!', 'Ochutnám… Mňam! Jsi výborný cukrář!', 'Páni! Ten je krásný! A tak voní!']), { sfx: true });
    }, 800);
  }

  function repeatHint() {
    if (step === -1) talk('Vyber si, jestli upečeme dortík, nebo velký dort!');
    else if (step === 0 && need[added]) talk(`Teď potřebujeme ${need[added].acc}!`);
    else if (step === 1) talk('Krouž prstem v míse!');
    else if (step === 2) baking ? peek() : talk('Ťukni na troubu!');
    else if (step === 3) talk('Vyber si polevu!');
    else if (step === 4) talk('Ťukni na ozdobu a pak na dort!');
  }

  function leave() { clearTimers(); quiet(el.dorte); el.win.classList.remove('on'); }

  return { init, showSetup, leave };
})();

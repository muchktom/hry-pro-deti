// Gábino pexeso
const Pexeso = (() => {
  const ITEMS = [
    ...CHARACTERS.map(c => ({ id: c.id, name: c.name, art: c.id, bg: '#fff' })),
    { id: 'cupcake', name: 'Dortík', emoji: '🧁' },
    { id: 'house', name: 'Domeček', emoji: '🏠' },
    { id: 'yarn', name: 'Klubíčko', emoji: '🧶' },
    { id: 'wand', name: 'Kouzelná hůlka', emoji: '🪄' },
    { id: 'box', name: 'Krabice', emoji: '🎁' },
    { id: 'rainbow', name: 'Duha', emoji: '🌈' },
    { id: 'cheese', name: 'Sýr', emoji: '🧀' },
    { id: 'phones', name: 'Sluchátka', emoji: '🎧' },
    { id: 'bow', name: 'Mašle', emoji: '🎀' },
    { id: 'shell', name: 'Mušle', emoji: '🐚' },
    { id: 'moon', name: 'Měsíček', emoji: '🌙' },
  ];

  let el = {}, pairs = 6, cards = [], open = [], lock = false, moves = 0, found = 0;

  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function init() {
    el = {
      setup: document.getElementById('px-setup'), board: document.getElementById('px-board'),
      stats: document.getElementById('px-stats'), win: document.getElementById('px-win'),
      stars: document.getElementById('px-stars'), winText: document.getElementById('px-win-text'),
    };
    document.querySelectorAll('.px-size').forEach(b => b.addEventListener('click', () => { Sound.play('tap'); start(+b.dataset.pairs); }));
    document.getElementById('px-again').addEventListener('click', () => start(pairs));
    document.getElementById('px-other').addEventListener('click', showSetup);
    window.addEventListener('resize', layout);
  }

  function showSetup() {
    el.win.classList.remove('on');
    el.board.classList.remove('on');
    el.setup.style.display = '';
    el.stats.textContent = '';
  }

  function start(p) {
    pairs = p; moves = 0; found = 0; open = []; lock = false;
    el.win.classList.remove('on');
    el.setup.style.display = 'none';
    // vždy aspoň polovina obrázků jsou postavičky
    const chars = shuffle(ITEMS.filter(i => i.art)), things = shuffle(ITEMS.filter(i => !i.art));
    const nChars = Math.min(chars.length, Math.ceil(p / 2) + Math.floor(Math.random() * 2));
    const chosen = shuffle([...chars.slice(0, nChars), ...things.slice(0, p - nChars)]);
    cards = shuffle([...chosen, ...chosen].map((it, i) => ({ it, key: i })));
    el.board.innerHTML = '';
    cards.forEach((c, i) => {
      const d = document.createElement('button');
      d.className = 'card';
      d.innerHTML = `<div class="card-in"><div class="card-face card-back">🐾</div>
        <div class="card-face card-front"><div class="pic">${c.it.art ? ART.render(c.it.art, { mouth: 'smile' }) : c.it.emoji}</div><div class="lbl">${c.it.name}</div></div></div>`;
      d.addEventListener('click', () => flip(i));
      c.el = d;
      el.board.appendChild(d);
    });
    el.board.classList.add('on');
    layout();
    stats();
  }

  function layout() {
    if (!el.board || !el.board.classList.contains('on')) return;
    const n = cards.length;
    const W = el.board.clientWidth - 20, H = el.board.clientHeight - 20, gap = 8;
    let best = { cols: 2, size: 0 }, even = { cols: 2, size: 0 };
    for (let cols = 2; cols <= 6; cols++) {
      const rows = Math.ceil(n / cols);
      const w = (W - gap * (cols - 1)) / cols;
      const h = (H - gap * (rows - 1)) / rows;
      const size = Math.min(w, h / 1.15);
      if (size > best.size) best = { cols, size };
      if (n % cols === 0 && size > even.size) even = { cols, size };
    }
    if (even.size >= best.size * 0.8) best = even; // raději úplná mřížka bez "díry"
    const s = Math.floor(best.size);
    el.board.style.gridTemplateColumns = `repeat(${best.cols}, ${s}px)`;
    el.board.style.gridAutoRows = `${Math.floor(s * 1.15)}px`;
    el.board.style.setProperty('--cs', s + 'px');
  }

  function stats() { el.stats.textContent = `⭐ ${found}/${pairs}  👆 ${moves}`; }

  function flip(i) {
    const c = cards[i];
    if (lock || c.done || open.includes(i)) return;
    Sound.play('flip');
    c.el.classList.add('open');
    open.push(i);
    if (open.length < 2) return;
    moves++;
    const [a, b] = open.map(k => cards[k]);
    if (a.it.id === b.it.id) {
      lock = true;
      setTimeout(() => {
        a.done = b.done = true;
        a.el.classList.add('done'); b.el.classList.add('done');
        open = []; lock = false; found++;
        Sound.play('match');
        Voice.speak(a.it.name + '!', { pitch: 1.3, rate: 1 });
        stats();
        if (found === pairs) setTimeout(win, 700);
      }, 350);
    } else {
      lock = true;
      setTimeout(() => {
        Sound.play('miss');
        a.el.classList.remove('open'); b.el.classList.remove('open');
        open = []; lock = false;
      }, 1000);
    }
    stats();
  }

  function win() {
    const ratio = moves / pairs;
    const stars = ratio <= 1.6 ? 3 : ratio <= 2.4 ? 2 : 1;
    el.stars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    el.winText.textContent = `Všechny dvojice za ${moves} ${moves >= 5 ? 'tahů' : 'tahy'}!`;
    el.win.classList.add('on');
    Sound.play('win');
    App.confetti();
    const g = CHAR.gabi;
    setTimeout(() => Voice.speak(['Hurá! Výborně! Našli jsme všechny dvojice!', 'Jupí! To bylo skvělé! Mňau!', 'Páni, ty jsi ale šikula!'][Math.floor(Math.random() * 3)], g.voice), 900);
  }

  return { init, showSetup };
})();

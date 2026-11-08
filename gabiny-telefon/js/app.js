// Gábin kouzelný telefon – hlavní aplikace
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const App = (() => {
  let current = 'splash';
  const leaveHooks = {};

  // ---------------- Navigace (funguje i tlačítko Zpět na Androidu) -------
  function show(id, params = {}) {
    if (leaveHooks[current] && current !== id) leaveHooks[current]();
    current = id;
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    const enter = enterHooks[id];
    if (enter) enter(params);
  }
  function go(id, params = {}) {
    history.pushState({ id, params }, '');
    show(id, params);
  }
  function back() { history.back(); }
  window.addEventListener('popstate', (e) => {
    const st = e.state || { id: 'home' };
    show(st.id === 'splash' ? 'home' : st.id, st.params || {});
  });

  // ---------------- Pomocníci ----------------
  function paintArt(root = document) {
    $$('[data-art]', root).forEach(d => { d.innerHTML = ART.render(d.dataset.art, { mouth: 'smile' }); });
  }

  function confetti() {
    const box = $('#confetti');
    const colors = ['#ff6fae', '#ffd166', '#6ee7f9', '#8b5cf6', '#86efac', '#fff'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = pick(colors);
      c.style.animationDuration = 1.8 + Math.random() * 1.8 + 's';
      c.style.animationDelay = Math.random() * 0.6 + 's';
      box.appendChild(c);
      setTimeout(() => c.remove(), 4500);
    }
  }

  function clock() {
    const d = new Date();
    $('#clock').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  const opts = {
    get incoming() { return Store.get('optIncoming', true); },
    get readMsg() { return Store.get('optReadMsg', true); },
  };

  // Mluvení postavičky na domovské obrazovce
  async function homeSay(id, text) {
    const c = CHAR[id];
    const btn = $(`.wchar[data-say="${id}"]`);
    const art = btn.querySelector('div');
    const lines = id === 'gabi'
      ? ['Ahoj! Já jsem Gábi! Chceš si zavolat?', 'Mňau! Zahrajeme si pexeso?', 'Napiš mi zprávu! Ráda ti odpovím!', 'Kočičí ouška, raz, dva, tři!']
      : ['Hihihi! Ahoj! Já jsem Pandy!', 'Zavolej mi! Budeme se mazlit!', 'Mám hlad! Nemáš sušenku?', 'Hop! Hop! Hihihi!'];
    const t = text || pick(lines);
    $('#home-bubble').textContent = t;
    btn.classList.add('talk');
    Sound.play(c.sfx);
    let open = false;
    const anim = setInterval(() => { open = !open; art.innerHTML = ART.render(id, { mouth: open ? 'open' : 'mid', eyes: 'open' }); }, 140);
    await sleep(350);
    await Voice.speak(t, c.voice);
    clearInterval(anim);
    art.innerHTML = ART.render(id, { mouth: 'smile', eyes: 'laugh' });
    btn.classList.remove('talk');
    setTimeout(() => { art.innerHTML = ART.render(id, { mouth: 'smile' }); }, 900);
  }

  // ---------------- Příchozí hovor ----------------
  let incomingTimer = null, incomingRing = null, lastIncoming = Date.now(), incomingId = null;
  function scheduleIncoming() {
    clearTimeout(incomingTimer);
    if (!opts.incoming) return;
    incomingTimer = setTimeout(() => {
      if (current === 'home' && Date.now() - lastIncoming > 150000) incoming(pick(CHARACTERS).id);
      else scheduleIncoming();
    }, 45000 + Math.random() * 60000);
  }
  function incoming(id) {
    lastIncoming = Date.now();
    incomingId = id;
    const c = CHAR[id];
    $('#incoming-avatar').innerHTML = ART.render(id, { mouth: 'laugh', eyes: 'laugh' });
    $('#incoming-avatar').style.background = c.color + '55';
    $('#incoming-name').textContent = c.name;
    go('incoming', { id });
    Sound.play('ring');
    incomingRing = setInterval(() => Sound.play('ring'), 1700);
    try { navigator.vibrate && navigator.vibrate([400, 300, 400]); } catch (e) { }
  }
  function stopIncomingRing() { clearInterval(incomingRing); incomingRing = null; if (navigator.vibrate) navigator.vibrate(0); }

  // ---------------- Kontakty ----------------
  function renderContacts() {
    const list = $('#contact-list');
    list.innerHTML = '';
    for (const c of CHARACTERS) {
      const row = document.createElement('div');
      row.className = 'row-card';
      row.innerHTML = `<div class="avatar" style="--c:${c.color};background:${c.color}33">${ART.render(c.id, { mouth: 'smile' })}</div>
        <div class="row-name"><b>${c.name}</b><span>${c.tag}</span></div>
        <button class="call-btn voice" aria-label="Zavolat">📞</button>
        <button class="call-btn video" aria-label="Videohovor">🎥</button>`;
      row.querySelector('.voice').addEventListener('click', () => { Sound.play('tap'); go('call', { id: c.id, video: false }); });
      row.querySelector('.video').addEventListener('click', () => { Sound.play('tap'); go('call', { id: c.id, video: true }); });
      row.querySelector('.avatar').addEventListener('click', () => { Sound.play(c.sfx); });
      list.appendChild(row);
    }
  }

  // ======================= HOVOR ==========================================
  const Call = (() => {
    let S = null; // stav aktuálního hovoru
    const el = {};

    const QUICK = [
      ['👋', 'Ahoj', 'ahoj'], ['😊', 'Jak se máš?', 'jak se máš'], ['🙀', 'Co děláš?', 'co děláš'], ['😂', 'Vtip', 'řekni vtip'],
      ['🎵', 'Zazpívej', 'zazpívej'], ['❤️', 'Mám tě rád', 'mám tě rád'], ['🍰', 'Hlad?', 'máš hlad'], ['🎲', 'Hrajeme', 'pojď si hrát'],
      ['✨', 'Kouzlo', 'čaruj'], ['🐱', 'Mňau', 'mňau'], ['🐶', 'Doozie?', 'jak se má Doozie'], ['👋', 'Pa pa', 'pa pa'],
    ];

    function init() {
      Object.assign(el, {
        root: $('#call'), bg: $('#call-bg'), name: $('#call-name'), status: $('#call-status'),
        stage: $('#call-stage'), char: $('#call-char'), prop: $('#call-prop'), 
        cb: $('#char-bubble'), kb: $('#kid-bubble'), quick: $('#call-quick'), mic: $('#btn-mic'),
        hang: $('#btn-hang'), hint: $('#mic-hint'),
      });
      el.quick.innerHTML = QUICK.map(([e, l], i) => `<button class="qbtn" data-i="${i}"><i>${e}</i>${l}</button>`).join('');
      el.quick.addEventListener('click', (e) => {
        const b = e.target.closest('.qbtn'); if (!b || !S || S.phase !== 'live') return;
        Sound.play('tap');
        const [emo, , text] = QUICK[+b.dataset.i];
        kidSaid(emo + ' ' + text.charAt(0).toUpperCase() + text.slice(1), text);
      });
      el.mic.addEventListener('click', () => {
        if (!S || S.phase !== 'live') return;
        if (Listener.isActive()) { Listener.finishNow(); return; } // domluvil(a) – zpracuj hned
        Voice.stop(); stopTalking();
        S.misses = 0;
        listen(true);
      });
      el.hang.addEventListener('click', () => hangUp());
    }

    function draw() {
      if (!S) return;
      el.char.innerHTML = ART.render(S.c.id, { eyes: S.eyes, mouth: S.mouth });
    }

    function moodFace(mood) {
      switch (mood) {
        case 'laugh': return { eyes: 'laugh', mouth: 'laugh' };
        case 'love': return { eyes: 'love', mouth: 'smile' };
        case 'surprised': return { eyes: 'surprised', mouth: 'o' };
        case 'sleepy': return { eyes: 'sleepy', mouth: 'flat' };
        case 'sad': return { eyes: 'open', mouth: 'sad' };
        default: return { eyes: 'open', mouth: 'smile' };
      }
    }
    function setMood(mood) { Object.assign(S, moodFace(mood), { mood }); draw(); }

    function startTalking() {
      stopTalking();
      el.root.classList.add('talking');
      const eyesTalk = { laugh: 'laugh', love: 'love', sleepy: 'sleepy', surprised: 'surprised' }[S.mood] || 'open';
      S.talkTimer = setInterval(() => {
        S.eyes = S.blinking ? 'blink' : eyesTalk;
        S.mouth = pick(['open', 'mid', 'open', 'smile', 'mid']);
        draw();
      }, 120);
    }
    function stopTalking() {
      if (!S) return;
      clearInterval(S.talkTimer); S.talkTimer = null;
      el.root.classList.remove('talking');
    }

    function blinkLoop() {
      if (!S) return;
      S.blinkTimer = setTimeout(() => {
        if (!S) return;
        if (!S.talkTimer && S.eyes === 'open') {
          S.eyes = 'blink'; draw();
          setTimeout(() => { if (S && S.eyes === 'blink') { S.eyes = 'open'; draw(); } }, 160);
        } else if (S.talkTimer) { S.blinking = true; setTimeout(() => { if (S) S.blinking = false; }, 160); }
        // občas se postavička sama od sebe usměje / zasměje (mění se obrázek)
        if (!S.talkTimer && Math.random() < 0.18) {
          const keep = S.mood;
          setMood(pick(['laugh', 'love', 'surprised']));
          setTimeout(() => { if (S && !S.talkTimer) setMood(keep === 'sad' ? 'happy' : keep || 'happy'); }, 900);
        }
        blinkLoop();
      }, 1800 + Math.random() * 2500);
    }

    function showProp(p) {
      el.prop.textContent = p;
      el.prop.classList.remove('show'); void el.prop.offsetWidth; el.prop.classList.add('show');
    }

    function showBubble(b, text, interim = false) {
      b.textContent = text;
      b.classList.toggle('interim', interim);
      b.classList.add('show');
    }

    function setListening(on) {
      el.mic.classList.toggle('listening', on);
      if (on) { el.mic.classList.remove('hint'); el.hint.textContent = 'Poslouchám… (až domluvíš, klepni na 🎤)'; }
      else if (S && S.phase === 'live') el.hint.textContent = Listener.supported ? '' : 'Vyber, co chceš říct 👆';
    }

    function tick() {
      if (!S || S.phase !== 'live') return;
      const s = Math.floor((Date.now() - S.t0) / 1000);
      el.status.textContent = (S.video ? '🎥 ' : '📞 ') + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    function decorate(c) {
      el.root.style.setProperty('--call-bg', c.bg);
      el.root.classList.toggle('dark', !!c.dark);
      el.bg.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const s = document.createElement('span');
        s.textContent = c.deco[i % c.deco.length];
        s.style.left = (5 + Math.random() * 85) + '%';
        s.style.top = (8 + Math.random() * 75) + '%';
        s.style.animationDelay = (-Math.random() * 6) + 's';
        s.style.fontSize = (24 + Math.random() * 22) + 'px';
        el.bg.appendChild(s);
      }
    }

    async function start({ id, video, answered }) {
      end(true);
      const c = CHAR[id];
      S = { c, video, phase: 'ringing', ctx: Brain.newContext(), eyes: 'open', mouth: 'smile', mood: 'happy', misses: 0, gen: Math.random() };
      const gen = S.gen;
      el.root.classList.toggle('voice', !video);
      el.root.classList.add('ringing');
      el.name.textContent = c.name;
      el.cb.classList.remove('show'); el.kb.classList.remove('show');
      el.hint.textContent = '';
      decorate(c);
      draw();
      blinkLoop();

      if (!answered) {
        el.status.textContent = 'Volám…';
        for (let i = 0; i < 2; i++) {
          Sound.play('ring');
          await sleep(1700);
          if (!S || S.gen !== gen) return;
        }
      }
      S.phase = 'live';
      S.t0 = Date.now();
      S.clock = setInterval(tick, 500); tick();
      el.root.classList.remove('ringing');
      Sound.play('connect');
      await sleep(500);
      if (!S || S.gen !== gen) return;
      say(Brain.greeting(c, S.ctx));
    }

    async function say(r) {
      if (!S || S.phase !== 'live') return;
      const gen = S.gen;
      Listener.stop(); setListening(false);
      S.mood = r.mood || 'happy';
      Object.assign(S, moodFace(S.mood)); draw();
      showBubble(el.cb, r.text);
      if (r.prop) showProp(r.prop);
      if (r.dance) el.stage.classList.add('dance');
      if (r.sfx) { Sound.play(r.sfx); await sleep(r.sfx === 'beat' ? 1200 : r.end ? 350 : 650); }
      if (!S || S.gen !== gen) return;
      if (r.song) {
        el.stage.classList.add('dance');
        if (r.song === 'beat') Sound.play('beat', 4);
        else Sound.song(r.song, { bpm: r.slow ? 90 : 150 });
      }
      startTalking();
      const v = { ...S.c.voice }; if (r.slow) v.rate *= 0.85;
      await Voice.speak(r.text, v);
      if (!S || S.gen !== gen) return;
      stopTalking();
      setMood(S.mood === 'sad' ? 'love' : S.mood);
      setTimeout(() => el.stage.classList.remove('dance'), r.song ? 1500 : 400);
      if (r.after) Sound.play(r.after);
      if (r.end) { await sleep(400); if (S && S.gen === gen) hangUp(); return; }
      await sleep(250);
      if (S && S.gen === gen) autoListen();
    }

    function autoListen() {
      if (!Listener.supported) { setListening(false); return; }
      if (S.misses >= 3) { el.mic.classList.add('hint'); el.hint.textContent = 'Klepni na 🎤 a mluv'; return; }
      listen(false);
    }

    function listen(manual) {
      if (!S) return;
      const gen = S.gen;
      if (!Listener.supported) { el.hint.textContent = 'Tenhle prohlížeč neumí poslouchat. Vyber, co chceš říct 👆'; return; }
      Listener.listen({
        onStart: () => setListening(true),
        onResult: (text, final) => {
          if (!S || S.gen !== gen) return;
          showBubble(el.kb, text, !final);
          if (final) { S.misses = 0; respond(text); }
        },
        onEnd: (had) => {
          if (!S || S.gen !== gen) return;
          setListening(false);
          if (had || S.phase !== 'live') return;
          S.misses++;
          if (S.misses === 1) listen(false);
          else if (S.misses <= 3) say(Brain.nudge(S.c, S.ctx));
          else autoListen();
        },
        onError: (err) => {
          if (!S || S.gen !== gen) return;
          setListening(false);
          S.misses = 9;
          if (err === 'not-allowed' || err === 'service-not-allowed') el.hint.textContent = 'Mikrofon není povolený – vyber, co chceš říct 👆';
          else if (err === 'network') el.hint.textContent = 'Poslouchání potřebuje internet. Vyber, co chceš říct 👆';
          else el.hint.textContent = 'Klepni na 🎤 a mluv';
        },
      });
    }

    function kidSaid(display, text) {
      Listener.stop(); setListening(false); Voice.stop(); stopTalking();
      showBubble(el.kb, display);
      S.misses = 0;
      respond(text);
    }

    async function respond(text) {
      const gen = S.gen;
      const r = Brain.respond(S.c, text, S.ctx);
      // krátké "přemýšlení" – postavička se podiví
      S.eyes = 'open'; S.mouth = 'o'; draw();
      await sleep(350);
      if (S && S.gen === gen) say(r);
    }

    function end(silent) {
      if (!S) return;
      clearInterval(S.clock); clearTimeout(S.blinkTimer); stopTalking();
      Listener.stop(); Voice.stop();
      el.stage.classList.remove('dance');
      el.mic.classList.remove('listening', 'hint');
      S = null;
      if (!silent) Sound.play('hang');
    }

    function hangUp() {
      if (!S) return;
      end(false);
      if (current === 'call') back();
    }

    return { init, start, end };
  })();

  // ======================= ZPRÁVY =========================================
  const Chat = (() => {
    let cur = null, ctxs = {}, typingTimer = null;
    const SEED = {
      gabi: 'Ahoj! 👋 Tady Gábi. Napiš mi něco! 🎀',
      pandy: 'Hihi! Nechceš si hrát? 🐼',
      dj: 'Jou! Mám novou písničku! 🎧',
      krysour: 'Pí pí! Postavil jsem nový stroj! 🔧',
      dorte: 'Upekl jsem dortík! 🧁 Chceš kousek?',
      valecka: 'Ach… dobré ráno… 😴',
      rybocka: 'Blub blub! 🫧 Ahoj z bazénu!',
      autena: 'Tú tú! 🚗 Kam pojedeme?',
      krabicka: 'Ahoj! ✂️ Vyrobila jsem něco krásného! Chceš vědět co?',
    };
    const STICKERS = ['👋', '❤️', '😂', '🎵', '🍰', '😴', '🐱', '🌈', '⭐', '🎁', '😢', '⚽', '🐶'];

    const load = (id) => Store.get('chat_' + id, null);
    const save = (id, m) => Store.set('chat_' + id, m.slice(-80));

    function ensureSeeds() {
      for (const c of CHARACTERS) if (!load(c.id)) save(c.id, [{ from: 'them', text: SEED[c.id], t: Date.now(), unread: true }]);
    }
    function unreadCount(id) { return (load(id) || []).filter(m => m.unread).length; }
    function totalUnread() { return CHARACTERS.reduce((s, c) => s + unreadCount(c.id), 0); }
    function updateBadge() { const n = totalUnread(); $('#badge-msg').textContent = n ? n : ''; }

    function renderList() {
      const list = $('#chat-list');
      list.innerHTML = '';
      for (const c of CHARACTERS) {
        const msgs = load(c.id) || [];
        const last = msgs[msgs.length - 1];
        const n = unreadCount(c.id);
        const row = document.createElement('button');
        row.className = 'row-card';
        row.innerHTML = `<div class="avatar" style="--c:${c.color};background:${c.color}33">${ART.render(c.id, { mouth: 'smile' })}</div>
          <div class="row-name"><b>${c.name}</b><span>${last ? (last.from === 'me' ? 'Ty: ' : '') + escapeHtml(last.text) : ''}</span></div>
          <b class="badge">${n || ''}</b>`;
        row.addEventListener('click', () => { Sound.play('tap'); go('chat', { id: c.id }); });
        list.appendChild(row);
      }
    }

    function escapeHtml(s) { return s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }
    const onlyEmoji = (s) => /^[\p{Extended_Pictographic}‍️\s]+$/u.test(s) && s.trim().length <= 8;

    function msgEl(m) {
      const d = document.createElement('div');
      d.className = 'msg ' + m.from + (onlyEmoji(m.text) ? ' big' : '');
      d.textContent = m.text;
      if (m.from === 'them') d.addEventListener('click', () => speakMsg(d, m.text));
      return d;
    }

    async function speakMsg(d, text) {
      if (!cur) return;
      $$('.msg.speaking').forEach(x => x.classList.remove('speaking'));
      d.classList.add('speaking');
      await Voice.speak(text, CHAR[cur].voice);
      d.classList.remove('speaking');
    }

    function open({ id }) {
      cur = id;
      const c = CHAR[id];
      ctxs[id] = ctxs[id] || Brain.newContext();
      $('#chat-name').textContent = c.name;
      $('#chat-avatar').innerHTML = ART.render(id, { mouth: 'smile' });
      $('#chat-avatar').style.setProperty('--c', c.color);
      const box = $('#msgs');
      box.innerHTML = '';
      const msgs = load(id) || [];
      msgs.forEach(m => box.appendChild(msgEl(m)));
      const unread = msgs.filter(m => m.unread);
      msgs.forEach(m => delete m.unread);
      save(id, msgs);
      updateBadge();
      box.scrollTop = box.scrollHeight;
      if (unread.length && opts.readMsg) {
        const els = $$('.msg.them', box);
        setTimeout(() => speakMsg(els[els.length - 1], unread[unread.length - 1].text), 400);
      }
    }

    function add(id, m) {
      const msgs = load(id) || [];
      msgs.push(m); save(id, msgs);
      if (cur === id && current === 'chat') {
        const box = $('#msgs');
        const d = msgEl(m);
        box.appendChild(d);
        box.scrollTop = box.scrollHeight;
        return d;
      }
      return null;
    }

    function send(text) {
      text = text.trim();
      if (!text || !cur) return;
      const id = cur;
      Sound.play('send');
      add(id, { from: 'me', text, t: Date.now() });
      const r = Brain.respond(CHAR[id], text, ctxs[id]);
      let reply = r.text;
      if (r.prop && !reply.includes(r.prop)) reply += ' ' + r.prop;
      if (r.song) reply = '🎵 ' + reply + ' 🎶';
      clearTimeout(typingTimer);
      setTimeout(() => {
        if (cur !== id) return;
        const box = $('#msgs');
        $$('.typing', box).forEach(t => t.remove());
        const t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>';
        box.appendChild(t); box.scrollTop = box.scrollHeight;
      }, 400);
      typingTimer = setTimeout(() => {
        $$('#msgs .typing').forEach(t => t.remove());
        const here = cur === id && current === 'chat';
        const d = add(id, { from: 'them', text: reply, t: Date.now(), unread: !here });
        updateBadge();
        Sound.play('receive');
        if (here) {
          if (r.sfx) setTimeout(() => Sound.play(r.sfx), 300);
          if (r.song) r.song === 'beat' ? Sound.play('beat', 2) : Sound.song(r.song, { bpm: 150 });
          if (opts.readMsg && d) setTimeout(() => speakMsg(d, reply), r.sfx ? 900 : 300);
        }
      }, 1200 + Math.min(reply.length * 15, 1500));
    }

    function init() {
      ensureSeeds();
      updateBadge();
      $('#stickers').innerHTML = STICKERS.map(s => `<button type="button">${s}</button>`).join('');
      $('#stickers').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) send(b.textContent); });
      $('#composer').addEventListener('submit', (e) => {
        e.preventDefault();
        const inp = $('#chat-input');
        send(inp.value); inp.value = '';
      });
      $('#chat-mic').addEventListener('click', () => {
        const btn = $('#chat-mic');
        if (Listener.isActive()) { Listener.stop(); btn.classList.remove('listening'); return; }
        if (!Listener.supported) { alert('Tenhle prohlížeč neumí diktování. Zkus Chrome.'); return; }
        Voice.stop();
        Listener.listen({
          onStart: () => btn.classList.add('listening'),
          onResult: (text, final) => { $('#chat-input').value = text; if (final) { send(text); $('#chat-input').value = ''; } },
          onEnd: () => btn.classList.remove('listening'),
          onError: () => btn.classList.remove('listening'),
        });
      });
      $('#chat-call').addEventListener('click', () => go('call', { id: cur, video: false }));
      $('#chat-video').addEventListener('click', () => go('call', { id: cur, video: true }));
    }

    function leave() { Listener.stop(); Voice.stop(); $('#chat-mic').classList.remove('listening'); }

    return { init, renderList, open, leave, updateBadge };
  })();

  // ---------------- Profil dítěte ----------------
  const Profile = (() => {
    const AVATARS = ['🐱', '🐶', '🐰', '🦊', '🐼', '🦄', '🐸', '🐵', '🐯', '🐨'];
    let draftAvatar = null;

    function cleanName(s) {
      const t = (s || '').replace(/[^\p{L}\s-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);
      return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
    }
    function avatar() { return Store.get('kidAvatar') || AVATARS[0]; }

    function renderChip() {
      const nm = Store.get('kidName');
      $('#pc-avatar').textContent = avatar();
      $('#pc-text').textContent = nm ? `Ahoj, ${nm}!` : 'Jak se jmenuješ?';
    }
    function renderPreview() {
      $('#pf-avatar').textContent = draftAvatar;
      $('#pf-preview-name').textContent = cleanName($('#pf-name').value);
      $$('#pf-avatars button').forEach(b => b.classList.toggle('sel', b.textContent === draftAvatar));
    }

    function open() {
      draftAvatar = avatar();
      $('#pf-name').value = Store.get('kidName') || '';
      renderPreview();
      $('#profile').classList.add('on');
    }
    function close() {
      Listener.stop(); $('#pf-mic').classList.remove('listening');
      $('#pf-name').blur();
      $('#profile').classList.remove('on');
    }
    function save() {
      const old = Store.get('kidName');
      const nm = cleanName($('#pf-name').value);
      Store.set('kidAvatar', draftAvatar);
      Store.set('kidName', nm || null);
      Store.set('kidNameFromProfile', !!nm);
      renderChip();
      close();
      Sound.play('magic');
      if (nm && nm !== old) homeSay('gabi', `Ahoj, ${nm}! To je ale krásné jméno! Budu si ho pamatovat.`);
    }

    function init() {
      $('#pf-avatars').innerHTML = AVATARS.map(a => `<button type="button">${a}</button>`).join('');
      $('#pf-avatars').addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        Sound.play('tap'); draftAvatar = b.textContent; renderPreview();
      });
      $('#pf-name').addEventListener('input', renderPreview);
      $('#pf-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } });
      $('#pf-mic').addEventListener('click', () => {
        const btn = $('#pf-mic');
        if (Listener.isActive()) { Listener.stop(); btn.classList.remove('listening'); return; }
        if (!Listener.supported) { alert('Tenhle prohlížeč neumí poslouchat. Napiš jméno, nebo zkus Chrome.'); return; }
        Voice.stop();
        Listener.listen({
          silenceMs: 1200,
          onStart: () => btn.classList.add('listening'),
          onResult: (text, final) => {
            const nm = final ? (Brain.extractName(text) || cleanName(text)) : cleanName(text);
            $('#pf-name').value = nm; renderPreview();
          },
          onEnd: () => btn.classList.remove('listening'),
          onError: () => btn.classList.remove('listening'),
        });
      });
      $('#profile-chip').addEventListener('click', () => { Sound.play('tap'); open(); });
      $('#pf-save').addEventListener('click', save);
      $('#pf-cancel').addEventListener('click', close);
      $('#profile').addEventListener('click', (e) => { if (e.target.id === 'profile') close(); });
      renderChip();
    }

    return { init, renderChip };
  })();

  // ---------------- Pro rodiče ----------------
  function showInfo() {
    const secure = window.isSecureContext;
    const items = [
      `${Listener.supported ? '✅' : '❌'} Rozpoznávání řeči ${Listener.supported ? 'je k dispozici' : 'není k dispozici (použijte Chrome)'}.`,
      `${secure ? '✅' : '⚠️'} ${secure ? 'Stránka běží přes HTTPS – mikrofon může fungovat.' : 'Stránka neběží přes HTTPS – mikrofon nebude fungovat. Nahrajte hru na web s https.'}`,
      `${Voice.hasCzech() ? `✅ Počet českých hlasů v telefonu: ${Voice.czechCount()}. Každá postavička má jinou výšku a rychlost hlasu${Voice.czechCount() > 1 ? ' a postavičky se střídají mezi hlasy' : ''}.` : '⚠️ Nenašel jsem český hlas. V Androidu: Nastavení → Systém → Jazyky → Převod textu na řeč → Google → nainstalovat Čeština.'}`,
      'Vyzkoušet hlasy: ' + CHARACTERS.map(c => `<button class="voice-try" data-v="${c.id}">▶ ${c.name}</button>`).join(' '),
      'Postavičky odpovídají podle klíčových slov (ahoj, vtip, zazpívej, mám tě rád, co děláš, hlad, pa pa…). Nic se neposílá na žádný server kromě rozpoznávání řeči v Chromu.',
      Store.get('kidName') ? `Postavičky si pamatují jméno: <b>${Store.get('kidName')}</b>` : 'Postavičky se během hovoru zeptají na jméno dítěte.',
    ];
    $('#info-list').innerHTML = items.map(i => `<li>${i}</li>`).join('');
    $('#opt-incoming').checked = opts.incoming;
    $('#opt-readmsg').checked = opts.readMsg;
    $('#info').classList.add('on');
    document.querySelectorAll('.voice-try').forEach(b => b.addEventListener('click', () => {
      const c = CHAR[b.dataset.v];
      Voice.speak(`Ahoj! Já jsem ${c.name}!`, c.voice);
    }));
  }

  // ---------------- Vstupy do obrazovek ----------------
  const enterHooks = {
    home: () => { scheduleIncoming(); Chat.updateBadge(); Profile.renderChip(); },
    contacts: () => renderContacts(),
    call: (p) => Call.start(p),
    chats: () => Chat.renderList(),
    chat: (p) => Chat.open(p),
    games: () => { },
    pexeso: () => Pexeso.showSetup(),
    incoming: () => { },
  };
  leaveHooks.call = () => Call.end(true);
  leaveHooks.chat = () => Chat.leave();
  leaveHooks.incoming = () => stopIncomingRing();
  leaveHooks.pexeso = () => Voice.stop();

  // ---------------- Start ----------------
  function init() {
    paintArt();
    clock(); setInterval(clock, 10000);
    Call.init(); Chat.init(); Pexeso.init(); Profile.init();

    $('#btn-start').addEventListener('click', async () => {
      Sound.unlock();
      try {
        const de = document.documentElement;
        if (de.requestFullscreen && !document.fullscreenElement) await de.requestFullscreen({ navigationUI: 'hide' });
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => { });
      } catch (e) { }
      Sound.play('magic');
      history.replaceState({ id: 'home' }, '');
      show('home');
      setTimeout(() => homeSay('gabi'), 500);
    });

    document.addEventListener('click', (e) => {
      const g = e.target.closest('[data-go]');
      if (g) { Sound.play('tap'); go(g.dataset.go); return; }
      if (e.target.closest('[data-back]')) { Sound.play('tap'); back(); return; }
      const s = e.target.closest('[data-say]');
      if (s) homeSay(s.dataset.say);
    });

    $('#btn-accept').addEventListener('click', () => {
      if (!incomingId) return;
      stopIncomingRing();
      const params = { id: incomingId, video: true, answered: true };
      history.replaceState({ id: 'call', params }, '');
      show('call', params);
    });
    $('#btn-decline').addEventListener('click', () => { stopIncomingRing(); Sound.play('hang'); back(); });

    $('#btn-info').addEventListener('click', showInfo);
    $('#btn-info-close').addEventListener('click', () => $('#info').classList.remove('on'));
    $('#opt-incoming').addEventListener('change', (e) => { Store.set('optIncoming', e.target.checked); scheduleIncoming(); });
    $('#opt-readmsg').addEventListener('change', (e) => Store.set('optReadMsg', e.target.checked));
    $('#btn-forget').addEventListener('click', () => { Store.set('kidName', null); Store.set('kidNameFromProfile', false); Profile.renderChip(); showInfo(); });

    // když se telefon zamkne nebo přepne aplikace, ukončíme hovor
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && current === 'call') { Call.end(true); back(); }
    });

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => { });
    }
  }

  return { init, go, back, confetti, incoming };
})();

App.init();

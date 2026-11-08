// Zvukové efekty (syntetizované přes WebAudio), čtení nahlas (speechSynthesis)
// a poslouchání (SpeechRecognition).

const Sound = (() => {
  let ctx = null;
  const ac = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  function tone({ f = 440, f2 = null, type = 'sine', t = 0, d = 0.2, v = 0.18, a = 0.01, filter = null }) {
    const c = ac(); if (!c) return;
    const now = c.currentTime + t;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, now);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + d);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(v, now + a);
    g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    let node = o;
    if (filter) {
      const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filter;
      o.connect(fl); node = fl;
    }
    node.connect(g); g.connect(c.destination);
    o.start(now); o.stop(now + d + 0.05);
  }

  function noise({ t = 0, d = 0.3, v = 0.15, freq = 800, type = 'lowpass' }) {
    const c = ac(); if (!c) return;
    const now = c.currentTime + t;
    const len = Math.floor(c.sampleRate * d);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(v, now); g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    src.connect(fl); fl.connect(g); g.connect(c.destination);
    src.start(now);
  }

  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz

  function melody(notes, { bpm = 140, type = 'triangle', v = 0.15 } = {}) {
    // notes: [[midi|null, beats], ...]
    const beat = 60 / bpm; let t = 0;
    for (const [n, b] of notes) {
      if (n) tone({ f: N(n), type, t, d: b * beat * 0.95, v });
      t += b * beat;
    }
    return t * 1000;
  }

  const fx = {
    tap() { tone({ f: 660, f2: 880, type: 'sine', d: 0.08, v: 0.12 }); },
    pop() { tone({ f: 400, f2: 1200, type: 'sine', d: 0.12, v: 0.2 }); },
    flip() { tone({ f: 500, f2: 750, type: 'triangle', d: 0.1, v: 0.12 }); },
    match() { [72, 76, 79, 84].forEach((n, i) => tone({ f: N(n), type: 'triangle', t: i * 0.08, d: 0.25, v: 0.15 })); },
    miss() { tone({ f: 330, f2: 220, type: 'triangle', d: 0.25, v: 0.12 }); },
    win() { melody([[72, .5], [76, .5], [79, .5], [84, 1], [79, .5], [84, 2]], { bpm: 200 }); },
    send() { tone({ f: 500, f2: 1400, type: 'sine', d: 0.15, v: 0.12 }); },
    receive() { tone({ f: N(84), type: 'sine', d: 0.15, v: 0.15 }); tone({ f: N(91), type: 'sine', t: 0.1, d: 0.3, v: 0.15 }); },
    ring() { // jedno zazvonění telefonu
      for (let i = 0; i < 2; i++) {
        tone({ f: N(79), type: 'sine', t: i * 0.45, d: 0.35, v: 0.16 });
        tone({ f: N(83), type: 'sine', t: i * 0.45 + 0.18, d: 0.25, v: 0.12 });
      }
    },
    dial() { tone({ f: 425, type: 'sine', d: 1.0, v: 0.08 }); },
    connect() { tone({ f: N(76), type: 'sine', d: 0.12, v: 0.15 }); tone({ f: N(83), type: 'sine', t: 0.12, d: 0.2, v: 0.15 }); },
    hang() { tone({ f: N(76), type: 'sine', d: 0.15, v: 0.15 }); tone({ f: N(69), type: 'sine', t: 0.15, d: 0.3, v: 0.15 }); },
    meow() {
      tone({ f: 500, f2: 900, type: 'sawtooth', d: 0.25, v: 0.12, filter: 1800 });
      tone({ f: 900, f2: 450, type: 'sawtooth', t: 0.22, d: 0.35, v: 0.12, filter: 1500 });
    },
    purr() { for (let i = 0; i < 8; i++) noise({ t: i * 0.11, d: 0.09, v: 0.12, freq: 200 }); },
    magic() { [84, 88, 91, 96, 100, 103].forEach((n, i) => tone({ f: N(n), type: 'sine', t: i * 0.06, d: 0.4, v: 0.08 })); },
    giggle() { [0, 1, 2, 3, 4].forEach(i => tone({ f: 700 + i * 60, f2: 900 + i * 60, type: 'triangle', t: i * 0.11, d: 0.09, v: 0.12 })); },
    woof() { [0, 0.28].forEach(t => { tone({ f: 420, f2: 260, type: 'sawtooth', t, d: 0.16, v: 0.13, filter: 1200 }); noise({ t, d: 0.08, v: 0.08, freq: 900 }); }); },
    sneak() { [0, 0.18, 0.36].forEach((t, i) => tone({ f: N(55 + i * 3), type: 'triangle', t, d: 0.14, v: 0.14 })); tone({ f: 700, f2: 1100, type: 'sine', t: 0.6, d: 0.25, v: 0.1 }); },
    squeak() { tone({ f: 1800, f2: 2600, type: 'sine', d: 0.12, v: 0.12 }); tone({ f: 2000, f2: 2800, type: 'sine', t: 0.16, d: 0.12, v: 0.12 }); },
    honk() { [0, 0.3].forEach(t => { tone({ f: 392, type: 'square', t, d: 0.22, v: 0.07, filter: 1500 }); tone({ f: 494, type: 'square', t, d: 0.22, v: 0.07, filter: 1500 }); }); },
    bubbles() { for (let i = 0; i < 7; i++) { const f = 300 + Math.random() * 500; tone({ f, f2: f * 2.5, type: 'sine', t: i * 0.09 + Math.random() * 0.04, d: 0.08, v: 0.12 }); } },
    boing() { tone({ f: 220, f2: 330, type: 'sine', d: 0.12, v: 0.14 }); tone({ f: 330, f2: 200, type: 'sine', t: 0.12, d: 0.18, v: 0.12 }); },
    plop() { tone({ f: 900, f2: 300, type: 'sine', d: 0.09, v: 0.16 }); },
    splash() { noise({ d: 0.35, v: 0.18, freq: 1200 }); tone({ f: 300, f2: 900, type: 'sine', t: 0.05, d: 0.1, v: 0.08 }); },
    stir() { noise({ d: 0.15, v: 0.06, freq: 600, type: 'bandpass' }); },
    tick() { tone({ f: 1500, type: 'square', d: 0.03, v: 0.05, filter: 3000 }); },
    ding() { tone({ f: 1760, type: 'triangle', d: 1.2, v: 0.15 }); tone({ f: 2637, type: 'sine', d: 0.8, v: 0.05 }); },
    yawn() { tone({ f: 300, f2: 500, type: 'sawtooth', d: 0.5, v: 0.08, filter: 900 }); tone({ f: 500, f2: 220, type: 'sawtooth', t: 0.5, d: 0.7, v: 0.08, filter: 700 }); },
    snore() { noise({ d: 0.8, v: 0.18, freq: 300 }); tone({ f: 1200, f2: 1600, type: 'sine', t: 0.9, d: 0.3, v: 0.05 }); },
    scratch() { noise({ d: 0.12, v: 0.25, freq: 2500, type: 'bandpass' }); noise({ t: 0.15, d: 0.12, v: 0.25, freq: 1500, type: 'bandpass' }); },
    beat(bars = 2) {
      const b = 60 / 120 / 2;
      for (let i = 0; i < 8 * bars; i++) {
        if (i % 4 === 0) tone({ f: 150, f2: 40, type: 'sine', t: i * b, d: 0.25, v: 0.4 });
        if (i % 4 === 2) noise({ t: i * b, d: 0.12, v: 0.2, freq: 3000, type: 'bandpass' });
        noise({ t: i * b, d: 0.04, v: 0.06, freq: 8000, type: 'highpass' });
      }
      return 8 * bars * b * 1000;
    },
  };

  // Krátké veselé melodie k písničkám (vlastní, jednoduché)
  const songs = {
    a: [[67, 1], [69, 1], [71, 1], [67, 1], [71, 1], [72, 1], [74, 2], [74, 1], [72, 1], [71, 1], [69, 1], [67, 3], [null, 1]],
    b: [[60, .5], [64, .5], [67, .5], [72, 1], [71, .5], [69, .5], [67, 1], [65, .5], [64, .5], [62, .5], [60, 2]],
    c: [[72, 1], [72, .5], [74, .5], [76, 1], [72, 1], [79, 1.5], [77, .5], [76, 1], [74, 1], [72, 2]],
  };
  function song(name, opts) { return melody(songs[name] || songs.a, opts); }

  function play(name, ...args) { try { return fx[name] ? fx[name](...args) || 0 : 0; } catch (e) { return 0; } }

  return { play, song, unlock: ac, has: (n) => !!fx[n] };
})();

const Voice = (() => {
  const synth = window.speechSynthesis;
  let voices = []; // všechny české hlasy v telefonu
  let current = null; // držíme referenci, aby Android nezahodil callbacky

  function pick() {
    if (!synth) return;
    const cs = synth.getVoices().filter(v => /^cs([-_]|$)/i.test(v.lang));
    // Google hlasy dopředu, lokální (offline) před síťovými
    cs.sort((a, b) => (/google/i.test(b.name) - /google/i.test(a.name)) || (b.localService - a.localService));
    voices = cs;
  }
  if (synth) { pick(); synth.onvoiceschanged = pick; }

  const clean = (t) => t
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/([aeiouyáéíóúůýě])\1+/giu, '$1')
    .replace(/(\p{L})\1{2,}/gu, '$1')
    .replace(/(?<!\p{L})jé(?!\p{L})/giu, 'jej')
    .replace(/(?<!\p{L})hm+(?!\p{L})/giu, 'hm')
    .replace(/\s+/g, ' ').trim();

  function speak(text, { pitch = 1, rate = 1, v = 0 } = {}, onBoundary) {
    return new Promise((resolve) => {
      const t = clean(text);
      if (!synth || !t) { resolve(); return; }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'cs-CZ';
      if (voices.length) u.voice = voices[v % voices.length];
      u.pitch = pitch; u.rate = rate;
      let done = false;
      const fin = () => { if (done) return; done = true; clearTimeout(timer); resolve(); };
      // pojistka – na některých telefonech onend nepřijde
      const timer = setTimeout(fin, 1500 + t.length * 80 / rate);
      u.onend = fin; u.onerror = fin;
      if (onBoundary) u.onboundary = onBoundary;
      current = u;
      // malá prodleva po cancel() – jinak Chrome občas promluvu zahodí
      setTimeout(() => synth.speak(u), 60);
    });
  }

  function stop() { if (synth) synth.cancel(); current = null; }

  return { speak, stop, hasCzech: () => voices.length > 0, czechCount: () => voices.length, supported: !!synth };
})();

const Listener = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let session = null; // aktuální poslouchání { rec, finish, cancel }

  // Poslouchá, dokud dítě nepřestane mluvit (ticho silenceMs). Když Chrome rozpoznávání
  // ukončí sám (dítě se nadechne), spustí se znovu a text se skládá dohromady.
  function listen({ onStart, onResult, onEnd, onError, silenceMs = 1800, maxMs = 25000 } = {}) {
    if (!SR) { onError && onError('unsupported'); return; }
    stop();
    const parts = [];
    let cur = '', lastHeard = 0, finished = false, started = false, rec = null, silenceTimer = null;
    const full = () => [...parts, cur].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

    const kill = () => {
      if (rec) { rec.onend = rec.onresult = rec.onerror = rec.onstart = null; try { rec.abort(); } catch (e) { } }
      rec = null;
    };
    const done = (text, err) => {
      if (finished) return;
      finished = true;
      clearTimeout(silenceTimer); clearTimeout(maxTimer);
      kill();
      if (session && session.id === me.id) session = null;
      if (err) { onError && onError(err); return; }
      if (text) onResult && onResult(text, true);
      onEnd && onEnd(!!text);
    };
    const finish = () => done(full());
    const arm = () => { clearTimeout(silenceTimer); silenceTimer = setTimeout(finish, silenceMs); };

    function start() {
      rec = new SR();
      rec.lang = 'cs-CZ';
      rec.interimResults = true;
      rec.continuous = true;
      rec.maxAlternatives = 1;
      rec.onstart = () => { if (!started) { started = true; onStart && onStart(); } };
      rec.onresult = (e) => {
        // Android občas posílá stejný text opakovaně ("ahoj", "ahoj jak", "ahoj jak se máš") – sloučíme
        const segs = [];
        for (let i = 0; i < e.results.length; i++) {
          const t = e.results[i][0].transcript.trim();
          if (!t) continue;
          const prev = segs[segs.length - 1];
          if (prev && t.toLowerCase().startsWith(prev.toLowerCase())) segs[segs.length - 1] = t;
          else if (!(prev && prev.toLowerCase().startsWith(t.toLowerCase()))) segs.push(t);
        }
        cur = segs.join(' ');
        lastHeard = Date.now();
        onResult && onResult(full(), false);
        arm();
      };
      rec.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        if (!full()) done('', e.error);
      };
      rec.onend = () => {
        if (finished) return;
        if (cur) { parts.push(cur); cur = ''; }
        if (!full()) { done(''); return; }               // nic neřeklo
        if (Date.now() - lastHeard < silenceMs) {           // jen krátká pauza – posloucháme dál
          try { start(); } catch (err) { finish(); }
        } else finish();
      };
      try { rec.start(); } catch (err) { done('', 'start'); }
    }

    const maxTimer = setTimeout(finish, maxMs);
    const me = { id: Math.random(), finish, cancel: () => { finished = true; clearTimeout(silenceTimer); clearTimeout(maxTimer); kill(); } };
    session = me;
    start();
  }

  // ukončit hned a zpracovat, co už zaznělo
  function finishNow() { if (session) session.finish(); }
  // zrušit bez výsledku
  function stop() { if (session) { session.cancel(); session = null; } }

  return { listen, stop, finishNow, supported: !!SR, isActive: () => !!session };
})();

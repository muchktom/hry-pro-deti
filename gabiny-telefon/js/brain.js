// "Mozek" postav: z toho, co dítě řekne nebo napíše, vybere odpověď.
// Odpověď: { text, sfx, mood, prop, dance, song, end }

const Store = {
  get(k, d = null) { try { const v = localStorage.getItem('gkt_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('gkt_' + k, JSON.stringify(v)); } catch (e) { } },
};

const Brain = (() => {
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // Klíčová slova: "slovo" = začátek slova, "=slovo" = přesné slovo, "víc slov" = fráze
  function hit(n, tokens, list) {
    for (const k of list) {
      if (k.includes(' ')) { if ((' ' + n + ' ').includes(' ' + k)) return true; }
      else if (k[0] === '=') { if (tokens.includes(k.slice(1))) return true; }
      else if (tokens.some(t => t.startsWith(k))) return true;
    }
    return false;
  }

  const I = {
    bye: ['pa pa', '=pa', '=papa', 'nashledan', 'na shledanou', '=nashle', 'musim jit', 'uz musim', 'dobrou noc', 'sbohem', 'konci', 'zavesim'],
    love: ['mam te rad', 'mam te rada', 'mas me rad', 'mas me rada', 'miluj', 'pusin', '=pusu', '=pusa', 'mam vas rad'],
    joke: ['vtip', 'zasmej', 'legrac', 'smesn', 'srand'],
    more: ['=jeste', 'dalsi', '=znovu', 'jeste jeden', 'jeste jednou', 'jeste neco', '=dalsi'],
    song: ['zazpiv', 'zpiv', 'pisn', 'pisnick', 'zatancuj', 'tancuj', 'tanc', 'hudb', 'muzik'],
    how: ['jak se mas', 'jak se dari', 'jak je ti', 'jak to jde', 'jak se vede', 'jak se mate'],
    name: ['jak se jmenujes', 'kdo jsi', 'kdo je tam', 'kdo to je', 'jak ti rikaj', 'kdo ty jsi'],
    myname: ['jmenuju se', 'jmenuji se', 'rikaji mi', 'rikaj mi'],
    doing: ['co delas', 'co ted delas', 'co delate', 'co tam delas'],
    where: ['kde jsi', 'kde bydlis', 'kde jste'],
    food: ['hlad', 'jidl', '=jist', 'snist', 'mnam', 'svacin', 'obed', 'vecere', 'sladk', 'bonbon', 'zmrzl', '=papat', 'papu', 'snidan'],
    play: ['hrat', '=hraj', 'hrajem', '=hra', '=hru', 'schovav', 'honick', 'pojd si'],
    sleep: ['spat', 'spink', 'unaven', 'ospal', 'zivat', 'chrr', 'usinam'],
    sad: ['smutn', 'plac', 'boli', 'strach', 'bojim', '=au', 'brec'],
    thanks: ['dekuj', '=diky', '=dik', 'dekuji'],
    count: ['pocitej', 'pocitat', 'spocit', 'cisla'],
    meow: ['mnau', 'mnoau', 'miau', 'mrnau', 'kocic', 'kocka', 'kocku', 'kocko', 'mnauky'],
    woof: ['haf', 'pejsek', 'pes '],
    magic: ['kouzl', 'kouzel', 'carov', 'caruj', 'carod', 'magi', 'abrakadabra', '=cary'],
    color: ['barv'],
    greet: ['ahoj', '=cau', 'cauky', 'nazdar', 'dobry den', '=halo', '=cus', 'zdravim', '=hello', '=hi'],
    yes: ['=ano', '=jo', '=jasne', '=jojo', '=urcite', '=chci', '=jasny', '=dobre', '=ok', '=jasan', '=ja', '=jooo', '=no'],
    no: ['=ne', '=nechci', '=nee', '=neee', '=nene', '=nikdy'],
  };

  const EMOJI = [
    [/❤|💖|💕|😘|😍|🥰|💗/u, 'love'], [/😂|🤣|😆|😄|😁/u, 'joke'], [/👋/u, 'greet'], [/🎵|🎶|💃|🕺|🎤/u, 'song'],
    [/🍰|🎂|🧁|🍕|🍎|🍪|🍦|🍓/u, 'food'], [/😴|💤|🌙|🛏/u, 'sleep'], [/🐱|😺|😸|🐈/u, 'meow'], [/😢|😭|😞/u, 'sad'],
    [/⭐|🌈|✨|🪄/u, 'magic'], [/🎁/u, 'gift'], [/⚽|🎲|🧸/u, 'play'], [/🐶|🐕/u, 'woof'],
  ];

  const JOKES = [
    'Víš, proč má žirafa tak dlouhý krk? Protože jí smrdí nohy!',
    'Co je to? Je to zelené a skáče to po louce. Přece okurka na trampolíně!',
    'Víš, proč slon nejezdí na kole? Protože nemá palec na zvonek!',
    'Co řekla nula osmičce? Ty máš ale pěkný pásek!',
    'Jak se jmenuje kočka, co umí plavat? Kočka v plavkách!',
    'Víš, proč ryby nemluví? Protože mají pusu plnou vody!',
    'Jaké zvířátko je nejsilnější? Šnek! Unese na zádech celý domeček!',
    'Co je žluté a neumí plavat? Bagr!',
    'Jak se jmenuje medvěd, který nemá zoubky? Gumový medvídek!',
    'Co říká semafor autům? Nekoukejte, já se převlékám!',
    'Víš, proč čarodějnice létá na koštěti? Protože vysavač má moc krátkou šňůru!',
    'Jak poznáš, že byl v ledničce slon? Podle stop v másle!',
    'Kdo umí skočit výš než dům? Úplně každý! Dům přece skákat neumí!',
    'Proč kostra nechodí tancovat? Protože na to nemá tělo!',
    'Proč šel banán k doktorovi? Protože se mu špatně loupalo!',
    'Jak se jmenuje pejsek, který umí kouzlit? Labrakadabrador!',
    'Co dělá myška, když jde k počítači? Kliká si ocáskem!',
    'Co má čtyři nohy a neumí chodit? Přece stůl!',
    'Víš, co řekl polštář peřině? Ty mě vždycky tak hezky přikryješ!',
    'Proč nosí kocour do školy žebřík? Protože chce jít na vysokou školu!',
  ];
  const LAUGH = ['Hihihi!', 'Chachacha!', 'Hihi, ten je dobrý!', 'Mňau, ten se mi líbí!'];

  // vybere vtip, který ještě nezazněl (pamatuje si to i mezi hovory)
  function freshJoke() {
    let used = Store.get('jokesUsed', []);
    let free = JOKES.map((_, i) => i).filter(i => !used.includes(i));
    if (!free.length) { used = []; free = JOKES.map((_, i) => i); }
    const i = pick(free);
    used.push(i);
    Store.set('jokesUsed', used);
    return JOKES[i];
  }

  const COLORS = {
    cerven: 'Červená', modr: 'Modrá', zelen: 'Zelená', zlut: 'Žlutá', ruzov: 'Růžová', fialov: 'Fialová',
    oranz: 'Oranžová', bil: 'Bílá', cern: 'Černá', hned: 'Hnědá', duh: 'Duhová', zlat: 'Zlatá', stribr: 'Stříbrná', tyrkys: 'Tyrkysová',
  };

  const QUESTIONS = [
    { type: 'color', q: 'Jakou barvu máš nejradši?' },
    { type: 'food', q: 'A co ty nejradši papáš?' },
    { type: 'animal', q: 'Jaké zvířátko máš nejradši?' },
    { type: 'toy', q: 'S jakou hračkou si nejradši hraješ?' },
    { type: 'day', q: 'Co dneska děláš?' },
    { type: 'joke?', q: 'Chceš slyšet vtip?' },
    { type: 'song?', q: 'Mám ti zazpívat písničku?' },
    { type: 'meow', q: 'Umíš udělat mňau jako kočička?' },
  ];

  const ECHO = {
    food: ['Mňam, {x}! To zní dobře!', '{x}? To bych taky ochutnal!'],
    animal: ['{x}! To je úžasné zvířátko!', 'Páni, {x}! To mám taky moc rád!'],
    toy: ['{x}? To musí být super hračka!', 'Páni, {x}! S tím bych si taky hrál!'],
    day: ['To zní jako skvělý den!', 'Páni, to je ale den!', 'To je bezva!'],
    any: ['Říkáš {x}? To je zajímavé!', '{x}? Páni, to se mi líbí!'],
  };

  function fem(c, s) { // jednoduché přechýlení: "rád" -> "ráda" pro holčičí postavy
    if (!c.fem) return s;
    return s.replace(/\bbych taky ochutnal\b/g, 'bych taky ochutnala').replace(/\bmám taky moc rád\b/g, 'mám taky moc ráda')
      .replace(/\bbych si taky hrál\b/g, 'bych si taky hrála');
  }

  function fill(c, s) {
    const jm = Store.get('kidName');
    return fem(c, s.replace(/\{jm\}/g, jm ? ', ' + jm : ''));
  }

  function ask(c, ctx) {
    let pool = QUESTIONS.filter(q => !ctx.asked.includes(q.type));
    if (!Store.get('kidName') && !ctx.asked.includes('name')) pool = [{ type: 'name', q: 'A jak se jmenuješ ty?' }];
    if (!pool.length) { ctx.asked = []; pool = QUESTIONS; }
    const q = pick(pool);
    ctx.asked.push(q.type);
    ctx.pending = q.type;
    return q.q;
  }

  const R = (text, o = {}) => ({ text, ...o });

  function newContext() { return { pending: null, asked: [], turns: 0, silence: 0 }; }

  function greeting(c, ctx) {
    let t = fill(c, pick(c.hello));
    if (ctx && Math.random() < 0.6) t += ' ' + ask(c, ctx);
    return R(t, { sfx: c.sfx, mood: 'happy' });
  }

  function song(c) {
    return R(c.song.text, { song: c.song.tune, mood: 'laugh', dance: true, prop: '🎵', slow: !!c.song.slow });
  }

  function joke(c, count = 1, ctx = null) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      if (i > 0) parts.push(pick(['A ještě jeden!', 'A teď další!', 'Mám ještě jeden!']));
      parts.push(freshJoke() + ' ' + pick(LAUGH));
    }
    const r = R(parts.join(' '), { mood: 'laugh', after: 'giggle', isJoke: true });
    if (ctx && Math.random() < 0.6) { r.text += ' Chceš slyšet ještě jeden?'; r.setPending = 'joke?'; }
    return r;
  }

  // kolik vtipů dítě chce ("dva vtipy", "tři vtipy")
  function jokeCount(tokens) {
    const nums = { dva: 2, dve: 2, '2': 2, tri: 3, '3': 3, ctyri: 3, pet: 3, hodne: 3, vic: 2, vice: 2 };
    for (const t of tokens) if (nums[t]) return nums[t];
    return 1;
  }

  const NAME_STOP = ['se', 'jmenuju', 'jmenuji', 'ja', 'jsem', 'mi', 'rikaji', 'rikaj', 'no', 'tak', 'ahoj', 'je', 'to', 'ano', 'jo',
    'ne', 'nevim', 'cau', 'hm', 'moje', 'jmeno', 'nic', 'proc', 'co', 'kdo', 'jak', 'nechci', 'neco', 'taky', 'ty', 'ti', 'te', 'si',
    'mama', 'maminka', 'tata', 'tatinek', 'gabi', 'pandy', 'jo', 'jasne', 'dobre', 'super', 'vtip', 'pa', 'papa', 'ted', 'uz', 'a', 'i'];
  // vypadá slovo jako jméno? (ne jako sloveso typu "dělat", "hrát", "spinkat")
  function looksLikeName(w) {
    const n = norm(w);
    if (n.length < 2 || n.length > 14 || NAME_STOP.includes(n)) return false;
    if (n.length > 3 && /(at|et|it|ut|yt|ct|ti)$/.test(n)) return false;
    return !Object.values(I).some(list => hit(n, [n], list.filter(k => !k.includes(' '))));
  }

  function extractName(raw) {
    const n = norm(raw).split(' ');
    const orig = raw.replace(/[^\p{L} ]/gu, ' ').split(/\s+/).filter(Boolean);
    for (let i = n.length - 1; i >= 0; i--) {
      if (NAME_STOP.includes(n[i])) continue;
      const w = orig[i] || n[i];
      if (!looksLikeName(w)) return null;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return null;
  }

  // oprava dřív špatně uloženého jména (např. "Dělat")
  { const old = Store.get('kidName'); if (old && !Store.get('kidNameFromProfile') && !looksLikeName(old)) Store.set('kidName', null); }

  function answerPending(c, ctx, n, tokens, raw, intents) {
    const p = ctx.pending; ctx.pending = null;
    const short = raw.trim().replace(/[.!?]+$/, '');
    switch (p) {
      case 'name': {
        const nm = extractName(raw);
        if (nm && nm.length < 16) {
          Store.set('kidName', nm); Store.set('kidNameFromProfile', false);
          return R(`Ahoj, ${nm}! To je ale krásné jméno! Budu si ho pamatovat.`, { mood: 'love', sfx: c.sfx });
        }
        return null;
      }
      case 'color': {
        for (const [k, v] of Object.entries(COLORS)) {
          if (tokens.some(t => t.startsWith(k))) return R(`${v}! To je nádherná barva! Moje nejoblíbenější barva je ${c.favColor}.`, { mood: 'happy', prop: '🎨' });
        }
        return R(`To je krásná barva! Moje nejoblíbenější barva je ${c.favColor}.`, { mood: 'happy', prop: '🎨' });
      }
      case 'joke?': if (intents.yes || intents.more) return joke(c, 1, ctx); if (intents.no) return R('Dobře, tak třeba příště!', { mood: 'happy' }); return null;
      case 'song?': if (intents.yes) return song(c); if (intents.no) return R('Dobře, tak si budeme povídat!', { mood: 'happy' }); return null;
      case 'meow': if (intents.meow) return R('Mňau! To bylo krásné! Jsi skoro opravdová kočička!', { mood: 'laugh', sfx: 'meow' });
        return R('Mňau mňau! Já to umím takhle!', { sfx: 'meow', mood: 'laugh' });
      case 'food': case 'animal': case 'toy': case 'day':
        if (intents.no) return R('Nevadí! To je v pořádku.', { mood: 'happy' });
        if (short.split(' ').length <= 6) return R(fill(c, pick(ECHO[p]).replace('{x}', short)), { mood: 'happy' });
        return R(pick(ECHO.day), { mood: 'happy' });
    }
    return null;
  }

  function respond(c, raw, ctx) {
    ctx.turns++;
    const n = norm(raw);
    const tokens = n.split(' ').filter(Boolean);
    const intents = {};
    for (const [k, list] of Object.entries(I)) intents[k] = hit(n, tokens, list);
    // "papa", "papaa", "papapa", "paa" … a "čau čau", "tak ahoj"
    if (tokens.some(t => /^(pa+)+$/.test(t))) intents.bye = true;
    if (/(^| )(cau cau|ahoj ahoj|tak ahoj|tak cau|tak papa|mej se|mejte se|ahojky ahojky)( |$)/.test(n)) intents.bye = true;
    // samotné "ahoj"/"čau" na konci delšího hovoru = loučení
    if (ctx.turns > 4 && /^(ahoj|cau|cauky|ahojky)( (gabi|pandy|\w+))?$/.test(n)) intents.bye = true;
    if (intents.bye) intents.greet = false;
    for (const [re, k] of EMOJI) if (re.test(raw)) intents[k] = true;

    // odpověď na otázku, kterou postava položila
    if (ctx.pending) {
      const sp = c.special.some(x => hit(n, tokens, x.w));
      const other = sp || Object.keys(intents).some(k => intents[k] && !['greet', 'yes', 'no', 'myname'].includes(k));
      if (ctx.pending === 'name') {
        if (!intents.myname && !other && tokens.filter(t => !NAME_STOP.includes(t)).length <= 2) {
          const r = answerPending(c, ctx, n, tokens, raw, intents);
          if (r) return fin(r);
        }
        ctx.pending = null;
      } else if (!other || (ctx.pending === 'meow' && intents.meow)) {
        const r = answerPending(c, ctx, n, tokens, raw, intents);
        if (r) return fin(r);
      } else ctx.pending = null;
    }

    const out = [];
    const add = (r) => { if (r && out.length < 2) out.push(r); };

    if (intents.myname) {
      const nm = extractName(raw);
      if (nm) { Store.set('kidName', nm); Store.set('kidNameFromProfile', false); add(R(`Ahoj, ${nm}! Moc ${c.fem ? 'ráda' : 'rád'} tě poznávám! Já jsem ${c.name}.`, { mood: 'love', sfx: c.sfx })); }
    }
    add(friendTalk(c, n, tokens));
    if (intents.love) add(R(fill(c, pick(c.love)), { mood: 'love', prop: '💖', sfx: 'magic' }));
    if (intents.joke || (intents.more && ctx.last === 'joke')) add(joke(c, intents.joke ? jokeCount(tokens) : 1, ctx));
    else if (intents.more && ctx.last === 'song') add(song(c));
    if (intents.song) add(song(c));
    const sp = c.special.find(x => hit(n, tokens, x.w));
    if (sp) add(R(pick(sp.r), { sfx: sp.sfx, prop: sp.prop, dance: sp.dance, mood: 'laugh' }));
    if (intents.how) add(R(pick(c.feel), { mood: 'happy', q: true }));
    if (intents.name) add(R(c.intro, { mood: 'happy', sfx: c.sfx }));
    if (intents.doing) add(R(pick(c.doing), { mood: 'happy' }));
    if (intents.where) add(R('Jsem doma v kouzelném domečku! Je to tady moc krásné.', { mood: 'happy', prop: '🏠' }));
    if (intents.food) add(R(pick(c.food), { mood: 'laugh', prop: pick(['🍰', '🧁', '🍪']) }));
    if (intents.play) add(R(pick(c.play), { mood: 'laugh', dance: true }));
    if (intents.sleep && !intents.bye) add(R(pick(c.sleep), { mood: 'sleepy', sfx: 'yawn', prop: '🌙' }));
    if (intents.sad) add(R('Ach jo, to mě mrzí. Posílám ti velikánské obejmutí. Uvidíš, že bude zase dobře!', { mood: 'sad', prop: '🤗' }));
    if (intents.thanks) add(R(pick(['Není zač!', 'Rádo se stalo!', 'Pro tebe cokoliv!']), { mood: 'happy' }));
    if (intents.count) add(R('Jedna, dva, tři, čtyři, pět! Hurá, umím počítat do pěti! Teď ty!', { mood: 'laugh', prop: '🔢' }));
    if (intents.meow) add(R('Mňau mňau! Kočičky jsou nejlepší na celém světě!', { mood: 'laugh', sfx: 'meow', prop: '🐱' }));
    if (intents.woof) add(R('Haf haf? Ty jsi pejsek? Hihi! Pejsky má moc ráda Gábina sestřička Doozie!', { mood: 'laugh', sfx: 'woof', prop: '🐶' }));
    if (intents.magic) add(R(`Abrakadabra, mňau mňau bum! ${c.fem ? 'Proměnila' : 'Proměnil'} jsem tě v kočičku! Řekni mňau!`, { mood: 'surprised', sfx: 'magic', prop: '✨', setPending: 'meow' }));
    if (intents.gift) add(R('Dárek? Pro mě? Páni, děkuju! Co v něm asi je?', { mood: 'surprised', prop: '🎁', sfx: 'magic' }));
    if (intents.color) add(R(`Moje nejoblíbenější barva je ${c.favColor}. A tvoje?`, { mood: 'happy', prop: '🌈', setPending: 'color' }));

    if (intents.bye) out.push(R(fill(c, pick(c.bye)), { mood: 'happy', end: true, sfx: out.length ? null : c.sfx }));

    let r;
    if (out.length) {
      r = merge(out);
      // dlouhé vyprávění – nejdřív ocenit, co dítě vyprávělo
      if (tokens.length > 9 && !intents.bye) r.text = pick(['Páni, to je ale příběh!', 'To zní skvěle!', 'Ty toho ale zažíváš!', 'To je zajímavé!']) + ' ' + r.text;
      else if (intents.greet && !intents.bye && !/^ahoj/i.test(r.text)) r.text = fill(c, 'Ahoj{jm}! ') + r.text;
    } else if (intents.greet) r = R(fill(c, pick(['Ahoj ahoj{jm}!', 'Ahojky{jm}!', 'Ahoj{jm}! Jsem tady!'])), { mood: 'happy', q: true });
    else if (intents.yes) r = R(pick(['Super!', 'Hurá!', 'Jasně!']), { mood: 'happy', q: true });
    else if (intents.no) r = R(pick(['Dobře, dobře.', 'Hm, tak jo.']), { mood: 'happy', q: true });
    else {
      // nerozuměli jsme – reagujeme vesele a pokračujeme otázkou
      let t = pick(c.generic);
      const words = raw.trim().split(/\s+/).length;
      if (words <= 5 && Math.random() < 0.5 && !/[\u{1F000}-\u{1FFFF}]/u.test(raw)) t = fill(c, pick(ECHO.any).replace('{x}', raw.trim().replace(/[.!?]+$/, '')));
      r = R(t, { mood: pick(['happy', 'laugh', 'surprised']), q: Math.random() < 0.65 });
    }

    return fin(r);

    function fin(r) {
      ctx.last = r.isJoke ? 'joke' : r.song ? 'song' : null;
      if (r.setPending) { ctx.pending = r.setPending; ctx.asked.push(r.setPending); }
      else if (r.q && !r.end) r.text += ' ' + ask(c, ctx);
      return r;
    }
  }

  // spojí dvě odpovědi do jedné (písnička a loučení vždycky na konec)
  function merge(list) {
    if (list.length === 1) return list[0];
    list.sort((a, b) => (a.end ? 2 : a.song ? 1 : 0) - (b.end ? 2 : b.song ? 1 : 0));
    const r = { ...list[0] };
    for (const x of list.slice(1)) {
      r.text += ' ' + x.text;
      r.sfx = r.sfx || x.sfx; r.prop = r.prop || x.prop; r.dance = r.dance || x.dance;
      r.song = r.song || x.song; r.slow = r.slow || x.slow; r.end = r.end || x.end;
      r.setPending = x.setPending || r.setPending; r.q = x.q; r.isJoke = r.isJoke || x.isJoke;
    }
    return r;
  }

  // ---- Kamarádi a rodina (Doozie, Puggie Paws, ostatní postavičky) ----
  const ASKS_ABOUT = ['jak se ma', 'kde je', 'co dela', 'co ted dela', 'je tam', 'pozdravuj', 'mas rad', 'mas rada', 'jak je na tom', 'jak se dari'];
  const FRIENDS = [
    {
      id: 'doozie', always: true, w: ['dooz', 'duzi', 'duzy', 'duze', 'dusi', 'dusie', 'duzie', 'sestr'], prop: '🐶', sfx: 'woof',
      gabi: ['Doozie, moje mladší sestřička? Má se skvěle! Zrovna si hraje se svým štěňátkem Puggie Paws. Haf haf!',
        'Doozie se má moc dobře! Ona miluje pejsky, tak teď běhá se štěňátky po zahradě. Moc tě pozdravuje!',
        'Doozie je venku u psí boudičky a učí pejsky nové kousky. Je to ta nejlepší sestřička na světě!'],
      other: ['Doozie? To je Gábina mladší sestřička! Má se skvěle a hraje si s pejsky. Haf haf!',
        'Doozie se má moc dobře! Nejradši si hraje se štěňátkem Puggie Paws.'],
    },
    {
      id: 'puggie', always: true, w: ['pugg', 'pugi', 'pagi', 'paggi', 'stenat'], prop: '🐶', sfx: 'woof',
      other: ['Puggie Paws je Doozino štěňátko! Je moc roztomilé a pořád vrtí ocáskem. Haf haf!',
        'Puggie se má výborně! Zrovna honí svůj ocásek. Hihi!'],
    },
    { id: 'gabi', w: ['gabi', 'gabin', 'gabby', 'gaby', 'gabk'], other: ['Gábi se má kouzelně! Zrovna se zmenšila a hraje si v domečku.', 'Gábi je v domečku a vymýšlí nové kouzelné tvoření!'] },
    { id: 'pandy', w: ['pand'], other: ['Pandy se má mazlivě! Zrovna dělá kotrmelce na posteli.', 'Pandy si hraje na schovávanou. Myslím, že je pod polštářem!'] },
    { id: 'dj', w: ['=dj', 'didzej', 'dydzej', 'catnip'], other: ['DJ kocour pouští hudbu a všichni tancují!', 'DJ kocour ladí kytaru. Brnk brnk!'] },
    { id: 'krysour', w: ['krysour', 'krysak'], other: ['Krysour zase něco vynalézá. A samozřejmě u toho mlsá sýr!'] },
    { id: 'dorte', w: ['=dorte', '=dorteho', '=dortem'], other: ['Dortě peče v kuchyni dort. Voní to po celém domečku!'] },
    { id: 'valecka', w: ['valeck'], other: ['Válečka spinká na polštáři. Pst, ať ji nevzbudíme!'] },
    { id: 'rybocka', w: ['ryboc'], other: ['Rybočka plave v bazénu a dělá bublinky. Blub blub!'] },
    { id: 'autena', w: ['auten'], other: ['Autěna jezdí po zahradě. Tú tú!'] },
  ];

  function friendTalk(c, n, tokens) {
    const asking = hit(n, tokens, ASKS_ABOUT);
    for (const f of FRIENDS) {
      if (f.id === c.id || !hit(n, tokens, f.w)) continue;
      if (!f.always && !asking) continue;
      const lines = (f[c.id] || f.other);
      return R(pick(lines), { mood: 'happy', prop: f.prop, sfx: f.sfx });
    }
    return null;
  }

  function nudge(c, ctx) {
    ctx.silence++;
    if (ctx.silence === 1) return R(pick(['Haló? Jsi tam?', 'Hm? Neslyším tě. Řekni něco!', 'Haló haló! Slyšíme se?']), { mood: 'surprised' });
    return R(pick(['Mňau? Klepni na mikrofon a řekni mi něco!', 'Tak já tu počkám. Klepni na mikrofon, až budeš chtít mluvit!']), { mood: 'happy' });
  }

  return { respond, greeting, nudge, newContext, ask, norm, extractName };
})();

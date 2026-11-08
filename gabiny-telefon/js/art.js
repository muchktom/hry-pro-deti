// Kreslené postavičky jako SVG. Každá postava má tělo + obličej, který umí měnit výraz.
// ART.render(id, {eyes, mouth}) -> SVG řetězec
const ART = (() => {
  const OUT = '#3b2752'; // barva obrysu

  const ear = (bx, by, w, h, tilt, color, inner, stroke = OUT) => {
    const p = `${bx - w / 2},${by} ${bx + tilt},${by - h} ${bx + w / 2},${by}`;
    const pi = `${bx - w / 4},${by - 3} ${bx + tilt * 0.8},${by - h * 0.66} ${bx + w / 4},${by - 3}`;
    return `<polygon points="${p}" fill="${color}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>` +
      (inner ? `<polygon points="${pi}" fill="${inner}" stroke-linejoin="round"/>` : '');
  };

  // chlupatý / kudrnatý obrys (vlnky kolem elipsy)
  const fluffy = (cx, cy, rx, ry, n, b, fill, stroke = OUT, sw = 3) => {
    const pt = (a, k) => [(cx + Math.cos(a) * (rx + k)).toFixed(1), (cy + Math.sin(a) * (ry + k)).toFixed(1)];
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const p = pt(a, 0);
      if (i === 0) { d += `M${p}`; continue; }
      const c = pt(a - Math.PI / n, b * 2);
      d += ` Q${c} ${p}`;
    }
    return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  };

  const whiskers = (x, y, color = OUT) => `
    <g stroke="${color}" stroke-width="2" stroke-linecap="round" opacity=".55">
      <line x1="${x - 24}" y1="${y}" x2="${x - 50}" y2="${y - 6}"/>
      <line x1="${x - 24}" y1="${y + 6}" x2="${x - 50}" y2="${y + 8}"/>
      <line x1="${x + 24}" y1="${y}" x2="${x + 50}" y2="${y - 6}"/>
      <line x1="${x + 24}" y1="${y + 6}" x2="${x + 50}" y2="${y + 8}"/>
    </g>`;

  const heart = (x, y, s, c = '#ff3d7f') =>
    `<path d="M${x},${y + s * 0.9} C${x - s * 1.6},${y - s * 0.1} ${x - s * 0.8},${y - s * 1.3} ${x},${y - s * 0.4} C${x + s * 0.8},${y - s * 1.3} ${x + s * 1.6},${y - s * 0.1} ${x},${y + s * 0.9}Z" fill="${c}"/>`;

  const star = (x, y, r, c = '#fff36b') => {
    let p = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      p += `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)} `;
    }
    return `<polygon points="${p}" fill="${c}" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/>`;
  };

  // horní víčko – mazaný / ospalý pohled
  const lid = (x, y, r, color) => {
    const rx = r * 0.86 + 2, ry = r + 2, ly = y - r * 0.05;
    return `<path d="M${x - rx},${ly} Q${x},${ly - r * 0.25} ${x + rx},${ly} L${x + rx},${y - ry - 2} L${x - rx},${y - ry - 2}Z" fill="${color}"/>` +
      `<path d="M${x - rx},${ly} Q${x},${ly - r * 0.25} ${x + rx},${ly}" fill="none" stroke="${OUT}" stroke-width="3.5" stroke-linecap="round"/>`;
  };

  const bow = (x, y, s, c = '#ff5c9a') => `<g stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M${x},${y} L${x - s},${y - s * 0.6} L${x - s},${y + s * 0.6}Z" fill="${c}"/><path d="M${x},${y} L${x + s},${y - s * 0.6} L${x + s},${y + s * 0.6}Z" fill="${c}"/>
    <circle cx="${x}" cy="${y}" r="${s * 0.28}" fill="${c}"/></g>`;

  // velké lesklé oči jako v animovaných seriálech
  function eye(x, y, r, color, kind) {
    switch (kind) {
      case 'blink':
        return `<path d="M${x - r},${y + 2} Q${x},${y + r * 0.8} ${x + r},${y + 2}" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>`;
      case 'laugh':
        return `<path d="M${x - r},${y + 4} Q${x},${y - r * 1.1} ${x + r},${y + 4}" fill="none" stroke="${OUT}" stroke-width="4.5" stroke-linecap="round"/>`;
      case 'sleepy':
        return `<path d="M${x - r},${y} L${x + r},${y}" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>` +
          `<path d="M${x - r * 0.85},${y} Q${x},${y + r} ${x + r * 0.85},${y}" fill="#1f1630"/>`;
      case 'love':
        return heart(x, y, r * 0.95);
      default: {
        const k = kind === 'surprised' ? 1.18 : 1;
        const rx = r * 0.86 * k, ry = r * k;
        return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#1f1630"/>` +
          `<ellipse cx="${x}" cy="${y + ry * 0.32}" rx="${rx * 0.72}" ry="${ry * 0.58}" fill="${color}" opacity=".95"/>` +
          `<ellipse cx="${x}" cy="${y + ry * 0.1}" rx="${rx * 0.4}" ry="${ry * 0.45}" fill="#1f1630"/>` +
          `<ellipse cx="${x + rx * 0.32}" cy="${y - ry * 0.4}" rx="${r * 0.34}" ry="${r * 0.3}" fill="#fff"/>` +
          `<circle cx="${x - rx * 0.38}" cy="${y + ry * 0.45}" r="${r * 0.15}" fill="#fff"/>`;
      }
    }
  }

  function mouth(x, y, w, kind, cat, teeth) {
    const s = w / 2;
    switch (kind) {
      case 'open':
        return `<path d="M${x - s * 0.8},${y - 2} Q${x},${y - 6} ${x + s * 0.8},${y - 2} Q${x + s * 0.7},${y + s * 1.3} ${x},${y + s * 1.35} Q${x - s * 0.7},${y + s * 1.3} ${x - s * 0.8},${y - 2}Z" fill="#7a1f3d" stroke="${OUT}" stroke-width="2.5"/>` +
          `<ellipse cx="${x}" cy="${y + s * 0.95}" rx="${s * 0.45}" ry="${s * 0.3}" fill="#ff7a9c"/>` +
          (teeth ? `<rect x="${x - 7}" y="${y - 3}" width="6" height="8" fill="#fff" rx="1"/><rect x="${x + 1}" y="${y - 3}" width="6" height="8" fill="#fff" rx="1"/>` : '');
      case 'mid':
        return `<ellipse cx="${x}" cy="${y + s * 0.35}" rx="${s * 0.55}" ry="${s * 0.45}" fill="#7a1f3d" stroke="${OUT}" stroke-width="2.5"/>` +
          `<ellipse cx="${x}" cy="${y + s * 0.6}" rx="${s * 0.3}" ry="${s * 0.15}" fill="#ff7a9c"/>`;
      case 'laugh':
        return `<path d="M${x - s},${y - 3} Q${x},${y + 2} ${x + s},${y - 3} Q${x + s * 0.8},${y + s * 1.5} ${x},${y + s * 1.5} Q${x - s * 0.8},${y + s * 1.5} ${x - s},${y - 3}Z" fill="#7a1f3d" stroke="${OUT}" stroke-width="2.5"/>` +
          `<ellipse cx="${x}" cy="${y + s * 1.1}" rx="${s * 0.5}" ry="${s * 0.3}" fill="#ff7a9c"/>`;
      case 'o':
        return `<ellipse cx="${x}" cy="${y + 4}" rx="${s * 0.35}" ry="${s * 0.45}" fill="#7a1f3d" stroke="${OUT}" stroke-width="2.5"/>`;
      case 'sad':
        return `<path d="M${x - s * 0.7},${y + 8} Q${x},${y - 4} ${x + s * 0.7},${y + 8}" fill="none" stroke="${OUT}" stroke-width="3.5" stroke-linecap="round"/>`;
      case 'flat':
        return `<path d="M${x - s * 0.4},${y + 3} L${x + s * 0.4},${y + 3}" stroke="${OUT}" stroke-width="3.5" stroke-linecap="round"/>`;
      default: // smile
        if (cat) {
          return `<path d="M${x - s},${y} Q${x - s / 2},${y + s * 0.8} ${x},${y} Q${x + s / 2},${y + s * 0.8} ${x + s},${y}" fill="none" stroke="${OUT}" stroke-width="3.5" stroke-linecap="round"/>` +
            (teeth ? `<rect x="${x - 6}" y="${y + 1}" width="5" height="7" fill="#fff" stroke="${OUT}" stroke-width="1.5" rx="1"/><rect x="${x + 1}" y="${y + 1}" width="5" height="7" fill="#fff" stroke="${OUT}" stroke-width="1.5" rx="1"/>` : '');
        }
        return `<path d="M${x - s},${y} Q${x},${y + s * 1.1} ${x + s},${y}" fill="#fff" stroke="${OUT}" stroke-width="3.5" stroke-linecap="round"/>`;
    }
  }

  function face(f, st) {
    const { x = 100, eyeY, eyeDx, eyeR = 12, eyeColor = '#5b3a8c', mouthY, mouthW = 20, nose, cat = true,
      blush = '#ff8fb1', teeth = false, whisk = false, brows, lids } = f;
    let s = '';
    if (blush) s += `<ellipse cx="${x - eyeDx - 9}" cy="${eyeY + 20}" rx="10" ry="6" fill="${blush}" opacity=".55"/><ellipse cx="${x + eyeDx + 9}" cy="${eyeY + 20}" rx="10" ry="6" fill="${blush}" opacity=".55"/>`;
    if (whisk) s += whiskers(x, mouthY - 6, whisk === true ? OUT : whisk);
    const ek = st.eyes || 'open';
    s += eye(x - eyeDx, eyeY, eyeR, eyeColor, ek);
    s += eye(x + eyeDx, eyeY, eyeR, eyeColor, ek);
    if (lids && (ek === 'open')) for (const ex of [x - eyeDx, x + eyeDx]) s += lid(ex, eyeY, eyeR, lids);
    const sad = st.mouth === 'sad';
    if (brows || sad) {
      const bc = brows || OUT, by = eyeY - eyeR - 7;
      s += sad
        ? `<path d="M${x - eyeDx - 10},${by + 2} L${x - eyeDx + 8},${by - 4}" stroke="${bc}" stroke-width="3.5" stroke-linecap="round"/><path d="M${x + eyeDx + 10},${by + 2} L${x + eyeDx - 8},${by - 4}" stroke="${bc}" stroke-width="3.5" stroke-linecap="round"/>`
        : `<path d="M${x - eyeDx - 9},${by} Q${x - eyeDx},${by - 6} ${x - eyeDx + 9},${by}" fill="none" stroke="${bc}" stroke-width="3.5" stroke-linecap="round"/><path d="M${x + eyeDx - 9},${by} Q${x + eyeDx},${by - 6} ${x + eyeDx + 9},${by}" fill="none" stroke="${bc}" stroke-width="3.5" stroke-linecap="round"/>`;
    }
    if (nose) s += `<path d="M${x - 5},${mouthY - 9} L${x + 5},${mouthY - 9} L${x},${mouthY - 3}Z" fill="${nose}" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/>`;
    s += mouth(x, mouthY, mouthW, st.mouth || 'smile', cat, teeth);
    return s;
  }

  // --- Postavy -------------------------------------------------------------
  const C = {};

  // Gábi: kudrnaté hnědé vlasy, čelenka s kočičími oušky, pruhované tričko a růžový svetřík
  C.gabi = {
    face: { eyeY: 122, eyeDx: 21, eyeR: 12.5, eyeColor: '#8a5a32', mouthY: 148, mouthW: 18, cat: false, brows: '#4a2a1a' },
    back: () => `
      ${fluffy(100, 150, 80, 62, 20, 7, '#4f2c1b')}
      ${fluffy(100, 108, 72, 66, 22, 7, '#4f2c1b')}
      <path d="M48,210 C52,182 148,182 152,210Z" fill="#fff" stroke="${OUT}" stroke-width="3"/>
      <g stroke="#2b2b3a" stroke-width="4"><line x1="66" y1="194" x2="134" y2="194"/><line x1="62" y1="203" x2="138" y2="203"/></g>
      <path d="M46,210 C48,190 62,180 78,182 L74,210Z" fill="#ff5c9a" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M154,210 C152,190 138,180 122,182 L126,210Z" fill="#ff5c9a" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="89" y="160" width="22" height="24" fill="#e9b48c"/>
      ${ear(62, 66, 34, 42, -8, '#ffffff', '#ffb3cf')}${ear(138, 66, 34, 42, 8, '#ffffff', '#ffb3cf')}
      <path d="M50,66 L74,66 M126,66 L150,66" stroke="#2b2b3a" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="100" cy="122" rx="48" ry="50" fill="#f2c39d" stroke="${OUT}" stroke-width="3"/>
      <g fill="#4f2c1b" stroke="${OUT}" stroke-width="2.5">
        <circle cx="56" cy="98" r="12"/><circle cx="68" cy="82" r="13"/><circle cx="86" cy="74" r="13"/>
        <circle cx="104" cy="72" r="13"/><circle cx="122" cy="76" r="13"/><circle cx="136" cy="88" r="12"/><circle cx="145" cy="102" r="10"/>
      </g>
      <path d="M52,74 Q100,44 148,74" fill="none" stroke="#ff7fb5" stroke-width="6" stroke-linecap="round"/>`,
    front: () => `<path d="M97,137 Q100,140 103,137" fill="none" stroke="#c98a6a" stroke-width="2.5" stroke-linecap="round"/>`,
  };

  // Pandy: bílý plyšový kocourek s černými oušky a černými tlapkami
  C.pandy = {
    face: { eyeY: 118, eyeDx: 25, eyeR: 14, eyeColor: '#4b7fe0', mouthY: 148, mouthW: 18, nose: '#ff8fb1' },
    back: () => `
      <ellipse cx="100" cy="206" rx="64" ry="38" fill="#fff" stroke="${OUT}" stroke-width="3"/>
      <ellipse cx="52" cy="190" rx="17" ry="22" fill="#2a2a2e" stroke="${OUT}" stroke-width="3" transform="rotate(20 52 190)"/>
      <ellipse cx="148" cy="190" rx="17" ry="22" fill="#2a2a2e" stroke="${OUT}" stroke-width="3" transform="rotate(-20 148 190)"/>
      <g fill="#ff9cc0"><circle cx="50" cy="200" r="5"/><circle cx="150" cy="200" r="5"/></g>
      ${ear(56, 86, 46, 60, -6, '#2a2a2e', '#ff9cc0')}${ear(144, 86, 46, 60, 6, '#2a2a2e', '#ff9cc0')}
      <ellipse cx="100" cy="122" rx="68" ry="58" fill="#fff" stroke="${OUT}" stroke-width="3"/>
      <ellipse cx="100" cy="146" rx="22" ry="14" fill="#f4f1f8"/>`,
    front: () => `<path d="M60,90 q4,4 0,8 M140,90 q-4,4 0,8" stroke="#d9d4e6" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  };

  // DJ kocour: fialovomodrý kocour v růžové pletené kapuci s oušky
  C.dj = {
    face: { eyeY: 122, eyeDx: 22, eyeR: 12.5, eyeColor: '#36c2a8', mouthY: 150, mouthW: 20, nose: '#ff8fc8', whisk: true },
    back: () => `
      <path d="M36,210 C40,176 160,176 164,210Z" fill="#e64a7b" stroke="${OUT}" stroke-width="3"/>
      ${ear(48, 78, 46, 60, -12, '#e64a7b', '#ff9cbd')}${ear(152, 78, 46, 60, 12, '#e64a7b', '#ff9cbd')}
      <ellipse cx="100" cy="122" rx="80" ry="72" fill="#e64a7b" stroke="${OUT}" stroke-width="3"/>
      <ellipse cx="100" cy="126" rx="60" ry="54" fill="#8b86f0" stroke="#b8336a" stroke-width="7"/>
      <path d="M86,78 l3,12 M100,76 l0,13 M114,78 l-3,12" stroke="#6a62d6" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="100" cy="148" rx="24" ry="15" fill="#c2bfff"/>
      <g fill="#ff9cbd" opacity=".7"><circle cx="40" cy="120" r="3"/><circle cx="160" cy="120" r="3"/><circle cx="48" cy="150" r="3"/><circle cx="152" cy="150" r="3"/><circle cx="46" cy="95" r="3"/><circle cx="154" cy="95" r="3"/></g>`,
    front: () => '',
  };

  // Krysour (CatRat): modrý chlupatý kocour s tmavšími pruhy, dlouhým pruhovaným ocasem a mazaným pohledem
  C.krysour = {
    face: { eyeY: 120, eyeDx: 23, eyeR: 12.5, eyeColor: '#f2b13a', mouthY: 150, mouthW: 22, nose: '#2d3f8f', whisk: '#cfe0ff', lids: '#5b9be6', blush: false },
    back: () => `
      <path d="M150,200 C190,196 196,160 176,140 C166,130 174,114 186,118" fill="none" stroke="${OUT}" stroke-width="17" stroke-linecap="round"/>
      <path d="M150,200 C190,196 196,160 176,140 C166,130 174,114 186,118" fill="none" stroke="#5b9be6" stroke-width="11" stroke-linecap="round" stroke-dasharray="12 9"/>
      <path d="M150,200 C190,196 196,160 176,140 C166,130 174,114 186,118" fill="none" stroke="#2d5fb5" stroke-width="11" stroke-linecap="round" stroke-dasharray="0 12 9 0" stroke-dashoffset="-12"/>
      ${fluffy(100, 206, 60, 34, 16, 5, '#5b9be6')}
      <ellipse cx="100" cy="206" rx="30" ry="22" fill="#a9ccf7"/>
      ${ear(54, 86, 44, 62, -14, '#5b9be6', '#9fc4f5')}${ear(146, 86, 44, 62, 14, '#5b9be6', '#9fc4f5')}
      <path d="M40,28 l4,-8 M44,30 l8,-6 M160,28 l-4,-8 M156,30 l-8,-6" stroke="#5b9be6" stroke-width="4" stroke-linecap="round"/>
      ${fluffy(100, 124, 66, 56, 22, 6, '#5b9be6')}
      <path d="M82,74 l4,14 M100,70 l0,16 M118,74 l-4,14" stroke="#2d5fb5" stroke-width="6" stroke-linecap="round"/>
      <path d="M36,120 l14,4 M38,136 l13,-1 M164,120 l-14,4 M162,136 l-13,-1" stroke="#2d5fb5" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="100" cy="150" rx="26" ry="17" fill="#a9ccf7"/>`,
    front: () => '',
  };

  C.dorte = {
    face: { eyeY: 122, eyeDx: 22, eyeR: 12, eyeColor: '#7a5be0', mouthY: 148, mouthW: 18, nose: '#ff8fb1' },
    back: () => `
      <path d="M50,160 L150,160 L138,206 L62,206Z" fill="#ff9fd0" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M53,172 L147,172 L144,184 L56,184Z" fill="#b89bff"/><path d="M57,188 L143,188 L140,200 L60,200Z" fill="#8fd8ff"/>
      <path d="M50,160 L150,160 L138,206 L62,206Z" fill="none" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      ${ear(60, 84, 34, 40, -8, '#fff8f0', '#ffb3cf')}${ear(140, 84, 34, 40, 8, '#fff8f0', '#ffb3cf')}
      ${fluffy(100, 120, 66, 50, 16, 6, '#fff8f0')}
      <g stroke-width="4.5" stroke-linecap="round"><line x1="70" y1="90" x2="76" y2="86" stroke="#5bd6ff"/><line x1="88" y1="80" x2="91" y2="86" stroke="#ffd166"/>
      <line x1="110" y1="80" x2="116" y2="84" stroke="#7cf27c"/><line x1="128" y1="90" x2="132" y2="85" stroke="#ff5c9a"/><line x1="99" y1="90" x2="104" y2="92" stroke="#b07cff"/>
      <line x1="60" y1="108" x2="64" y2="104" stroke="#ff5c9a"/><line x1="140" y1="106" x2="144" y2="110" stroke="#5bd6ff"/></g>`,
    front: () => '',
  };

  // Válečka: modrá chlupatá mazlivá kočička na polštáři
  // Válečka (Pillow Cat): žlutá ospalá kočička s polštářovým tělem z barevných záplat
  C.valecka = {
    face: { eyeY: 124, eyeDx: 23, eyeR: 12, eyeColor: '#7a4bd0', mouthY: 152, mouthW: 18, nose: '#ff7aa8', whisk: true, lids: '#f6c35b' },
    back: () => `
      <rect x="6" y="150" width="188" height="56" rx="28" fill="#ff6fa8" stroke="${OUT}" stroke-width="3"/>
      <rect x="44" y="152" width="34" height="52" fill="#7ed9a0"/><rect x="118" y="152" width="34" height="52" fill="#ffd166"/>
      <rect x="6" y="150" width="188" height="56" rx="28" fill="none" stroke="${OUT}" stroke-width="3"/>
      <path d="M44,154 l0,50 M78,154 l0,50 M118,154 l0,50 M152,154 l0,50" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/>
      ${ear(56, 88, 42, 50, -8, '#f6c35b', '#ffb3cf')}${ear(144, 88, 42, 50, 8, '#f6c35b', '#ffb3cf')}
      <ellipse cx="100" cy="126" rx="66" ry="54" fill="#f6c35b" stroke="${OUT}" stroke-width="3"/>
      <path d="M84,76 l3,12 M100,73 l0,14 M116,76 l-3,12" stroke="#e08e2b" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="100" cy="152" rx="24" ry="15" fill="#ffe6b0"/>`,
    front: () => `<g fill="#7b6cff" font-family="sans-serif" font-weight="800"><path d="M150,52 h12 l-12,14 h12" fill="none" stroke="#7b6cff" stroke-width="3.5" stroke-linejoin="round"/><path d="M168,34 h9 l-9,10 h9" fill="none" stroke="#7b6cff" stroke-width="3" stroke-linejoin="round"/></g>`,
  };

  C.rybocka = {
    face: { eyeY: 118, eyeDx: 22, eyeR: 12.5, eyeColor: '#a05be0', mouthY: 148, mouthW: 20, nose: '#ff6fa8', whisk: true },
    back: () => `
      <path d="M100,168 C130,178 150,172 160,162 L186,140 L190,178 L168,172 C150,198 120,204 100,202Z" fill="#b57cf0" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M45,210 C50,174 150,174 155,210Z" fill="#8f6cf0" stroke="${OUT}" stroke-width="3"/>
      <path d="M70,192 q8,-8 16,0 q8,-8 16,0 q8,-8 16,0" fill="none" stroke="#c9b3ff" stroke-width="2.5"/>
      <path d="M40,118 C20,100 22,130 30,140 C36,136 40,130 44,128Z M160,118 C180,100 178,130 170,140 C164,136 160,130 156,128Z" fill="#d38cf0" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>
      ${ear(56, 84, 42, 52, -10, '#6fd6cf', '#ffd0e6')}${ear(144, 84, 42, 52, 10, '#6fd6cf', '#ffd0e6')}
      <ellipse cx="100" cy="120" rx="62" ry="56" fill="#6fd6cf" stroke="${OUT}" stroke-width="3"/>
      <ellipse cx="100" cy="146" rx="24" ry="15" fill="#c9f3ef"/>`,
    front: () => `
      ${bow(140, 76, 15, '#ff5c9a')}
      <circle cx="30" cy="60" r="7" fill="none" stroke="#9fe8ff" stroke-width="3"/><circle cx="20" cy="38" r="4" fill="none" stroke="#9fe8ff" stroke-width="3"/>`,
  };

  // Autěna: kočičí autíčko
  // Autěna (Carlita): fialové kočičí autíčko
  C.autena = {
    face: { eyeY: 126, eyeDx: 30, eyeR: 13, eyeColor: '#ff5c9a', mouthY: 152, mouthW: 22 },
    back: () => `
      <path d="M150,96 C156,70 150,46 168,30" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
      <path d="M168,30 l14,4 l-12,8Z" fill="#ff5c9a" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>
      ${ear(66, 74, 30, 34, -6, '#9b5de5', '#ffb3d9')}${ear(134, 74, 30, 34, 6, '#9b5de5', '#ffb3d9')}
      <path d="M50,102 C55,64 145,64 150,102Z" fill="#9b5de5" stroke="${OUT}" stroke-width="3"/>
      <path d="M62,100 C66,76 134,76 138,100Z" fill="#cdb8ff" stroke="${OUT}" stroke-width="2.5"/>
      <path d="M72,96 l8,-14 M88,96 l8,-16 M104,96 l8,-16 M120,96 l8,-12" stroke="#fff" stroke-width="2" opacity=".7"/>
      <rect x="16" y="98" width="168" height="72" rx="30" fill="#9b5de5" stroke="${OUT}" stroke-width="3"/>
      <path d="M24,150 Q100,166 176,150" fill="none" stroke="#7a3fc4" stroke-width="5"/>
      <circle cx="56" cy="172" r="20" fill="#3b3b4f" stroke="${OUT}" stroke-width="3"/><circle cx="56" cy="172" r="8" fill="#ff9fd0"/>
      <circle cx="144" cy="172" r="20" fill="#3b3b4f" stroke="${OUT}" stroke-width="3"/><circle cx="144" cy="172" r="8" fill="#ff9fd0"/>
      <rect x="18" y="128" width="16" height="12" rx="5" fill="#fff36b" stroke="${OUT}" stroke-width="2"/>
      <rect x="166" y="128" width="16" height="12" rx="5" fill="#fff36b" stroke="${OUT}" stroke-width="2"/>`,
    front: () => '',
  };

  function render(id, st = {}) {
    const c = C[id];
    if (!c) return '';
    return `<svg viewBox="0 0 200 210" xmlns="http://www.w3.org/2000/svg" class="char-svg">${c.back()}${face(c.face, st)}${c.front()}</svg>`;
  }

  return { render, ids: Object.keys(C) };
})();

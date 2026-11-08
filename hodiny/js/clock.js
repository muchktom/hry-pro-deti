'use strict';

/* ====================== Ciferník (SVG) ====================== */
const RIM_COLORS = ['#e63946', '#f77f00', '#2a9d8f', '#457b9d', '#8338ec', '#ff006e', '#3a86ff', '#06a77d'];
const CHUTE_COLORS = [['#ff595e', '#ffca3a'], ['#8ac926', '#ffffff'], ['#1982c4', '#ffffff'], ['#6a4c93', '#ffca3a'], ['#ff924c', '#fff']];

function clockSVG(h, m, cfg) {
  const ha = (h % 12) * 30 + m * 0.5, ma = m * 6;
  const rim = pick(RIM_COLORS), [c1, c2] = pick(CHUTE_COLORS);
  const cx = 60, cy = 100;
  let s = `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">`;
  // padák
  s += `<path d="M8 34 Q60 -14 112 34 Q99 26 86 34 Q73 26 60 34 Q47 26 34 34 Q21 26 8 34Z" fill="${c1}" stroke="#0003" stroke-width="1.5"/>`;
  s += `<path d="M34 34 Q47 26 60 34 Q60 0 60 2 Q40 8 34 34Z" fill="${c2}" opacity=".85"/>`;
  s += `<path d="M86 34 Q73 26 60 34 Q60 0 60 2 Q80 8 86 34Z" fill="${c2}" opacity=".85"/>`;
  s += `<g stroke="#555" stroke-width="1"><line x1="9" y1="34" x2="30" y2="54"/><line x1="34" y1="33" x2="44" y2="49"/><line x1="86" y1="33" x2="76" y2="49"/><line x1="111" y1="34" x2="90" y2="54"/></g>`;
  // ciferník
  s += `<circle cx="${cx}" cy="${cy}" r="56" fill="${rim}"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="49" fill="#fffef8"/>`;
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0, a = i * 6 * Math.PI / 180;
    const r1 = 48, r2 = major ? 41 : 45;
    s += `<line x1="${cx + Math.sin(a) * r1}" y1="${cy - Math.cos(a) * r1}" x2="${cx + Math.sin(a) * r2}" y2="${cy - Math.cos(a) * r2}" stroke="${major ? '#222' : '#999'}" stroke-width="${major ? (i % 15 === 0 ? 3.2 : 2.2) : 1}" stroke-linecap="round"/>`;
  }
  for (let n = 1; n <= 12; n++) {
    if (cfg.numbers === 'none' || (cfg.numbers === 'quarters' && n % 3)) continue;
    const a = n * 30 * Math.PI / 180;
    s += `<text x="${cx + Math.sin(a) * 33}" y="${cy - Math.cos(a) * 33}" font-size="13" font-weight="800" font-family="Baloo 2, Arial, sans-serif" fill="#222" text-anchor="middle" dominant-baseline="central">${n}</text>`;
  }
  const hc = cfg.coloredHands ? '#d62828' : '#222', mc = cfg.coloredHands ? '#1d4e89' : '#222';
  // hodinová (krátká, tlustá)
  s += `<g transform="rotate(${ha} ${cx} ${cy})"><line x1="${cx}" y1="${cy + 6}" x2="${cx}" y2="${cy - 25}" stroke="${hc}" stroke-width="7" stroke-linecap="round"/></g>`;
  // minutová (dlouhá, tenká)
  s += `<g transform="rotate(${ma} ${cx} ${cy})"><line x1="${cx}" y1="${cy + 8}" x2="${cx}" y2="${cy - 40}" stroke="${mc}" stroke-width="4" stroke-linecap="round"/></g>`;
  s += `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#ffb703" stroke="#222" stroke-width="1.5"/>`;
  s += `</svg>`;
  return s;
}

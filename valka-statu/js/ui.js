'use strict';
// Horní/dolní lišta, tabulka srdíček, obrazovky menu a konce hry

const uiEls = {
  money: document.getElementById('money'), hp0: document.getElementById('hp0'), hp1: document.getElementById('hp1'),
  cards: [...document.querySelectorAll('.card')],
};
function updateUI() {
  const s = sides[0];
  uiEls.money.textContent = Math.floor(s.money);
  uiEls.hp0.style.width = (100 * s.base / s.baseMax) + '%';
  uiEls.hp1.style.width = (100 * sides[1].base / sides[1].baseMax) + '%';
  for (const card of uiEls.cards) {
    const t = card.dataset.t, cost = card.querySelector('.cost');
    let can, txt, free = false;
    if (TYPES[t]) {
      const n = s.reserve[t];
      if (n > 0) { free = true; txt = 'ZDARMA ×' + n; can = true; }
      else { txt = '💰 ' + TYPES[t].cost; can = s.money >= TYPES[t].cost; }
    } else if (t === 'mina') { txt = '💰 ' + MINE.cost; can = s.money >= MINE.cost; }
    else { const l = s.turret.lvl; txt = l >= 4 ? 'MAX ★★★★' : '💰 ' + TURRET_COST[l] + ' ' + '★'.repeat(l + 1); can = l < 4 && s.money >= TURRET_COST[l]; }
    if (cost.textContent !== txt) cost.textContent = txt;
    cost.classList.toggle('free', free);
    card.classList.toggle('dis', !can);
    card.classList.toggle('sel', t === 'mina' && mineMode);
  }
}

function drawCardIcons() {
  for (const card of uiEls.cards) {
    const cc = card.querySelector('canvas').getContext('2d'), t = card.dataset.t;
    cc.setTransform(2, 0, 0, 2, 0, 0); cc.clearRect(0, 0, 64, 44);
    if (DRAW[t]) DRAW[t](cc, t === 'vrtulnik' ? 36 : 30, 22, 0, 1, false, 0);
    else if (t === 'mina') { cc.save(); cc.scale(1.4, 1.4); drawMineIcon(cc, 22, 18, 0, true); cc.restore(); }
    else drawTowerIcon(cc, 30, 22, 0, 0);
  }
}

function buildHeartsTable() {
  const tb = document.getElementById('heartsTable');
  let html = '';
  for (const [k, T] of Object.entries(TYPES)) {
    html += `<tr><td><canvas data-i="${k}" width="112" height="76"></canvas></td><td><b>${T.name.toUpperCase()}</b><br><small>útok ${T.dmg} · dosah ${T.range < 100 ? 'krátký' : T.range < 200 ? 'střední' : 'dlouhý'}${T.splash ? ' · trefí víc najednou' : ''}${T.air ? ' · létá: trefí ho jen voják, vrtulník a věž' : !T.antiAir ? ' · na vrtulník nedostřelí' : ''}</small></td><td class="h">${'❤'.repeat(T.hp)}</td><td><small>${T.kind === 'bio' ? '→ ošetřovna 🩹' : '→ opravna 🔧'}</small></td></tr>`;
  }
  html += `<tr><td style="text-align:center;font-size:26px">💣</td><td><b>MINA</b><br><small>vybuchne a ubere ${MINE.dmg} ❤ všem kolem</small></td><td></td><td></td></tr>`;
  html += `<tr><td style="text-align:center;font-size:26px">🏰</td><td><b>ZÁKLADNA</b><br><small>má věž, která střílí</small></td><td class="h">❤ × ${BASE_HP}</td><td></td></tr>`;
  tb.innerHTML = html;
  tb.querySelectorAll('canvas').forEach(cvv => { const cc = cvv.getContext('2d'); cc.setTransform(2, 0, 0, 2, 0, 0); DRAW[cvv.dataset.i](cc, cvv.dataset.i === 'vrtulnik' ? 36 : 28, 22, 0, 1, false, 0); });
}

// ====================== OBRAZOVKY ======================
const overlay = document.getElementById('overlay'), ovBox = document.getElementById('ovBox');
function showOverlay(kind) {
  state = kind === 'menu' ? 'menu' : 'over';
  overlay.classList.remove('hide');
  const diffBtns = Object.entries(DIFF).map(([k, d]) => `<button data-d="${k}" class="${k === diff ? 'cur' : ''}" title="Obtížnost ${k}"><span class="num">${k}</span><span class="emo">${d.emoji}</span></button>`).join('');
  if (kind === 'menu') {
    ovBox.innerHTML = `<h1><span class="b">VÁLKA</span> <span class="r">STÁTŮ</span></h1>
      <p>Znič nepřátelskou základnu dřív, než oni zničí tu tvoji!</p>
      <ul>
        <li><b>Pošli vojáky a stroje:</b> vyber cestu (klikni na ni nebo 1 / 2 / 3) a pak klikni na kartičku dole – <b>Voják</b>, <b>Tank</b>, <b>Dělo</b> nebo <b>Vrtulník</b>.</li>
        <li><b>🚁 Vrtulník létá:</b> tanky a děla na něj nedostřelí a miny mu neublíží. Sestřelí ho jen <b>voják</b>, jiný vrtulník nebo věž.</li>
        <li><b>Zachraň zraněné:</b> když má někdo 🩹 nebo 🔧, <b>chyť ho myší a přetáhni</b> – vojáka do <b>OŠETŘOVNY</b>, tank a dělo do <b>OPRAVNY</b>. Až se uzdraví, čeká v <b>záloze</b> a pošleš ho znovu <b>zadarmo</b>.</li>
        <li>Vojáka můžeš přetáhnout taky na jinou cestu (jen dozadu, ne dopředu).</li>
        <li><b>💣 Mina:</b> polož ji na svou půlku cesty – nepřítel na ni najede a bum!</li>
        <li><b>Věž:</b> tvoje základna střílí sama. Za peníze ji vylepšíš ⭐.</li>
        <li><b>❤️ Zásahy:</b> klikni na srdíčko nahoře a uvidíš, kolik kdo vydrží.</li>
        <li>Nepřítel na druhé straně hraje <b>sám</b> a dělá úplně to samé!</li>
      </ul>
      <p><b>Jak těžké to má být?</b> <small>(1 = nejlehčí, 4 = nejtěžší)</small></p>
      <div class="diff">${diffBtns}</div>
      <a class="allgames" href="../">← Všechny hry</a>`;
  } else {
    const win = kind === 'win';
    ovBox.innerHTML = `<h1>${win ? '🎉 VYHRÁL JSI! 🎉' : '💥 Prohra…'}</h1>
      <p style="font-size:20px">${win ? 'Nepřátelská základna je zničená. Jsi skvělý velitel!' : 'Tvoje základna padla. Zkus to znovu – a nezapomeň léčit zraněné!'}</p>
      <p>Hrát znovu:</p><div class="diff">${diffBtns}</div>
      <a class="allgames" href="../">← Všechny hry</a>`;
  }
  ovBox.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
    diff = b.dataset.d;
    try { localStorage.setItem('valka_diff', diff); } catch (e) {}
    startGame();
  });
}
function startGame() {
  ac();
  reset();
  overlay.classList.add('hide');
  state = 'play';
  document.getElementById('btnPause').textContent = '⏸';
  toast('Vyber cestu a pošli vojáky! ⚔️');
}

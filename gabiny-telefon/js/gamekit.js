// Společní pomocníci pro minihry (bubliny, pečení)
const GameKit = (() => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const kid = () => Store.get('kidName');

  // Postavička mluví: otevírá pusu, dokud nedomluví. Novější promluva přeruší starší.
  const talking = new WeakMap();
  async function say(el, id, text, { sfx = false } = {}) {
    const c = CHAR[id];
    if (!el || !c) return;
    const token = {};
    talking.set(el, token);
    clearInterval(el._anim);
    if (sfx) Sound.play(c.sfx);
    let open = false;
    el._anim = setInterval(() => { open = !open; el.innerHTML = ART.render(id, { mouth: open ? 'open' : 'mid', eyes: 'open' }); }, 150);
    await Voice.speak(text, c.voice);
    if (talking.get(el) !== token) return;
    clearInterval(el._anim);
    el.innerHTML = ART.render(id, { mouth: 'smile', eyes: 'laugh' });
    setTimeout(() => { if (talking.get(el) === token) el.innerHTML = ART.render(id, { mouth: 'smile' }); }, 900);
  }
  function quiet(el) { if (el) { clearInterval(el._anim); talking.delete(el); } Voice.stop(); }
  function face(el, id, st) { if (el) { clearInterval(el._anim); el.innerHTML = ART.render(id, st); } }

  // Pochvala se jménem dítěte (když ho známe)
  function praise(list) {
    const t = pickOne(list), nm = kid();
    return nm && Math.random() < 0.5 ? t.replace(/!$/, `, ${nm}!`) : t;
  }

  return { rnd, pickOne, shuffle, say, quiet, face, praise };
})();

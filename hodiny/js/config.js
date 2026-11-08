'use strict';

/* ====================== Nastavení ====================== */
const MAX_LIVES = 5;
const HITS_PER_LEVEL = 5;
const LS_SCORES = 'hodinovyHon.scores';
const LS_MAXLVL = 'hodinovyHon.maxLevel';
const LS_NAME = 'hodinovyHon.name';
const LS_SOUND = 'hodinovyHon.sound';
const LS_SETTINGS = 'hodinovyHon.settings';

/* Výchozí nastavení (dá se změnit na úvodní obrazovce) */
const DEFAULT_SETTINGS = {
  h24: false,        // zadávat i časy přes 12 (13:00–23:59)
  speed: 'normal',   // 'slow' | 'normal' | 'fast'
};
const SPEED_FACTOR = { slow: 0.7, normal: 1, fast: 1.4 };
const SPEED_LABEL = { slow: '🐢 Pomalu', normal: '🚶 Normálně', fast: '🐇 Rychle' };

function loadSettings() { return Object.assign({}, DEFAULT_SETTINGS, lsGet(LS_SETTINGS, {})); }
let settings;

const LEVEL_DESC = {
  1: 'Celé hodiny (3:00, 8:00…)',
  2: 'Půlhodiny (4:30…)',
  3: 'Čtvrthodiny (2:15, 6:45…)',
  4: 'Po 5 minutách (7:25…)',
  5: 'Po 5 minutách, na ciferníku jen 12, 3, 6, 9',
  6: 'Po 5 minutách, ciferník bez čísel',
  7: 'Každá minuta (10:37…)',
  8: 'Každá minuta, jen 12, 3, 6, 9',
  9: 'Mistr času – bez čísel, stejné ručičky',
};

function levelCfg(L) {
  const step = L <= 1 ? 60 : L === 2 ? 30 : L === 3 ? 15 : L <= 6 ? 5 : 1;
  const numbers = (L <= 4 || L === 7) ? 'all' : (L === 5 || L === 8) ? 'quarters' : 'none';
  // sekundy, za které hodiny propadnou celou obrazovkou (čím víc, tím pomaleji)
  const fallTime = Math.max(5, 16 / (1 + 0.1 * (L - 1))) / SPEED_FACTOR[settings.speed];
  const maxClocks = Math.min(3 + Math.floor(L / 2), 7);
  return {
    step, numbers, fallTime, maxClocks,
    spawnEvery: Math.max(0.8, fallTime / (maxClocks + 0.5)),
    // limit na nalezení zadaného času: po vypršení -1 život a nový čas
    taskLimit: Math.round(fallTime + 8),
    h24: settings.h24,
    tricky: L >= 4,
    coloredHands: L <= 8,
  };
}
function levelDesc(L) { return LEVEL_DESC[L] || `Mistr času – rychlost ${L - 8}× zrychlená 🔥`; }

/* ====================== Pomocné ====================== */
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const pad = n => String(n).padStart(2, '0');
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

settings = loadSettings();

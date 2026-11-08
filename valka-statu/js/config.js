'use strict';
// Nastavení hry – tady se dají měnit čísla (životy, útok, ceny…)

const W = 1280, H = 720;
const LANES = [205, 375, 545];
const FIELD_L = 200, FIELD_R = 1080;
const COL = ['#2f6fd6', '#d63a2f'];
const COL_DARK = ['#1b3f80', '#7d1d16'];
const COL_LIGHT = ['#9cc0ff', '#ffaaa0'];

const TYPES = {
  vojak: { name: 'Voják', hp: 3,  dmg: 1, range: 75,  speed: 46, cd: 0.9, cost: 50,  kind: 'bio',   r: 17 },
  tank:  { name: 'Tank',  hp: 10, dmg: 2, range: 125, speed: 28, cd: 1.6, cost: 160, kind: 'stroj', r: 25 },
  delo:  { name: 'Dělo',  hp: 5,  dmg: 3, range: 270, speed: 20, cd: 2.8, cost: 130, kind: 'stroj', r: 21, splash: 48 },
};
const MINE = { cost: 40, dmg: 4, radius: 65 };
const TURRET = [null, { dmg: 1, cd: 1.3 }, { dmg: 1, cd: 0.85 }, { dmg: 2, cd: 0.95 }, { dmg: 2, cd: 0.65 }];
const TURRET_COST = [null, 150, 250, 400];
const TURRET_RANGE = 390;
const CAP = { ose: 3, opr: 2 };
const HEAL = { ose: 0.9, opr: 0.7 };
const BASE_HP = 50;
const PLAYER_INCOME = 8;
const DIFF = {
  lehka:   { name: 'Lehká 🙂',   inc: 5,   think: [1.8, 3.2], retreat: 0.3,  mines: 0.5 },
  stredni: { name: 'Střední 😎', inc: 7.5, think: [1.1, 2.3], retreat: 0.65, mines: 1 },
  tezka:   { name: 'Těžká 😈',   inc: 10,  think: [0.6, 1.6], retreat: 0.95, mines: 1.6 },
};

function mirror(r) { return { x: W - r.x - r.w, y: r.y, w: r.w, h: r.h }; }
const BLD = [{
  ose:  { x: 10, y: 10,  w: 180, h: 150 },
  opr:  { x: 10, y: 170, w: 180, h: 150 },
  base: { x: 100, y: 440, r: 72 },
  park: { x: 10, y: 530, w: 180, h: 180 },
}];
BLD[1] = { ose: mirror(BLD[0].ose), opr: mirror(BLD[0].opr), base: { x: W - 100, y: 440, r: 72 }, park: mirror(BLD[0].park) };

// pomocné funkce
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const laneAt = y => { for (let i = 0; i < 3; i++) if (Math.abs(y - LANES[i]) < 82) return i; return -1; };
const kindKey = type => TYPES[type].kind === 'bio' ? 'ose' : 'opr';

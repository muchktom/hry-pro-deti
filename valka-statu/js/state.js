'use strict';
// Stav hry

const cv = document.getElementById('game'), ctx = cv.getContext('2d');
let units, projs, parts, floats, mines, sides, toasts;
let state = 'menu', paused = false, showHearts = false, diff = '2';
try { const d = localStorage.getItem('valka_diff'); if (DIFF[d]) diff = d; } catch (e) {}
let selLane = 1, mineMode = false, drag = null, hover = null, nextId = 1, time = 0, muted = false;

function newSide() {
  return { money: 200, base: BASE_HP, baseMax: BASE_HP, flash: 0,
    turret: { lvl: 1, cd: 0, ang: 0, recoil: 0 },
    reserve: { vojak: 0, tank: 0, delo: 0, vrtulnik: 0 }, ose: [], opr: [], aiT: 2.5 };
}
function reset() {
  units = []; projs = []; parts = []; floats = []; mines = []; toasts = [];
  sides = [newSide(), newSide()];
  const D = DIFF[diff], ai = sides[1];
  if (D.money) ai.money = D.money;
  if (D.turret) ai.turret.lvl = D.turret;
  if (D.base) ai.base = ai.baseMax = D.base;
  selLane = 1; mineMode = false; drag = null; time = 0; paused = false;
  updateLaneButtons();
}

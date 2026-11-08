'use strict';
// Stav hry

const cv = document.getElementById('game'), ctx = cv.getContext('2d');
let units, projs, parts, floats, mines, sides, toasts;
let state = 'menu', paused = false, showHearts = false, diff = 'stredni';
let selLane = 1, mineMode = false, drag = null, hover = null, nextId = 1, time = 0, muted = false;

function newSide() {
  return { money: 200, base: BASE_HP, baseMax: BASE_HP, flash: 0,
    turret: { lvl: 1, cd: 0, ang: 0, recoil: 0 },
    reserve: { vojak: 0, tank: 0, delo: 0 }, ose: [], opr: [], aiT: 2.5 };
}
function reset() {
  units = []; projs = []; parts = []; floats = []; mines = []; toasts = [];
  sides = [newSide(), newSide()];
  selLane = 1; mineMode = false; drag = null; time = 0; paused = false;
  updateLaneButtons();
}

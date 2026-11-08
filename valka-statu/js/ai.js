'use strict';
// Počítačový protivník

function aiChooseLane() {
  let bestL = 0, bestS = -1e9;
  for (let l = 0; l < 3; l++) {
    let s = Math.random() * 4;
    for (const u of units) {
      if (u.lane !== l) continue;
      if (u.side === 0) s += u.hp * (1 + (u.x - FIELD_L) / (FIELD_R - FIELD_L) * 2);
      else s -= u.hp * 0.8;
    }
    if (s > bestS) { bestS = s; bestL = l; }
  }
  return bestL;
}

function aiThink() {
  const s = sides[1], D = DIFF[diff];
  if (s.turret.lvl < 4 && s.money >= TURRET_COST[s.turret.lvl] + 120 && Math.random() < 0.3) { upgradeTurret(1); return; }
  const lane = aiChooseLane();
  const res = ['vrtulnik', 'tank', 'delo', 'vojak'].find(t => s.reserve[t] > 0);
  if (res) { deploy(1, res, lane); return; }
  if (Math.random() < 0.07 * D.mines && s.money >= MINE.cost + 60) {
    placeMine(1, Math.floor(Math.random() * 3), rnd(FIELD_R - 330, FIELD_R - 80)); return;
  }
  const foes = units.filter(u => u.side === 0 && u.lane === lane);
  const enemyHeli = foes.filter(u => u.type === 'vrtulnik').length;
  const enemyMachines = foes.filter(u => u.type === 'tank' || u.type === 'delo').length;
  const r = Math.random();
  let want = r < 0.38 ? 'vojak' : r < 0.62 ? 'tank' : r < 0.82 ? 'delo' : 'vrtulnik';
  // reakce na hráče: na vrtulník vojáci, na tanky a děla vrtulník
  if (enemyHeli > 0 && Math.random() < D.smart) want = 'vojak';
  else if (enemyMachines > 0 && Math.random() < D.smart) want = Math.random() < 0.6 ? 'vrtulnik' : 'delo';
  if (s.money >= TYPES[want].cost) deploy(1, want, lane);
  else if (want !== 'vojak' && Math.random() < 0.65) { /* šetří peníze */ }
  else if (s.money >= TYPES.vojak.cost) deploy(1, 'vojak', lane);
}

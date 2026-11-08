'use strict';

/* ====================== Obrazovky ====================== */
function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('show', s.id === id);
}

function startGame(level) {
  Sound.init();
  measure();
  for (const c of S.clocks) c.el.remove();
  field.querySelectorAll('.popup,.banner,.star,.hole,.flash').forEach(e => e.remove());
  Object.assign(S, {
    running: true, paused: false, level, startLevel: level, score: 0, lives: MAX_LIVES,
    combo: 0, hitsInLevel: 0, target: null, clocks: [], spawnTimer: 0.3, sinceTarget: 0, taskTime: 0,
  });
  makeTarget();
  renderHearts(); renderHud();
  showScreen(null);
  banner(`Úroveň ${level}`, levelDesc(level));
}

function pauseGame() {
  if (!S.running) return;
  S.paused = true; showScreen('pauseScreen');
}
function resumeGame() { S.paused = false; showScreen(null); }

function gameOver() {
  S.running = false;
  Sound.over();
  $('finalScore').textContent = S.score;
  $('finalInfo').textContent = `Dosažená úroveň: ${S.level}`;
  $('nameInput').value = lsGet(LS_NAME, '');
  $('saveBox').style.display = S.score > 0 ? '' : 'none';
  lastSavedIdx = -1;
  renderBoard($('boardOver'));
  showScreen('overScreen');
  if (S.score > 0) setTimeout(() => $('nameInput').focus(), 100);
}

let lastSavedIdx = -1;
function saveScore() {
  const name = ($('nameInput').value.trim() || 'Hráč').slice(0, 16);
  lsSet(LS_NAME, name);
  const list = lsGet(LS_SCORES, []);
  const entry = { name, score: S.score, level: S.level, date: new Date().toLocaleDateString('cs-CZ'), id: Date.now() };
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const top = list.slice(0, 10);
  lsSet(LS_SCORES, top);
  lastSavedIdx = top.findIndex(e => e.id === entry.id);
  $('saveBox').style.display = 'none';
  renderBoard($('boardOver'));
}

function renderBoard(el) {
  const list = lsGet(LS_SCORES, []);
  if (!list.length) { el.innerHTML = '<div class="empty">Zatím tu nikdo není. Buď první!</div>'; return; }
  const medals = ['🥇', '🥈', '🥉'];
  el.innerHTML = `<table class="board"><tr><th></th><th>Jméno</th><th>Skóre</th><th>Úroveň</th></tr>` +
    list.map((e, i) => `<tr class="${i === lastSavedIdx ? 'me' : ''}"><td>${medals[i] || (i + 1) + '.'}</td><td>${escapeHtml(e.name)}</td><td>${e.score}</td><td>${e.level}</td></tr>`).join('') +
    `</table>`;
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function renderLevelPicker() {
  const maxL = lsGet(LS_MAXLVL, 1);
  const shown = Math.max(10, maxL);
  selectedLevel = Math.min(Math.max(1, selectedLevel), maxL);
  const p = $('levelPicker'); p.innerHTML = '';
  for (let L = 1; L <= shown; L++) {
    const b = document.createElement('button');
    b.className = 'lvl' + (L === selectedLevel ? ' sel' : '');
    if (L > maxL) { b.disabled = true; b.textContent = '🔒'; b.title = 'Zatím zamčeno'; }
    else { b.textContent = L; b.onclick = () => { selectedLevel = L; renderLevelPicker(); }; }
    p.appendChild(b);
  }
  $('levelDesc').textContent = `Úroveň ${selectedLevel}: ${levelDesc(selectedLevel)}`;
}

function renderSettings() {
  $('h24Toggle').checked = settings.h24;
  $('help24').style.display = settings.h24 ? '' : 'none';
  const p = $('speedPicker'); p.innerHTML = '';
  for (const k of Object.keys(SPEED_LABEL)) {
    const b = document.createElement('button');
    b.className = 'spd' + (settings.speed === k ? ' sel' : '');
    b.textContent = SPEED_LABEL[k];
    b.onclick = () => { settings.speed = k; lsSet(LS_SETTINGS, settings); renderSettings(); };
    p.appendChild(b);
  }
}
$('h24Toggle').onchange = e => { settings.h24 = e.target.checked; lsSet(LS_SETTINGS, settings); renderSettings(); };

function toMenu() {
  S.running = false; S.paused = false;
  for (const c of S.clocks) c.el.remove();
  S.clocks = [];
  $('taskTime').textContent = '--:--';
  $('taskBarFill').style.width = '100%';
  lastSavedIdx = -1;
  renderLevelPicker(); renderSettings(); renderBoard($('boardStart'));
  showScreen('startScreen');
}

/* ---------- ovládání ---------- */
$('playBtn').onclick = () => startGame(selectedLevel);
$('menuBtn').onclick = () => (S.paused ? resumeGame() : pauseGame());
$('resumeBtn').onclick = resumeGame;
$('quitBtn').onclick = toMenu;
$('againBtn').onclick = () => startGame(S.startLevel);
$('toMenuBtn').onclick = toMenu;
$('saveBtn').onclick = saveScore;
$('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveScore(); e.stopPropagation(); });
$('soundBtn').onclick = () => {
  Sound.on = !Sound.on; lsSet(LS_SOUND, Sound.on);
  $('soundBtn').textContent = Sound.on ? '🔊' : '🔇';
};
$('soundBtn').textContent = Sound.on ? '🔊' : '🔇';
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' || e.key === 'p') {
    if (!S.running) return;
    S.paused ? resumeGame() : pauseGame();
  } else if (e.key === 'Enter' && $('startScreen').classList.contains('show')) {
    startGame(selectedLevel);
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && S.running && !S.paused) pauseGame(); });
document.addEventListener('contextmenu', e => e.preventDefault());

// úvod
renderHearts(); renderHud();
toMenu();

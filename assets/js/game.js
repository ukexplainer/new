/* --- AimForce (replaces previous arcade) ---
   An anagram-based puzzle game where players "weave" words from scrambled letters
   to form chains or sentences. Unlock new themes (e.g., mythology, space) as you progress,
   with timed modes and multiplayer word battles. Perfect for quick sessions with endless replayability.
   NOTE: placeholders are unchanged: quantum-canvas, qd-pause, qd-restart, gf_quantum_scores
*/

const canvas = document.getElementById('quantum-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  // maintain canvas resolution if attributes set
  const W = canvas.width = canvas.width || 800;
  const H = canvas.height = canvas.height || 420;

  // UI hooks (placeholders preserved)
  const btnPause = document.getElementById('qd-pause');
  const btnRestart = document.getElementById('qd-restart');

  /* Game state */
  const STATE = {
    running: true,
    over: false,
    score: 0,
    combo: 1,
    comboTimer: 0,
    timeLeft: 90,         // seconds for each run
    themeIndex: 0,
    found: new Set(),
    wordPool: [],         // letters pool (objects with x/y)
    selected: [],         // indexes of selected tiles
    currentWord: '',
  };

  const THEMES = [
    {
      id: 'space',
      name: 'Space',
      letters: 'PLANETS',
      words: ['plan','planet','planets','pan','pet','pets','lap','sat','tan','net','set','ant','lane','plea','lean']
    },
    {
      id: 'myth',
      name: 'Mythology',
      letters: 'OLYMPUS',
      words: ['ply','opus','soup','plus','soup','mop','sum','plys','you','us','my','spum'] // sample small words
    },
    {
      id: 'ocean',
      name: 'Ocean',
      letters: 'CORALBE',
      words: ['coral','coal','oral','car','arc','bar','lab','able','core','race','care']
    }
  ];

  // keep storage key same as original placeholder
  const SCORE_KEY = 'gf_quantum_scores';

  // visuals
  const TILE = { r: 36, gap: 14, font: '24px Inter, sans-serif' };
  const HUD_FONT = '16px Inter, sans-serif';

  // generate letter tiles from theme letters string
  function setupTheme(idx = 0) {
    const theme = THEMES[idx % THEMES.length];
    STATE.themeIndex = idx % THEMES.length;
    STATE.found = new Set();
    STATE.currentWord = '';
    STATE.selected = [];
    STATE.wordPool = [];
    // shuffle letters and place in a row centered
    const lettersArr = theme.letters.split('');
    shuffleArray(lettersArr);
    const totalWidth = lettersArr.length * (TILE.r * 2 + TILE.gap) - TILE.gap;
    const startX = (W - totalWidth) / 2 + TILE.r;
    for (let i = 0; i < lettersArr.length; i++) {
      STATE.wordPool.push({
        ch: lettersArr[i].toUpperCase(),
        x: startX + i * (TILE.r * 2 + TILE.gap),
        y: H / 2,
        used: false
      });
    }
  }

  // small helper: Fisher-Yates
  function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  // pointer interactions
  let pointerDown = false;
  canvas.addEventListener('pointerdown', (e) => {
    pointerDown = true;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    handleTilePick(px, py);
  });
  window.addEventListener('pointermove', (e) => {
    if (!pointerDown) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    handleTilePick(px, py);
  });
  window.addEventListener('pointerup', () => { pointerDown = false; });

  // keyboard: Enter to submit, Backspace to remove last, Space to shuffle selection, T to change theme
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter') submitWord();
    if (e.code === 'Backspace') removeLastLetter();
    if (e.code === 'Space') { e.preventDefault(); clearSelection(); }
    if (e.key.toLowerCase() === 't') { switchTheme(STATE.themeIndex + 1); }
    if (e.key.toLowerCase() === 'p') togglePause();
    if (e.key.toLowerCase() === 'r') restart();
  });

  // bind buttons but keep IDs same
  if (btnPause) btnPause.onclick = togglePause;
  if (btnRestart) btnRestart.onclick = restart;

  function handleTilePick(px, py) {
    if (!STATE.running || STATE.over) return;
    // detect tile under pointer
    for (let i = 0; i < STATE.wordPool.length; i++) {
      const t = STATE.wordPool[i];
      const dx = px - t.x, dy = py - t.y;
      if (dx * dx + dy * dy <= TILE.r * TILE.r) {
        // if not already selected, add; if selected and last, deselect
        const selIndex = STATE.selected.indexOf(i);
        if (selIndex === -1 && !t.used) {
          STATE.selected.push(i);
          t.used = true;
        }
        break;
      }
    }
    rebuildCurrentWord();
  }

  function rebuildCurrentWord() {
    STATE.currentWord = STATE.selected.map(i => STATE.wordPool[i].ch).join('').toLowerCase();
  }

  function removeLastLetter() {
    if (STATE.selected.length === 0) return;
    const idx = STATE.selected.pop();
    STATE.wordPool[idx].used = false;
    rebuildCurrentWord();
  }

  function clearSelection() {
    for (const i of STATE.selected) STATE.wordPool[i].used = false;
    STATE.selected = [];
    rebuildCurrentWord();
  }

  function submitWord() {
    if (!STATE.currentWord) return;
    const theme = THEMES[STATE.themeIndex];
    const valid = theme.words.includes(STATE.currentWord);
    if (valid && !STATE.found.has(STATE.currentWord)) {
      // success
      STATE.found.add(STATE.currentWord);
      const baseScore = STATE.currentWord.length * 10;
      STATE.score += Math.floor(baseScore * STATE.combo);
      STATE.combo++;
      STATE.comboTimer = 5; // seconds to maintain combo
      // small visual feedback handled in render
    } else {
      // invalid or duplicate: small penalty and reset combo
      STATE.score = Math.max(0, STATE.score - 5);
      STATE.combo = 1;
      STATE.comboTimer = 0;
    }
    clearSelection();
  }

  function switchTheme(idx) {
    setupTheme(idx);
  }

  function togglePause() { if (!STATE.over) STATE.running = !STATE.running; }

  function restart() {
    saveScore();
    Object.assign(STATE, {
      running: true, over: false, score: 0, combo: 1, comboTimer: 0, timeLeft: 90, found: new Set(), selected: [], currentWord: ''
    });
    setupTheme(0);
  }

  // timer loop
  let last = performance.now();
  function loop(t) {
    const dt = (t - last) / 1000;
    last = t;
    if (STATE.running && !STATE.over) update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    if (STATE.comboTimer > 0) {
      STATE.comboTimer -= dt;
      if (STATE.comboTimer <= 0) STATE.combo = 1;
    }
    STATE.timeLeft -= dt;
    if (STATE.timeLeft <= 0) {
      STATE.timeLeft = 0;
      STATE.over = true;
      STATE.running = false;
      saveScore();
    }
  }

  function render() {
    // background
    ctx.fillStyle = '#051025';
    ctx.fillRect(0, 0, W, H);

    // title + theme
    const theme = THEMES[STATE.themeIndex];
    ctx.fillStyle = '#eaf4ff';
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText('AimForce', 18, 28);
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#cfe8ff';
    ctx.fillText(`Theme: ${theme.name} (press T to switch)`, 18, 48);

    // HUD: time, score, combo
    ctx.font = HUD_FONT;
    ctx.fillStyle = '#eaf4ff';
    ctx.fillText(`Time: ${Math.ceil(STATE.timeLeft)}s`, W - 140, 28);
    ctx.fillText(`Score: ${Math.floor(STATE.score)}`, W - 140, 48);
    if (STATE.combo > 1) ctx.fillText(`Combo x${STATE.combo}`, W - 140, 68);

    // current word preview
    ctx.font = '22px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(STATE.currentWord.toUpperCase(), W / 2 - ctx.measureText(STATE.currentWord.toUpperCase()).width / 2, H / 2 - 80);

    // draw tiles
    for (let i = 0; i < STATE.wordPool.length; i++) {
      const t = STATE.wordPool[i];
      // tile background
      ctx.beginPath();
      ctx.fillStyle = t.used ? 'rgba(255, 165, 0, 0.95)' : '#0b5b82';
      ctx.arc(t.x, t.y, TILE.r, 0, Math.PI * 2);
      ctx.fill();
      // letter
      ctx.fillStyle = '#fff';
      ctx.font = TILE.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.ch, t.x, t.y);
    }

    // found words list (left column)
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#bde8ff';
    ctx.fillText('Found:', 18, 90);
    ctx.fillStyle = '#9fd8ff';
    let y = 110;
    const foundArr = Array.from(STATE.found);
    for (let i = 0; i < Math.min(foundArr.length, 8); i++) {
      ctx.fillText(foundArr[i], 18, y);
      y += 20;
    }

    // tips and controls (bottom left)
    ctx.fillStyle = '#9fbfd6';
    ctx.fillText('Controls: Click tiles to build word. Enter to submit. Backspace to remove. Space clear. T change theme.', 18, H - 24);

    // messages
    if (STATE.over) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(W / 2 - 220, H / 2 - 70, 440, 140);
      ctx.fillStyle = '#ffdfef';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Time\'s Up!', W / 2, H / 2 - 10);
      ctx.font = '18px Inter, sans-serif';
      ctx.fillStyle = '#ffd6ec';
      ctx.fillText(`Final Score: ${Math.floor(STATE.score)}`, W / 2, H / 2 + 28);
      ctx.textAlign = 'start';
    }
  }

  /* save score to localStorage (placeholder key unchanged) */
  function saveScore() {
    try {
      const list = JSON.parse(localStorage.getItem(SCORE_KEY) || '[]');
      list.push({ name: 'Player', score: Math.floor(STATE.score), ts: Date.now(), theme: THEMES[STATE.themeIndex].id });
      list.sort((a, b) => b.score - a.score);
      localStorage.setItem(SCORE_KEY, JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.error("Could not save score", e);
    }
  }

  // initial setup
  setupTheme(0);
  last = performance.now();
  requestAnimationFrame(loop);
}

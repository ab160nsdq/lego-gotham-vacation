(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const State = Object.freeze({
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    GAMEOVER: 'GAMEOVER',
    VICTORY: 'VICTORY',
    HIGHSCORE: 'HIGHSCORE',
  });

  const HIGHSCORE_KEY = 'boardwalkBashHighScores';
  const MAX_HIGHSCORES = 10;
  const GROUND_Y = HEIGHT - 80;

  const game = {
    state: State.TITLE,
    keys: new Set(),
    score: 0,
    health: 3,
    elapsed: 0,
    lastFrame: 0,
  };

  function loadHighScores() {
    try {
      const raw = localStorage.getItem(HIGHSCORE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn('high score load failed', err);
      return [];
    }
  }

  function saveHighScore(initials, score) {
    const list = loadHighScores();
    list.push({ initials: String(initials).slice(0, 3).toUpperCase(), score, ts: Date.now() });
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, MAX_HIGHSCORES);
    localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(trimmed));
    return trimmed;
  }

  function startGame() {
    game.state = State.PLAYING;
    game.score = 0;
    game.health = 3;
    game.elapsed = 0;
  }

  function onKeyDown(e) {
    game.keys.add(e.code);

    if (game.state === State.TITLE && e.code === 'Space') {
      e.preventDefault();
      startGame();
      return;
    }

    if ((game.state === State.GAMEOVER || game.state === State.VICTORY) && e.code === 'Space') {
      e.preventDefault();
      game.state = State.HIGHSCORE;
      return;
    }

    if (game.state === State.HIGHSCORE && e.code === 'Space') {
      e.preventDefault();
      game.state = State.TITLE;
    }
  }

  function onKeyUp(e) {
    game.keys.delete(e.code);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function update(dt) {
    switch (game.state) {
      case State.TITLE:
        break;
      case State.PLAYING:
        game.elapsed += dt;
        break;
      case State.GAMEOVER:
      case State.VICTORY:
      case State.HIGHSCORE:
        break;
    }
  }

  function clearScreen() {
    ctx.fillStyle = '#06060f';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function drawTitle() {
    clearScreen();

    ctx.fillStyle = '#ffcc33';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEGO Batman: Boardwalk Bash', WIDTH / 2, HEIGHT / 2 - 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('Press Space to Start', WIDTH / 2, HEIGHT / 2 + 20);

    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText('Coney Island — Summer Weekend', WIDTH / 2, HEIGHT - 24);
  }

  function drawBoardwalkPlaceholder() {
    ctx.fillStyle = '#1b1b3a';
    ctx.fillRect(0, 0, WIDTH, GROUND_Y);

    ctx.fillStyle = '#f5b66b';
    ctx.fillRect(0, GROUND_Y - 12, WIDTH, 12);

    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    ctx.strokeStyle = '#5b3a1b';
    ctx.lineWidth = 1;
    for (let x = 0; x < WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${game.score}`, 12, 22);
    ctx.fillText(`Health: ${'♥'.repeat(game.health)}`, 12, 42);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px monospace';
    ctx.fillText('[boardwalk placeholder — physics & sprites next]', WIDTH / 2, HEIGHT / 2);
  }

  function drawEndScreen(title, color) {
    clearScreen();
    ctx.fillStyle = color;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 10);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Final Score: ${game.score}`, WIDTH / 2, HEIGHT / 2 + 24);
    ctx.fillText('Press Space for High Scores', WIDTH / 2, HEIGHT / 2 + 56);
  }

  function drawHighScores() {
    clearScreen();
    const list = loadHighScores();

    ctx.fillStyle = '#ffcc33';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('High Scores', WIDTH / 2, 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    if (list.length === 0) {
      ctx.fillText('No scores yet — be the first!', WIDTH / 2, HEIGHT / 2);
    } else {
      list.forEach((entry, i) => {
        const y = 90 + i * 22;
        ctx.fillText(`${String(i + 1).padStart(2, ' ')}.  ${entry.initials}   ${entry.score}`, WIDTH / 2, y);
      });
    }

    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText('Press Space to return to Title', WIDTH / 2, HEIGHT - 20);
  }

  function render() {
    switch (game.state) {
      case State.TITLE:
        drawTitle();
        break;
      case State.PLAYING:
        drawBoardwalkPlaceholder();
        break;
      case State.GAMEOVER:
        drawEndScreen('GAME OVER', '#ff5555');
        break;
      case State.VICTORY:
        drawEndScreen('YOU WIN!', '#55ff99');
        break;
      case State.HIGHSCORE:
        drawHighScores();
        break;
    }
  }

  function loop(now) {
    const dt = game.lastFrame ? (now - game.lastFrame) / 1000 : 0;
    game.lastFrame = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  window.BoardwalkBash = { State, game, loadHighScores, saveHighScore };
})();

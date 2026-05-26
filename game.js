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

  const GRAVITY = 0.5;
  const JUMP_VY = -10;
  const DOUBLE_JUMP_VY = -8.5;
  const MOVE_SPEED = 4;
  const CROUCH_FACTOR = 0.5;

  const PLAYER_WIDTH = 32;
  const PLAYER_HEIGHT = 48;
  const PLAYER_START_X = 80;

  const game = {
    state: State.TITLE,
    keys: new Set(),
    score: 0,
    health: 3,
    elapsed: 0,
    lastFrame: 0,
  };

  const player = {
    x: PLAYER_START_X,
    y: GROUND_Y - PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    isGrounded: true,
    canDoubleJump: true,
    isCrouching: false,
    facing: 1,
  };

  function getPlayerHeight() {
    return player.isCrouching ? player.height * CROUCH_FACTOR : player.height;
  }

  function setCrouching(next) {
    if (next === player.isCrouching) return;
    const oldH = getPlayerHeight();
    player.isCrouching = next;
    const newH = getPlayerHeight();
    // Anchor feet position when crouch state toggles.
    player.y += (oldH - newH);
  }

  function resetPlayer() {
    player.x = PLAYER_START_X;
    player.width = PLAYER_WIDTH;
    player.height = PLAYER_HEIGHT;
    player.vx = 0;
    player.vy = 0;
    player.isGrounded = true;
    player.canDoubleJump = true;
    player.isCrouching = false;
    player.facing = 1;
    player.y = GROUND_Y - getPlayerHeight();
  }

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
    resetPlayer();
  }

  function tryJump() {
    if (player.isGrounded) {
      player.vy = JUMP_VY;
      player.isGrounded = false;
      return;
    }
    if (player.canDoubleJump) {
      player.vy = DOUBLE_JUMP_VY;
      player.canDoubleJump = false;
    }
  }

  function onKeyDown(e) {
    game.keys.add(e.code);

    if (e.code !== 'Space') return;
    e.preventDefault();

    switch (game.state) {
      case State.TITLE:
        startGame();
        break;
      case State.PLAYING:
        tryJump();
        break;
      case State.GAMEOVER:
      case State.VICTORY:
        game.state = State.HIGHSCORE;
        break;
      case State.HIGHSCORE:
        game.state = State.TITLE;
        break;
    }
  }

  function onKeyUp(e) {
    game.keys.delete(e.code);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function updatePlayer() {
    let dirX = 0;
    if (game.keys.has('ArrowLeft') || game.keys.has('KeyA')) dirX -= 1;
    if (game.keys.has('ArrowRight') || game.keys.has('KeyD')) dirX += 1;
    player.vx = dirX * MOVE_SPEED;
    if (dirX !== 0) player.facing = dirX;

    const wantsCrouch = game.keys.has('ArrowDown') || game.keys.has('KeyS');
    setCrouching(wantsCrouch && player.isGrounded);

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    const h = getPlayerHeight();
    if (player.y + h >= GROUND_Y) {
      player.y = GROUND_Y - h;
      player.vy = 0;
      if (!player.isGrounded) {
        player.isGrounded = true;
        player.canDoubleJump = true;
      }
    } else {
      player.isGrounded = false;
    }

    if (player.x < 0) player.x = 0;
  }

  function update(dt) {
    switch (game.state) {
      case State.TITLE:
        break;
      case State.PLAYING:
        game.elapsed += dt;
        updatePlayer();
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

  function drawPlayer() {
    const w = player.width;
    const h = getPlayerHeight();
    const x = Math.round(player.x);
    const y = Math.round(player.y);

    const BLACK = '#101015';
    const BELT = '#ffcc33';
    const BELT_BUCKLE = '#b8860b';
    const TRUNKS = '#3aa8e8';
    const TRUNKS_SHADOW = '#2683b8';
    const EYES = '#f4f4f4';

    // Sky-blue swim trunks (bottom 30%)
    ctx.fillStyle = TRUNKS;
    ctx.fillRect(x, y + h * 0.70, w, h * 0.30);
    ctx.fillStyle = TRUNKS_SHADOW;
    ctx.fillRect(x, y + h * 0.70, w, h * 0.04);

    // Black torso + cape block (28%–70%)
    ctx.fillStyle = BLACK;
    ctx.fillRect(x, y + h * 0.28, w, h * 0.42);

    // Yellow utility belt sitting on top of the trunks
    ctx.fillStyle = BELT;
    ctx.fillRect(x, y + h * 0.62, w, h * 0.08);
    ctx.fillStyle = BELT_BUCKLE;
    ctx.fillRect(x + w * 0.42, y + h * 0.63, w * 0.16, h * 0.05);

    // Cowl / head (top 30%, slightly narrower)
    ctx.fillStyle = BLACK;
    ctx.fillRect(x + w * 0.08, y, w * 0.84, h * 0.30);

    // White eye slits
    ctx.fillStyle = EYES;
    const eyeY = y + h * 0.14;
    const eyeH = Math.max(2, h * 0.05);
    ctx.fillRect(x + w * 0.26, eyeY, w * 0.18, eyeH);
    ctx.fillRect(x + w * 0.56, eyeY, w * 0.18, eyeH);

    // Tiny black LEGO feet poking out below the trunks
    if (!player.isCrouching) {
      ctx.fillStyle = BLACK;
      ctx.fillRect(x + w * 0.15, y + h * 0.95, w * 0.25, h * 0.05);
      ctx.fillRect(x + w * 0.60, y + h * 0.95, w * 0.25, h * 0.05);
    }
  }

  function drawBoardwalkLevel() {
    // Sky
    ctx.fillStyle = '#1b1b3a';
    ctx.fillRect(0, 0, WIDTH, GROUND_Y);

    // Distant ocean strip
    ctx.fillStyle = '#2b3a8a';
    ctx.fillRect(0, GROUND_Y - 60, WIDTH, 20);

    // Top board (sun-bleached plank surface)
    ctx.fillStyle = '#f5b66b';
    ctx.fillRect(0, GROUND_Y - 12, WIDTH, 12);

    // Boardwalk body
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    // Plank lines
    ctx.strokeStyle = '#5b3a1b';
    ctx.lineWidth = 1;
    for (let x = 0; x < WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }

    drawPlayer();

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${game.score}`, 12, 22);
    ctx.fillText(`Health: ${'♥'.repeat(game.health)}`, 12, 42);
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
        drawBoardwalkLevel();
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

  window.BoardwalkBash = { State, game, player, loadHighScores, saveHighScore };
})();

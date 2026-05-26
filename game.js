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
  const FLIP_SPEED = Math.PI / 8;

  const PLAYER_WIDTH = 32;
  const PLAYER_HEIGHT = 48;
  const PLAYER_START_X = 80;

  // Scoring + damage tuning
  const HOTDOG_SCORE = 10;
  const STRESS_PER_HIT = 20;
  const STRESS_MAX = 100;
  const INVINCIBILITY_DURATION = 1.0; // seconds

  // Entity hitbox dimensions (match the drawn sprites)
  const HOTDOG_WIDTH = 22;
  const HOTDOG_HEIGHT = 10;
  const SEAGULL_WIDTH = 24;
  const SEAGULL_HEIGHT = 14;

  const game = {
    state: State.TITLE,
    keys: new Set(),
    score: 0,
    stress: 0,
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
    isFlipping: false,
    flipAngle: 0,
    isInvincible: false,
    invulnTimer: 0,
  };

  const collectibles = [
    { x: 100, y: 240, type: 'hotdog', collected: false },
    { x: 180, y: 260, type: 'hotdog', collected: false },
    { x: 260, y: 220, type: 'hotdog', collected: false },
    { x: 340, y: 270, type: 'hotdog', collected: false },
    { x: 420, y: 240, type: 'hotdog', collected: false },
    { x: 500, y: 250, type: 'hotdog', collected: false },
    { x: 580, y: 215, type: 'hotdog', collected: false },
    { x: 660, y: 265, type: 'hotdog', collected: false },
    { x: 720, y: 240, type: 'hotdog', collected: false },
    { x: 770, y: 270, type: 'hotdog', collected: false },
  ];

  const enemies = [
    { x: 300, y: 120, type: 'seagull', vx: 1.5, vx_bounds: { min: 200, max: 450 } },
    { x: 650, y: 160, type: 'seagull', vx: -1.5, vx_bounds: { min: 500, max: 750 } },
  ];

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
    player.isFlipping = false;
    player.flipAngle = 0;
    player.isInvincible = false;
    player.invulnTimer = 0;
    player.y = GROUND_Y - getPlayerHeight();
  }

  function resetLevel() {
    for (const c of collectibles) c.collected = false;
  }

  function checkCollision(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  function getPlayerRect() {
    return {
      x: player.x,
      y: player.y,
      width: player.width,
      height: getPlayerHeight(),
    };
  }

  function takeDamage() {
    if (player.isInvincible) return;
    game.stress = Math.min(STRESS_MAX, game.stress + STRESS_PER_HIT);
    player.isInvincible = true;
    player.invulnTimer = INVINCIBILITY_DURATION;
    if (game.stress >= STRESS_MAX) {
      game.state = State.GAMEOVER;
    }
  }

  function handleCollisions() {
    const playerRect = getPlayerRect();

    for (const c of collectibles) {
      if (c.collected) continue;
      const cRect = { x: c.x, y: c.y, width: HOTDOG_WIDTH, height: HOTDOG_HEIGHT };
      if (checkCollision(playerRect, cRect)) {
        c.collected = true;
        game.score += HOTDOG_SCORE;
      }
    }

    if (player.isInvincible) return;
    for (const e of enemies) {
      const eRect = { x: e.x, y: e.y, width: SEAGULL_WIDTH, height: SEAGULL_HEIGHT };
      if (checkCollision(playerRect, eRect)) {
        takeDamage();
        break;
      }
    }
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
    game.stress = 0;
    game.elapsed = 0;
    resetPlayer();
    resetLevel();
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
      player.isFlipping = true;
      player.flipAngle = 0;
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

  function updatePlayer(dt) {
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

    if (player.isFlipping) {
      player.flipAngle += FLIP_SPEED * player.facing;
      if (Math.abs(player.flipAngle) >= Math.PI * 2) {
        player.isFlipping = false;
        player.flipAngle = 0;
      }
    }

    const h = getPlayerHeight();
    if (player.y + h >= GROUND_Y) {
      player.y = GROUND_Y - h;
      player.vy = 0;
      if (!player.isGrounded) {
        player.isGrounded = true;
        player.canDoubleJump = true;
        player.isFlipping = false;
        player.flipAngle = 0;
      }
    } else {
      player.isGrounded = false;
    }

    if (player.x < 0) player.x = 0;

    if (player.isInvincible) {
      player.invulnTimer -= dt;
      if (player.invulnTimer <= 0) {
        player.isInvincible = false;
        player.invulnTimer = 0;
      }
    }
  }

  function updateEnemies() {
    for (const e of enemies) {
      e.x += e.vx;
      if (e.x >= e.vx_bounds.max) {
        e.x = e.vx_bounds.max;
        e.vx = -Math.abs(e.vx);
      } else if (e.x <= e.vx_bounds.min) {
        e.x = e.vx_bounds.min;
        e.vx = Math.abs(e.vx);
      }
    }
  }

  function update(dt) {
    switch (game.state) {
      case State.TITLE:
        break;
      case State.PLAYING:
        game.elapsed += dt;
        updatePlayer(dt);
        updateEnemies();
        handleCollisions();
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
    const OUTLINE = '#f4f4f4';

    ctx.save();
    if (player.isInvincible) {
      // High-frequency alpha pulse for the invincibility flash.
      ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(player.invulnTimer * 18));
    }
    if (player.isFlipping) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(player.flipAngle);
      ctx.translate(-cx, -cy);
    }

    // Sky-blue swim trunks (bottom 30%)
    ctx.fillStyle = TRUNKS;
    ctx.fillRect(x, y + h * 0.70, w, h * 0.30);
    ctx.fillStyle = TRUNKS_SHADOW;
    ctx.fillRect(x, y + h * 0.70, w, h * 0.04);

    // Black torso + cape block (28–70%)
    ctx.fillStyle = BLACK;
    ctx.fillRect(x, y + h * 0.28, w, h * 0.42);

    // Yellow utility belt with buckle
    ctx.fillStyle = BELT;
    ctx.fillRect(x, y + h * 0.62, w, h * 0.08);
    ctx.fillStyle = BELT_BUCKLE;
    ctx.fillRect(x + w * 0.42, y + h * 0.63, w * 0.16, h * 0.05);

    // Cowl + bat ears as a single outlined silhouette so the white stroke
    // wraps the whole head shape and rides through the flip rotation cleanly.
    const earH = h * 0.13;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, y + h * 0.30);
    ctx.lineTo(x + w * 0.08, y);
    ctx.lineTo(x + w * 0.14, y - earH);
    ctx.lineTo(x + w * 0.30, y);
    ctx.lineTo(x + w * 0.70, y);
    ctx.lineTo(x + w * 0.86, y - earH);
    ctx.lineTo(x + w * 0.92, y);
    ctx.lineTo(x + w * 0.92, y + h * 0.30);
    ctx.closePath();
    ctx.fillStyle = BLACK;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();

    // Eye slits (drawn after the outline so they sit on top of the cowl)
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

    ctx.restore();
  }

  function drawHotdog(c) {
    if (c.collected) return;
    const bob = Math.sin(game.elapsed * 3 + c.x * 0.01) * 2;
    const w = HOTDOG_WIDTH;
    const h = HOTDOG_HEIGHT;
    const x = Math.round(c.x);
    const y = Math.round(c.y + bob);

    // Bun top
    ctx.fillStyle = '#d4a064';
    ctx.fillRect(x, y, w, h * 0.4);
    // Sausage
    ctx.fillStyle = '#a83a1f';
    ctx.fillRect(x + 1, y + h * 0.35, w - 2, h * 0.35);
    // Mustard streak
    ctx.fillStyle = '#ffd633';
    ctx.fillRect(x + 2, y + h * 0.48, w - 4, h * 0.1);
    // Bun bottom
    ctx.fillStyle = '#d4a064';
    ctx.fillRect(x, y + h * 0.7, w, h * 0.3);
    // Bun seam highlight
    ctx.fillStyle = '#b8854a';
    ctx.fillRect(x, y + h * 0.32, w, 1);
  }

  function drawSeagull(e) {
    const flap = Math.sin(game.elapsed * 12 + e.x * 0.05) * 2;
    const w = SEAGULL_WIDTH;
    const x = Math.round(e.x);
    const y = Math.round(e.y);
    const dir = e.vx >= 0 ? 1 : -1;

    // Body
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(x + 7, y + 5, 10, 6);
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(x + 7, y + 9, 10, 2);

    // Wings — animated flap via vertical offset on outer tips
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 4 - flap);
    ctx.lineTo(x + 8, y + 7);
    ctx.moveTo(x + w, y + 4 - flap);
    ctx.lineTo(x + 16, y + 7);
    ctx.stroke();

    // Beak
    ctx.fillStyle = '#ff9933';
    if (dir > 0) {
      ctx.beginPath();
      ctx.moveTo(x + 17, y + 6);
      ctx.lineTo(x + 22, y + 8);
      ctx.lineTo(x + 17, y + 9);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + 7, y + 6);
      ctx.lineTo(x + 2, y + 8);
      ctx.lineTo(x + 7, y + 9);
      ctx.closePath();
      ctx.fill();
    }

    // Eye
    ctx.fillStyle = '#101015';
    const eyeX = dir > 0 ? x + 14 : x + 8;
    ctx.fillRect(eyeX, y + 6, 2, 2);
  }

  function drawCollectibles() {
    for (const c of collectibles) drawHotdog(c);
  }

  function drawEnemies() {
    for (const e of enemies) {
      if (e.type === 'seagull') drawSeagull(e);
    }
  }

  function drawHUD() {
    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${game.score}`, 12, 22);

    // Stress meter label
    ctx.fillText('Vacation Stress', 12, 44);

    // Stress bar
    const barX = 12;
    const barY = 50;
    const barW = 180;
    const barH = 12;
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(barX, barY, barW, barH);

    const ratio = Math.min(1, game.stress / STRESS_MAX);
    let fillColor;
    if (game.stress < 40) fillColor = '#55cc77';
    else if (game.stress < 70) fillColor = '#ffcc33';
    else fillColor = '#ff5555';
    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, barW * ratio, barH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.fillText(`${Math.round(game.stress)}%`, barX + barW + 8, barY + 10);
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

    // Level entities
    drawCollectibles();
    drawEnemies();

    // Player
    drawPlayer();

    // HUD on top
    drawHUD();
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

  window.BoardwalkBash = {
    State,
    game,
    player,
    collectibles,
    enemies,
    checkCollision,
    loadHighScores,
    saveHighScore,
  };
})();

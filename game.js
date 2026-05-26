(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Pre-load title-screen backdrop. `complete && naturalWidth > 0` is the
  // defensive check we use at draw time — `complete` alone flips true on
  // load errors too, which would let `drawImage` throw on a broken file.
  const titleBgImage = new Image();
  titleBgImage.src = 'assets/title-bg.png';

  // Background music loop. Plays on first Space-from-TITLE press (which
  // satisfies the browser's user-gesture requirement) and resets to 0
  // whenever we return to the title screen.
  const bgMusic = new Audio('assets/04 All of Us.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.4;

  function stopMusic() {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }

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

  // World extents
  const LEVEL_WIDTH = 3000;
  const LEVEL_END_X = 2800;
  const CAMERA_MAX = LEVEL_WIDTH - WIDTH;

  // Physics
  const GRAVITY = 0.5;
  const JUMP_VY = -10;
  const DOUBLE_JUMP_VY = -8.5;
  const MOVE_SPEED = 4;
  const CROUCH_FACTOR = 0.5;
  const FLIP_SPEED = Math.PI / 8;

  // Player
  const PLAYER_WIDTH = 32;
  const PLAYER_HEIGHT = 48;
  const PLAYER_START_X = 80;

  // Scoring + damage
  const HOTDOG_SCORE = 10;
  const SEAGULL_HIT_SCORE = 50;
  const STRESS_PER_HIT = 20;
  const STRESS_MAX = 100;
  const INVINCIBILITY_DURATION = 1.0;

  // Entity hitbox dimensions
  const HOTDOG_WIDTH = 22;
  const HOTDOG_HEIGHT = 10;
  const SEAGULL_WIDTH = 24;
  const SEAGULL_HEIGHT = 14;

  // Batarangs
  const BATARANG_WIDTH = 14;
  const BATARANG_HEIGHT = 7;
  const BATARANG_SPEED = 8;
  const BATARANG_RANGE = 300;
  const BATARANG_SPIN = 0.55;
  const BATARANG_COOLDOWN = 0.18;

  // Boss zone
  const PENGUIN_X = 2820;
  const FERRIS_CENTER_X = 2900;
  const FERRIS_CENTER_Y = 180;
  const FERRIS_RADIUS = 110;

  const game = {
    state: State.TITLE,
    keys: new Set(),
    score: 0,
    stress: 0,
    elapsed: 0,
    lastFrame: 0,
    initialsEntry: '',
  };

  const camera = { x: 0 };

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
    batarangCooldown: 0,
  };

  function createInitialCollectibles() {
    return [
      // Section 1 — opening run
      { x: 100, y: 250, type: 'hotdog', collected: false },
      { x: 180, y: 270, type: 'hotdog', collected: false },
      { x: 260, y: 240, type: 'hotdog', collected: false },
      { x: 340, y: 270, type: 'hotdog', collected: false },
      { x: 420, y: 220, type: 'hotdog', collected: false },
      { x: 500, y: 250, type: 'hotdog', collected: false },
      // Section 2 — mid pier
      { x: 600, y: 230, type: 'hotdog', collected: false },
      { x: 700, y: 260, type: 'hotdog', collected: false },
      { x: 820, y: 210, type: 'hotdog', collected: false },
      { x: 920, y: 240, type: 'hotdog', collected: false },
      { x: 1040, y: 270, type: 'hotdog', collected: false },
      { x: 1160, y: 230, type: 'hotdog', collected: false },
      { x: 1280, y: 260, type: 'hotdog', collected: false },
      { x: 1380, y: 200, type: 'hotdog', collected: false },
      // Section 3 — deeper pier
      { x: 1500, y: 240, type: 'hotdog', collected: false },
      { x: 1620, y: 270, type: 'hotdog', collected: false },
      { x: 1740, y: 215, type: 'hotdog', collected: false },
      { x: 1860, y: 250, type: 'hotdog', collected: false },
      { x: 1980, y: 230, type: 'hotdog', collected: false },
      { x: 2100, y: 270, type: 'hotdog', collected: false },
      // Section 4 — approach to the Ferris Wheel
      { x: 2220, y: 240, type: 'hotdog', collected: false },
      { x: 2340, y: 210, type: 'hotdog', collected: false },
      { x: 2460, y: 250, type: 'hotdog', collected: false },
      { x: 2580, y: 270, type: 'hotdog', collected: false },
      { x: 2680, y: 230, type: 'hotdog', collected: false },
    ];
  }

  function createInitialEnemies() {
    return [
      { x: 300,  y: 120, type: 'seagull', vx:  1.5, vx_bounds: { min:  200, max:  450 } },
      { x: 650,  y: 160, type: 'seagull', vx: -1.5, vx_bounds: { min:  500, max:  800 } },
      { x: 950,  y: 110, type: 'seagull', vx:  1.3, vx_bounds: { min:  850, max: 1150 } },
      { x: 1350, y: 170, type: 'seagull', vx: -1.5, vx_bounds: { min: 1200, max: 1550 } },
      { x: 1800, y: 130, type: 'seagull', vx:  1.8, vx_bounds: { min: 1650, max: 2000 } },
      { x: 2400, y: 140, type: 'seagull', vx: -1.4, vx_bounds: { min: 2150, max: 2700 } },
    ];
  }

  const collectibles = createInitialCollectibles();
  const enemies = createInitialEnemies();
  const batarangs = [];

  function getPlayerHeight() {
    return player.isCrouching ? player.height * CROUCH_FACTOR : player.height;
  }

  function setCrouching(next) {
    if (next === player.isCrouching) return;
    const oldH = getPlayerHeight();
    player.isCrouching = next;
    const newH = getPlayerHeight();
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
    player.batarangCooldown = 0;
    player.y = GROUND_Y - getPlayerHeight();
  }

  function resetLevel() {
    collectibles.length = 0;
    collectibles.push(...createInitialCollectibles());
    enemies.length = 0;
    enemies.push(...createInitialEnemies());
    batarangs.length = 0;
  }

  function resetWorld() {
    game.score = 0;
    game.stress = 0;
    game.elapsed = 0;
    game.initialsEntry = '';
    camera.x = 0;
    resetPlayer();
    resetLevel();
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

  function handleBatarangCollisions() {
    for (let i = batarangs.length - 1; i >= 0; i--) {
      const b = batarangs[i];
      const bRect = { x: b.x, y: b.y, width: BATARANG_WIDTH, height: BATARANG_HEIGHT };
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const eRect = { x: e.x, y: e.y, width: SEAGULL_WIDTH, height: SEAGULL_HEIGHT };
        if (checkCollision(bRect, eRect)) {
          batarangs.splice(i, 1);
          enemies.splice(j, 1);
          game.score += SEAGULL_HIT_SCORE;
          break;
        }
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
    resetWorld();
    game.state = State.PLAYING;
  }

  function returnToTitle() {
    resetWorld();
    stopMusic();
    game.state = State.TITLE;
  }

  function submitInitialsAndShowHighScores() {
    const initials = game.initialsEntry.length > 0
      ? game.initialsEntry.padEnd(3, 'A')
      : 'AAA';
    saveHighScore(initials, game.score);
    game.initialsEntry = '';
    game.state = State.HIGHSCORE;
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

  function spawnBatarang() {
    if (player.batarangCooldown > 0) return;
    const ph = getPlayerHeight();
    const cx = player.x + player.width / 2;
    const cy = player.y + ph / 2;
    batarangs.push({
      x: cx - BATARANG_WIDTH / 2,
      y: cy - BATARANG_HEIGHT / 2,
      vx: BATARANG_SPEED * player.facing,
      distance: 0,
      spin: 0,
    });
    player.batarangCooldown = BATARANG_COOLDOWN;
  }

  function onKeyDown(e) {
    game.keys.add(e.code);
    if (e.repeat) return;

    // Escape returns to title from PLAYING (ignored in other states)
    if (e.code === 'Escape') {
      if (game.state === State.PLAYING) {
        e.preventDefault();
        returnToTitle();
      }
      return;
    }

    if (game.state === State.TITLE) {
      if (e.code === 'Space') {
        e.preventDefault();
        startGame();
        bgMusic.play().catch(err => console.log('Audio waiting for interaction:', err));
      }
      return;
    }

    if (game.state === State.PLAYING) {
      if (e.code === 'Space') {
        e.preventDefault();
        tryJump();
        return;
      }
      if (e.code === 'KeyX' || e.code === 'KeyJ') {
        e.preventDefault();
        spawnBatarang();
        return;
      }
      return;
    }

    if (game.state === State.GAMEOVER || game.state === State.VICTORY) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        submitInitialsAndShowHighScores();
        return;
      }
      if (e.code === 'Backspace') {
        e.preventDefault();
        if (game.initialsEntry.length > 0) {
          game.initialsEntry = game.initialsEntry.slice(0, -1);
        }
        return;
      }
      if (/^Key[A-Z]$/.test(e.code) && game.initialsEntry.length < 3) {
        e.preventDefault();
        game.initialsEntry += e.code.slice(3);
      }
      return;
    }

    if (game.state === State.HIGHSCORE) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        stopMusic();
        game.state = State.TITLE;
      }
      return;
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

    if (player.batarangCooldown > 0) {
      player.batarangCooldown -= dt;
      if (player.batarangCooldown < 0) player.batarangCooldown = 0;
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

  function updateBatarangs() {
    for (let i = batarangs.length - 1; i >= 0; i--) {
      const b = batarangs[i];
      b.x += b.vx;
      b.distance += Math.abs(b.vx);
      b.spin += BATARANG_SPIN;

      const screenX = b.x - camera.x;
      if (b.distance >= BATARANG_RANGE || screenX + BATARANG_WIDTH < 0 || screenX > WIDTH) {
        batarangs.splice(i, 1);
      }
    }
  }

  function updateCamera() {
    const target = player.x - WIDTH / 2;
    camera.x = Math.max(0, Math.min(CAMERA_MAX, target));
  }

  function update(dt) {
    switch (game.state) {
      case State.TITLE:
        break;
      case State.PLAYING:
        game.elapsed += dt;
        updatePlayer(dt);
        updateEnemies();
        updateBatarangs();
        if (player.x >= LEVEL_END_X) {
          game.state = State.VICTORY;
          break;
        }
        handleBatarangCollisions();
        handleCollisions();
        updateCamera();
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

  function wrapText(text, maxChars) {
    const words = text.split(/\s+/);
    const lines = [];
    let current = '';
    for (const w of words) {
      if (current.length === 0) {
        current = w;
      } else if (current.length + 1 + w.length <= maxChars) {
        current += ' ' + w;
      } else {
        lines.push(current);
        current = w;
      }
    }
    if (current.length > 0) lines.push(current);
    return lines;
  }

  function drawTitle() {
    // High-fidelity menu graphic, with a dark fallback if the image
    // hasn't loaded or 404'd.
    if (titleBgImage.complete && titleBgImage.naturalWidth > 0) {
      ctx.drawImage(titleBgImage, 0, 0, WIDTH, HEIGHT);
    } else {
      ctx.fillStyle = '#0a0b10';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // Full-canvas dark mask so every text element pops with maximum
    // contrast over the title artwork.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Drop-shadow every text run that follows so individual glyphs
    // also read cleanly against any backdrop.
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Premise paragraph
    const premise =
      'BATMAN IS ON VACATION AT CONEY ISLAND, BUT THE PENGUIN HAS RIGGED ' +
      'THE BOARDWALK! COLLECT HOT DOGS TO STAY FUELED, THROW BATARANGS TO ' +
      'BLAST ANNOYING SEAGULLS, AND REACH THE CYCLONE ROLLER COASTER ' +
      'BEFORE YOUR VACATION STRESS HITS 100%!';
    const premiseLines = wrapText(premise, 60);

    ctx.fillStyle = '#f4f4f4';
    ctx.font = '12px monospace';
    let py = 45;
    for (const line of premiseLines) {
      ctx.fillText(line, WIDTH / 2, py);
      py += 16;
    }

    // Controls header
    py += 14;
    ctx.fillStyle = '#ffcc33';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('CONTROLS GUIDE', WIDTH / 2, py);
    py += 22;

    // Controls list — key in yellow, description in white, two-column
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    const controls = [
      ['Left/Right Arrows or A/D', 'Run'],
      ['Space', 'Jump / Double-Jump Flip'],
      ['Down Arrow or S', 'Crouch & Slide Under Obstacles'],
      ['X or J', 'Throw Batarang'],
      ['Esc', 'Return to Main Menu'],
    ];
    const keyX = 160;
    const descX = 400;
    for (const [key, desc] of controls) {
      ctx.fillStyle = '#ffcc33';
      ctx.fillText(`[${key}]`, keyX, py);
      ctx.fillStyle = '#f4f4f4';
      ctx.fillText(`— ${desc}`, descX, py);
      py += 18;
    }

    // Start prompt
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press Space to Start', WIDTH / 2, HEIGHT - 38);

    // Footer
    ctx.fillStyle = '#888888';
    ctx.font = '11px monospace';
    ctx.fillText('Coney Island — Summer Weekend', WIDTH / 2, HEIGHT - 18);

    ctx.restore();
  }

  function drawPlayer() {
    const w = player.width;
    const h = getPlayerHeight();
    const x = Math.round(player.x - camera.x);
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
      ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(player.invulnTimer * 18));
    }
    if (player.isFlipping) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(player.flipAngle);
      ctx.translate(-cx, -cy);
    }

    ctx.fillStyle = TRUNKS;
    ctx.fillRect(x, y + h * 0.70, w, h * 0.30);
    ctx.fillStyle = TRUNKS_SHADOW;
    ctx.fillRect(x, y + h * 0.70, w, h * 0.04);

    ctx.fillStyle = BLACK;
    ctx.fillRect(x, y + h * 0.28, w, h * 0.42);

    ctx.fillStyle = BELT;
    ctx.fillRect(x, y + h * 0.62, w, h * 0.08);
    ctx.fillStyle = BELT_BUCKLE;
    ctx.fillRect(x + w * 0.42, y + h * 0.63, w * 0.16, h * 0.05);

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

    ctx.fillStyle = EYES;
    const eyeY = y + h * 0.14;
    const eyeH = Math.max(2, h * 0.05);
    ctx.fillRect(x + w * 0.26, eyeY, w * 0.18, eyeH);
    ctx.fillRect(x + w * 0.56, eyeY, w * 0.18, eyeH);

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
    const x = Math.round(c.x - camera.x);
    const y = Math.round(c.y + bob);

    if (x + w < 0 || x > WIDTH) return;

    ctx.fillStyle = '#d4a064';
    ctx.fillRect(x, y, w, h * 0.4);
    ctx.fillStyle = '#a83a1f';
    ctx.fillRect(x + 1, y + h * 0.35, w - 2, h * 0.35);
    ctx.fillStyle = '#ffd633';
    ctx.fillRect(x + 2, y + h * 0.48, w - 4, h * 0.1);
    ctx.fillStyle = '#d4a064';
    ctx.fillRect(x, y + h * 0.7, w, h * 0.3);
    ctx.fillStyle = '#b8854a';
    ctx.fillRect(x, y + h * 0.32, w, 1);
  }

  function drawSeagull(e) {
    const flap = Math.sin(game.elapsed * 12 + e.x * 0.05) * 2;
    const w = SEAGULL_WIDTH;
    const x = Math.round(e.x - camera.x);
    const y = Math.round(e.y);
    const dir = e.vx >= 0 ? 1 : -1;

    if (x + w < 0 || x > WIDTH) return;

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(x + 7, y + 5, 10, 6);
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(x + 7, y + 9, 10, 2);

    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 4 - flap);
    ctx.lineTo(x + 8, y + 7);
    ctx.moveTo(x + w, y + 4 - flap);
    ctx.lineTo(x + 16, y + 7);
    ctx.stroke();

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

    ctx.fillStyle = '#101015';
    const eyeX = dir > 0 ? x + 14 : x + 8;
    ctx.fillRect(eyeX, y + 6, 2, 2);
  }

  function drawBatarang(b) {
    const x = Math.round(b.x - camera.x);
    const y = Math.round(b.y);

    if (x + BATARANG_WIDTH < 0 || x > WIDTH) return;

    const cx = x + BATARANG_WIDTH / 2;
    const cy = y + BATARANG_HEIGHT / 2;
    const w = BATARANG_WIDTH / 2;
    const h = BATARANG_HEIGHT / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(b.spin);

    // Bat-symbol silhouette with two wing tips and a center notch.
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(-w * 0.55, -h);
    ctx.lineTo(0, -h * 0.35);
    ctx.lineTo(w * 0.55, -h);
    ctx.lineTo(w, 0);
    ctx.lineTo(w * 0.55, h);
    ctx.lineTo(0, h * 0.35);
    ctx.lineTo(-w * 0.55, h);
    ctx.closePath();
    ctx.fillStyle = '#101015';
    ctx.fill();
    ctx.strokeStyle = '#ffcc33';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  function drawFerrisWheel() {
    const screenX = Math.round(FERRIS_CENTER_X - camera.x);
    const screenY = FERRIS_CENTER_Y;

    if (screenX + FERRIS_RADIUS + 30 < 0 || screenX - FERRIS_RADIUS - 30 > WIDTH) return;

    ctx.fillStyle = '#3a2a4a';
    ctx.fillRect(screenX - 8, screenY, 16, GROUND_Y - screenY - 12);
    ctx.fillRect(screenX - 24, GROUND_Y - 18, 48, 6);

    ctx.strokeStyle = '#a76de0';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(screenX, screenY, FERRIS_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#8a4ec7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX, screenY, FERRIS_RADIUS - 8, 0, Math.PI * 2);
    ctx.stroke();

    const numSpokes = 8;
    const rot = game.elapsed * 0.3;
    const carColors = ['#ffcc33', '#ff5599', '#55cc77', '#5599ff'];
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i / numSpokes) * Math.PI * 2 + rot;
      const cx = screenX + Math.cos(angle) * (FERRIS_RADIUS - 4);
      const cy = screenY + Math.sin(angle) * (FERRIS_RADIUS - 4);

      ctx.strokeStyle = '#a76de0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      ctx.fillStyle = carColors[i % carColors.length];
      ctx.fillRect(cx - 8, cy - 6, 16, 12);
      ctx.strokeStyle = '#101015';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 8, cy - 6, 16, 12);
    }

    ctx.fillStyle = '#3a2a4a';
    ctx.fillRect(screenX - 12, screenY - 12, 24, 24);
    ctx.strokeStyle = '#a76de0';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX - 12, screenY - 12, 24, 24);
  }

  function drawPenguin() {
    const w = 40;
    const h = 52;
    const x = Math.round(PENGUIN_X - camera.x);
    const y = Math.round(GROUND_Y - h);

    if (x + w + 8 < 0 || x - 8 > WIDTH) return;

    ctx.fillStyle = '#101015';
    ctx.fillRect(x + 8, y - 14, w - 16, 12);
    ctx.fillRect(x + 4, y - 4, w - 8, 4);
    ctx.fillStyle = '#8a4ec7';
    ctx.fillRect(x + 8, y - 8, w - 16, 2);

    ctx.fillStyle = '#101015';
    ctx.fillRect(x + 6, y, w - 12, 14);
    ctx.fillRect(x, y + 14, w, h - 18);

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(x + 8, y + 20, w - 16, h - 30);

    ctx.fillStyle = '#ff9933';
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 6);
    ctx.lineTo(x - 2, y + 9);
    ctx.lineTo(x + 6, y + 11);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff5555';
    ctx.fillRect(x + 10, y + 4, 3, 3);

    ctx.fillStyle = '#ffcc33';
    ctx.fillRect(x - 2, y + 22, 4, 12);
    ctx.fillRect(x + w - 2, y + 22, 4, 12);
    ctx.fillRect(x + 4, y + h - 4, 10, 4);
    ctx.fillRect(x + w - 14, y + h - 4, 10, 4);
  }

  function drawCollectibles() {
    for (const c of collectibles) drawHotdog(c);
  }

  function drawEnemies() {
    for (const e of enemies) {
      if (e.type === 'seagull') drawSeagull(e);
    }
  }

  function drawBatarangs() {
    for (const b of batarangs) drawBatarang(b);
  }

  function drawHUD() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${game.score}`, 12, 22);
    ctx.fillText('Vacation Stress', 12, 44);

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

    const remaining = Math.max(0, LEVEL_END_X - Math.round(player.x));
    ctx.textAlign = 'right';
    ctx.font = '12px monospace';
    ctx.fillText(`Cyclone in ${remaining} ft`, WIDTH - 12, 22);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px monospace';
    ctx.fillText('Esc: Main Menu', WIDTH - 12, 40);
  }

  function drawBoardwalkLevel() {
    ctx.fillStyle = '#1b1b3a';
    ctx.fillRect(0, 0, WIDTH, GROUND_Y);

    ctx.fillStyle = '#2b3a8a';
    ctx.fillRect(0, GROUND_Y - 60, WIDTH, 20);

    ctx.fillStyle = '#f5b66b';
    ctx.fillRect(0, GROUND_Y - 12, WIDTH, 12);

    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    ctx.strokeStyle = '#5b3a1b';
    ctx.lineWidth = 1;
    const plankSpacing = 40;
    const startX = -(((camera.x % plankSpacing) + plankSpacing) % plankSpacing);
    for (let x = startX; x < WIDTH; x += plankSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }

    drawFerrisWheel();
    drawPenguin();

    drawCollectibles();
    drawEnemies();
    drawBatarangs();

    drawPlayer();

    drawHUD();
  }

  function drawEndScreen(title, color) {
    clearScreen();

    ctx.fillStyle = color;
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, WIDTH / 2, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Final Score: ${game.score}`, WIDTH / 2, 105);

    ctx.fillStyle = '#ffcc33';
    ctx.font = '14px monospace';
    ctx.fillText('Enter your initials for the leaderboard:', WIDTH / 2, 155);

    // Three slot boxes
    const slotW = 50;
    const slotH = 60;
    const slotGap = 14;
    const totalW = slotW * 3 + slotGap * 2;
    const slotsStartX = (WIDTH - totalW) / 2;
    const slotY = 180;
    const cursorIdx = game.initialsEntry.length;
    const blink = Math.floor(Date.now() / 380) % 2 === 0;

    for (let i = 0; i < 3; i++) {
      const sx = slotsStartX + i * (slotW + slotGap);
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(sx, slotY, slotW, slotH);
      ctx.strokeStyle = i === cursorIdx ? '#ffcc33' : '#5a5a7a';
      ctx.lineWidth = i === cursorIdx ? 3 : 2;
      ctx.strokeRect(sx, slotY, slotW, slotH);

      const letter = game.initialsEntry[i];
      if (letter) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, sx + slotW / 2, slotY + slotH / 2 + 2);
        ctx.textBaseline = 'alphabetic';
      } else if (i === cursorIdx && blink) {
        ctx.fillStyle = '#ffcc33';
        ctx.fillRect(sx + slotW / 2 - 2, slotY + 14, 4, slotH - 28);
      }
    }

    ctx.fillStyle = '#cccccc';
    ctx.font = '12px monospace';
    ctx.fillText('Type 3 letters · Backspace to undo', WIDTH / 2, 275);
    ctx.fillText('Press Enter or Space to submit  (blank = AAA)', WIDTH / 2, 295);

    ctx.fillStyle = '#888888';
    ctx.font = '11px monospace';
    ctx.fillText('Esc returns to the Main Menu without saving', WIDTH / 2, HEIGHT - 18);
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
        drawEndScreen('YOU REACHED THE CYCLONE!', '#55ff99');
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
    camera,
    collectibles,
    enemies,
    batarangs,
    checkCollision,
    loadHighScores,
    saveHighScore,
  };
})();

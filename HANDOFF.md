# Handoff

**Last updated:** 2026-05-26
**Branch:** `feature/core-game-loop`
**Status:** Collision + stress meter committed (`9c027f9`). **Side-scrolling
3000 px world, expanded level (25 hotdogs / 6 seagulls), Ferris Wheel +
Penguin boss-zone backdrop, and `VICTORY` trigger at `x ≥ 2800` live in
working tree** (uncommitted). The level is end-to-end winnable.

## Commit log

- `9c027f9` — *Feat: Implement AABB collision detection, invincibility
  frames, and dynamic three-color HUD stress meter* —
  2 files / +193 −81 lines.
- `ccd683b` — *Feat: Implement double-jump flip matrix, player outline
  stroke, bobbing hotdogs, and patrolling seagulls* —
  2 files / +247 −50 lines.
- `0d132d0` — *Feat: Implement gravity physics, double-jump tracking,
  crouching states, and geometric player sprite rendering* —
  3 files / +229 −58 lines.
- `4cb7e25` — *Feat: Initialize 5-state machine loop, canvas rendering
  context, and keyboard input listeners* — 8 files / +579 lines.

## Just landed this turn — Agent 2 (Physics) + Agent 4 (Level Designer) + Agent 3 (UI)

### Side-scrolling camera (Agent 2)

- New world constants: `LEVEL_WIDTH = 3000`, `LEVEL_END_X = 2800`,
  `CAMERA_MAX = LEVEL_WIDTH - WIDTH = 2200`.
- New `camera = { x: 0 }` — exported on `window.BoardwalkBash.camera`.
- New `updateCamera()` clamps `camera.x` to
  `clamp(player.x - WIDTH/2, 0, CAMERA_MAX)` — Batman stays at the
  screen center until camera hits either bound.
- All world-positioned draws subtract `camera.x` from their screen x:
  `drawPlayer()`, `drawHotdog()`, `drawSeagull()`, `drawFerrisWheel()`,
  `drawPenguin()`. Boardwalk planks tile via `camera.x % 40` so they
  scroll past the screen.
- HUD remains screen-fixed (`drawHUD()` does **not** use `camera.x`).
- Sky and ocean strip stay static (parallax = 0) — gives the level
  a free poor-man's depth effect.
- `startGame()` resets `camera.x = 0`.
- Off-screen culling: hotdogs / seagulls / Ferris / Penguin early-return
  if their screen x is fully outside the canvas.

### Expanded level (Agent 4)

- `collectibles[]` grew from 10 → **25 hotdogs**, distributed across
  four sections of the boardwalk (`x = 100 … 2680`, y bobbing between
  `200` and `270`).
- `enemies[]` grew from 2 → **6 seagulls**, patrolling staggered
  segments from `x = 200` through `x = 2700` at varying `y` (110–170)
  and `vx` magnitudes (1.3–1.8).

### Ferris Wheel + Penguin boss zone (Agent 4 + Agent 3)

- `drawFerrisWheel()` paints a stylized purple Ferris Wheel anchored at
  world `(2900, 180)`, radius `110`: two-tone purple ring, blocky
  central hub, eight rotating spokes (driven by `game.elapsed * 0.3`)
  with alternating yellow/pink/green/blue cars outlined in black, and a
  pole running down to the boardwalk.
- `drawPenguin()` paints a 40×52 blocky Penguin boss at world
  `x = 2820`: top hat with purple band, white belly inside a black
  body block, orange beak pointing left at incoming Batman, sinister
  red eye, yellow flipper arms + feet.
- HUD gained a right-aligned `Cyclone in N ft` readout so the player
  can see how close they are to victory.

### Victory trigger (Agent 3)

- In the `PLAYING` update branch, after movement integration:
  `if (player.x >= LEVEL_END_X) game.state = State.VICTORY` (with a
  `break` so no further collisions land that frame).
- Victory end-screen text changed from generic "YOU WIN!" to
  **"YOU REACHED THE CYCLONE!"**.

## Open for next agent

- **Agent 1 (Git)** — commit current working tree, then push branch
  and open the PR into `main`.
- **Agent 3 (UI)** — 3-letter initials-entry UI on the
  `GAMEOVER / VICTORY → HIGHSCORE` flow so the final score actually
  lands on the `localStorage` leaderboard.
- **Agent 4 (Design)** — more hazard variety (beach balls, bumper
  cars), Batarang power-up, optional mid-level checkpoints, Penguin
  attack pattern instead of a static greeter.
- **Agent 5 (QA)** — full manual run-through: speedrun left-to-right
  without taking damage, confirm camera doesn't overshoot at `x = 0`
  or past `x = 2200`, confirm `VICTORY` fires exactly on first frame
  `player.x ≥ 2800`.

## Verification

```bash
python3 -m http.server 8000   # if not already up
bash scripts/verify-build.sh  # static checks
```

Manual playtest: open `http://127.0.0.1:8000/`, hit Space, then run
Batman to the right. Expected:

- Camera locks Batman at screen center after passing `x = 400`.
- Camera stops moving once it reaches `x = 2200`; Batman walks toward
  the right edge from there.
- 25 hotdogs vanish on touch (+10 each); 6 seagulls patrol staggered
  segments.
- Approaching `x ≈ 2800` reveals the rotating purple Ferris Wheel and
  top-hatted Penguin.
- Crossing `x = 2800` immediately swaps to the
  **"YOU REACHED THE CYCLONE!"** victory screen.
- Stress meter hitting 100% before reaching the Cyclone drops to
  GAME OVER.

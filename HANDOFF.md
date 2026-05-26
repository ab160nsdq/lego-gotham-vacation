# Handoff

**Last updated:** 2026-05-26
**Branch:** `feature/core-game-loop`
**Status:** Visual polish + level population committed (`ccd683b`).
**Interactive gameplay — AABB collision, hotdog scoring, Vacation Stress
Meter, invincibility flash, GAMEOVER trigger — live in working tree**
(uncommitted; ready for next commit). The game is now fully playable
end-to-end (TITLE → PLAYING → GAMEOVER → HIGHSCORE → TITLE).

## Commit log

- `ccd683b` — *Feat: Implement double-jump flip matrix, player outline
  stroke, bobbing hotdogs, and patrolling seagulls* — 2 files /
  +247 −50 lines.
  - Cowl + outward-pointing bat ears drawn as one outlined silhouette
    with a `#f4f4f4` stroke. Double-jump triggers a full-rotation flip
    that wraps the whole sprite via `ctx.save/translate/rotate`.
  - `collectibles[]` (10 floating hotdogs) and `enemies[]` (2
    patrolling seagulls) scaffolded, drawn, and animated.
- `0d132d0` — *Feat: Implement gravity physics, double-jump tracking,
  crouching states, and geometric player sprite rendering* —
  3 files / +229 −58 lines.
- `4cb7e25` — *Feat: Initialize 5-state machine loop, canvas rendering
  context, and keyboard input listeners* — 8 files / +579 lines.

## Just landed this turn — Agent 2 (Physics) + Agent 3 (UI)

### AABB collision (Agent 2)

- New `checkCollision(r1, r2)` — generic rectangle overlap; takes any
  `{x, y, width, height}` pair. Exported on
  `window.BoardwalkBash.checkCollision` for debug poking.
- New `getPlayerRect()` returns the player's live AABB using the
  current crouch-aware height so ducking actually shrinks the hitbox.
- New `handleCollisions()` runs every frame in `PLAYING`:
  - Walks `collectibles[]`, skips already-collected items, tests
    overlap, flags `collected = true` on hit.
  - Walks `enemies[]` (short-circuited if `player.isInvincible`),
    calls `takeDamage()` on first hit and breaks (one stress tick per
    frame max).
- Hitbox constants match the drawn sprites: `HOTDOG_WIDTH=22`,
  `HOTDOG_HEIGHT=10`, `SEAGULL_WIDTH=24`, `SEAGULL_HEIGHT=14`.

### Scoring (Agent 3)

- `HOTDOG_SCORE = 10`. On hotdog overlap, `game.score += 10` and the
  hotdog stops rendering. HUD reads `game.score` every frame, so the
  increment is instant.

### Vacation Stress Meter + damage (Agent 3)

- Replaced `game.health` with `game.stress` (0–100).
  `STRESS_PER_HIT = 20`, `STRESS_MAX = 100`.
- New `takeDamage()` — gated by `player.isInvincible`; bumps stress,
  arms the invuln timer, and switches state to `GAMEOVER` once stress
  hits 100.
- New invincibility flash: `player.isInvincible` + `player.invulnTimer`
  (1.0 s). `updatePlayer(dt)` counts the timer down; while active,
  `drawPlayer()` pulses `ctx.globalAlpha` (0.35–0.75) so Batman visibly
  shimmers through the cooldown.
- `resetPlayer()` clears the invuln state on each `startGame()`.

### HUD redesign (Agent 3)

- New `drawHUD()` paints `Score: N` plus a labeled "Vacation Stress"
  bar (180 × 12 px) with three-color fill — green under 40%, yellow
  40–69%, red 70%+ — outlined in white, with a `NN%` readout to the
  right of the bar.

## Open for next agent

- **Agent 1 (Git)** — commit current working tree, then push branch
  and open the PR into `main`.
- **Agent 3 (UI)** — 3-letter initials-entry UI on the
  `GAMEOVER → HIGHSCORE` flow so the final score actually lands on the
  `localStorage` leaderboard. GAMEOVER + VICTORY screen polish.
- **Agent 4 (Design)** — Cyclone victory trigger zone (player past
  `level_end` flips state to `VICTORY`). Extra hazards / collectibles,
  scoring balance.
- **Agent 2 / Agent 5** — side-scroll camera so the level can extend
  past 800 px and the seagull patrols can spread out.

## Verification

```bash
python3 -m http.server 8000   # if not already up
bash scripts/verify-build.sh  # static checks
```

Manual playtest: open `http://127.0.0.1:8000/`, hit Space, then drive
Batman with arrows/WASD. Expected: hotdogs disappear and the score
ticks +10 on touch; seagulls add +20% to the Vacation Stress bar with a
1-second alpha flash on Batman; stress reaching 100% drops you onto the
GAME OVER screen.

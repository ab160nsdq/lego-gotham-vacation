# Handoff

**Last updated:** 2026-05-26
**Branch:** `feature/core-game-loop`
**Status:** Engine + sprite committed (`0d132d0`). **Player visual polish
and level population (hotdogs + seagulls) live in working tree**
(uncommitted; ready for next commit).

## Commit log

- `0d132d0` — *Feat: Implement gravity physics, double-jump tracking,
  crouching states, and geometric player sprite rendering* —
  3 files / +229 −58 lines.
  - Physics constants: `GRAVITY`, `JUMP_VY`, `DOUBLE_JUMP_VY`,
    `MOVE_SPEED`, `CROUCH_FACTOR`.
  - `player` object (`x`, `y`, `width`, `height`, `vx`, `vy`,
    `isGrounded`, `canDoubleJump`, `isCrouching`, `facing`); reset on
    each `startGame()`.
  - `updatePlayer()` polls run / jump / double-jump / crouch input,
    integrates gravity, pins to `GROUND_Y`, clamps left edge.
  - `drawPlayer()` renders the layered LEGO Batman sprite (black cowl
    + torso, yellow utility belt with buckle, sky-blue swim trunks,
    eye slits, LEGO foot studs).
  - `favicon.ico` rolled in alongside.
- `4cb7e25` — *Feat: Initialize 5-state machine loop, canvas rendering
  context, and keyboard input listeners* — 8 files / +579 lines.

## Just landed this turn — Agent 5 (Visual) + Agent 4 (Level Designer)

### Player sprite polish (`drawPlayer()` in `game.js`)

- Cowl + bat ears redrawn as a single outlined silhouette path so the
  white `#f4f4f4` stroke wraps the whole head shape cleanly. Two
  outward-pointing ear peaks at `~14%` and `~86%` of the player width,
  reaching `13%` of player height above the head block.
- White cowl outline (`lineWidth: 1.5`) cleanly separates Batman from
  the dark sky.
- Double-jump now triggers a **flip-frame rotation**: new
  `player.isFlipping` + `player.flipAngle` state, advanced by
  `FLIP_SPEED = π/8` rad/frame in the direction of `player.facing`.
  Reset on landing. The entire sprite (ears, outline, body, belt,
  trunks) rides the rotation via `ctx.save() / translate / rotate`,
  so the outline stays attached during the flip.

### Level scaffolding (Agent 4)

- New top-level `collectibles` array — 10 hotdog entries shaped
  `{x, y, type: 'hotdog', collected: false}`, distributed across
  `x = 100…770`, `y = 215…270` (floating above the boardwalk).
- New top-level `enemies` array — 2 patrolling seagulls shaped
  `{x, y, type: 'seagull', vx, vx_bounds: {min, max}}`. Seagull 1
  patrols 200→450 at y=120, seagull 2 patrols 500→750 at y=160.
- `updateEnemies()` advances each enemy by `vx`, bounces off
  `vx_bounds.min` / `.max` (no collision against the player yet).
- `drawHotdog()` paints a tan-bun + red-sausage + yellow-mustard
  hotdog with a subtle floaty vertical bob driven by `game.elapsed`.
- `drawSeagull()` paints a white body, animated V-shaped wings
  flapping via a sine of `game.elapsed`, orange beak that flips with
  patrol direction, black eye dot.
- `startGame()` now also calls `resetLevel()` (clears all `collected`
  flags) so a fresh playthrough re-populates the boardwalk.
- `window.BoardwalkBash` debug export now exposes `collectibles` and
  `enemies` arrays.

> Note: no player ↔ entity collision yet — per spec, this turn is pure
> scaffold + render.

## Open for next agent

- **Agent 2 (Physics) follow-up** — AABB collision helper, then wire
  player ↔ hotdog (collect, +score, mark `collected = true`) and
  player ↔ seagull (lose health, brief invuln window).
- **Agent 4 (Design)** — additional hazard types (beach balls, bumper
  cars), Batarang power-up, Cyclone victory trigger zone, scoring
  values balanced.
- **Agent 2 / Agent 5** — side-scroll camera so the level can extend
  past 800px and the seagull patrols can spread out.
- **Agent 3 (UI)** — GAMEOVER / VICTORY polish, 3-letter initials-entry
  UI on HIGHSCORE state.
- **Agent 1 (Git)** — commit current working tree, then push branch
  and open PR into `main` when the slice is merge-ready.

## Verification

```bash
python3 -m http.server 8000   # if not already up
bash scripts/verify-build.sh  # static checks
```

Manual playtest: open `http://127.0.0.1:8000/`, hit Space, then drive
Batman with arrows/WASD. Expected: runs left/right, jumps + double-jumps
on Space, ducks on S/↓, doesn't escape the left edge, doesn't fall
through the boardwalk.

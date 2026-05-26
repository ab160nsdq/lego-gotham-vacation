# Handoff

**Last updated:** 2026-05-26
**Branch:** `feature/core-game-loop`
**Status:** Engine loop committed (`4cb7e25`). **Player physics & sprite live
in working tree** (uncommitted; rolling forward into next commit alongside
the prior HANDOFF tweak).

## Commit log

- `4cb7e25` — *Feat: Initialize 5-state machine loop, canvas rendering
  context, and keyboard input listeners* — 8 files / +579 lines.
  Staged by Agent 1 (Git Manager) after Agent 5's verify pass.

## Just landed this turn — Agent 2 (Physics) + Agent 5 (Visual)

### Physics (`game.js`)

- New constants: `GRAVITY = 0.5`, `JUMP_VY = -10`, `DOUBLE_JUMP_VY = -8.5`,
  `MOVE_SPEED = 4`, `CROUCH_FACTOR = 0.5`, `PLAYER_WIDTH = 32`,
  `PLAYER_HEIGHT = 48`.
- New `player` object with `{x, y, width, height, vx, vy, isGrounded,
  canDoubleJump, isCrouching, facing}`; reset on every `startGame()`.
- Per-frame `updatePlayer()` polls input from `game.keys`:
  - `A` / `D` / `←` / `→` apply ±`MOVE_SPEED` to `vx`.
  - `S` / `↓` toggles crouch when grounded; feet stay anchored to
    `GROUND_Y` via `setCrouching()`.
- `Space` is now state-routed in `onKeyDown`:
  - TITLE → start game
  - PLAYING → `tryJump()` (ground jump → `JUMP_VY`; airborne with
    `canDoubleJump` → `DOUBLE_JUMP_VY`, then locks until landing)
  - GAMEOVER / VICTORY → HIGHSCORE
  - HIGHSCORE → TITLE
- Gravity integrates each frame; ground collision pins `y` to
  `GROUND_Y - h` and resets `canDoubleJump` on landing.
- Boundary clip: `player.x` clamped at left edge (`x >= 0`); ground
  collision prevents falling through bottom.

### Visuals (`game.js`)

- New `drawPlayer()` renders the LEGO Batman sprite as layered geometry:
  black cowl (top 30%, slightly narrower), black torso (28–70%), yellow
  utility belt with darker buckle (62–70%), sky-blue swim trunks with
  waistband shadow (70–100%), white eye-slit pair, two black LEGO foot
  studs (hidden while crouching).
- Boardwalk render gained a distant ocean strip; removed the dev
  "placeholder" overlay text now that the player is on-screen.
- Player exposed on `window.BoardwalkBash.player` for debug poking.

## Open for next agent

- **Agent 4 (Design):** spawn hazard entities (seagulls, beach balls,
  bumper cars), collectibles (tickets, cotton candy), Cyclone victory
  trigger zone. Wire scoring + damage to `game.score` / `game.health`.
- **Agent 3 (UI):** GAMEOVER / VICTORY screen polish, 3-letter
  initials-entry UI on the HIGHSCORE state.
- **Agent 2 (Physics) follow-ups:** side-scroll camera (so the player
  isn't blocked at the right edge implicitly by canvas width), AABB
  collision helper for hazards/collectibles.
- **Agent 1 (Git):** commit current working tree (`HANDOFF.md` +
  `game.js`) before next slice, then push and open PR into `main`.

## Verification

```bash
python3 -m http.server 8000   # if not already up
bash scripts/verify-build.sh  # static checks
```

Manual playtest: open `http://127.0.0.1:8000/`, hit Space, then drive
Batman with arrows/WASD. Expected: runs left/right, jumps + double-jumps
on Space, ducks on S/↓, doesn't escape the left edge, doesn't fall
through the boardwalk.

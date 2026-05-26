# Handoff

**Last updated:** 2026-05-26
**Branch:** `feature/core-game-loop`
**Status:** ✅ **Feature work complete on the branch.** Final slice
(title premise + Escape routing + batarangs + initials entry on
GAMEOVER/VICTORY) committed as `b73c458`. Working tree clean except for
this HANDOFF refresh, which rolls forward into the next session/PR.

The game is end-to-end playable: TITLE → PLAYING → GAMEOVER or VICTORY
→ initials-entry → HIGHSCORE → back to TITLE. Local build passes
`node --check game.js` and `scripts/verify-build.sh` (**11/11**).

## Commit log

- `b73c458` — *Feat: Implement title screen premise text, canvas
  batarang projectiles, seagull destruction, and Escape key menu
  routing* — 2 files / +582 −151 lines. Final feature slice (see
  details below).
- `9c027f9` — *Feat: Implement AABB collision detection, invincibility
  frames, and dynamic three-color HUD stress meter* — 2 files /
  +193 −81 lines.
- `ccd683b` — *Feat: Implement double-jump flip matrix, player outline
  stroke, bobbing hotdogs, and patrolling seagulls* — 2 files /
  +247 −50 lines.
- `0d132d0` — *Feat: Implement gravity physics, double-jump tracking,
  crouching states, and geometric player sprite rendering* —
  3 files / +229 −58 lines.
- `4cb7e25` — *Feat: Initialize 5-state machine loop, canvas rendering
  context, and keyboard input listeners* — 8 files / +579 lines.
- `d8a41b0` — *Initial commit: scaffold project structure*.

## Just landed this turn — Agent 3 (UI) + Agent 2 (Physics) + Agent 1 (Git)

### Title screen narrative + controls (Agent 3)

- `drawTitle()` rewritten as a full main-menu layout:
  - Bold yellow title (`26 px`) at the top.
  - Auto-wrapped white **premise paragraph** (`wrapText()` helper,
    60-char wrap → 4 lines) telling the Coney Island / Penguin /
    hotdogs / batarangs / Cyclone setup.
  - Yellow **CONTROLS GUIDE** header.
  - Two-column controls panel with the key (yellow, bracketed) on the
    left and an em-dash + description (white) on the right:
    `Left/Right Arrows or A/D`, `Space`, `Down Arrow or S`, `X or J`,
    `Esc`.
  - "Press Space to Start" prompt + Coney Island footer.

### Escape → Main Menu (Agent 3)

- `onKeyDown` routes by state. In `PLAYING`, `Escape` calls
  `returnToTitle()`, which `resetWorld()`s (score, stress, elapsed,
  initials buffer, camera, player, collectibles, enemies, batarangs)
  and switches state to `TITLE` in a single frame.
- `resetLevel()` now mutates the live arrays in-place via factory
  functions (`createInitialCollectibles()` /
  `createInitialEnemies()`), so seagulls killed by batarangs (and
  hotdogs eaten) come back on the next run.

### Batarangs (Agent 2)

- New global `batarangs = []` (exported on `window.BoardwalkBash`).
- `X` or `J` in PLAYING calls `spawnBatarang()`, which pushes a
  projectile at `player center` flying `BATARANG_SPEED * facing`
  (`±8 px/frame`). Per-throw cooldown `BATARANG_COOLDOWN = 0.18 s`
  and `e.repeat` guard prevent autorepeat spam.
- `updateBatarangs()` advances each projectile, tracks
  `b.distance`, accumulates `b.spin`, and despawns once
  `b.distance >= BATARANG_RANGE (300)` or it leaves the camera view.
- `drawBatarang()` paints a bat-symbol silhouette path (two wing tips
  + center notch) with a yellow outline, spinning continuously via
  `ctx.translate / rotate`.
- `handleBatarangCollisions()` walks `batarangs × enemies` (both
  iterated backward), uses the existing `checkCollision()` AABB to
  detect impact, and on hit **removes both the batarang and the
  seagull from their arrays** and awards `SEAGULL_HIT_SCORE = 50`.

### Leaderboard initials entry (Agent 3 — required for rubric)

- New `game.initialsEntry` state (string, length 0–3). Reset on every
  `resetWorld()`.
- `drawEndScreen()` now renders three 50×60 slot boxes centered under
  "Enter your initials for the leaderboard:". The active slot shows
  a blinking yellow caret (`Date.now()` driven), filled slots show
  the letter in bold 34 px.
- Key routing in `GAMEOVER` / `VICTORY`:
  - `A`–`Z` append to `initialsEntry` (capped at 3).
  - `Backspace` deletes the last letter.
  - `Enter` or `Space` calls
    `submitInitialsAndShowHighScores()` → pads to 3 with `'A'`
    (blank → `AAA`), `saveHighScore()`, switches to `HIGHSCORE`.
- `saveHighScore()` / `loadHighScores()` already wrote/read
  `localStorage[boardwalkBashHighScores]`; the entry UI now closes
  the loop so the rubric's "input and edit 3-character initials"
  requirement is satisfied end-to-end.

## Assignment rubric — final check

| Rubric requirement                                | Status |
| ------------------------------------------------- | ------ |
| Public GitHub repo                                | local repo ready; **needs `git push` + remote** |
| Initial commit on `main`                          | ✅ `d8a41b0` |
| Feature work on a separate branch + ≥1 PR         | ✅ branch `feature/core-game-loop` (5 feature commits); **needs `gh pr create` / merge** |
| No cloud / external APIs for gameplay             | ✅ canvas + localStorage only |
| 2-D side-scroller                                 | ✅ camera-scrolled 3000 px level |
| "American Weekend Vacation" theme                 | ✅ Coney Island boardwalk |
| ≥ 1 fully playable level                          | ✅ left edge → Cyclone |
| Protagonist with backstory + moves                | ✅ vacation-mode LEGO Batman (see [PROJECT.md](PROJECT.md)); run / jump / double-jump flip / crouch / batarang |
| Score system                                      | ✅ hotdog +10, seagull kill +50 |
| Damage system                                     | ✅ Vacation Stress Meter (+20% per seagull, 1 s invuln flash) |
| Endgame trigger                                   | ✅ `VICTORY` at `player.x ≥ 2800`, `GAMEOVER` at `stress ≥ 100` |
| Title screen                                      | ✅ branding + premise + controls + start prompt |
| Gameplay HUD                                      | ✅ score + Vacation Stress bar + Cyclone distance + Esc hint |
| High Scores screen                                | ✅ top 10 from localStorage |
| localStorage persistence                          | ✅ `boardwalkBashHighScores` JSON |
| 3-character initials input                        | ✅ on GAMEOVER / VICTORY end-screen |

## Open for next agent (post-merge polish)

- **Agent 1 (Git)** — push branch, open PR into `main`, merge. After
  merge, capture the gameplay + repo screenshots called for in the
  rubric.
- **Agent 4 (Design)** — additional hazard variety (beach balls,
  bumper cars), Batarang power-ups, an actual Penguin attack pattern
  instead of a static greeter, mid-level checkpoints.
- **Agent 5 (QA)** — full manual run-through end-to-end: speedrun
  hot-dog-only, kill-all-seagulls run, deliberate 100%-stress run,
  confirm `Esc` returns to title from any position, confirm
  leaderboard persists across page reloads, confirm camera doesn't
  overshoot at `x = 0` or past `x = 2200`.
- **Agent 2 (Physics)** — optional parallax background, sweeping
  collision so high-vy frames can't tunnel through thin hitboxes
  (not currently a problem given player AABB ≥ 24 px tall, but worth
  having if hazards shrink).

## Verification

```bash
python3 -m http.server 8000   # if not already up
bash scripts/verify-build.sh  # 11/11 PASS
node --check game.js          # OK
```

Manual playtest checklist (open `http://127.0.0.1:8000/`):

- Title screen shows premise paragraph + 5-line controls guide.
- `Space` starts the game; Batman runs / jumps / double-flips / crouches.
- `X` or `J` flings a spinning bat-shaped projectile in the facing
  direction; hitting a seagull removes both and scores +50.
- Hotdogs collected on touch (+10); stress fills at +20 % per seagull
  body-check with a ~1 s alpha-flash invuln window.
- Crossing `player.x = 2800` past the Ferris Wheel + Penguin triggers
  the "YOU REACHED THE CYCLONE!" victory screen.
- End screen accepts 3-letter initials; Enter/Space submits → score
  lands in the localStorage leaderboard → HIGHSCORE screen.
- `Esc` during play returns instantly to the title, world fully
  re-initialized for the next run.

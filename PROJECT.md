# LEGO Batman: Boardwalk Bash

A 2-D side-scrolling vacation romp where the Caped Crusader trades cape patrol
for a long weekend at Coney Island. The boardwalk has its share of villainy
— rigged carnival games, runaway bumper cars, dive-bombing seagulls — and
Batman has to make it to the Cyclone roller coaster at the end of the pier
before sunset.

## Story

After foiling the Riddler's twelfth heist of the year, Bruce Wayne decides
he's earned a getaway. He swaps the Batmobile for a beach towel and heads to
Coney Island for a classic American weekend. The moment he steps onto the
boardwalk, something feels off: the Penguin is hawking rigged ring-toss,
the Joker has tampered with the Ferris wheel, and Catwoman has her eye on
the Cyclone's grand prize. Can Batman make it to the front of the line
without losing his cool — or his cotton candy?

## Theme

**American Weekend Vacation** — Coney Island boardwalk, summer afternoon,
neon-and-sea-breeze aesthetic, pixel-LEGO art direction.

## Protagonist

- **Bruce Wayne (LEGO Batman)** in vacation mode — cape over a Hawaiian
  shirt, utility belt swapped for a fanny pack.
- **Backstory:** workaholic billionaire vigilante taking his first weekend
  off in five years. Motivation: ride the Cyclone before the park closes.
- **Moves:** run left/right, jump, mid-air glide (short cape-float).

## Core Mechanics

- **Run** the boardwalk left-to-right.
- **Jump** over hazards (seagull dive-bombs, errant beach balls, sand traps).
- **Collect** carnival tickets and cotton candy for score.
- **Avoid** damage from rogue rides and boardwalk villains.
- **Reach** the Cyclone roller coaster to win the level.

## Controls

| Key            | Action                              |
| -------------- | ----------------------------------- |
| Space          | Start game / advance prompts        |
| ← / →          | Move Batman                         |
| ↑ / W          | Jump (hold for short cape glide)    |
| Enter          | Submit high score initials          |

## Systems

- **Score** — tickets, cotton candy, and defeated boardwalk thugs add points.
- **Health** — 3 hearts; lose one per hazard contact, game ends at zero.
- **Endgame** — reaching the Cyclone triggers `VICTORY`; zero health triggers
  `GAMEOVER`. Both flow into the `HIGHSCORE` entry screen.
- **High Scores** — top 10 entries stored in `localStorage` keyed by
  3-character initials.

## Screens

1. **Title** — branding, start prompt, controls hint.
2. **Playing** — boardwalk level with live HUD (score, health, distance).
3. **Game Over / Victory** — final score, prompt to enter initials.
4. **High Scores** — top 10 leaderboard from `localStorage`.

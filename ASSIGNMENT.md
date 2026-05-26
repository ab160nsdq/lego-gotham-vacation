# Academic Assignment Requirements: 2D Side-Scroller

## 1. Source Code Management & Workflow Constraints

- **GitHub Account:** Must be hosted on a free GitHub.com repository.
- **Initial Commit:** Must contain at least one initial commit directly on
  the `main` branch establishing the baseline project.
- **Pull Request Workflow:** Development of features must happen on a
  separate branch. We must create and successfully merge **at least one
  Pull Request (PR)** into `main`.
- **External Integration:** No cloud storage, external APIs, or internet
  access permitted for gameplay mechanics.

## 2. Core Game Design Requirements

- **Genre:** 2-D side-scrolling game.
- **Theme:** "American Weekend Vacation".
- **Scope:** At least **one fully playable level**.
- **Character Design:**
  - Distinct protagonist with explicit backstory and motivation.
  - Defined set of moves and actions to navigate platforms and obstacles.
- **Game Systems:**
  - Mechanism for scoring points or tracking health.
  - Mechanism for losing points or taking damage.
  - Distinct, triggering **endgame condition** that signifies the
    successful completion of the level.

## 3. Required User Interface Screens

State-switching across at least three main visual contexts:

1. **Title Screen** — branding and a method to start the session.
2. **Gameplay Screen** — the active environment, real-time score/health HUD.
3. **High Scores Summary Screen** — leaderboard of top scores.
   - **Data Persistence:** scores saved locally via browser `localStorage`.
   - **User Input:** players input and edit 3-character initials.

## 4. Final Deliverables Checklist

- [ ] GitHub Repository Link (public, with correct PR history).
- [ ] Game Description (story, controls, mechanics).
- [ ] Gameplay Screenshot.
- [ ] Repository Screenshot.
- [ ] Discussion Post.
- [ ] Classroom Readiness — demo the build in class.

## How this maps to our build

| Requirement              | Implementation                              |
| ------------------------ | ------------------------------------------- |
| 2-D side-scroller        | HTML5 `<canvas>` + vanilla JS               |
| Vacation theme           | Coney Island boardwalk ("Boardwalk Bash")   |
| Protagonist + backstory  | Vacation-mode LEGO Batman, see PROJECT.md   |
| Score + damage           | Tickets/cotton candy + 3-heart health bar   |
| Endgame trigger          | Reaching the Cyclone roller coaster         |
| Title screen             | `TITLE` state                               |
| Gameplay + HUD           | `PLAYING` state                             |
| Leaderboard + initials   | `HIGHSCORE` state, persisted in localStorage|
| PR workflow              | `feature/core-game-loop` → `main`           |

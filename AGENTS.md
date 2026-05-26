# Multi-Agent Collaboration

The build is split across specialized agent roles so Claude Code and Cursor
can parallelize without stepping on each other's commits.

## Roles

| # | Agent              | Focus                                                       |
| - | ------------------ | ----------------------------------------------------------- |
| 1 | Git Manager        | Branching, merges, PR hygiene                               |
| 2 | Physics Engineer   | Game loop, movement, gravity, collision, state machine      |
| 3 | UI Manager         | HTML structure, CSS styling, HUD layout, screen transitions |
| 4 | Game Designer      | Level layout, hazards, scoring rules, balance               |
| 5 | QA Engineer        | Manual playtests, regression checks, `verify-build.sh`      |
| 6 | Liaison            | Documentation, handoffs, status tracking                    |

## Workflow

1. **Agent 1** cuts a feature branch off `main`.
2. **Agents 2–5** implement against the spec on that branch.
3. **Agent 6** keeps `HANDOFF.md` current so the next contributor (human or
   AI) can pick up cold.
4. **Agent 5** runs `scripts/verify-build.sh` against the live preview at
   `http://127.0.0.1:8000/`.
5. **Agent 1** opens the PR and merges to `main` once verification passes.

## Ground rules

- Treat `main` as protected — no direct commits, every change lands via PR.
- Keep changes inside the agent's slice; coordinate cross-slice edits in
  `HANDOFF.md` rather than reaching across roles silently.
- Run the verification script before claiming a slice is "done".
- The preview server (`python3 -m http.server 8000`) is managed by Cursor;
  Claude Code writes files and lets the watcher pick them up.

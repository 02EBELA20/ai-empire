# CHANGELOG

## 0.2.0-m2 — 2026-10-15 (branch claude/m2-prototype)
### Added
- TypeScript project: Vite, Vitest, Three.js. Packages: `economy` (formulas), `sim` (game state, tick, bundle purchase, offline, prestige), `save` (versioned, validated save/load).
- Web prototype (`apps/web`): isometric Three.js scene with animated fans, cables and flowing particles; mobile-first HUD and shop; TAP button; offline-earnings popup; Singularity Reboot; autosave.
- 36 automated tests (economy formulas, parity with the Node simulator baseline, sim rules, offline, prestige, save validation, simulated playthrough).
- `npm run build:single` for a one-file preview build; `?speed=N`, `?fresh`, `?debug` URL options for testing.
### Known gaps
- Not yet tested on a real phone; no screenshot test was possible in the build sandbox.

## 0.1.0-m1 — 2026-10-15
### Added
- Project documentation set: MASTER_PLAN, GAME_DESIGN, ECONOMY, MONETIZATION, TECH_ARCHITECTURE, ART_DIRECTION, ROADMAP, DECISIONS, HANDOFF.
- `packages/data/economy.json`: draft v0 economy configuration.
- `tools/sim/simulate.mjs`: economy simulator (greedy bot with bundle purchases, offline earnings, prestige point estimate).
- `tools/sim/baseline-v0.txt`: first simulation output.

### Decisions
- D-003 (low-poly + glow) and D-004 (neon-tech, friendly proportions) finalized.

### Notes
- No game code yet. No automated tests yet (planned for M2 with Vitest).

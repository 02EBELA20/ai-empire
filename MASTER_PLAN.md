# MASTER PLAN — AI Empire: Neural Network Tycoon

Status: Milestone 1 (Game Design and Technical Planning). Version 0.1.0-m1.

## Vision
An original isometric 3D idle tycoon. The player starts with one basic computer and grows a sprawling AI technology empire. The signature feeling: **one upgrade lights up a whole connected network** — energy and data visibly flow through cables, machines spin up in sequence, income jumps.

## Design pillars
1. **Visible connections.** Every bonus is shown physically (cables, particles, pulses), never only as a number.
2. **Short feedback, long goals.** Seconds: a purchase. Minutes: a network change. Hours/days: new tech and prestige.
3. **Idle-friendly, never pushy.** Fully playable without paying; ads are optional rewards.
4. **Original identity.** Fictional companies and products only. No real brand names. Distinct network-graph mechanic.
5. **Mobile first.** Mid-range Android is the performance baseline.
6. **Deterministic and data-driven.** The simulation is pure logic; all balance values live in data files.

## Hard rules
- No paid AI APIs in gameplay. All "AI" businesses are simulated by deterministic formulas.
- No real crypto payouts or real-money mining.
- No mandatory ads, no aggressive pay-to-win.
- No giant single-file build; modular TypeScript packages.

## Scope
- MVP (M2-M3): see GAME_DESIGN.md section "MVP scope".
- Later: Device Fusion, more AI product lines, missions, seasons, iOS.

## Document map
GAME_DESIGN.md · ECONOMY.md · MONETIZATION.md · TECH_ARCHITECTURE.md · ART_DIRECTION.md · ROADMAP.md · DECISIONS.md · CHANGELOG.md · HANDOFF.md

## Collaboration protocol (Claude + ChatGPT via GitHub)
- `main` is stable. Feature work on `claude/<topic>` or `gpt/<topic>` branches. Never overwrite the other assistant's unmerged branch.
- Read HANDOFF.md and DECISIONS.md at the start of every session; update them at the end.
- Any decision that matters is written to DECISIONS.md as `D-xxx`. Chat history is not shared between assistants.
- Never claim something was tested/committed unless it actually was.

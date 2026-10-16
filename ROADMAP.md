# ROADMAP — AI Empire

Durations are rough estimates for part-time work and will shift.

| Milestone | Goal | Estimate | Exit criteria |
|---|---|---|---|
| M1 Design and Planning | docs, repo, economy simulator | ~1 week | docs approved, sim runs, repo on GitHub |
| M2 Playable Core Prototype | TS/Three.js project, 1 room, 2-3 devices, buy/upgrade, save, performance test on real Android | 3-4 weeks | playable loop; **go/no-go on tech stack** |
| M3 Connection Network and Economy | 6 devices, power/cooling/hub solver, auto-connect, economy tests | ~3 weeks | network understood in 5 min; economy tests pass |
| M4 Visual Upgrade System | GLB devices, 4 stages, cable particles, upgrade animations | ~4 weeks | visual evolution visible, perf budget met |
| M5 AI Products and Automation | text AI line, research tree, manager, offline, prestige | ~3 weeks | first prestige reachable, mid-game filled |
| M6 Retention and Monetization | rewarded ads, cosmetic IAP, analytics, tutorial, missions | ~3 weeks | D1/D7 measured in test group |
| M7 Mobile Optimization and Testing | device matrix, memory/battery, QA | ~3 weeks | 30+ FPS on mid-range, crash-free |
| M8 Public Release Preparation | store assets, policies, soft launch | ~2 weeks | store-ready build |

Total ≈ 5-6 months.

## Immediate next steps (after M1 approval)
1. Approve docs and open decisions in DECISIONS.md.
2. Initialize the TS monorepo (Vite + Vitest, no extra deps).
3. Port the economy formulas into `packages/economy` with unit tests identical to the Node simulator.
4. Build the minimal isometric scene and measure FPS on a real Android phone.

## Risk register
| Risk | Mitigation |
|---|---|
| WebView 3D performance | early device test, quality tiers, go/no-go gate |
| Network mechanic too complex | auto-connect, Optimize button, bottleneck hints |
| Mid-game plateau | research tree, extra tier, AI product line (see ECONOMY findings) |
| Asset production time | modular kit, 6-8 devices for MVP |
| Monetization too early | measure retention first |
| Similarity to existing idle miners | original network-graph mechanic, fictional brands |

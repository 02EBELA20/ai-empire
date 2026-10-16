# ECONOMY — AI Empire (draft v0)

All numbers live in `packages/data/economy.json`. Code must never hardcode them. The simulator `tools/sim/simulate.mjs` reads the same file.

## Formulas
- Cost: `cost(level) = baseCost * growth^level`
- Producer income: `baseIncome * level * milestoneMult(level)`; milestoneMult doubles at levels 25, 50, 100, 200, 400.
- Efficiency: `eff = min(powerSat, coolingSat)`, `sat = min(1, supply/demand)`; starter room gives free supply (power 10, cooling 8).
- Network bonus: `link = 1 + min(1.0, 0.02 * hubLevel)`.
- Total income: `sum(producerIncome) * eff * link * prestigeMult`.
- Prestige: `NP = floor(k * sqrt(lifetime / T))` with k=1, T=2e7; each NP = +2% income (not yet applied in sim).
- Offline: 60% of income rate, capped at 4 h.

## Device parameters (v0)
| Device | Base cost | Growth | Income/level | Power | Heat | Unlock (lifetime Credits) |
|---|---|---|---|---|---|---|
| Basic PC | 10 | 1.10 | 0.5 | 0.15 | 0.10 | 0 |
| Power Gen | 300 | 1.12 | supplies 8 | | | 150 |
| Cooling | 500 | 1.12 | supplies 6 | | | 300 |
| GPU Rack | 2,500 | 1.13 | 4 | 2.5 | 2.0 | 1,500 |
| Network Hub | 20,000 | 1.15 | +2% network | | | 40,000 |
| AI Core | 150,000 | 1.17 | 60 | 12 | 8 | 2,000,000 |

## Simulation v0 (greedy bot, 3 sessions/day x 15 min, 7 days)
Full output: `tools/sim/baseline-v0.txt`. Summary:

- First GPU Rack: ~6.4 min of play. Hub: 15 min. AI Core: 30 min.
- Lifetime Credits: day 1 ≈ 7.5M, day 3 ≈ 321M, day 7 ≈ 1.8B.
- Prestige points available: first NP on day 2, 9 NP by day 7.

## Findings
1. **Mid-game plateau after day 4.** Hub caps at level 50 and there is no new tier, so income flattens. Needs: research tree, a 4th producer tier or AI product line, and prestige reset in that window.
2. **Infrastructure is invisible to naive ROI.** Power/Cooling give no income alone; the simulation bot only progressed after bundle purchases were added. Real players need the same help in UI.
3. **Milestone doublings dominate growth.** They are the main source of "wow" jumps but also the main inflation risk; tune the multiplier and level thresholds first.
4. **Early pace is plausible but unvalidated.** The bot buys perfectly every second; real players are slower, so real progression will be slower than this table.

## Not modelled yet
Taps, Research Points and research effects, managers, AI product income, ad boosts, prestige multiplier, real-player inefficiency, big-number overflow (needs a big-number library past 1e308; none used yet).

## Tuning workflow
Edit `economy.json` → run `node tools/sim/simulate.mjs` (flags: `--days --sessions --minutes --json`) → compare with the pacing targets in GAME_DESIGN.md → record changes in CHANGELOG.md.

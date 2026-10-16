# GAME DESIGN — AI Empire

## 1. Core loop
- **Micro (seconds):** tap/collect, watch flow, income ticks up.
- **Meso (minutes):** earn Credits, upgrade or buy a device, connect it, remove the current bottleneck, income jumps.
- **Macro (hours/days):** research, new device tiers, AI products, managers, offline returns, Prestige ("Singularity Reboot").

Master loop: Earn → Upgrade → Connect → Optimize → Unlock → Automate → Expand → Prestige.

## 2. Currencies (MVP)
| Currency | Role |
|---|---|
| Credits | soft currency, buys devices/levels |
| Research Points (RP) | produced by a Research Lab device, spent in the tech tree |
| Neural Points (NP) | prestige currency, permanent global multiplier |

No premium/hard currency in MVP. If one is added later it is cosmetic-only.

## 3. Devices (MVP: 6)
| Device | Role | Notes |
|---|---|---|
| Basic PC | producer | first device, cheap, linear income |
| Power Generator | power supply | feeds producers |
| Cooling Unit | cooling supply | removes heat from producers |
| GPU Rack | producer | main mid-game income, heavy power/heat |
| Network Hub | multiplier | boosts connected devices (diminishing, capped) |
| AI Core | producer + compute | top tier, unlocks AI product lines |

Each device: levels, milestone doublings at levels 25/50/100/200/400, and 4 visual stages (see ART_DIRECTION.md).

## 4. Network mechanics
**Resources:** Power (kW), Cooling (heat dissipation), Data (bandwidth, MVP: represented via Hub bonus).

**Ports:** every device has typed ports (Power In/Out, Data In/Out, Cooling In). Connections are cables between compatible ports.

**Efficiency:** `eff = min(powerSat, coolingSat)` where `sat = min(1, supply/demand)`. Producer output is multiplied by `eff`. A throttled network is shown visibly (yellow/red cables, slower fans) and a **bottleneck indicator** points at the limiting resource.

**Auto-connect by default.** New devices attach to the nearest valid source automatically. Manual rewiring is optional and never required to progress. An **Optimize** button re-solves the layout for best efficiency.

**Synergies (examples, tunable):**
- GPU with connected Cooling: removes throttle (and later +25% bonus).
- Network Hub: +2% income per level on connected devices, capped at +100%.
- GPU cluster feeding an AI Core: raises Compute capacity.

**Anti-complexity rules:** bonuses use diminishing returns; the graph is recomputed only when it changes (dirty flag), not every tick; complexity is optional depth, not a gate.

**Key finding from sim v0:** infrastructure devices produce no income by themselves, so a naive "best ROI" player never buys them. The UI must therefore show "this GPU needs +1 Cooling" and offer a one-tap **bundle purchase** (device + required infrastructure).

## 5. Simulated AI companies and products
All fictional, all deterministic. Examples of in-game names (placeholders): *Chatter* (text AI), *Pixelia* (image AI), *Motionly* (video AI), *Vocalis* (voice AI), *Mechano* (robotics AI).

Each product line has: compute requirement, running cost per second, price per request, demand curve (grows with research and reputation). Output = f(compute allocated, level, research). No network calls, no real inference.

MVP: only the text AI line ("Chatter").

## 6. Research (MVP: ~15-20 nodes)
Costs RP. Branches: Efficiency (power/heat), Throughput (income), Networking (hub, auto-connect), Automation (managers), Offline (cap/rate). Provides the long-term goals that fill the mid-game.

## 7. Automation and managers
One manager per device type. Auto-buys the cheapest sensible level at a configurable threshold. Unlocked via research or Credits. MVP: 1 manager (auto-upgrade producers).

## 8. Offline earnings
Income at ~60% of active rate, capped at 4 hours base. Cap extended by research and by an optional rewarded ad. Sim and offline share the same pure functions so results are testable.

## 9. Prestige — "Singularity Reboot"
`NP = floor(k * sqrt(lifetimeCredits / T))`, each NP gives +2% global income. Resets devices, credits and levels; keeps research partially and all cosmetics. First prestige target: day 2-3 of casual play.

## 10. Later systems (post-MVP)
Device Fusion, extra AI lines, missions/challenges, seasonal events.

## 11. MVP scope
**In:** 1 zone (room growing into a small server hall), 6 devices, 3 connection types, 3 currencies, 1 AI product, 15-20 research nodes, 1 manager, offline earnings, first prestige, versioned save/load, economy and save tests, web prototype and first Android build.

**Out:** Fusion, other AI lines, missions, seasons, real ad/IAP SDKs (interfaces only), iOS.

**MVP success criteria:** network idea understood within 5 minutes; a 30-minute session is engaging; stable 30+ FPS on a real mid-range Android.

## 12. Pacing targets
First upgrade 10-20 s · first new device 3-5 min · first network link ~10 min · first research ~15 min · first prestige 2-3 days casual.

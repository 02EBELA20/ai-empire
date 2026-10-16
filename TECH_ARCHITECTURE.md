# TECH ARCHITECTURE — AI Empire

## Stack (provisional, see D-001)
- TypeScript, Vite, Three.js (rendering)
- UI: plain DOM + TypeScript (D-011), not rendered inside the 3D canvas
- Mobile wrapper: Capacitor (Android first)
- Tests: Vitest
- Assets: GLB with Meshopt/Draco compression and KTX2 textures
- Big numbers: add a big-number library only when values approach 1e300 (not yet needed)

**Go/no-go gate (end of M2):** if the Three.js + WebView prototype cannot hold 30 FPS on a real mid-range Android, re-evaluate Godot or Unity. This is the biggest technical risk.

## Package layout (monorepo)
```
packages/
  data/          JSON configs (devices, research, economy)
  sim/           pure TS simulation, no DOM/Three.js, deterministic, fixed tick
  economy/       formulas, balancing helpers (shared by sim and tools)
  render/        Three.js scene, instancing, animations, camera
  ui/            HUD, panels, shop, research
  save/          versioned save format + migrations
  assets/        asset manager, loaders, LOD, caching
  monetization/  AdService / PurchaseService interfaces (stubs first)
  analytics/     event interface, no-op implementation first
  platform/      Capacitor bridges (haptics, storage, lifecycle)
tools/
  sim/           balance simulator (Node)
```

## Principles
1. **Simulation is separate from rendering.** Fixed timestep, pure functions, testable in Node.
2. **Same code for offline and online earnings.** Offline = fast-forward the sim with the offline rate.
3. **Data-driven.** Balance in JSON; code reads it via typed loaders with validation.
4. **Dirty-flag network solver.** Recompute efficiency only when the graph or levels change.
5. **Versioned saves.** `saveVersion` field + migration functions; round-trip tests.
6. **No monolith.** No single giant HTML file.
7. **Dependencies minimal.** Ad/IAP SDKs added only in M6.

## Performance budget (mid-range Android)
- < 100 draw calls, < 150k triangles in view, instancing for repeated parts, texture atlases
- Target 30 FPS stable, 60 FPS on high-end; dynamic quality tiers (shadows, particles, resolution scale)
- Pause/throttle rendering when the app is backgrounded; battery-friendly idle mode

## Testing
- Unit tests: income, costs, efficiency, prestige, offline, save/load migrations.
- Property checks: income never negative, never NaN, monotonic with levels.
- Balance regression: sim script output compared against pacing targets.
- Device tests: real Android FPS/thermal checks each milestone from M2.

## Anti-cheat (light)
Offline time validated with a server timestamp (when a backend exists) plus capped offline hours; client-side clock rollback detection. No server-authoritative economy in MVP.

## Open technical questions
- Native vs Capacitor plugins for ads/IAP in M6.
- Whether to add a minimal backend before launch (time check, analytics).

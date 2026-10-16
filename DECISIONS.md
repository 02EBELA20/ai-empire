# DECISIONS

Format: **D-xxx — Topic — Decision — Reason — Date — Status**

**D-001 — Tech stack — TypeScript + Vite + Three.js + Capacitor, with a go/no-go performance test at the end of M2 — Best fit for web prototype, mobile packaging and AI/GitHub collaboration; real Android performance is the biggest risk — 2026-10-15 — Accepted (owner approved plan)**

**D-002 — MVP scope — 6 devices, 1 AI product line, Device Fusion and extra AI lines postponed — Protects the core loop and schedule — 2026-10-15 — Accepted**

**D-003 — Visual style — Stylized low-poly with emissive glow (not realistic) — Mid-range phone performance, fast asset production, and glow/energy-flow readability (the core 'wow' moment); realistic style rejected on performance and production cost — 2026-10-15 — FINAL (owner delegated the choice to Claude's recommendation).**

**D-004 — Tone — Clean neon-tech with friendly proportions — Fits the AI theme without feeling cold, stays readable on small screens, and differentiates from existing idle-miner visuals — 2026-10-15 — FINAL (owner delegated the choice to Claude's recommendation).**

**D-005 — Platform order — Android first, iOS later — Lower cost, faster iteration — 2026-10-15 — Accepted**

**D-006 — Brands — Fictional companies/products only; no real AI or hardware brand names — Legal safety, originality — 2026-10-15 — Accepted**

**D-007 — Currencies — Credits, Research Points, Neural Points; no premium currency in MVP — Simplicity — 2026-10-15 — Accepted**

**D-008 — Network UX — Auto-connect by default, manual rewiring optional, Optimize button, bundle purchase of device + required infrastructure — Idle players should not solve puzzles; sim v0 showed infrastructure is skipped otherwise — 2026-10-15 — Accepted**

**D-009 — Monetization sequencing — Measure retention before adding ad/IAP SDKs; rewarded ads first, then cosmetics — Avoid hurting retention — 2026-10-15 — Accepted**

**D-010 — Repository — github.com/02EBELA20/ai-empire is the source of truth; `main` stable, work on `claude/*` and `gpt/*` branches — Shared state between assistants — 2026-10-15 — Accepted**

**D-011 — UI layer — Plain DOM/TypeScript for the prototype, no UI framework — Smaller bundle, zero extra dependencies, easy to swap later; the HUD is simple enough — 2026-10-15 — Accepted (revisit if UI grows)**

**D-012 — Preview build — `vite build --mode single` inlines everything into one HTML for quick sharing/previews; the normal build stays multi-file — The source stays modular (no monolith); the single file is only a build artifact — 2026-10-15 — Accepted**

**D-013 — Texture atlases — One atlas per device family (6 families: 512–1K each, all four stages share it) plus one environment atlas, not a single shared 1K atlas — At 128 px/m a single 1K atlas holds ~64 m² of unique surface but the 24 device models need ~500 m²; per-family atlases keep draw calls low because each (device, stage) is one InstancedMesh with one material — 2026-10-16 — Accepted (owner delegated; revisit after the gpu_rack vertical slice is measured on a real phone)**

**D-014 — Base expansion — The workshop grows with run progress, driven by data in economy.json: 8x8 at start, 12x12 at the Network Hub unlock (lifetime 40K), 18x18 at the AI Core unlock (lifetime 2M), 24x24 campus kept permanently after the first prestige (Neural Points >= 1) — Starter interior is 36 tiles while a maxed device set needs 51, so growth must coincide with unlocks; lifetime credits are the existing unlock axis, and the prestige reward becomes visible — 2026-10-16 — Accepted as a placeholder (thresholds to be tuned with the simulator in M4; expansion is cosmetic space only, no new income)**

**D-015 — Instancing rule for M4 art — Merge each model to one mesh/material and use one InstancedMesh per (device id, stage); fans and the cable/particle systems are instanced too; per-instance state (throttled, just-built) goes through an instanced attribute — Keeps device draw calls around 10 instead of 45-75 and protects the 100 draw-call cap — 2026-10-16 — Accepted**

**D-016 — Geometry compression and preview assets — Meshopt only (no Draco); KTX2 only for the final build; the browser preview uses uncompressed GLB plus PNG/WebP atlases because the single-file artifact cannot load the Basis transcoder — Smaller decoder, one pipeline to pin, and previews keep working — 2026-10-16 — Accepted**

**Pending decision (needs owner approval of the final visual direction): art direction V2 (industrial workshop, `docs/art/` on branch `gpt/art-direction`) would supersede D-003/D-004 (neon low-poly) and the root ART_DIRECTION.md. Not applied yet.**

## Open questions
- Whether a minimal backend is needed before launch.
- Final game name/store title and trademark check.

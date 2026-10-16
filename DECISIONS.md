# DECISIONS

Format: **D-xxx — Topic — Decision — Reason — Date — Status**

**D-001 — Tech stack — TypeScript + Vite + Three.js + Capacitor, with a go/no-go performance test at the end of M2 — Best fit for web prototype, mobile packaging and AI/GitHub collaboration; real Android performance is the biggest risk — 2026-10-15 — Accepted (owner approved plan)**

**D-002 — MVP scope — 6 devices, 1 AI product line, Device Fusion and extra AI lines postponed — Protects the core loop and schedule — 2026-10-15 — Accepted**

**D-003 — Visual style — Stylized low-poly with emissive glow (not realistic) — Mid-range phone performance, fast asset production, and glow/energy-flow readability (the core 'wow' moment); realistic style rejected on performance and production cost — 2026-10-15 — FINAL (owner delegated the choice to Claude's recommendation).**

**D-004 — Tone — Clean neon-tech with friendly proportions — Fits the AI theme without feeling cold, stays readable on small screens, and differentiates from existing idle-miner visuals — 2026-10-15 — FINAL (owner delegated the choice to Claude's recommendation).; AMENDED 2026-10-16 by explicit owner approval: the tone is now Premium Industrial Sci-Fi with controlled neon accents (Visual Direction V2): detailed industrial machinery, believable materials, visible mechanical components and restrained emissive lighting. The stylized 3D approach of D-003 is preserved. Original tone was clean neon-tech with friendly proportions**

**D-005 — Platform order — Android first, iOS later — Lower cost, faster iteration — 2026-10-15 — Accepted**

**D-006 — Brands — Fictional companies/products only; no real AI or hardware brand names — Legal safety, originality — 2026-10-15 — Accepted**

**D-007 — Currencies — Credits, Research Points, Neural Points; no premium currency in MVP — Simplicity — 2026-10-15 — Accepted**

**D-008 — Network UX — Auto-connect by default, manual rewiring optional, Optimize button, bundle purchase of device + required infrastructure — Idle players should not solve puzzles; sim v0 showed infrastructure is skipped otherwise — 2026-10-15 — Accepted**

**D-009 — Monetization sequencing — Measure retention before adding ad/IAP SDKs; rewarded ads first, then cosmetics — Avoid hurting retention — 2026-10-15 — Accepted**

**D-010 — Repository — github.com/02EBELA20/ai-empire is the source of truth; `main` stable, work on `claude/*` and `gpt/*` branches — Shared state between assistants — 2026-10-15 — Accepted**

**D-011 — UI layer — Plain DOM/TypeScript for the prototype, no UI framework — Smaller bundle, zero extra dependencies, easy to swap later; the HUD is simple enough — 2026-10-15 — Accepted (revisit if UI grows)**

**D-012 — Preview build — `vite build --mode single` inlines everything into one HTML for quick sharing/previews; the normal build stays multi-file — The source stays modular (no monolith); the single file is only a build artifact — 2026-10-15 — Accepted**

**D-013 — Texture atlases — Start with ONE shared 1024x1024 atlas for the vertical slice (gpu_rack, power_gen, cooling, floor tiles); move to per-family atlases or 2048x2048 only when measurement shows a clear benefit and mobile performance holds — Follows ChatGPT's recommendation. The 128 px/m math says one 1K atlas cannot hold all 24 models (~64 m² vs ~500 m²), so a split is expected before full six-device coverage; decide at that review gate with real texel-density numbers — 2026-10-16 — Accepted (amended the same day; first written as 'one atlas per family')**

**D-014 — Base expansion — The workshop grows with run progress, driven by data in economy.json: 8x8 at start, 12x12 at the Network Hub unlock (lifetime 40K), 18x18 at the AI Core unlock (lifetime 2M), 24x24 campus kept permanently after the first prestige (Neural Points >= 1) — Starter interior is 36 tiles while a maxed device set needs 51, so growth must coincide with unlocks; lifetime credits are the existing unlock axis, and the prestige reward becomes visible — 2026-10-16 — Accepted as a placeholder (thresholds to be tuned with the simulator in M4; expansion is cosmetic space only, no new income); AMENDMENT 2026-10-16: only the 8x8 -> 12x12 -> 18x18 steps reuse the existing unlock thresholds and change no balance. Keeping the 24x24 campus after the first prestige is a NEW perk and is NOT accepted until the owner approves it. Thresholds stay placeholders; OWNER DECISION 2026-10-16: the prestige-persistent 24x24 campus is DEFERRED. Do not implement it; the existing expansion behavior stays as it is (no expansion system is implemented yet beyond the ground slab growing with the base). Only the 8x8 -> 12x12 -> 18x18 steps remain proposed for M4**

**D-015 — Instancing — Use InstancedMesh only for repeated geometry with compatible materials (several racks at the same stage, shared fans, cable segments, particles). Unique devices (power_gen, network_hub, ai_core, usually one instance) stay ordinary meshes. Each model still aims for 1-2 materials so the 100 draw-call cap holds — Follows ChatGPT: unique structures gain nothing from instancing. Today GLB devices are plain clones; instancing is added only when measured draw calls require it — 2026-10-16 — Accepted (amended the same day; first written as 'one InstancedMesh per device and stage')**

**D-016 — Asset compression — Meshopt and KTX2 for optimized production assets; standard GLB with PNG/WebP textures are allowed while prototyping, with the conversion pipeline documented in docs/ASSET_CONTRACT.md. Draco is not used — One geometry pipeline to pin; the single-file browser preview cannot load the Basis transcoder, so previews use prototype assets. The game already decodes Meshopt GLB; KTX2 loading is not wired yet — 2026-10-16 — Accepted (amended the same day)**


**D-017 — Visual direction V2 versus earlier decisions — Art Direction V2 (ChatGPT, `docs/art/` on branch `gpt/art-direction`) is compatible with D-003 and D-014 but changes the tone set by D-004. Conflicts found: (1) D-003 stylized low-poly with emissive glow: COMPATIBLE, V2 refines it (chunky machined forms, emissive as accents only). (2) D-004 clean neon-tech: CONFLICT in tone. V2 is premium industrial sci-fi, a miniature datacenter workshop with a warm/cool hierarchy and an explicit ban on 'generic neon cubes'. (3) D-014: NO CONFLICT, V2 ENVIRONMENT.md uses the same 8/12/18/24 sizes but defines no trigger, which D-014 supplies; the prestige-linked campus still needs owner approval. (4) Root ART_DIRECTION.md: file names (`device_<id>_stage<N>.glb` vs `<id>_s<N>.glb`), triangle budgets (~2-6k stage 1 to ~10k stage 4 vs V2's 0.6-1.4k to 2.2-5k), cooling color (ice blue vs teal) and palette differ; V2 numbers are stricter and fit the 150k scene cap. (5) V2 UI_STYLE shows `$` and `kW`; the game uses Credits and abstract power units, so those stay Credits and abstract units. (6) Stage levels 1/25/100/400 equal income-milestone levels 25/100/400 (covered by a test), so a visual change always lands on a milestone; Lv 50 and 200 doublings get no new model. No economy change — 2026-10-16 — ACCEPTED by the owner the same day: V2 is adopted, D-003 stays FINAL, D-004 is amended (see D-004), the root ART_DIRECTION.md is updated to match, and the prestige campus is deferred (D-014)**

**D-018 — Device asset contract — Models are `<device_id>_s<1-4>.glb` in `apps/web/assets/models/devices/`; meters, Y-up, origin at the bottom center of the footprint, front toward +Z; sizes, triangle budgets and socket names come from `packages/data/device-assets.json`; the game discovers files at build time, validates them (`packages/assets`), rejects broken ones with a console error and keeps the built-in placeholder; 1 meter = 0.25 world units — Lets art land without touching code and never breaks the game; full text in docs/ASSET_CONTRACT.md — 2026-10-16 — Accepted. AMENDED the same day by the owner: gpu_rack stage 1 keeps the 2x2-cell footprint and the 3.84 x 3.84 m limit but its recommended visible size is 3.2 m wide x 2.8 m deep x 2.5 m tall (the earlier 1.6 m height was too flat); stage 2-4 heights (2.7 / 2.9 / 3.2 m) are provisional. Triangle target for gpu_rack_s1 stays 1000, but silhouette and readability come first: if the first real model needs a modest increase, the proposed new budget is reported before the contract changes. The full scene stays under 100 draw calls and 150,000 visible triangles**

## Open questions
- Whether a minimal backend is needed before launch.
- Final game name/store title and trademark check.

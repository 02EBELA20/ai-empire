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

## Open questions
- Preact vs plain DOM for UI (decide in M2).
- Whether a minimal backend is needed before launch.
- Final game name/store title and trademark check.

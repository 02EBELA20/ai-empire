# ART DIRECTION — AI Empire

Status: FINAL direction (D-003, D-004 as amended on 2026-10-16 to Visual Direction V2, see D-017). Changes need a new decision entry.
Full V2 specification: `docs/art/` (branch `gpt/art-direction`, by ChatGPT). Model rules the game enforces: `docs/ASSET_CONTRACT.md`. Where this file and `docs/art/` differ, `docs/art/` wins for new assets.

## Style
- Isometric 3D, stylized low-poly with emissive glow accents (readable and cheap on mid-range phones).
- Premium Industrial Sci-Fi with controlled neon accents (D-004 amended): detailed industrial machinery, believable materials, visible mechanical components and restrained emissive lighting. Emissive is an accent, never the whole model; avoid generic neon cubes, cold sterile realism and cartoon excess.
- Strong silhouettes per device so the player recognizes machines at a glance.

## Visual language of the network
- Cables carry animated particles: color by resource (Power = amber, Data = cyan, Cooling = teal per V2; the current placeholder cables still use the older ice blue until the M4 connection pass).
- Particle density and speed scale with throughput; throttled links turn yellow/red and slow down.
- Upgrade pulse: a wave travels along the network from the upgraded device.
- Bottleneck indicator highlights the limiting node.

## Device evolution
Each device has 4 visual stages (e.g. levels 1, 25, 100, 400): more modules, more fans, more lights, better materials. Fans spin, LEDs blink, status lights reflect efficiency.

## Modular asset kit
- Shared palette and a small material set; one texture atlas per category.
- Standard grid unit for placement; standard port locations per device type.
- Reusable parts: racks, panels, fans, cable connectors, pipes, vents.

## Asset pipeline
Blender → export GLB → Meshopt/Draco + KTX2 → asset manager. Naming and folder: `<id>_s<N>.glb` in `apps/web/assets/models/devices/` (see `docs/ASSET_CONTRACT.md`). Triangle budgets per device and stage: 0.6-1.4k at stage 1 up to 2.2-5k at stage 4 (`packages/data/device-assets.json`); the whole scene stays under 100 draw calls and 150,000 visible triangles. ChatGPT/Codex may assist modeling; every asset must pass the performance budget before merging.

## UI
Mobile first: large touch targets, thumb-reachable bottom bar, minimal text, big numbers abbreviated (1.2M). Accessibility: colorblind-safe resource colors plus icon/shape differences, reduced-motion option.

## Audio (later)
Soft mechanical hum scaling with activity, satisfying purchase/upgrade sounds, optional calm music.

## Legal and originality
No real brands, logos, characters or product names. Fictional companies only.

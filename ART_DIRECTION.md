# ART DIRECTION — AI Empire

Status: default direction, revisitable (see D-003, D-004).

## Style
- Isometric 3D, stylized low-poly with emissive glow accents (readable and cheap on mid-range phones).
- Clean "neon tech" mood with friendly proportions; avoid cold sterile realism and avoid cartoon excess.
- Strong silhouettes per device so the player recognizes machines at a glance.

## Visual language of the network
- Cables carry animated particles: color by resource (Power = amber, Data = cyan, Cooling = ice blue).
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
Blender → export GLB → Meshopt/Draco + KTX2 → asset manager. Naming: `device_<id>_stage<N>.glb`. Triangle budget per device: ~2-6k at stage 1, up to ~10k at stage 4. ChatGPT/Codex may assist modeling; every asset must pass the performance budget before merging.

## UI
Mobile first: large touch targets, thumb-reachable bottom bar, minimal text, big numbers abbreviated (1.2M). Accessibility: colorblind-safe resource colors plus icon/shape differences, reduced-motion option.

## Audio (later)
Soft mechanical hum scaling with activity, satisfying purchase/upgrade sounds, optional calm music.

## Legal and originality
No real brands, logos, characters or product names. Fictional companies only.

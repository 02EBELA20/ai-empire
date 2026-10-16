# AI Empire — Art Direction V2
Status: implementation specification for Milestone 4. All measurements and budgets are targets to validate on device.

## North star
**Premium Industrial Sci-Fi / Tactile Miniature Datacenter.** A believable miniature industrial world with chunky machined forms, layered construction, warm functional metal, precise cool light and visible mechanical activity. Visual delight comes from each upgrade adding recognizable *physical capability*, not simply more neon. Reference games are mood/quality inspiration only; no copied compositions, UI, naming or assets.

## Visual pillars
1. **Readable from phone height:** each machine has a unique top-down silhouette and one identifying animated feature.
2. **Mechanical cause and effect:** power flows to compute; compute generates heat; cooling restores efficiency; data exits via the network.
3. **Four meaningful generations:** S1 practical prototype; S2 professional rack; S3 industrial modular cluster; S4 flagship engineered centerpiece. Preserve each device's silhouette DNA.
4. **Warm/cool hierarchy:** neutral materials carry form; blue conveys data; amber power; teal cooling; violet computation; red warning. Emissive surfaces are accents, not the entire model.
5. **Handcrafted modularity:** shared bolts, vents, panels, fan modules and supports; instance repeated modules.

## Palette tokens (sRGB HEX)
- `bg.deep` #101B2B; `floor.base` #263647; `floor.raised` #35495A; `metal.dark` #27313D; `metal.mid` #667785; `metal.light` #A6B4BC
- `ceramic.offwhite` #D9E2E4; `rubber` #151D26; `copper` #B77743
- `data.cyan` #39C8E6; `power.amber` #F4B64C; `cooling.teal` #48D8B7; `compute.violet` #A48CFA
- `success` #67D39A; `warning` #F3A34A; `danger` #E75F64; `ui.text` #F0F5F7; `ui.muted` #9EB0C0
Maintain contrast for small-screen text; never rely on hue alone for status.

## Materials
Use one shared ORM/metal/roughness atlas where practical; a separate shared emissive mask is allowed. 1K KTX2 atlas for prototype, consider 2K only if measured quality warrants. Painted steel matte (roughness .65), brushed alloy (.38), polymer (.78), copper (.42), translucent-looking cooling tubes approximated by opaque teal surfaces for mobile. Stylized beveled edges baked or modeled selectively; no expensive transmission or real-time reflections. Two-sided materials prohibited except intentional flat signage.

## Camera and framing
Three.js OrthographicCamera, fixed isometric orientation: yaw 45 degrees, elevation approximately 35.264 degrees; no free orbit. World axes: X/Z ground, Y up. Camera framing must be tested at 16:9 and 19.5:9, with device silhouettes clear at typical phone viewing size. Use orthographic zoom steps and pan constrained to playable footprint. No perspective-only detail required to read an upgrade.

## Lighting and effects
One soft directional key, low-intensity hemispheric ambient, baked AO/contact shadows in texture or cheap blob shadows. No per-device shadow-casting lights. Use unlit/emissive masks for lamps. Subtle bloom only if GPU profiling permits; default off on low tier. Target 30 FPS minimum on representative mid-range Android, aspire to 60 FPS on higher tier.

## Performance budget
Hard in-view cap: <100 draw calls and <150,000 triangles, including environment and effects. Suggested allocation: devices 90k, environment 35k, cables/effects 15k, 10k safety. Repeated components use InstancedMesh or merged geometry; stage changes must not multiply draw calls. Aim for 1–2 materials per asset, no more than 3 exceptional cases. Use frustum culling, distance-based detail reductions, KTX2 textures and compressed GLB assets. Validate in Chrome Android GPU profiling and Three.js renderer.info, not just Blender.

## State visual language
Normal: steady colored pulse and moving functional parts. Throttled: reduced flow speed, amber/red striped warning lamp, irregular fan speed and subtle dimming (no expensive smoke). Just-built: 0.8–1.2 s staged assembly/scale reveal, quick white-to-device-color emissive sweep, then settle to normal. Respect reduced-motion preference by using static state badges instead.

## Do / Do not
DO: emphasize clear silhouettes, mechanical layering, upgrade reveal, constrained accent color, shared modules, readable cable paths, visual feedback linked to actual simulation.
DO NOT: build anonymous neon cubes, fill every edge with glow, copy Crypto Idle Miner imagery, create busy particle storms, add dynamic lights to every object, make stage 4 enormous relative to its tile, use tiny illegible labels or use real AI inference.

## Acceptance criteria
Six devices × four stages visually distinguishable in grayscale silhouettes; color-blind readable states; no stage footprint collisions; GPU/CPU budgets verified in representative full scene; fixed camera shots approved at mobile resolution.

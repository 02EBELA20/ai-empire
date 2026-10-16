# Environment — The Living AI Workshop

## Core setting
The player starts in a compact repurposed industrial workshop, not on an empty blue grid slab. A warm graphite concrete floor, recessed cable trenches, painted safety markings, partial waist-height back walls, visible support columns, one small service door and purposeful props make the space believable. No ceiling blocks the fixed isometric camera.

## Grid and expansion
Grid cell 2m square. Start 8×8 tiles with 1-tile perimeter; expand in authored chunks: 8×8 starter workshop → 12×12 converted warehouse → 18×18 industrial hall → 24×24 data-center campus. Expansions unlock adjacent floor sections with a short construction animation. Preserve orthographic angle, tile scale and clear machine silhouettes. Use wall segments that fade or hide if they occlude machines. Do not create one enormous dense room at stage one.

## Floors and walls
Floor: 4 modular tile variants sharing atlas: smooth concrete, grating, maintenance hatch, reinforced raised floor. Variants seeded per tile but stable across sessions. Thin embossed lane strips and power/data trench covers provide subtle directionality. Back walls: 1.8m partial height, modular steel panels with occasional vents and windows; front walls omitted for visibility. AO baked into materials. Border railings and safety stripes in sparing amber.

## Props
Reusable instanced crates, tool carts, fire extinguisher, cable spools, caution posts, wall panels, small maintenance robots (later milestone). Place no prop within device collision/connector clearance. Props have no gameplay cost and should be removed first under performance pressure.

## Lighting
One fixed soft directional light from camera-left/front and hemispheric fill. Add emissive wall panels and floor lane markers as texture/emissive masks only. No per-prop dynamic point lights. Base dark navy-gray; machines read brighter and warmer than floor.

## Cable / pipe / flow language
Power: chunky dark insulated cables with **amber** pulse segments; data: narrow braided fiber trunk with **cyan** flow; cooling: thicker segmented rigid pipes with **teal** emissive segments. Never use color alone: cable profiles differ (round power, flat data, twin-tube cooling). Connections follow orthogonal grid paths and snap to named device sockets; prefer floor trenches with short raised socket runs. Avoid spaghetti overlaps by routing along shared channels with branch junctions. Use pooled geometries and atlas materials; update only changed paths. Animate flow with UV offset or instanced segments (avoid per-dot mesh allocations). Data flow direction corresponds to actual simulation where possible. In throttled state pulse rate drops; in disconnected state glow goes dark.

## Camera/readability
At default mobile framing, foreground machinery must not cover UI or key AI Core. Prioritize distinct roof silhouettes, large status lights and clean spacing. Allow zoom for details but maintain fixed angle. Add an optional hide-walls toggle only if visibility testing requires it.

## Performance and acceptance
Environment <=35k triangles in typical view, <=20 draw calls through instancing/merged static geometry. Cables/effects <=15k triangles and <=15 draw calls. Device budgets per DEVICES.md. Validate full busy scene under 100 draw calls and 150k triangles. Verify contrast in grayscale and on 360px-wide mobile layout.

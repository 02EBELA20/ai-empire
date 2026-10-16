# Blender → Three.js Asset Production Guide

## Coordinates and scale
Blender metric, Unit Scale 1.0; 1 Blender unit = 1 meter. World grid tile = 2m X × 2m Z in Three.js. Blender authoring axes: X/Y ground and Z up; exporter transforms to glTF/Three.js Y up. Confirm orientation with a test cube before mass export. Device origin at floor center of assigned footprint, positive Y up in runtime. Forward orientation: local +Z in Three.js (after export). No arbitrary model-specific rotations in application code.

## Footprint, stages, and naming
Files: `assets/models/devices/{device_id}_s{1..4}.glb`, e.g. `gpu_rack_s2.glb`. Mesh nodes `body`, `trim`, `emissive`, optional `fan_*`; sockets named `socket_power`, `socket_data`, `socket_cooling`. Animation clips `idle` only if necessary; prefer runtime rotation and emissive pulses. Stage replacement keeps origin, footprint, sockets and simulation identity. See DEVICES.md for exact footprint and budget.

## Modeling
Apply transforms; triangulate deterministically; recalculate normals; use bevels selectively. Avoid subdivision surfaces, tiny bolts modeled individually, hidden faces and internal detail not seen by orthographic camera. Use low-segment cylinders (8–12) and bake surface details into textures. For instanced fans, export one shared fan asset, not 24 duplicate mesh copies. Put sockets on visible edges with 0.08m clearance. No negative scales.

## Material and atlas
Shared 1024×1024 atlas first; use consistent texel density target 128–256 px/m for visible surfaces, with extra density for identifying front panels. UV padding >=8 px at 1K with mipmapping. Metallic-roughness PBR; pack occlusion, roughness and metallic as ORM where pipeline supports it. KTX2/BasisU textures: ETC1S for broad albedo, UASTC for critical masks if measured necessary. Emissive regions use a shared mask; animate intensity in shader/material, not by cloning every mesh material.

## Export/compression
Export clean glTF 2.0 binary `.glb` from Blender with selected visible meshes, applied modifiers, UVs, tangents only if needed, no cameras or lights. Blender's stock glTF exporter does not necessarily emit Meshopt compression: perform Meshopt via a separate glTF-Transform/gltfpack processing step, or Draco via supported external tooling. Pick ONE geometry compression pipeline and ensure Three.js decoder is configured. Convert textures to KTX2 with a tested external texture tool; do not assume Blender export alone produces KTX2. Keep uncompressed source `.blend` and editable texture sources outside runtime bundle. Use versioned command scripts and pin tool versions.

## Animation
Fans: named pivot objects, runtime rotation around local axis. Status lamps: emissive pulse using shared uniform/instanced attribute. Cable flow: UV offset or pooled instanced indicators; avoid hundreds of unique particle objects. Stage upgrade: parent scale reveal/segment transform, not skeletal animation. For reduced-motion, disable looping cosmetic motion.

## QA checklist
1. Correct origin, dimensions, Y-up orientation and stage footprint.
2. All required sockets present, no floating connections.
3. No material/texture missing after GLB round-trip.
4. One or two draw-call-friendly materials, avoid multi-material proliferation.
5. Stage silhouettes recognizable in grayscale at phone size.
6. Triangles under per-device budget; full scene under 150k triangles and 100 draw calls.
7. Check compression decoder, KTX2 loader and fallback on target Android.
8. Test all four stage swaps without moving cables or changing tile occupancy.
9. Test normal, throttled and just-built visual states, including reduced motion.
10. Commit Blender sources and optimized runtime outputs separately when feasible; use Git LFS for large binaries if repository policy permits.

## Integration interface recommendation
`DeviceVisual { id, stage, state, gridFootprint, sockets, modelUrl }`; `stageForLevel(level)`: 1 if <25, 2 if <100, 3 if <400, else 4. Keep gameplay math independent of asset loading. Missing GLB should use an obvious temporary placeholder and log error without crashing.

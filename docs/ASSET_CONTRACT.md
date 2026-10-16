# Device Asset Contract (Milestone 4)

How a 3D model must be built so the game can load it with no code change. Source of the numbers: `packages/data/device-assets.json`
(derived from `docs/art/DEVICES.md` and `BLENDER_GUIDE.md` on branch `gpt/art-direction`). The same rules are enforced in code by
`packages/assets` (validation) and `apps/web/src/deviceAssets.ts` (loading). Decision record: D-018.

## 1. File name and location
- Name: `<device_id>_s<stage>.glb`, stage 1 to 4. Example: **`gpu_rack_s1.glb`**.
- Device ids: `basic_pc`, `power_gen`, `cooling`, `gpu_rack`, `network_hub`, `ai_core`.
- Folder: **`apps/web/assets/models/devices/`**. Drop the file there; no registration step.
- A file with any other name is ignored with a console error. Stage 2 to 4 files are optional and independent: a device uses a model only for a stage that has a file, otherwise it keeps the built-in placeholder.

## 2. Units, axes, pivot
- Blender metric, Unit Scale 1.0: **1 Blender unit = 1 meter**. Apply all transforms and modifiers; no negative scales.
- Export glTF 2.0 binary (.glb) with **+Y Up** (Blender default). In the game: Y is up, X and Z are the ground.
- **Pivot (origin) = the center of the footprint, on the floor.** The lowest point of the model is at y = 0; the model is centered on X and Z.
- **Front faces glTF +Z, which is Blender -Y** (the default front view). The camera looks from +X/+Z, so the front (+Z) and the right side (+X in Blender) are the two faces the player sees: put the detail there, keep the back and left simple.

## 3. Size
One tile is 2 m x 2 m. The model must fit the footprint minus a 0.08 m inset on every side.

| Device | Footprint (tiles) | Footprint (m) | Max model size X x Z (m) | Heights stage 1-4 (m) | Triangles stage 1-4 |
|---|---|---|---|---|---|
| basic_pc | 1 x 1 | 2 x 2 | 1.84 x 1.84 | 1.25 / 1.4 / 1.55 / 1.7 | 650 / 1050 / 1600 / 2250 |
| power_gen | 2 x 2 | 4 x 4 | 3.84 x 3.84 | 1.5 / 1.8 / 2.2 / 2.4 | 900 / 1450 / 2300 / 3200 |
| cooling | 2 x 2 | 4 x 4 | 3.84 x 3.84 | 1.5 / 1.9 / 2.1 / 2.5 | 850 / 1400 / 2250 / 3100 |
| gpu_rack | 2 x 2 | 4 x 4 | 3.84 x 3.84 | **2.5** / 2.7* / 2.9* / 3.2* | 1000 / 1750 / 2650 / 3700 |
| network_hub | 1 x 2 | 2 x 4 | 1.84 x 3.84 | 1.2 / 1.4 / 1.7 / 2.0 | 600 / 1050 / 1700 / 2400 |
| ai_core | 3 x 3 | 6 x 6 | 5.84 x 5.84 | 2.1 / 2.5 / 3.0 / 3.4 | 1400 / 2400 / 3700 / 5000 |

\* Stage 2-4 heights of the gpu_rack are provisional: they only had to stay at or above stage 1 and will be confirmed when those models are designed. Other devices still use the values from `docs/art/DEVICES.md`.

**`gpu_rack_s1.glb` specifically (owner-approved 2026-10-16, D-018):**

| Item | Value |
|---|---|
| Grid footprint | 2 x 2 cells (unchanged) |
| Hard limit on the model | 3.84 x 3.84 m (X x Z) |
| **Recommended visible size** | **3.2 m wide (X) x 2.8 m deep (Z) x 2.5 m tall (Y)** |
| Origin | bottom center, on the ground |
| Forward | glTF +Z (Blender -Y) |
| Triangle target | 1000 (see the policy below) |
| Materials | 1 to 2 |
| Required nodes | `fan_*` (two fans), `socket_power`, `socket_data`, `socket_cooling` |

The recommended size is a target, not a gate: the game accepts any model inside the 3.84 x 3.84 m limit whose height is within 25% of 2.5 m (1.88 to 3.13 m) without a message, and only warns beyond that.

**Triangle budget policy.** 1000 triangles is the starting target for `gpu_rack_s1`, not a reason to cut silhouette quality or readability. The game does not reject a model until it has more than double the budget (a warning appears above 1250). If the first real Blender model shows that a modest increase is needed, report the proposed new budget first and change `device-assets.json` and this document together. The whole scene must stay under 100 draw calls and 150,000 visible triangles; the current placed-device total at stage 4 is about 47,000.

## 4. Named nodes and materials
- Meshes: `body`, `trim`, `emissive` (more are fine). Keep to **1-2 materials** (3 only in exceptional cases) to protect the 100 draw-call budget.
- **Fans:** an Empty named `fan_<n>` at the fan center, with the blades as its children. The game spins it around **its own local Z axis in Blender** (the arrow of a "Single Arrow" empty; local Y after export). Put that axis through the center of the fan. Do not animate fans in Blender.
- **Sockets:** Empties named `socket_power`, `socket_data`, `socket_cooling` on a visible edge, at least 0.08 m from the footprint edge. Only the sockets listed for the device are expected. The game reads their positions; cable routing will attach to them in a later step.
- **Emissive:** any material whose name starts with `emissive` (for example `emissive_lamps`) is cloned per device and pulsed by the game. When a rack is throttled its emissive color turns red. Use a normal PBR emissive color or texture; do not rely on Blender node effects that glTF cannot carry.
- No lights, cameras, skeletons or animation clips in the file (lights and cameras are removed on load). Two-sided materials are not allowed.

## 5. Textures and compression
- While prototyping: plain GLB with embedded PNG or WebP textures, 1024 x 1024 shared atlas (D-013).
- Production: Meshopt-compressed geometry and KTX2 textures (D-016). The game already reads Meshopt GLB. **KTX2 loading is not wired yet**; a GLB that needs it is rejected with a message saying so.
- Planned conversion (commands not yet run in this repo; pin tool versions when first used): `npx gltfpack -i model.glb -o model.opt.glb -cc` for Meshopt, then texture conversion to KTX2 with a tested external tool. Do not rely on Blender export alone for either.

## 6. What the game does with the file
1. At build time Vite finds every `*.glb` in the folder. In the single-file preview the files are inlined as data URLs; in the normal build they are emitted as hashed files.
2. On start the game parses each file and measures the bounding box, triangle count, material count and node names.
3. **Errors reject the model** (the placeholder stays, a red `[assets]` console message explains why): wrong name or unreadable file, no geometry, size far off the spec (usually wrong units or axes), model not on the floor, pivot not at the footprint center, footprint over the limit, triangles more than double the budget.
4. **Warnings accept it** (yellow console message): height more than 25% off, triangles more than 25% over budget, more than 3 materials, missing socket empties.
5. Accepted models are scaled **1 meter = 0.25 world units** and placed with the pivot at the middle of the device's footprint in the current layout. The loaded model is shared by all placed copies of that device.
6. The whole thing is optional: with no files, or only rejected ones, the game looks and plays as before.

## 7. How to try a model
Copy the file to the folder and run `npm run dev` (or `npm run build:single` for the one-file preview). With `?debug` in the URL, `window.__ai.assets` lists every file with its issues. Run `npm test` to check the contract code.

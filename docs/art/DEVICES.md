# Device Asset Specifications — Milestone 4

## Conventions and budgets
World grid: 1 tile = 2 m × 2 m on X/Z. Dimensions below are X × Z tile footprints; height in meters. Keep stage footprints **identical within each family**, enabling drop-in replacement. Device pivots at footprint center on floor. Stage ids `s1..s4` activate at levels **1, 25, 100, 400**. Listed triangle budgets are per unique full mesh; repeated internals should be instanced and are counted in scene totals. All geometry must stay inside assigned footprint with 0.08 m inset. Shared state logic: normal = steady device-color operation; throttled = amber alternating lamp, flow slowed to 35%, mild flicker; just-built = 1 s modular assembly + emissive sweep. Throttled state must also expose a UI status symbol.

## basic_pc — workstation / entry compute
Footprint **1×1**, height S1 1.25m / S2 1.4 / S3 1.55 / S4 1.7. Signature: vertical tower + visible computing panel.
|Stage|Silhouette|Parts|Materials and effects|Triangles|
|---|---|---|---|---:|
|S1|Compact tower, one monitor|case, monitor, 1 fan, desk base|charcoal polymer, steel; cyan power LED; slow fan|650|
|S2|Wider dual-fan workstation|dual fan, vent grille, two displays|alloy trim; dual cyan LED strips; 2 fans|1,050|
|S3|Professional vertical compute pedestal|stacked compute drawers, display, exposed cooling loop|brushed alloy, copper; cyan/violet heartbeat; 3 fans|1,600|
|S4|Flagship mini AI workstation|sculpted central spine, 4 modular compute drawers, top status crown|ceramic/metal; violet compute ring and cyan bars; 4 instanced fans|2,250|

## power_gen — power source
Footprint **2×2**, height 1.5 / 1.8 / 2.2 / 2.4m. Signature: stout generator body + amber power terminals.
|Stage|Silhouette|Parts|Materials and effects|Triangles|
|---|---|---|---|---:|
|S1|Single squat diesel-like industrial box|engine cover, exhaust cap, terminal|olive-gray steel, amber meter; subtle flywheel rotation|900|
|S2|Twin-module generator|two engine housings, transformer, guarded fan|dark metal/copper; 2 amber pulse bars; fan|1,450|
|S3|Power conditioning skid|three modular generators, breaker wall, busbar|painted steel, copper rails; chasing amber segments|2,300|
|S4|Integrated microgrid power station|four synchronized power pods around central transformer|light alloy, copper; synchronized amber rings, rotating turbines|3,200|

## cooling — heat management
Footprint **2×2**, height 1.5 / 1.9 / 2.1 / 2.5m. Signature: visible circular fan array and teal fluid channels.
|Stage|Silhouette|Parts|Materials and effects|Triangles|
|---|---|---|---|---:|
|S1|Single cooling box|large fan, vent box, two pipe connectors|matte steel; teal temperature light; fan rotation|850|
|S2|Twin-tower cooling|two fans, side heat exchangers, manifold|gray alloy; teal flow line; two fans|1,400|
|S3|Industrial chiller skid|four fan housings, radiator panels, visible pipe loop|ceramic and steel; emissive teal pipe segments|2,250|
|S4|Flagship modular liquid cooling plant|tiered radiators, six instanced fans, top coolant header|brushed metal; animated teal fluid path, fan array|3,100|

## gpu_rack — high throughput compute
Footprint **2×2**, height 1.6 / 1.9 / 2.2 / 2.6m. Signature: stacked horizontally slotted compute blades.
|Stage|Silhouette|Parts|Materials and effects|Triangles|
|---|---|---|---|---:|
|S1|Open single GPU rack|four blade trays, two fans, feet|dark alloy; violet blade indicators; two fans|1,000|
|S2|Dual-column rack|eight blade trays, rear busbar, fan wall|steel and copper; violet progress bars; four instanced fans|1,750|
|S3|High-density compute cabinet|three stacked blade sections, coolant manifold|light metal; violet/cyan throughput lights, fan wall|2,650|
|S4|Premium AI compute cluster|four armored rack bays around glowing spine|ceramic steel; layered violet pulses and cyan busbar; fan arrays|3,700|

## network_hub — connectivity
Footprint **1×2**, height 1.2 / 1.4 / 1.7 / 2.0m. Signature: upright antenna / routing mast and radial ports.
|Stage|Silhouette|Parts|Materials and effects|Triangles|
|---|---|---|---|---:|
|S1|Small switch pedestal|switch box, four ports, tiny mast|dark metal; cyan blinking port lamps|600|
|S2|Tall managed network cabinet|two switches, antenna, cable raceway|steel; sequenced cyan data lamps|1,050|
|S3|Backbone routing tower|three switch shelves, fiber trunk, ring collar|alloy; ring UV-scroll illusion|1,700|
|S4|Global network nexus|tiered hexagonal switching crown, four routing arms|ceramic/steel; rotating low-poly ring, cyan packets|2,400|

## ai_core — iconic central brain (non-sentient simulation)
Footprint **3×3**, height 2.1 / 2.5 / 3.0 / 3.4m. Signature: central protected luminous computation core surrounded by modular frame.
|Stage|Silhouette|Parts|Materials and effects|Triangles|
|---|---|---|---|---:|
|S1|Core pedestal with one protected prism|pedestal, four struts, prism, 4 connectors|matte metal; violet slow heartbeat|1,400|
|S2|Dual-layer core tower|two concentric guards, 8 ports, central prism|steel/copper; two asynchronous violet rings|2,400|
|S3|Industrial compute reactor|three concentric frame levels, external data fins|brushed alloy; cyan/violet running lanes|3,700|
|S4|Monumental flagship AI nexus|multi-tier floating-look core within grounded support cage|ceramic steel; 4 synchronized light bands, slow rotating ring|5,000|

## Placement and states
- Stage changes replace mesh at same origin; retain device id, grid footprint, cable endpoints and simulation state.
- Connector sockets are authored as named empties: `socket_power`, `socket_data`, `socket_cooling`; unused sockets omitted.
- Normal: device-specific steady animation above.
- Throttled: generic amber warning beacon and 35% data/rotor speed; power shortage adds amber lightning icon, overheating adds thermometer icon in HUD. Avoid physically implausible visual damage.
- Just-built: assemble large modules in 3 beats (base, chassis, active core), 1 second total, then fade from bright neutral to normal; reduced motion uses single fade.
- S4 complexity budget is deliberately modest. Stage value comes from composition and animation, not polygon count.

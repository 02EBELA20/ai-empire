# Mobile UI Style — Industrial Control Deck

## Identity
A compact high-contrast industrial dashboard that visually belongs to the workshop. Panels use dark graphite (#101B2B / #263647), thin metal-edge strokes (#667785), restrained cyan accents (#39C8E6), and large readable white text (#F0F5F7). UI must never obscure the main upgrade reveal.

## Typography
Use OFL-licensed **Inter** (or system sans fallback) for numbers, HUD and buttons; **Rajdhani** (or system sans fallback) sparingly for big headings and tier labels. Bundle only legally distributable subsets. Minimum 14sp body, 12sp secondary only for nonessential labels; primary amounts 20–28sp, tap targets >=44×44 logical px.

## HUD
Top-left: virtual money balance with compact per-second rate below; tap expands breakdown. Top-right: power usage/capacity, heat status and settings. Bottom: thumb-friendly four navigation tabs: Build, Network, Research, Companies. Device selection opens a bottom sheet rather than tiny 3D floating text. HUD respects iOS/Android safe areas, notch and gesture region. No fake real-money balance.

## Device sheet
Large device icon/thumbnail; level, current production, power draw, cooling demand, connection status. Primary button: `Upgrade — $X`, with expected gain `+$Y/s` and next visual milestone `S3 at Lv100`. Secondary actions: Connect, Move, Details. If throttled, surface the cause and a concrete remedy (e.g. `Power deficit: 20 kW`). Keep upgrade action always reachable with one thumb.

## Shop cards
2-column grid on wide phone, 1-column on narrow devices. 3D preview or consistent icon, readable name, role, footprint, cost, projected contribution. Locked cards show explicit unlock requirement; never use random-looking mystery pricing. Category filters use horizontal scroll chips.

## Buttons and iconography
Primary cyan filled with dark label; secondary dark with light border; warning amber; destructive red. Press feedback: 0.96 scale, short 100ms highlight; optional haptic on native. Use consistent line icons with ~2px stroke; 24px baseline, distinct symbols for power bolt, cooling fan, data nodes, compute chip, research flask, company briefcase. No trademarked company logos.

## Motion and feedback
On upgrade: device briefly highlights, number increments with 300ms roll, compact `+income/s` toast, stage transition if threshold crossed. Keep all motion <=1.2s and interruptible. Reduced-motion mode disables shake/pulses and uses crossfade. Do not show interstitial ads after an upgrade. Rewarded ads must be clearly optional.

## Accessibility / localization
WCAG-inspired contrast >=4.5:1 for ordinary text; icons paired with labels for status. Format numbers in compact localized notation (e.g. 1.2K, 3.4M) and provide full number on tap. Design for English first with flexible layouts for longer translations. Never encode meaning solely in color.

## UI performance
Use batched DOM/CSS overlay or lightweight framework; avoid hundreds of labels in Three.js. Update displayed economic values at a visually smooth but bounded cadence (~4–10 Hz), while simulation runs independently. Profile UI on mid-range Android.

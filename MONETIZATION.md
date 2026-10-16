# MONETIZATION — AI Empire

Principle: the core game is fully enjoyable for free. Revenue is optional, honest and non-blocking.

## Revenue streams
1. **Rewarded video (optional).** Player-initiated only. Offers: 2x income for 30 min, double offline earnings on return, free research speed-up, bonus offline cap. Frequency-capped. No forced interstitials.
2. **Cosmetic IAP.** Device skins, lighting themes, cable effects, room themes.
3. **Founder Pack.** Exclusive cosmetics + small comfort (extra save slot, slightly larger offline cap). No direct income multiplier.
4. **Season Pass (later).** Cosmetics and comfort only.

## Not allowed
- Mandatory ads or ad walls.
- Paid income multipliers that bypass progression.
- Real crypto payouts or real-money mining.
- Selling progress that makes free players feel blocked.

## Sequencing
Measure retention first (targets: D1 35-40%, D7 12-15%). Add rewarded ads in M6 only if the loop retains. Add IAP after that. Until then only the interfaces (`AdService`, `PurchaseService`) exist, with no SDK dependency.

## Cost estimate (to verify before relying on it)
| Item | Estimate |
|---|---|
| Google Play developer account | one-time ~US$25 |
| Apple Developer Program | ~US$99/year |
| Store commission | typically 15-30%, 15% with small-business programs |
| Ad mediation (AdMob / AppLovin MAX) | free, revenue share |
| Analytics/crash (e.g. Firebase) | free tier initially |
| Backend (time validation, later leaderboards) | tens of US$ per month |
| Assets (Blender + AI assistance) | mainly time |
| Legal | privacy policy, consent (GDPR/ATT), child-directed rules |

## Compliance notes
Disclose rewarded ads and purchases clearly. Add consent flow before ad SDKs ship. Avoid targeting children under 13 (COPPA). Ensure no real-money gambling-like mechanics (no loot-box paid randomness).

## Metrics to track
D1/D7/D30 retention, session length, sessions/day, ad opt-in rate, ARPDAU, payer conversion, time to first prestige, funnel drop-off points.

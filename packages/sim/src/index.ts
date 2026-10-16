import {
  bottleneck,
  computeNetwork,
  cost,
  getDevice,
  prestigeMultiplier,
  prestigePoints,
  type Bottleneck,
  type EconomyConfig,
  type Levels,
  type NetworkResult,
} from '@economy';

export interface GameState {
  credits: number;
  /** Credits earned in the current run (drives unlocks and prestige). */
  lifetime: number;
  levels: Levels;
  neuralPoints: number;
  playSeconds: number;
  /** Wall-clock ms of the last tick/save, used for offline earnings. */
  lastSeenMs: number;
}

export function createState(cfg: EconomyConfig, nowMs: number): GameState {
  return {
    credits: cfg.startingCredits,
    lifetime: 0,
    levels: {},
    neuralPoints: 0,
    playSeconds: 0,
    lastSeenMs: nowMs,
  };
}

export function network(cfg: EconomyConfig, s: GameState): NetworkResult {
  return computeNetwork(cfg, s.levels, prestigeMultiplier(cfg, s.neuralPoints));
}

export function isUnlocked(cfg: EconomyConfig, s: GameState, id: string): boolean {
  return s.lifetime >= getDevice(cfg, id).unlockAt;
}

export function tick(cfg: EconomyConfig, s: GameState, dt: number): void {
  if (!(dt > 0)) return;
  const earned = network(cfg, s).income * dt;
  s.credits += earned;
  s.lifetime += earned;
  s.playSeconds += dt;
}

/** Credits per tap: always at least 1, scales slightly with income so taps stay relevant. */
export function tapValue(cfg: EconomyConfig, s: GameState): number {
  return 1 + network(cfg, s).income * 0.05;
}

export function tap(cfg: EconomyConfig, s: GameState): number {
  const v = tapValue(cfg, s);
  s.credits += v;
  s.lifetime += v;
  return v;
}

export interface PurchasePlan {
  /** Device ids in purchase order (the device first, then any infrastructure it needs). */
  items: string[];
  total: number;
  unlocked: boolean;
  /** Infrastructure bought along with the device to avoid throttling (bundle purchase, D-008). */
  infraAdded: string[];
}

/** Plans buying one level of `id` plus the cheapest power/cooling needed to keep efficiency at 100%. */
export function planPurchase(cfg: EconomyConfig, s: GameState, id: string): PurchasePlan {
  const dev = getDevice(cfg, id);
  const levels: Levels = { ...s.levels };
  const items: string[] = [];
  let total = 0;
  const buy = (did: string) => {
    const d = getDevice(cfg, did);
    const lv = levels[did] ?? 0;
    total += cost(d, lv);
    levels[did] = lv + 1;
    items.push(did);
  };
  const unlocked = isUnlocked(cfg, s, id);
  buy(id);
  const infraAdded: string[] = [];
  if (dev.kind === 'producer') {
    const before = computeNetwork(cfg, s.levels).eff;
    for (let i = 0; i < 40; i++) {
      const net = computeNetwork(cfg, levels);
      // Only bundle infrastructure when the purchase itself would push efficiency down.
      if (net.eff >= 0.999 || net.eff >= before) break;
      const need = bottleneck(net);
      const infraId = need === 'power' ? 'power_gen' : 'cooling';
      if (!isUnlocked(cfg, s, infraId)) break;
      buy(infraId);
      infraAdded.push(infraId);
    }
  }
  return { items, total, unlocked, infraAdded };
}

export function canAfford(s: GameState, plan: PurchasePlan): boolean {
  return plan.unlocked && s.credits >= plan.total;
}

export function buy(cfg: EconomyConfig, s: GameState, id: string): boolean {
  const plan = planPurchase(cfg, s, id);
  if (!canAfford(s, plan)) return false;
  for (const did of plan.items) {
    const d = getDevice(cfg, did);
    const lv = s.levels[did] ?? 0;
    s.credits -= cost(d, lv);
    s.levels[did] = lv + 1;
  }
  if (s.credits < 0) s.credits = 0;
  return true;
}

export interface OfflineResult {
  seconds: number;
  credits: number;
}

export function offlineEarnings(cfg: EconomyConfig, s: GameState, nowMs: number): OfflineResult {
  const raw = (nowMs - s.lastSeenMs) / 1000;
  if (!(raw > 0)) return { seconds: 0, credits: 0 };
  const seconds = Math.min(raw, cfg.offline.capHours * 3600);
  const credits = network(cfg, s).income * seconds * cfg.offline.rate;
  return { seconds, credits };
}

export function applyOffline(cfg: EconomyConfig, s: GameState, nowMs: number): OfflineResult {
  const r = offlineEarnings(cfg, s, nowMs);
  s.credits += r.credits;
  s.lifetime += r.credits;
  s.lastSeenMs = nowMs;
  return r;
}

export function prestigeGain(cfg: EconomyConfig, s: GameState): number {
  return prestigePoints(cfg, s.lifetime);
}

/** Singularity Reboot: bank Neural Points, reset the run. Returns points gained (0 = not allowed). */
export function reboot(cfg: EconomyConfig, s: GameState): number {
  const gain = prestigeGain(cfg, s);
  if (gain < 1) return 0;
  s.neuralPoints += gain;
  s.credits = cfg.startingCredits;
  s.lifetime = 0;
  s.levels = {};
  return gain;
}

export { bottleneck };
export type { Bottleneck };

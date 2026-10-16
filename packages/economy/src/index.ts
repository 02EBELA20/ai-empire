export type DeviceKind = 'producer' | 'power' | 'cooling' | 'hub';

export interface DeviceDef {
  id: string;
  kind: DeviceKind;
  baseCost: number;
  costGrowth: number;
  baseIncome?: number;
  supply?: number;
  power?: number;
  heat?: number;
  unlockAt: number;
}

export interface EconomyConfig {
  version: number;
  startingCredits: number;
  starterSupply: { power: number; cooling: number };
  milestones: { levels: number[]; multiplier: number };
  offline: { capHours: number; rate: number };
  prestige: { k: number; T: number; bonusPerPoint: number };
  hub: { bonusPerLevel: number; maxBonus: number };
  devices: DeviceDef[];
}

export type Levels = Record<string, number>;

export interface NetworkResult {
  income: number;
  rawIncome: number;
  eff: number;
  powerSat: number;
  coolingSat: number;
  link: number;
  powerSupply: number;
  powerDemand: number;
  coolingSupply: number;
  heatDemand: number;
}

export function milestoneMult(cfg: EconomyConfig, level: number): number {
  let m = 1;
  for (const l of cfg.milestones.levels) if (level >= l) m *= cfg.milestones.multiplier;
  return m;
}

export function cost(dev: DeviceDef, level: number): number {
  return dev.baseCost * Math.pow(dev.costGrowth, level);
}

export function getDevice(cfg: EconomyConfig, id: string): DeviceDef {
  const d = cfg.devices.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown device: ${id}`);
  return d;
}

export function computeNetwork(cfg: EconomyConfig, levels: Levels, prestigeMult = 1): NetworkResult {
  let powerDemand = 0;
  let heatDemand = 0;
  let rawIncome = 0;
  let powerSupply = cfg.starterSupply.power;
  let coolingSupply = cfg.starterSupply.cooling;
  for (const d of cfg.devices) {
    const n = levels[d.id] ?? 0;
    if (d.kind === 'producer') {
      rawIncome += (d.baseIncome ?? 0) * n * milestoneMult(cfg, n);
      powerDemand += (d.power ?? 0) * n;
      heatDemand += (d.heat ?? 0) * n;
    } else if (d.kind === 'power') {
      powerSupply += (d.supply ?? 0) * n;
    } else if (d.kind === 'cooling') {
      coolingSupply += (d.supply ?? 0) * n;
    }
  }
  const powerSat = powerDemand > 0 ? Math.min(1, powerSupply / powerDemand) : 1;
  const coolingSat = heatDemand > 0 ? Math.min(1, coolingSupply / heatDemand) : 1;
  const eff = Math.min(powerSat, coolingSat);
  const hubLevel = levels['network_hub'] ?? 0;
  const link = 1 + Math.min(cfg.hub.maxBonus, cfg.hub.bonusPerLevel * hubLevel);
  return {
    income: rawIncome * eff * link * prestigeMult,
    rawIncome,
    eff,
    powerSat,
    coolingSat,
    link,
    powerSupply,
    powerDemand,
    coolingSupply,
    heatDemand,
  };
}

/** Progress toward the next income-doubling milestone: `prev` is the last one reached, `at` the next. Null past the last. */
export function nextMilestone(cfg: EconomyConfig, level: number): { prev: number; at: number } | null {
  let prev = 0;
  for (const l of cfg.milestones.levels) {
    if (level < l) return { prev, at: l };
    prev = l;
  }
  return null;
}

export type Bottleneck = 'power' | 'cooling' | null;

export function bottleneck(net: NetworkResult): Bottleneck {
  if (net.eff >= 0.999) return null;
  return net.powerSat <= net.coolingSat ? 'power' : 'cooling';
}

export function prestigePoints(cfg: EconomyConfig, lifetime: number): number {
  if (!(lifetime > 0)) return 0;
  return Math.floor(cfg.prestige.k * Math.sqrt(lifetime / cfg.prestige.T));
}

export function prestigeMultiplier(cfg: EconomyConfig, neuralPoints: number): number {
  return 1 + cfg.prestige.bonusPerPoint * neuralPoints;
}

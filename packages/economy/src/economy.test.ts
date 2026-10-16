import { describe, expect, it } from 'vitest';
import economyJson from '../../data/economy.json';
import {
  bottleneck,
  computeNetwork,
  cost,
  getDevice,
  milestoneMult,
  nextMilestone,
  prestigeMultiplier,
  prestigePoints,
  type EconomyConfig,
} from './index';

const cfg = economyJson as unknown as EconomyConfig;

describe('cost and milestones', () => {
  it('first basic PC costs its base cost', () => {
    expect(cost(getDevice(cfg, 'basic_pc'), 0)).toBe(10);
  });

  it('cost grows geometrically', () => {
    const d = getDevice(cfg, 'gpu_rack');
    expect(cost(d, 3)).toBeCloseTo(d.baseCost * Math.pow(d.costGrowth, 3), 6);
  });

  it('income multiplier doubles at each milestone level', () => {
    expect(milestoneMult(cfg, 24)).toBe(1);
    expect(milestoneMult(cfg, 25)).toBe(2);
    expect(milestoneMult(cfg, 50)).toBe(4);
    expect(milestoneMult(cfg, 100)).toBe(8);
    expect(milestoneMult(cfg, 200)).toBe(16);
    expect(milestoneMult(cfg, 400)).toBe(32);
  });
});

describe('next milestone', () => {
  it('points at the next doubling level and remembers the previous one', () => {
    expect(nextMilestone(cfg, 0)).toEqual({ prev: 0, at: 25 });
    expect(nextMilestone(cfg, 24)).toEqual({ prev: 0, at: 25 });
    expect(nextMilestone(cfg, 25)).toEqual({ prev: 25, at: 50 });
    expect(nextMilestone(cfg, 399)).toEqual({ prev: 200, at: 400 });
  });

  it('returns null once every milestone is reached', () => {
    expect(nextMilestone(cfg, 400)).toBeNull();
    expect(nextMilestone(cfg, 9999)).toBeNull();
  });
});

describe('network efficiency', () => {
  it('empty network earns nothing and is not throttled', () => {
    const n = computeNetwork(cfg, {});
    expect(n.income).toBe(0);
    expect(n.eff).toBe(1);
    expect(bottleneck(n)).toBeNull();
  });

  it('GPU racks beyond cooling supply are throttled by cooling', () => {
    const n = computeNetwork(cfg, { gpu_rack: 10, power_gen: 10 });
    expect(n.eff).toBeLessThan(1);
    expect(n.coolingSat).toBeLessThan(n.powerSat);
    expect(bottleneck(n)).toBe('cooling');
  });

  it('adding cooling raises efficiency and income', () => {
    const before = computeNetwork(cfg, { gpu_rack: 10, power_gen: 5 });
    const after = computeNetwork(cfg, { gpu_rack: 10, power_gen: 5, cooling: 5 });
    expect(after.eff).toBeGreaterThan(before.eff);
    expect(after.income).toBeGreaterThan(before.income);
  });

  it('hub bonus is capped', () => {
    const big = computeNetwork(cfg, { network_hub: 10000 });
    expect(big.link).toBe(1 + cfg.hub.maxBonus);
  });

  it('income is finite and never negative for extreme levels', () => {
    const n = computeNetwork(cfg, { basic_pc: 5000, gpu_rack: 5000, ai_core: 5000 });
    expect(Number.isFinite(n.income)).toBe(true);
    expect(n.income).toBeGreaterThanOrEqual(0);
  });
});

describe('parity with tools/sim baseline (day 1 and day 7 states from baseline-v0.txt)', () => {
  it('day 1 levels give ~1.47K income/s at 100% efficiency', () => {
    const n = computeNetwork(cfg, { basic_pc: 84, power_gen: 27, cooling: 26, gpu_rack: 32, network_hub: 18, ai_core: 11 });
    expect(n.eff).toBe(1);
    expect(n.income / 1470).toBeGreaterThan(0.99);
    expect(n.income / 1470).toBeLessThan(1.01);
  });

  it('day 7 levels give ~14.57K income/s at 100% efficiency', () => {
    const n = computeNetwork(cfg, { basic_pc: 141, power_gen: 94, cooling: 88, gpu_rack: 75, network_hub: 50, ai_core: 46 });
    expect(n.eff).toBe(1);
    expect(n.income / 14570).toBeGreaterThan(0.99);
    expect(n.income / 14570).toBeLessThan(1.01);
  });
});

describe('prestige', () => {
  it('gives no points for tiny runs and grows with sqrt of lifetime', () => {
    expect(prestigePoints(cfg, 0)).toBe(0);
    expect(prestigePoints(cfg, 1000)).toBe(0);
    const a = prestigePoints(cfg, cfg.prestige.T * 4);
    const b = prestigePoints(cfg, cfg.prestige.T * 16);
    expect(b).toBe(a * 2);
  });

  it('each point adds the configured bonus', () => {
    expect(prestigeMultiplier(cfg, 10)).toBeCloseTo(1 + 10 * cfg.prestige.bonusPerPoint, 10);
  });
});

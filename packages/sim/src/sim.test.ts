import { describe, expect, it } from 'vitest';
import economyJson from '../../data/economy.json';
import { computeNetwork, type EconomyConfig } from '@economy';
import {
  applyOffline,
  buy,
  createState,
  isUnlocked,
  network,
  offlineEarnings,
  planPurchase,
  reboot,
  tap,
  tick,
} from './index';

const cfg = economyJson as unknown as EconomyConfig;
const T0 = 1_000_000;

function richState() {
  const s = createState(cfg, T0);
  s.credits = 1e9;
  s.lifetime = 1e9;
  return s;
}

describe('starting out', () => {
  it('starts with the configured credits and can afford the first PC', () => {
    const s = createState(cfg, T0);
    expect(s.credits).toBe(cfg.startingCredits);
    expect(buy(cfg, s, 'basic_pc')).toBe(true);
    expect(s.levels['basic_pc']).toBe(1);
    expect(s.credits).toBe(0);
  });

  it('cannot buy what it cannot afford and credits stay unchanged', () => {
    const s = createState(cfg, T0);
    s.credits = 5;
    expect(buy(cfg, s, 'basic_pc')).toBe(false);
    expect(s.credits).toBe(5);
    expect(s.levels['basic_pc'] ?? 0).toBe(0);
  });

  it('locked devices cannot be bought even with enough credits', () => {
    const s = createState(cfg, T0);
    s.credits = 1e9;
    expect(isUnlocked(cfg, s, 'ai_core')).toBe(false);
    expect(buy(cfg, s, 'ai_core')).toBe(false);
  });
});

describe('earning', () => {
  it('tick adds income x dt to credits and lifetime', () => {
    const s = createState(cfg, T0);
    buy(cfg, s, 'basic_pc');
    tick(cfg, s, 10);
    expect(s.credits).toBeCloseTo(5, 6);
    expect(s.lifetime).toBeCloseTo(5, 6);
  });

  it('ignores non-positive dt', () => {
    const s = createState(cfg, T0);
    buy(cfg, s, 'basic_pc');
    tick(cfg, s, -5);
    tick(cfg, s, 0);
    expect(s.credits).toBe(0);
  });

  it('a tap always gives at least 1 credit', () => {
    const s = createState(cfg, T0);
    const before = s.credits;
    tap(cfg, s);
    expect(s.credits - before).toBeGreaterThanOrEqual(1);
  });
});

describe('bundle purchase (D-008)', () => {
  it('buying a GPU that would throttle also buys the needed infrastructure', () => {
    const s = richState();
    s.levels['basic_pc'] = 1;
    // Fill the starter cooling so one more GPU would throttle.
    s.levels['gpu_rack'] = 4;
    const plan = planPurchase(cfg, s, 'gpu_rack');
    expect(plan.infraAdded.length).toBeGreaterThan(0);
    expect(plan.items.length).toBe(1 + plan.infraAdded.length);
    const ok = buy(cfg, s, 'gpu_rack');
    expect(ok).toBe(true);
    expect(network(cfg, s).eff).toBeGreaterThanOrEqual(0.99);
  });

  it('does not bundle infrastructure when the purchase does not throttle', () => {
    const s = richState();
    const plan = planPurchase(cfg, s, 'basic_pc');
    expect(plan.infraAdded).toEqual([]);
    expect(plan.items).toEqual(['basic_pc']);
  });

  it('credits never go negative across many random purchases', () => {
    const s = richState();
    const ids = cfg.devices.map((d) => d.id);
    let seed = 42;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < 2000; i++) {
      const id = ids[Math.floor(rnd() * ids.length)]!;
      buy(cfg, s, id);
      tick(cfg, s, rnd() * 5);
      expect(s.credits).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(s.credits)).toBe(true);
    }
  });
});

describe('offline earnings', () => {
  it('pays the offline rate for the time away', () => {
    const s = createState(cfg, T0);
    buy(cfg, s, 'basic_pc');
    const r = offlineEarnings(cfg, s, T0 + 3600 * 1000);
    expect(r.seconds).toBe(3600);
    expect(r.credits).toBeCloseTo(0.5 * 3600 * cfg.offline.rate, 6);
  });

  it('caps the time at the configured hours', () => {
    const s = createState(cfg, T0);
    buy(cfg, s, 'basic_pc');
    const r = offlineEarnings(cfg, s, T0 + 100 * 3600 * 1000);
    expect(r.seconds).toBe(cfg.offline.capHours * 3600);
  });

  it('pays nothing if the clock went backwards', () => {
    const s = createState(cfg, T0);
    buy(cfg, s, 'basic_pc');
    expect(offlineEarnings(cfg, s, T0 - 5000)).toEqual({ seconds: 0, credits: 0 });
  });

  it('applyOffline credits the account and moves lastSeen forward', () => {
    const s = createState(cfg, T0);
    buy(cfg, s, 'basic_pc');
    const r = applyOffline(cfg, s, T0 + 600_000);
    expect(s.credits).toBeCloseTo(r.credits, 6);
    expect(s.lastSeenMs).toBe(T0 + 600_000);
  });
});

describe('prestige reboot', () => {
  it('is refused when no points would be gained', () => {
    const s = createState(cfg, T0);
    expect(reboot(cfg, s)).toBe(0);
    expect(s.neuralPoints).toBe(0);
  });

  it('banks points, resets the run and boosts income afterwards', () => {
    const s = richState();
    s.lifetime = cfg.prestige.T * 9;
    s.levels = { basic_pc: 10 };
    const incomeBefore = computeNetwork(cfg, s.levels).income;
    const gain = reboot(cfg, s);
    expect(gain).toBe(3);
    expect(s.neuralPoints).toBe(3);
    expect(s.levels).toEqual({});
    expect(s.lifetime).toBe(0);
    s.levels = { basic_pc: 10 };
    expect(network(cfg, s).income).toBeGreaterThan(incomeBefore);
  });
});

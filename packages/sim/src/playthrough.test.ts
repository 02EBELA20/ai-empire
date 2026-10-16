import { describe, expect, it } from 'vitest';
import economyJson from '../../data/economy.json';
import type { EconomyConfig } from '@economy';
import { buy, canAfford, createState, network, planPurchase, tick } from './index';

const cfg = economyJson as unknown as EconomyConfig;

/** Plays through the same public API the UI uses: buy the best affordable gain-per-cost option each second. */
function playMinutes(minutes: number) {
  const s = createState(cfg, 0);
  const firstBuy: Record<string, number> = {};
  for (let sec = 0; sec < minutes * 60; sec++) {
    tick(cfg, s, 1);
    for (let guard = 0; guard < 50; guard++) {
      const base = network(cfg, s).income;
      let best: { id: string; score: number } | null = null;
      for (const d of cfg.devices) {
        const plan = planPurchase(cfg, s, d.id);
        if (!plan.unlocked) continue;
        const lv = { ...s.levels };
        for (const id of plan.items) lv[id] = (lv[id] ?? 0) + 1;
        const gain = network(cfg, { ...s, levels: lv }).income - base;
        if (gain <= 0) continue;
        const score = gain / plan.total;
        if (!best || score > best.score) best = { id: d.id, score };
      }
      if (!best || !canAfford(s, planPurchase(cfg, s, best.id))) break;
      buy(cfg, s, best.id);
      firstBuy[best.id] ??= sec;
    }
  }
  return { s, firstBuy };
}

describe('simulated playthrough through the public sim API', () => {
  it('first PC is bought immediately and income keeps growing', () => {
    const { s, firstBuy } = playMinutes(10);
    expect(firstBuy['basic_pc']).toBeLessThanOrEqual(1);
    expect(network(cfg, s).income).toBeGreaterThan(5);
  });

  it('reaches a GPU rack inside the 3-12 minute pacing window and never throttles after bundle buys', () => {
    const { s, firstBuy } = playMinutes(20);
    const t = firstBuy['gpu_rack'];
    expect(t).toBeDefined();
    expect(t!).toBeGreaterThan(3 * 60);
    expect(t!).toBeLessThan(12 * 60);
    expect(network(cfg, s).eff).toBeGreaterThanOrEqual(0.99);
  });
});

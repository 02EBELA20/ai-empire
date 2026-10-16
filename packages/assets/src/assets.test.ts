import { describe, expect, it } from 'vitest';
import assetsJson from '../../data/device-assets.json';
import economyJson from '../../data/economy.json';
import type { EconomyConfig } from '@economy';
import {
  assetFileName,
  assetPath,
  checkAsset,
  footprintMeters,
  maxModelSize,
  parseAssetFileName,
  stageForLevel,
  type AssetConfig,
  type AssetStats,
} from './index';

const cfg = assetsJson as unknown as AssetConfig;
const economy = economyJson as unknown as EconomyConfig;

/** A model with the owner-approved gpu_rack stage 1 size: 3.2 m wide (X), 2.8 m deep (Z), 2.5 m tall. */
function goodRack(over: Partial<AssetStats> = {}): AssetStats {
  return {
    min: [-1.6, 0, -1.4],
    max: [1.6, 2.5, 1.4],
    triangles: 980,
    meshes: 1,
    materials: 1,
    nodes: ['gpu_rack', 'body', 'socket_power', 'socket_data', 'socket_cooling', 'fan_a'],
    ...over,
  };
}

describe('contract data', () => {
  it('covers exactly the economy devices that have a visual', () => {
    const visual = economy.devices.map((d) => d.id).sort();
    expect(Object.keys(cfg.devices).sort()).toEqual(visual);
  });
  it('has four stages of height and budget per device, growing with the stage', () => {
    for (const [id, spec] of Object.entries(cfg.devices)) {
      expect(spec.heights).toHaveLength(4);
      expect(spec.triangles).toHaveLength(4);
      for (let i = 1; i < 4; i++) {
        expect(spec.heights[i]!, id).toBeGreaterThanOrEqual(spec.heights[i - 1]!);
        expect(spec.triangles[i]!, id).toBeGreaterThan(spec.triangles[i - 1]!);
      }
    }
  });
  it('keeps the whole device set well under the triangle cap at stage 4 with the current instance limits', () => {
    const counts: Record<string, number> = { basic_pc: 4, power_gen: 1, cooling: 4, gpu_rack: 4, network_hub: 1, ai_core: 1 };
    let total = 0;
    for (const [id, n] of Object.entries(counts)) total += cfg.devices[id]!.triangles[3]! * n;
    expect(total).toBeLessThan(90_000);
  });
  it('stage thresholds line up with income milestones, so a visual change always lands on a milestone', () => {
    for (const lvl of cfg.stageLevels.slice(1)) expect(economy.milestones.levels).toContain(lvl);
  });
});

describe('stages and names', () => {
  it('maps levels to stages at 1 / 25 / 100 / 400', () => {
    expect([0, 1, 24].map((l) => stageForLevel(cfg, l))).toEqual([1, 1, 1]);
    expect([25, 99].map((l) => stageForLevel(cfg, l))).toEqual([2, 2]);
    expect([100, 399].map((l) => stageForLevel(cfg, l))).toEqual([3, 3]);
    expect([400, 5000].map((l) => stageForLevel(cfg, l))).toEqual([4, 4]);
  });
  it('builds and parses file names', () => {
    expect(assetFileName('gpu_rack', 1)).toBe('gpu_rack_s1.glb');
    expect(assetPath('gpu_rack', 1)).toBe('assets/models/devices/gpu_rack_s1.glb');
    expect(parseAssetFileName('/assets/models/devices/gpu_rack_s1.glb')).toEqual({ id: 'gpu_rack', stage: 1 });
    expect(parseAssetFileName('network_hub_s4.glb')).toEqual({ id: 'network_hub', stage: 4 });
    expect(parseAssetFileName('gpu_rack_stage1.glb')).toBeNull();
    expect(parseAssetFileName('gpu_rack_s5.glb')).toBeNull();
  });
  it('keeps the recommended sizes inside the footprint limit and equal to the stage height', () => {
    for (const [id, spec] of Object.entries(cfg.devices)) {
      for (const [stage, [w, d, h]] of Object.entries(spec.recommended ?? {})) {
        const max = maxModelSize(cfg, id)!;
        expect(w, `${id} s${stage} width`).toBeLessThanOrEqual(max[0]);
        expect(d, `${id} s${stage} depth`).toBeLessThanOrEqual(max[1]);
        expect(h, `${id} s${stage} height`).toBe(spec.heights[Number(stage) - 1]);
      }
    }
    expect(cfg.devices['gpu_rack']!.recommended!['1']).toEqual([3.2, 2.8, 2.5]);
  });
  it('gives the gpu_rack a 4 x 4 m footprint and a 3.84 m model limit', () => {
    expect(footprintMeters(cfg, 'gpu_rack')).toEqual([4, 4]);
    const m = maxModelSize(cfg, 'gpu_rack')!;
    expect(m[0]).toBeCloseTo(3.84, 6);
    expect(m[1]).toBeCloseTo(3.84, 6);
  });
});

describe('checkAsset', () => {
  const errors = (s: AssetStats, id = 'gpu_rack', stage = 1) => checkAsset(cfg, id, stage, s).filter((i) => i.severity === 'error');
  it('accepts a model that follows the contract with no issues', () => {
    expect(checkAsset(cfg, 'gpu_rack', 1, goodRack())).toEqual([]);
  });
  it('accepts the owner-approved gpu_rack stage 1 size: 3.2 x 2.8 x 2.5 m', () => {
    expect(checkAsset(cfg, 'gpu_rack', 1, goodRack({ min: [-1.6, 0, -1.4], max: [1.6, 2.5, 1.4] }))).toEqual([]);
  });
  it('accepts the full allowed footprint (3.84 x 3.84 m) at the stage 1 height', () => {
    expect(checkAsset(cfg, 'gpu_rack', 1, goodRack({ min: [-1.92, 0, -1.92], max: [1.92, 2.5, 1.92] }))).toEqual([]);
  });
  it('accepts heights within 25% of the spec silently and only warns beyond that', () => {
    expect(checkAsset(cfg, 'gpu_rack', 1, goodRack({ max: [1.6, 2.0, 1.4] }))).toEqual([]);
    expect(checkAsset(cfg, 'gpu_rack', 1, goodRack({ max: [1.6, 3.1, 1.4] }))).toEqual([]);
    const tall = checkAsset(cfg, 'gpu_rack', 1, goodRack({ max: [1.6, 3.3, 1.4] }));
    expect(tall.map((i) => i.severity)).toEqual(['warn']);
  });
  it('rejects a model exported in centimeters', () => {
    expect(errors(goodRack({ min: [-160, 0, -140], max: [160, 250, 140] })).length).toBeGreaterThan(0);
  });
  it('rejects a model that is floating or buried (origin not on the floor)', () => {
    expect(errors(goodRack({ min: [-1.6, 0.8, -1.4], max: [1.6, 3.3, 1.4] }))[0]!.message).toMatch(/floor/);
  });
  it('rejects a model that is off-center (pivot not at the footprint center)', () => {
    expect(errors(goodRack({ min: [0, 0, -1.4], max: [3.2, 2.5, 1.4] }))[0]!.message).toMatch(/pivot|centered/);
  });
  it('rejects a model larger than its footprint', () => {
    expect(errors(goodRack({ min: [-2.4, 0, -2.4], max: [2.4, 2.5, 2.4] }))[0]!.message).toMatch(/footprint/);
  });
  it('warns, but accepts, a model slightly over the triangle budget or with extra materials', () => {
    const issues = checkAsset(cfg, 'gpu_rack', 1, goodRack({ triangles: 1400, materials: 4 }));
    expect(issues.every((i) => i.severity === 'warn')).toBe(true);
    expect(issues.length).toBe(2);
  });
  it('rejects a model with more than double the budget', () => {
    expect(errors(goodRack({ triangles: 2500 })).length).toBe(1);
  });
  it('warns about a missing socket and wrong height', () => {
    const issues = checkAsset(cfg, 'gpu_rack', 1, goodRack({ max: [1.6, 3.4, 1.4], nodes: ['body', 'socket_power', 'socket_data'] }));
    expect(issues.map((i) => i.message).join('|')).toMatch(/socket_cooling/);
    expect(issues.map((i) => i.message).join('|')).toMatch(/height/);
    expect(issues.every((i) => i.severity === 'warn')).toBe(true);
  });
  it('rejects an unknown device, an out-of-range stage and an empty model', () => {
    expect(errors(goodRack(), 'toaster', 1).length).toBe(1);
    expect(errors(goodRack(), 'gpu_rack', 5).length).toBe(1);
    expect(errors(goodRack({ meshes: 0, triangles: 0 })).length).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import economyJson from '../../data/economy.json';
import type { EconomyConfig } from '@economy';
import { createState } from '@sim';
import { SAVE_VERSION, deserialize, loadGame, saveGame, serialize, type StorageLike } from './index';

const cfg = economyJson as unknown as EconomyConfig;
const ids = cfg.devices.map((d) => d.id);

class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

describe('save round trip', () => {
  it('restores the exact state', () => {
    const s = createState(cfg, 1000);
    s.credits = 12345.5;
    s.lifetime = 99999;
    s.neuralPoints = 4;
    s.playSeconds = 321;
    s.levels = { basic_pc: 12, gpu_rack: 3 };
    const back = deserialize(serialize(s, 5000), ids);
    expect(back).not.toBeNull();
    expect(back!.credits).toBe(12345.5);
    expect(back!.levels).toEqual({ basic_pc: 12, gpu_rack: 3 });
    expect(back!.neuralPoints).toBe(4);
    expect(back!.lastSeenMs).toBe(5000);
  });

  it('works through a storage object', () => {
    const st = new MemoryStorage();
    const s = createState(cfg, 1);
    s.levels = { basic_pc: 2 };
    saveGame(st, 'k', s, 2);
    expect(loadGame(st, 'k', ids)?.levels).toEqual({ basic_pc: 2 });
    expect(loadGame(st, 'missing', ids)).toBeNull();
  });
});

describe('save validation', () => {
  it('rejects corrupt JSON', () => {
    expect(deserialize('not json', ids)).toBeNull();
    expect(deserialize('null', ids)).toBeNull();
    expect(deserialize('"x"', ids)).toBeNull();
  });

  it('rejects saves from a newer game version', () => {
    const env = JSON.parse(serialize(createState(cfg, 1), 2));
    env.version = SAVE_VERSION + 1;
    expect(deserialize(JSON.stringify(env), ids)).toBeNull();
  });

  it('rejects NaN, negative or non-numeric values', () => {
    const base = JSON.parse(serialize(createState(cfg, 1), 2));
    for (const bad of [-1, 'a', null]) {
      const e = structuredClone(base);
      e.state.credits = bad;
      expect(deserialize(JSON.stringify(e), ids)).toBeNull();
    }
    const e2 = structuredClone(base);
    e2.state.levels = { basic_pc: -3 };
    expect(deserialize(JSON.stringify(e2), ids)).toBeNull();
  });

  it('drops unknown device ids and floors fractional levels', () => {
    const e = JSON.parse(serialize(createState(cfg, 1), 2));
    e.state.levels = { basic_pc: 5.9, hacked_device: 999 };
    const back = deserialize(JSON.stringify(e), ids)!;
    expect(back.levels).toEqual({ basic_pc: 5 });
  });

  it('survives a storage that throws', () => {
    const bad: StorageLike = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('full');
      },
      removeItem() {},
    };
    expect(() => saveGame(bad, 'k', createState(cfg, 1), 2)).not.toThrow();
    expect(loadGame(bad, 'k', ids)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import assetsJson from '@data/device-assets.json';
import type { AssetConfig } from '@assets';
import { DeviceAssets, parseDeviceGlb } from './deviceAssets';

const cfg = assetsJson as unknown as AssetConfig;

/** Builds a tiny valid GLB in memory: a box sitting on the floor, centered on X/Z, plus the contract's named nodes. Test fixture only, never shipped. */
function makeGlb(w: number, h: number, d: number, opts: { lift?: number } = {}): ArrayBuffer {
  const y0 = opts.lift ?? 0;
  const xs = [-w / 2, w / 2];
  const zs = [-d / 2, d / 2];
  const pos: number[] = [];
  for (const y of [y0, y0 + h]) for (const z of zs) for (const x of xs) pos.push(x, y, z);
  const idx = [0, 1, 3, 0, 3, 2, 4, 6, 7, 4, 7, 5, 0, 4, 5, 0, 5, 1, 2, 3, 7, 2, 7, 6, 0, 2, 6, 0, 6, 4, 1, 5, 7, 1, 7, 3];
  const bin = new ArrayBuffer(96 + 72);
  new Float32Array(bin, 0, 24).set(pos);
  new Uint16Array(bin, 96, 36).set(idx);
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      { name: 'gpu_rack', children: [1, 2, 3, 4, 5] },
      { name: 'body', mesh: 0 },
      { name: 'socket_power', translation: [-w / 2, 0.5, 0] },
      { name: 'socket_data', translation: [w / 2, 0.5, 0] },
      { name: 'socket_cooling', translation: [0, 0.5, d / 2] },
      { name: 'fan_a', translation: [0, y0 + h, 0] },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }, { attributes: { POSITION: 0 }, indices: 1, material: 1 }] }],
    materials: [{ name: 'metal' }, { name: 'emissive_lamps', emissiveFactor: [1, 0.5, 0] }],
    buffers: [{ byteLength: 168 }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 96 },
      { buffer: 0, byteOffset: 96, byteLength: 72 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3', min: [-w / 2, y0, -d / 2], max: [w / 2, y0 + h, d / 2] },
      { bufferView: 1, componentType: 5123, count: 36, type: 'SCALAR' },
    ],
  };
  let js = JSON.stringify(json);
  while (js.length % 4 !== 0) js += ' ';
  const jb = new TextEncoder().encode(js);
  const total = 12 + 8 + jb.length + 8 + bin.byteLength;
  const out = new ArrayBuffer(total);
  const dv = new DataView(out);
  dv.setUint32(0, 0x46546c67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jb.length, true);
  dv.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(out, 20, jb.length).set(jb);
  const o = 20 + jb.length;
  dv.setUint32(o, bin.byteLength, true);
  dv.setUint32(o + 4, 0x004e4942, true);
  new Uint8Array(out, o + 8).set(new Uint8Array(bin));
  return out;
}

const opts = { meshopt: false };

describe('parseDeviceGlb', () => {
  it('accepts a model that follows the contract', async () => {
    const { asset, report } = await parseDeviceGlb(cfg, 'gpu_rack_s1.glb', makeGlb(3.8, 1.6, 3.8), opts);
    expect(report.issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(asset).not.toBeNull();
    expect(asset!.key).toBe('gpu_rack_s1');
    expect(asset!.stats.triangles).toBe(24);
    expect(asset!.stats.materials).toBe(2);
  });

  it('rejects a bad file name', async () => {
    const { asset, report } = await parseDeviceGlb(cfg, 'rack.glb', makeGlb(3.8, 1.6, 3.8), opts);
    expect(asset).toBeNull();
    expect(report.issues[0]!.message).toMatch(/file name/);
  });

  it('rejects a model exported in centimeters, and a floating one', async () => {
    expect((await parseDeviceGlb(cfg, 'gpu_rack_s1.glb', makeGlb(380, 160, 380), opts)).asset).toBeNull();
    expect((await parseDeviceGlb(cfg, 'gpu_rack_s1.glb', makeGlb(3.8, 1.6, 3.8, { lift: 1 }), opts)).asset).toBeNull();
  });

  it('reports unreadable data instead of throwing', async () => {
    const { asset, report } = await parseDeviceGlb(cfg, 'gpu_rack_s1.glb', new ArrayBuffer(16), opts);
    expect(asset).toBeNull();
    expect(report.issues[0]!.message).toMatch(/could not read/);
  });
});

describe('DeviceAssets.instantiate', () => {
  async function loaded() {
    const { asset } = await parseDeviceGlb(cfg, 'gpu_rack_s1.glb', makeGlb(3.8, 1.6, 3.8), opts);
    const a = new DeviceAssets(cfg);
    a.add(asset!);
    return a;
  }

  it('reports which stages it has', async () => {
    const a = await loaded();
    expect(a.has('gpu_rack', 1)).toBe(true);
    expect(a.has('gpu_rack', 2)).toBe(false);
    expect(a.has('cooling', 1)).toBe(false);
    expect(a.instantiate('gpu_rack', 2, [1, 0.9])).toBeNull();
  });

  it('scales meters to world units and moves the footprint-center pivot to the middle of the legacy footprint', async () => {
    const inst = (await loaded()).instantiate('gpu_rack', 1, [1, 0.9])!;
    expect(inst.holder.scale.x).toBeCloseTo(cfg.worldPerMeter, 9);
    expect(inst.holder.position.x).toBeCloseTo(0.5, 9);
    expect(inst.holder.position.z).toBeCloseTo(0.45, 9);
    const box = new THREE.Box3().setFromObject(inst.holder);
    expect(box.min.y).toBeCloseTo(0, 6);
    expect(box.max.y).toBeCloseTo(1.6 * cfg.worldPerMeter, 6);
    expect(box.max.x - box.min.x).toBeCloseTo(3.8 * cfg.worldPerMeter, 6);
  });

  it('exposes fans, sockets and per-instance emissive materials', async () => {
    const a = await loaded();
    const one = a.instantiate('gpu_rack', 1, [1, 0.9])!;
    const two = a.instantiate('gpu_rack', 1, [1, 0.9])!;
    expect(one.fans.map((f) => f.name)).toEqual(['fan_a']);
    expect(Object.keys(one.sockets).sort()).toEqual(['socket_cooling', 'socket_data', 'socket_power']);
    // socket_power sits at x = -1.9 m relative to the pivot, i.e. 0.5 - 1.9 * 0.25 in the group
    expect(one.sockets['socket_power']!.x).toBeCloseTo(0.5 - 1.9 * cfg.worldPerMeter, 6);
    expect(one.emissives).toHaveLength(1);
    expect(one.emissives[0]!.mat).not.toBe(two.emissives[0]!.mat);
  });
});

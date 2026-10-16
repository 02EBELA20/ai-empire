/**
 * Device asset contract (Milestone 4). Pure data and checks, no Three.js, so it is testable in Node.
 * Numbers come from packages/data/device-assets.json; the human-readable contract is docs/ASSET_CONTRACT.md.
 */

export interface DeviceAssetSpec {
  /** Footprint in tiles on X and Z. */
  tiles: [number, number];
  /** Model height in meters per stage (index 0 = stage 1). */
  heights: number[];
  /** Triangle budget per stage. */
  triangles: number[];
  /** Named connection empties the model should provide. */
  sockets: string[];
  /** Optional recommended visible size per stage (key = stage number): [width X, depth Z, height Y] in meters. Informational; the hard limits are the footprint and the height tolerance. */
  recommended?: Record<string, [number, number, number]>;
  note?: string;
}

export interface AssetConfig {
  version: number;
  tileMeters: number;
  insetMeters: number;
  worldPerMeter: number;
  stageLevels: number[];
  devices: Record<string, DeviceAssetSpec>;
}

/** What the loader measured on a parsed model. Positions are in meters, in Three.js axes (Y up). */
export interface AssetStats {
  min: [number, number, number];
  max: [number, number, number];
  triangles: number;
  meshes: number;
  materials: number;
  /** Names of all nodes in the file. */
  nodes: string[];
}

export interface AssetIssue {
  severity: 'error' | 'warn';
  message: string;
}

export const MODEL_DIR = 'assets/models/devices';

/** Stage 1 below the second threshold, up to stage 4 at the last. Same rule as the in-game `stageOf`. */
export function stageForLevel(cfg: AssetConfig, level: number): number {
  let stage = 1;
  for (let i = 1; i < cfg.stageLevels.length; i++) if (level >= cfg.stageLevels[i]!) stage = i + 1;
  return stage;
}

export const assetKey = (id: string, stage: number): string => `${id}_s${stage}`;
export const assetFileName = (id: string, stage: number): string => `${assetKey(id, stage)}.glb`;
export const assetPath = (id: string, stage: number): string => `${MODEL_DIR}/${assetFileName(id, stage)}`;

/** Parses `gpu_rack_s1.glb` (or a path ending in it) into id and stage; null if the name does not follow the contract. */
export function parseAssetFileName(path: string): { id: string; stage: number } | null {
  const m = /([a-z][a-z0-9_]*)_s([1-4])\.glb$/.exec(path);
  return m ? { id: m[1]!, stage: Number(m[2]) } : null;
}

/** Full tile footprint in meters, before the safety inset. */
export function footprintMeters(cfg: AssetConfig, id: string): [number, number] | null {
  const spec = cfg.devices[id];
  return spec ? [spec.tiles[0] * cfg.tileMeters, spec.tiles[1] * cfg.tileMeters] : null;
}

/** Largest allowed model size on X and Z: the footprint minus the inset on each side. */
export function maxModelSize(cfg: AssetConfig, id: string): [number, number] | null {
  const f = footprintMeters(cfg, id);
  return f ? [f[0] - 2 * cfg.insetMeters, f[1] - 2 * cfg.insetMeters] : null;
}

/**
 * Checks a parsed model against the contract. Any `error` means the game rejects the model and keeps the placeholder;
 * `warn` means it is accepted but should be reviewed.
 */
export function checkAsset(cfg: AssetConfig, id: string, stage: number, s: AssetStats): AssetIssue[] {
  const out: AssetIssue[] = [];
  const err = (message: string) => out.push({ severity: 'error', message });
  const warn = (message: string) => out.push({ severity: 'warn', message });
  const spec = cfg.devices[id];
  if (!spec) {
    err(`unknown device id "${id}"`);
    return out;
  }
  if (!Number.isInteger(stage) || stage < 1 || stage > spec.heights.length) {
    err(`stage ${stage} is outside 1..${spec.heights.length}`);
    return out;
  }
  if (s.meshes === 0 || s.triangles === 0) {
    err('the model has no mesh geometry');
    return out;
  }
  const size = maxModelSize(cfg, id)!;
  const wantH = spec.heights[stage - 1]!;
  const w = s.max[0] - s.min[0];
  const h = s.max[1] - s.min[1];
  const d = s.max[2] - s.min[2];

  if (h > wantH * 6 || h < wantH / 6) err(`height ${h.toFixed(2)} m is far from the expected ${wantH} m: check that 1 Blender unit = 1 meter and that the export is Y-up`);
  if (Math.abs(s.min[1]) > 0.1) err(`the model must sit on the floor: its lowest point is at y=${s.min[1].toFixed(2)} m (origin must be at floor level)`);
  const tol = 0.05;
  if (w > size[0] * (1 + tol) || d > size[1] * (1 + tol)) {
    err(`footprint ${w.toFixed(2)} x ${d.toFixed(2)} m exceeds the allowed ${size[0].toFixed(2)} x ${size[1].toFixed(2)} m (tiles ${spec.tiles.join('x')} minus inset)`);
  }
  const halfW = size[0] / 2 + 0.05 * size[0];
  const halfD = size[1] / 2 + 0.05 * size[1];
  if (s.min[0] < -halfW || s.max[0] > halfW || s.min[2] < -halfD || s.max[2] > halfD) {
    err('the pivot must be at the center of the footprint on the floor: the model is not centered on X/Z');
  }
  if (!out.some((i) => i.severity === 'error')) {
    if (w < size[0] * 0.5 && d < size[1] * 0.5) warn(`the model fills under half of its footprint (${w.toFixed(2)} x ${d.toFixed(2)} m): intended?`);
    if (h < wantH * 0.75 || h > wantH * 1.25) warn(`height ${h.toFixed(2)} m differs more than 25% from the spec ${wantH} m`);
  }
  const budget = spec.triangles[stage - 1]!;
  if (s.triangles > budget * 2) err(`${s.triangles} triangles is more than double the budget of ${budget}`);
  else if (s.triangles > budget * 1.25) warn(`${s.triangles} triangles exceeds the budget of ${budget} by more than 25%`);
  if (s.materials > 3) warn(`${s.materials} materials; keep to 1-2 (3 in exceptional cases) to protect the draw-call budget`);
  for (const sock of spec.sockets) if (!s.nodes.includes(sock)) warn(`missing connection empty "${sock}"`);
  return out;
}

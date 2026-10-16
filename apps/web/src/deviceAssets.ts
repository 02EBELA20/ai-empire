import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { assetKey, checkAsset, parseAssetFileName, type AssetConfig, type AssetIssue, type AssetStats } from '@assets';

/** One accepted model, kept as a template and cloned for every placed device. */
export interface LoadedAsset {
  key: string;
  id: string;
  stage: number;
  template: THREE.Object3D;
  stats: AssetStats;
  issues: AssetIssue[];
}

/** Result of trying to load one file, kept for debugging (`?debug` exposes it as window.__ai.assets). */
export interface AssetReport {
  file: string;
  key: string | null;
  accepted: boolean;
  issues: AssetIssue[];
}

/** A cloned model ready to add to a device group. All lengths are already in world units. */
export interface AssetInstance {
  holder: THREE.Group;
  /** Nodes named `fan_*`; the game spins each around its own local Y axis (the empty's local Z axis in Blender). */
  fans: THREE.Object3D[];
  /** Materials named `emissive*` (cloned per instance, so state tinting never leaks between devices). */
  emissives: { mat: THREE.MeshStandardMaterial; color: THREE.Color; base: number }[];
  /** Positions of `socket_*` empties relative to the device group origin. */
  sockets: Record<string, THREE.Vector3>;
}

function measure(scene: THREE.Object3D): AssetStats {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  let triangles = 0;
  let meshes = 0;
  const materials = new Set<THREE.Material>();
  const nodes: string[] = [];
  scene.traverse((o) => {
    if (o.name) nodes.push(o.name);
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    meshes++;
    const g = m.geometry;
    triangles += g.index ? g.index.count / 3 : (g.getAttribute('position')?.count ?? 0) / 3;
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) materials.add(mat);
  });
  const empty = box.isEmpty();
  return {
    min: empty ? [0, 0, 0] : [box.min.x, box.min.y, box.min.z],
    max: empty ? [0, 0, 0] : [box.max.x, box.max.y, box.max.z],
    triangles: Math.round(triangles),
    meshes,
    materials: materials.size,
    nodes,
  };
}

/** Parses and validates one GLB. Returns null (with the reasons in `report`) when the contract is broken. */
export async function parseDeviceGlb(
  cfg: AssetConfig,
  file: string,
  data: ArrayBuffer,
  opts: { meshopt?: boolean } = {},
): Promise<{ asset: LoadedAsset | null; report: AssetReport }> {
  const parsed = parseAssetFileName(file);
  const report: AssetReport = { file, key: parsed ? assetKey(parsed.id, parsed.stage) : null, accepted: false, issues: [] };
  if (!parsed) {
    report.issues.push({ severity: 'error', message: 'file name must be <device_id>_s<1-4>.glb, for example gpu_rack_s1.glb' });
    return { asset: null, report };
  }
  try {
    const loader = new GLTFLoader();
    if (opts.meshopt !== false) {
      const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js');
      loader.setMeshoptDecoder(MeshoptDecoder);
    }
    const gltf = await loader.parseAsync(data, '');
    const scene = gltf.scene;
    const strip: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if ((o as THREE.Light).isLight || (o as THREE.Camera).isCamera) strip.push(o);
    });
    for (const o of strip) o.removeFromParent();
    if (strip.length > 0) report.issues.push({ severity: 'warn', message: `removed ${strip.length} light/camera node(s): models must not contain them` });
    const stats = measure(scene);
    const issues = checkAsset(cfg, parsed.id, parsed.stage, stats);
    report.issues.push(...issues);
    if (issues.some((i) => i.severity === 'error')) return { asset: null, report };
    report.accepted = true;
    return { asset: { key: report.key!, id: parsed.id, stage: parsed.stage, template: scene, stats, issues: report.issues }, report };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const hint = /ktx2/i.test(msg) ? ' (KTX2 textures are not wired yet; use PNG/WebP while prototyping, see docs/ASSET_CONTRACT.md)' : '';
    report.issues.push({ severity: 'error', message: `could not read the GLB: ${msg}${hint}` });
    return { asset: null, report };
  }
}

function decodeDataUrl(url: string): ArrayBuffer {
  const b64 = url.slice(url.indexOf(',') + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function readUrl(url: string): Promise<ArrayBuffer> {
  // The single-file preview inlines assets as data: URLs; decode them directly because fetch of data: may be blocked.
  if (url.startsWith('data:')) return decodeDataUrl(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.arrayBuffer();
}

export class DeviceAssets {
  private items = new Map<string, LoadedAsset>();
  readonly reports: AssetReport[] = [];

  constructor(private cfg: AssetConfig) {}

  add(asset: LoadedAsset): void {
    this.items.set(asset.key, asset);
  }

  has(id: string, stage: number): boolean {
    return this.items.has(assetKey(id, stage));
  }

  get size(): number {
    return this.items.size;
  }

  /**
   * Builds a ready-to-place copy. `footprint` is the device footprint in world units in the scene's corner-origin layout:
   * the model's footprint-center pivot is moved to the middle of it, and meters are converted to world units.
   */
  instantiate(id: string, stage: number, footprint: [number, number]): AssetInstance | null {
    const a = this.items.get(assetKey(id, stage));
    if (!a) return null;
    const holder = new THREE.Group();
    holder.name = `asset:${a.key}`;
    const model = a.template.clone(true);
    const emissives: AssetInstance['emissives'] = [];
    const fans: THREE.Object3D[] = [];
    const sockets: Record<string, THREE.Vector3> = {};
    holder.add(model);
    holder.scale.setScalar(this.cfg.worldPerMeter);
    holder.position.set(footprint[0] / 2, 0, footprint[1] / 2);
    holder.updateMatrixWorld(true);
    model.traverse((o) => {
      if (o.name.startsWith('fan_')) fans.push(o);
      if (o.name.startsWith('socket_')) {
        // The holder is not attached to a device group yet, so its world matrix is relative to the device group origin.
        sockets[o.name] = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
      }
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const swap = (mat: THREE.Material): THREE.Material => {
        if (!mat.name.startsWith('emissive') || !(mat instanceof THREE.MeshStandardMaterial)) return mat;
        const c = mat.clone();
        emissives.push({ mat: c, color: c.emissive.clone(), base: c.emissiveIntensity });
        return c;
      };
      m.material = Array.isArray(m.material) ? m.material.map(swap) : swap(m.material);
    });
    return { holder, fans, emissives, sockets };
  }
}

/** Finds every model shipped in apps/web/assets/models/devices, parses and validates it, and logs what was rejected. */
export async function loadBundledDeviceAssets(cfg: AssetConfig): Promise<DeviceAssets> {
  const files = import.meta.glob('/assets/models/devices/*.glb', { query: '?url', import: 'default' }) as Record<string, () => Promise<string>>;
  const assets = new DeviceAssets(cfg);
  for (const [path, load] of Object.entries(files)) {
    const name = path.slice(path.lastIndexOf('/') + 1);
    try {
      const data = await readUrl(await load());
      const { asset, report } = await parseDeviceGlb(cfg, name, data);
      assets.reports.push(report);
      for (const i of report.issues) (i.severity === 'error' ? console.error : console.warn)(`[assets] ${name}: ${i.message}`);
      if (asset) assets.add(asset);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      assets.reports.push({ file: name, key: null, accepted: false, issues: [{ severity: 'error', message }] });
      console.error(`[assets] ${name}: ${message}`);
    }
  }
  return assets;
}

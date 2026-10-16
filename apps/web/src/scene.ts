import * as THREE from 'three';
import type { NetworkResult } from '@economy';
import type { GameState } from '@sim';

type V2 = [number, number];
type CableKind = 'power' | 'cooling' | 'data';
interface CableDef {
  path: V2[];
  kind: CableKind;
}
interface Placed {
  id: string;
  pos: V2;
  stage: number;
}

const COLORS = { power: 0xffb02e, cooling: 0x4db8ff, data: 0x2ee6a8, bad: 0xff5a5a };

const visualCount = (level: number, max: number): number => (level <= 0 ? 0 : Math.min(max, 1 + Math.floor(level / 12)));
const stageOf = (level: number): number => (level >= 400 ? 4 : level >= 100 ? 3 : level >= 25 ? 2 : 1);

interface Layout {
  placed: Placed[];
  cables: CableDef[];
  signature: string;
}

function buildLayout(s: GameState): Layout {
  const L = (id: string) => s.levels[id] ?? 0;
  const placed: Placed[] = [];
  const cables: CableDef[] = [];
  const pcs = visualCount(L('basic_pc'), 4);
  const gpus = visualCount(L('gpu_rack'), 4);
  const cools = visualCount(L('cooling'), 4);
  const hasGen = L('power_gen') > 0;
  const hasHub = L('network_hub') > 0;
  const hasCore = L('ai_core') > 0;

  for (let i = 0; i < pcs; i++) placed.push({ id: 'basic_pc', pos: [2.2 + i * 0.9, -1.5], stage: stageOf(L('basic_pc')) });
  if (hasGen) placed.push({ id: 'power_gen', pos: [0, -1.5], stage: stageOf(L('power_gen')) });
  for (let j = 0; j < cools; j++) placed.push({ id: 'cooling', pos: [0, j * 1.2], stage: stageOf(L('cooling')) });
  for (let i = 0; i < gpus; i++) placed.push({ id: 'gpu_rack', pos: [2.2, i * 1.2], stage: stageOf(L('gpu_rack')) });
  if (hasHub) placed.push({ id: 'network_hub', pos: [4.6, 1.5], stage: stageOf(L('network_hub')) });
  if (hasCore) placed.push({ id: 'ai_core', pos: [6.2, 1.8], stage: stageOf(L('ai_core')) });

  const dataTarget: V2 | null = hasHub ? [5.05, 1.95] : hasCore ? [6.85, 2.45] : null;
  for (let i = 0; i < gpus; i++) {
    const y = i * 1.2 + 0.45;
    if (hasGen) cables.push({ kind: 'power', path: [[0.45, -1.05], [1.9, -1.05], [1.9, y], [2.7, y]] });
    if (dataTarget) cables.push({ kind: 'data', path: [[3.2, y], [3.9, y], [3.9, dataTarget[1]], dataTarget] });
  }
  const pcX = (i: number) => 2.2 + i * 0.9 + 0.35;
  if (hasGen) {
    for (let i = 0; i < pcs; i++) cables.push({ kind: 'power', path: [[0.45, -1.05], [1.9, -1.05], [1.9, -1.2], [pcX(i), -1.2]] });
  }
  for (let j = 0; j < cools; j++) {
    const cy = j * 1.2 + 0.45;
    if (gpus > 0) {
      const gy = (j % gpus) * 1.2 + 0.45;
      cables.push({ kind: 'cooling', path: [[0.9, cy], [1.55, cy], [1.55, gy], [2.7, gy]] });
    } else if (pcs > 0) {
      cables.push({ kind: 'cooling', path: [[0.9, cy], [1.55, cy], [1.55, -1.2], [pcX(j % pcs), -1.2]] });
    }
  }
  if (dataTarget) {
    for (let i = 0; i < pcs; i++) {
      const x = 2.2 + i * 0.9 + 0.35;
      cables.push({ kind: 'data', path: [[x, -1.2], [x, -0.7], [3.9, -0.7], [3.9, dataTarget[1]], dataTarget] });
    }
  }
  if (hasHub && hasCore) cables.push({ kind: 'data', path: [[5.05, 1.95], [6.85, 1.95], [6.85, 2.45]] });

  const signature = placed.map((p) => `${p.id}@${p.pos.join(',')}#${p.stage}`).join('|') + '/' + cables.length;
  return { placed, cables, signature };
}

interface DeviceVisual {
  group: THREE.Group;
  spinners: { obj: THREE.Object3D; speed: number; axis: 'y' | 'x' }[];
  statusMats: THREE.MeshStandardMaterial[];
  baseStatus: number;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: number, emissive = 0x000000, intensity = 0): THREE.MeshStandardMaterial {
  const key = `${color}|${emissive}|${intensity}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, flatShading: true, roughness: 0.7, metalness: 0.1 });
    matCache.set(key, m);
  }
  return m;
}

function addBox(g: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, edge?: number): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y + h / 2, z);
  g.add(mesh);
  if (edge !== undefined) {
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: edge }));
    lines.position.copy(mesh.position);
    g.add(lines);
  }
  return mesh;
}
const lit = (c: number) => mat(c, c, 0.22);

function makeFan(r: number, color: number): THREE.Group {
  const f = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.22, 0.05, 8), mat(0x1a1f33));
  f.add(hub);
  for (let k = 0; k < 3; k++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(r * 0.95, 0.025, r * 0.3), mat(color, color, 0.25));
    blade.position.set(Math.cos((k * Math.PI * 2) / 3) * r * 0.5, 0, Math.sin((k * Math.PI * 2) / 3) * r * 0.5);
    blade.rotation.y = -(k * Math.PI * 2) / 3;
    f.add(blade);
  }
  return f;
}

function makeDevice(id: string, stage: number): DeviceVisual {
  const g = new THREE.Group();
  const v: DeviceVisual = { group: g, spinners: [], statusMats: [], baseStatus: 0xffffff };
  switch (id) {
    case 'basic_pc': {
      const h = 0.28 + stage * 0.05;
      addBox(g, 0.7, h, 0.6, 0.35, 0, 0.3, lit(0x4a5a96), 0x37c8ff);
      addBox(g, 0.5, 0.02, 0.4, 0.35, h, 0.3, mat(0x1a2a3a, 0x37c8ff, 1.1));
      if (stage > 1) addBox(g, 0.12, 0.06, 0.12, 0.6, h, 0.5, mat(0x6b7280));
      v.baseStatus = 0x37c8ff;
      break;
    }
    case 'gpu_rack': {
      const h = 0.7 + stage * 0.12;
      addBox(g, 1.0, h, 0.9, 0.5, 0, 0.45, lit(0x5a54b0), 0xaaa3ff);
      const status = mat(0x7f77dd, 0x7f77dd, 1.3);
      v.statusMats.push(status);
      v.baseStatus = 0x7f77dd;
      addBox(g, 1.0, 0.04, 0.05, 0.5, h, 0.88, status);
      for (let k = 0; k < stage + 1; k++) addBox(g, 0.84, 0.04, 0.02, 0.5, 0.14 + k * 0.13, 0.91, mat(0x1b1840, 0xaaa3ff, 0.9));
      const fan = makeFan(0.3, 0xaaa3ff);
      fan.position.set(0.5, h + 0.04, 0.4);
      g.add(fan);
      v.spinners.push({ obj: fan, speed: 6, axis: 'y' });
      break;
    }
    case 'cooling': {
      const h = 0.6 + stage * 0.1;
      addBox(g, 0.9, h, 0.9, 0.45, 0, 0.45, lit(0x2f6aa0), 0x7fd0ff);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 6, 16), mat(0x4db8ff, 0x4db8ff, 1.2));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0.45, h + 0.03, 0.45);
      g.add(ring);
      const fan = makeFan(0.32, 0x7fd0ff);
      fan.position.set(0.45, h + 0.04, 0.45);
      g.add(fan);
      v.spinners.push({ obj: fan, speed: 9, axis: 'y' });
      v.baseStatus = 0x4db8ff;
      break;
    }
    case 'power_gen': {
      const h = 0.55 + stage * 0.1;
      addBox(g, 0.9, h, 0.9, 0.45, 0, 0.45, lit(0x8a6420), 0xffd27a);
      addBox(g, 0.94, 0.07, 0.94, 0.45, h * 0.55, 0.45, mat(0xffb02e, 0xffb02e, 1.3));
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.4, 8), mat(0x2b2210));
      stack.position.set(0.7, h + 0.2, 0.7);
      g.add(stack);
      v.baseStatus = 0xffb02e;
      break;
    }
    case 'network_hub': {
      const h = 0.35 + stage * 0.08;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, h, 6), lit(0x1f8a72));
      body.position.set(0.45, h / 2, 0.45);
      g.add(body);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 18), mat(0x2ee6a8, 0x2ee6a8, 1.4));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0.45, h + 0.03, 0.45);
      g.add(ring);
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), mat(0x7bf5cf, 0x2ee6a8, 1.6));
      orb.position.set(0.45, h + 0.3, 0.45);
      g.add(orb);
      v.spinners.push({ obj: orb, speed: 2.5, axis: 'y' });
      v.baseStatus = 0x2ee6a8;
      break;
    }
    case 'ai_core': {
      const h = 0.8 + stage * 0.15;
      addBox(g, 1.3, h, 1.3, 0.65, 0, 0.65, lit(0x8a4430), 0xffa27d);
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat(0xf0997b, 0xff6a3d, 1.6));
      core.position.set(0.65, h + 0.4, 0.65);
      g.add(core);
      v.spinners.push({ obj: core, speed: 1.6, axis: 'y' });
      for (const [px, pz] of [[0.12, 0.12], [1.18, 0.12], [0.12, 1.18], [1.18, 1.18]] as const) {
        addBox(g, 0.1, 0.18, 0.1, px, h, pz, mat(0xff6a3d, 0xff6a3d, 1.2));
      }
      v.baseStatus = 0xff6a3d;
      break;
    }
    default:
      break;
  }
  return v;
}

interface Particle {
  kind: CableKind;
  pts: THREE.Vector3[];
  cum: number[];
  total: number;
  offset: number;
}

export class GameScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 100);
  private content = new THREE.Group();
  private ground = new THREE.Group();
  private bounds = { x0: 0, x1: 6, z0: -1.5, z1: 4.5 };
  private curCenter = new THREE.Vector3(3, 0, 1.5);
  private tgtCenter = new THREE.Vector3(3, 0, 1.5);
  private tgtZoom = 1;
  private signature = '';
  private visuals: { id: string; v: DeviceVisual }[] = [];
  private flashes = new Map<string, number>();
  private particles: Particle[] = [];
  private pMesh: THREE.InstancedMesh | null = null;
  private t = 0;
  private pr = Math.min(window.devicePixelRatio || 1, 2);
  private slowFrames = 0;
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x070a16, 1);
    this.scene.add(this.content);
    this.scene.add(new THREE.AmbientLight(0xc8d2ff, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.15);
    sun.position.set(6, 12, 4);
    this.scene.add(sun);
    this.scene.add(this.ground);
    const rim = new THREE.DirectionalLight(0x7fa0ff, 0.55);
    rim.position.set(-8, 6, -6);
    this.scene.add(rim);
    this.camera.position.copy(this.curCenter).add(new THREE.Vector3(10, 10, 10));
    this.camera.lookAt(this.curCenter);
    this.resize();
    this.curCenter.copy(this.tgtCenter);
    this.camera.zoom = this.tgtZoom;
    this.camera.updateProjectionMatrix();
    new ResizeObserver(() => this.resize()).observe(canvas);
  }

  resize(): void {
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    this.renderer.setPixelRatio(this.pr);
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.left = -5 * aspect;
    this.camera.right = 5 * aspect;
    this.camera.top = 5;
    this.camera.bottom = -5;
    this.camera.updateProjectionMatrix();
    this.fit();
  }

  /** Frames the built area: computes the target zoom/centre from the ground bounds in view space. */
  private fit(): void {
    const { x0, x1, z0, z1 } = this.bounds;
    const c = new THREE.Vector3((x0 + x1) / 2, 0, (z0 + z1) / 2);
    const q = this.camera.quaternion;
    const inv = q.clone().invert();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const x of [x0, x1]) for (const z of [z0, z1]) for (const y of [-0.3, 1.9]) {
      const p = new THREE.Vector3(x, y, z).sub(c).applyQuaternion(inv);
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const hx = (maxX - minX) / 2;
    const hy = (maxY - minY) / 2;
    const aspect = this.camera.right / 5;
    this.tgtZoom = Math.min((5 * aspect) / (hx * 1.06), 5 / (hy * 1.06));
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    this.tgtCenter.copy(c).addScaledVector(right, (minX + maxX) / 2).addScaledVector(up, (minY + maxY) / 2);
  }

  private rebuildGround(layout: Layout): void {
    const FP: Record<string, V2> = { basic_pc: [0.7, 0.6], gpu_rack: [1, 0.9], cooling: [0.9, 0.9], power_gen: [0.9, 0.9], network_hub: [0.9, 0.9], ai_core: [1.3, 1.3] };
    let x0 = 1.0, x1 = 5.0, z0 = -1.0, z1 = 2.6;
    for (const p of layout.placed) {
      const f = FP[p.id] ?? [1, 1];
      x0 = Math.min(x0, p.pos[0]);
      x1 = Math.max(x1, p.pos[0] + f[0]);
      z0 = Math.min(z0, p.pos[1]);
      z1 = Math.max(z1, p.pos[1] + f[1]);
    }
    x0 = Math.floor(x0 - 1);
    x1 = Math.ceil(x1 + 1);
    z0 = Math.floor(z0 - 1);
    z1 = Math.ceil(z1 + 1);
    this.bounds = { x0, x1, z0, z1 };
    this.ground.clear();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.3, z1 - z0), mat(0x1a2347));
    slab.position.set((x0 + x1) / 2, -0.15, (z0 + z1) / 2);
    this.ground.add(slab);
    const v: number[] = [];
    for (let x = x0; x <= x1; x++) v.push(x, 0.012, z0, x, 0.012, z1);
    for (let z = z0; z <= z1; z++) v.push(x0, 0.012, z, x1, 0.012, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    this.ground.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x2c3a78 })));
    this.fit();
  }

  flash(id: string): void {
    this.flashes.set(id, 1);
  }

  private rebuild(layout: Layout): void {
    this.rebuildGround(layout);
    this.content.clear();
    this.visuals = [];
    for (const p of layout.placed) {
      const v = makeDevice(p.id, p.stage);
      v.group.position.set(p.pos[0], 0, p.pos[1]);
      this.content.add(v.group);
      this.visuals.push({ id: p.id, v });
    }
    this.particles = [];
    const baseMats = {
      power: mat(0x5a4310),
      cooling: mat(0x1b4a6e),
      data: mat(0x0f5c47),
    };
    for (const c of layout.cables) {
      const pts = c.path.map((q) => new THREE.Vector3(q[0], 0.06, q[1]));
      const cum = [0];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]!;
        const b = pts[i]!;
        const len = a.distanceTo(b);
        cum.push(cum[i - 1]! + len);
        if (len > 0) {
          const seg = new THREE.Mesh(new THREE.BoxGeometry(len + 0.08, 0.03, 0.08), baseMats[c.kind]);
          seg.position.copy(a).lerp(b, 0.5);
          seg.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
          this.content.add(seg);
        }
      }
      const total = cum[cum.length - 1] ?? 0;
      const n = Math.max(2, Math.round(total / 1.1));
      for (let k = 0; k < n; k++) this.particles.push({ kind: c.kind, pts, cum, total, offset: (k / n) * total });
    }
    if (this.particles.length > 0) {
      this.pMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 6, 6), new THREE.MeshBasicMaterial(), this.particles.length);
      this.pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.pMesh.frustumCulled = false;
      this.content.add(this.pMesh);
    } else {
      this.pMesh = null;
    }
  }

  sync(state: GameState): void {
    const layout = buildLayout(state);
    if (layout.signature !== this.signature) {
      this.signature = layout.signature;
      this.rebuild(layout);
    }
  }

  frame(dt: number, net: NetworkResult): void {
    this.t += dt;
    const throttled = net.eff < 0.999;
    const spin = 0.35 + 0.65 * net.eff;
    for (const { id, v } of this.visuals) {
      for (const sp of v.spinners) sp.obj.rotation[sp.axis] += sp.speed * spin * dt;
      for (const m of v.statusMats) {
        const bad = throttled && id === 'gpu_rack';
        m.color.setHex(bad ? COLORS.bad : v.baseStatus);
        m.emissive.setHex(bad ? COLORS.bad : v.baseStatus);
        m.emissiveIntensity = bad ? 1.1 + 0.6 * Math.sin(this.t * 7) : 1.3;
      }
      const f = this.flashes.get(id) ?? 0;
      const s = 1 + 0.09 * f;
      v.group.scale.set(s, s, s);
    }
    for (const [id, f] of this.flashes) {
      const nf = f - dt * 2.4;
      if (nf <= 0) this.flashes.delete(id);
      else this.flashes.set(id, nf);
    }
    if (this.pMesh) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i]!;
        const speed = p.kind === 'data' ? 0.5 + 1.4 * net.eff : p.kind === 'power' ? 1.5 : 1.2;
        const d = (p.offset + this.t * speed) % p.total;
        let seg = 1;
        while (seg < p.cum.length - 1 && p.cum[seg]! < d) seg++;
        const a = p.pts[seg - 1]!;
        const b = p.pts[seg]!;
        const span = p.cum[seg]! - p.cum[seg - 1]!;
        const k = span > 0 ? (d - p.cum[seg - 1]!) / span : 0;
        this.dummy.position.copy(a).lerp(b, k);
        this.dummy.position.y = 0.12;
        this.dummy.updateMatrix();
        this.pMesh.setMatrixAt(i, this.dummy.matrix);
        const hex = p.kind === 'data' && throttled ? COLORS.bad : COLORS[p.kind];
        this.pMesh.setColorAt(i, this.color.setHex(hex));
      }
      this.pMesh.instanceMatrix.needsUpdate = true;
      if (this.pMesh.instanceColor) this.pMesh.instanceColor.needsUpdate = true;
    }
    const k = 1 - Math.exp(-3.5 * dt);
    this.curCenter.lerp(this.tgtCenter, k);
    const z = this.camera.zoom + (this.tgtZoom - this.camera.zoom) * k;
    if (Math.abs(z - this.camera.zoom) > 1e-4) {
      this.camera.zoom = z;
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.copy(this.curCenter).add(new THREE.Vector3(10, 10, 10));
    this.camera.lookAt(this.curCenter);
    const t0 = performance.now();
    this.renderer.render(this.scene, this.camera);
    const cost = performance.now() - t0;
    if (dt > 0.034 && cost > 6) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 1);
    if (this.slowFrames > 90 && this.pr > 1) {
      this.pr = 1;
      this.resize();
      this.slowFrames = 0;
    }
  }
}

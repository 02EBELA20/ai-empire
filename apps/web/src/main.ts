import './style.css';
import economyJson from '@data/economy.json';
import type { EconomyConfig } from '@economy';
import { applyOffline, buy, createState, network, optimize, planPurchase, reboot, tap, tick, type GameState } from '@sim';
import { loadGame, saveGame, type StorageLike } from '@save';
import { GameScene } from './scene';
import { createUI } from './ui';
import { formatNum } from './format';

const cfg = economyJson as unknown as EconomyConfig;
const SAVE_KEY = 'ai-empire-save-v1';
const STEP = 0.1;
const params = new URLSearchParams(location.search);
const speed = Math.max(1, Math.min(1000, Number(params.get('speed')) || 1));
const ids = cfg.devices.map((d) => d.id);

const now = () => Date.now();

/** localStorage can throw on access (sandboxed frames, private mode); fall back to memory so the game still runs. */
function pickStorage(): StorageLike {
  try {
    const s = window.localStorage;
    s.setItem('__probe', '1');
    s.removeItem('__probe');
    return s;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
      removeItem: (k) => void mem.delete(k),
    };
  }
}
const storage = pickStorage();
let state: GameState = (!params.has('fresh') && loadGame(storage, SAVE_KEY, ids)) || createState(cfg, now());
const offline = applyOffline(cfg, state, now());

const scene = new GameScene(document.getElementById('view') as HTMLCanvasElement);

const ui = createUI(cfg, {
  onBuy(id) {
    const plan = planPurchase(cfg, state, id);
    if (buy(cfg, state, id)) {
      refresh();
      for (const pid of new Set(plan.items)) scene.flash(pid);
    }
  },
  onOptimize() {
    const plan = optimize(cfg, state);
    if (!plan) return;
    refresh();
    for (const pid of new Set(plan.items)) scene.flash(pid);
  },
  onInspect(id) {
    scene.highlight(id);
    ui.inspect(id, state, network(cfg, state));
  },
  onTap() {
    const v = tap(cfg, state);
    ui.floatText(`+${formatNum(v)}`);
    refresh();
  },
  onReboot() {
    void ui
      .confirm('Singularity Reboot resets your machines and credits but keeps Neural Points, which boost all income.', 'Reboot')
      .then((ok) => {
        if (!ok) return;
        reboot(cfg, state);
        saveNow();
        refresh();
      });
  },
  onReset() {
    void ui.confirm('Delete your save and start over?', 'Delete').then((ok) => {
      if (!ok) return;
      storage.removeItem(SAVE_KEY);
      state = createState(cfg, now());
      refresh();
    });
  },
});

function refresh() {
  scene.sync(state);
  ui.update(state, network(cfg, state));
}

function saveNow() {
  state.lastSeenMs = now();
  saveGame(storage, SAVE_KEY, state, now());
}

const canvasEl = document.getElementById('view') as HTMLCanvasElement;
canvasEl.addEventListener('click', (e) => {
  const id = scene.pick(e.clientX, e.clientY);
  if (id) {
    scene.highlight(id);
    ui.inspect(id, state, network(cfg, state));
  } else {
    ui.inspect(null, state, network(cfg, state));
  }
});

refresh();
if (offline.seconds >= 30 && offline.credits > 0) ui.showOffline(offline.seconds, offline.credits);

if (params.has('debug')) {
  (window as unknown as Record<string, unknown>)['__ai'] = { cfg, get state() { return state; }, set state(v: GameState) { state = v; refresh(); }, buy: (id: string) => buy(cfg, state, id), refresh };
}

let last = performance.now();
let acc = 0;
let sinceSave = 0;
function loop(t: number) {
  const dt = Math.min(0.25, (t - last) / 1000);
  last = t;
  acc += dt * speed;
  let steps = 0;
  while (acc >= STEP && steps < 200) {
    tick(cfg, state, STEP);
    acc -= STEP;
    steps++;
  }
  if (steps > 0) {
    state.lastSeenMs = now();
    refresh();
  }
  scene.frame(dt, network(cfg, state));
  sinceSave += dt;
  if (sinceSave > 5) {
    sinceSave = 0;
    saveNow();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveNow();
  } else {
    const r = applyOffline(cfg, state, now());
    last = performance.now();
    refresh();
    if (r.seconds >= 30 && r.credits > 0) ui.showOffline(r.seconds, r.credits);
  }
});
window.addEventListener('pagehide', saveNow);

import { bottleneck, computeNetwork, cost, getDevice, milestoneMult, nextMilestone, prestigeMultiplier, type EconomyConfig, type NetworkResult } from '@economy';
import { canAfford, planOptimize, planPurchase, prestigeGain, tapValue, type GameState } from '@sim';
import { formatDuration, formatNum } from './format';

const META: Record<string, { name: string; color: string; blurb: string }> = {
  basic_pc: { name: 'Basic PC', color: '#37c8ff', blurb: 'Your first machine' },
  power_gen: { name: 'Power Generator', color: '#ffb02e', blurb: 'Feeds your machines' },
  cooling: { name: 'Cooling Unit', color: '#4db8ff', blurb: 'Keeps GPUs from throttling' },
  gpu_rack: { name: 'GPU Rack', color: '#7f77dd', blurb: 'Serious compute' },
  network_hub: { name: 'Network Hub', color: '#2ee6a8', blurb: 'Boosts the whole network' },
  ai_core: { name: 'AI Core', color: '#ff6a3d', blurb: 'The brain of your empire' },
};
const nameOf = (id: string) => META[id]?.name ?? id;

export interface UIHandlers {
  onBuy(id: string): void;
  onOptimize(): void;
  onInspect(id: string): void;
  onTap(): void;
  onReboot(): void;
  onReset(): void;
}

export interface UI {
  update(state: GameState, net: NetworkResult): void;
  inspect(id: string | null, state: GameState, net: NetworkResult): void;
  showOffline(seconds: number, credits: number): void;
  floatText(text: string): void;
  confirm(message: string, okLabel: string): Promise<boolean>;
}

interface RowRefs {
  root: HTMLElement;
  lvl: HTMLElement;
  sub: HTMLElement;
  ms: HTMLElement;
  msBar: HTMLElement;
  msText: HTMLElement;
  btn: HTMLButtonElement;
  last: { sub: string; btn: string; ms: string; poor: boolean; locked: boolean; hidden: boolean };
}

export function createUI(cfg: EconomyConfig, h: UIHandlers): UI {
  const hud = document.getElementById('hud')!;
  const dock = document.getElementById('dock')!;
  hud.innerHTML = `
    <div class="credits"><span id="cr">0</span><small>Credits</small></div>
    <div class="row"><span id="inc">+0/s</span><span class="pill good" id="eff">100%</span><span id="np"></span></div>
    <div class="hint" id="hint"></div>`;
  const stage = document.querySelector('.stage') as HTMLElement;
  const insp = document.createElement('div');
  insp.className = 'inspector';
  insp.hidden = true;
  stage.appendChild(insp);
  let inspectId: string | null = null;
  let inspLast = '';
  dock.innerHTML = `
    <div class="toolbar"><button class="tap" id="tap">TAP</button><button class="opt" id="opt"></button><button class="reboot" id="reboot"></button></div>
    <div class="list" id="list"></div>
    <div class="foot"><span>AI Empire v0.3 prototype</span><button id="reset">Reset save</button></div>`;

  const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const cr = el('cr'), inc = el('inc'), eff = el('eff'), np = el('np'), hint = el('hint');
  const optBtn = el<HTMLButtonElement>('opt'), tapBtn = el<HTMLButtonElement>('tap'), rebootBtn = el<HTMLButtonElement>('reboot'), list = el('list');

  tapBtn.addEventListener('click', () => {
    navigator.vibrate?.(6);
    h.onTap();
  });
  rebootBtn.addEventListener('click', () => h.onReboot());
  optBtn.addEventListener('click', () => {
    navigator.vibrate?.(10);
    h.onOptimize();
  });
  insp.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-close]')) {
      inspectId = null;
      insp.hidden = true;
    }
  });
  el('reset').addEventListener('click', () => h.onReset());

  const rows = new Map<string, RowRefs>();
  for (const d of cfg.devices) {
    const meta = META[d.id] ?? { name: d.id, color: '#888', blurb: '' };
    const root = document.createElement('div');
    root.className = 'row-item';
    root.innerHTML = `
      <div class="chip" style="background:${meta.color}"></div>
      <div><div class="name">${meta.name}<span class="lvl">Lv 0</span></div><div class="sub"></div><div class="ms"><i></i><span></span></div></div>
      <button class="buy"></button>`;
    list.appendChild(root);
    (root.querySelector('.name') as HTMLElement).addEventListener('click', () => h.onInspect(d.id));
    const btn = root.querySelector('.buy') as HTMLButtonElement;
    btn.addEventListener('click', () => {
      navigator.vibrate?.(10);
      h.onBuy(d.id);
    });
    rows.set(d.id, {
      root,
      lvl: root.querySelector('.lvl') as HTMLElement,
      sub: root.querySelector('.sub') as HTMLElement,
      ms: root.querySelector('.ms') as HTMLElement,
      msBar: root.querySelector('.ms i') as HTMLElement,
      msText: root.querySelector('.ms span') as HTMLElement,
      btn,
      last: { sub: '', btn: '', ms: '?', poor: false, locked: false, hidden: false },
    });
  }

  function describe(id: string, gain: number, infra: string[]): string {
    const d = getDevice(cfg, id);
    let s: string;
    if (gain > 0.0001) s = `<b>+${formatNum(gain)}/s</b>`;
    else if (d.kind === 'power') s = `supplies +${d.supply} power`;
    else if (d.kind === 'cooling') s = `supplies +${d.supply} cooling`;
    else s = META[id]?.blurb ?? '';
    if (infra.length > 0) s += ` <em>+ ${infra.map(nameOf).join(', ')}</em>`;
    return s;
  }

  function renderInspector(state: GameState, net: NetworkResult): void {
    const id = inspectId!;
    const d = getDevice(cfg, id);
    const meta = META[id] ?? { name: id, color: '#888', blurb: '' };
    const n = state.levels[id] ?? 0;
    const pm = prestigeMultiplier(cfg, state.neuralPoints);
    const rows: [string, string][] = [['Level', String(n)], ['Next level', formatNum(cost(d, n))]];
    let note = meta.blurb;
    if (d.kind === 'producer') {
      const mult = milestoneMult(cfg, n);
      const own = (d.baseIncome ?? 0) * n * mult * net.eff * net.link * pm;
      const share = net.income > 0 ? (own / net.income) * 100 : 0;
      rows.push(['Output', `${formatNum(own)}/s`], ['Income share', `${share.toFixed(0)}%`], ['Milestone', `x${mult}`]);
      rows.push(['Power draw', formatNum((d.power ?? 0) * n)], ['Heat', formatNum((d.heat ?? 0) * n)]);
      if (net.eff < 0.999) note = `Running at ${Math.round(net.eff * 100)}% because of ${bottleneck(net)}. Output without the bottleneck: ${formatNum(own / net.eff)}/s.`;
    } else if (d.kind === 'power') {
      rows.push(['Supply', formatNum((d.supply ?? 0) * n)], ['Network', `${formatNum(net.powerDemand)} / ${formatNum(net.powerSupply)}`]);
    } else if (d.kind === 'cooling') {
      rows.push(['Supply', formatNum((d.supply ?? 0) * n)], ['Network', `${formatNum(net.heatDemand)} / ${formatNum(net.coolingSupply)}`]);
    } else {
      rows.push(['Bonus', `+${Math.round((net.link - 1) * 100)}%`], ['Max', `+${Math.round(cfg.hub.maxBonus * 100)}%`]);
    }
    const html = `<div class="ih"><i style="background:${meta.color}"></i><b>${meta.name}</b><button data-close aria-label="Close">×</button></div>
      <dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><p>${note}</p>`;
    if (html !== inspLast) {
      insp.innerHTML = html;
      inspLast = html;
    }
  }

  return {
    inspect(id, state, net) {
      inspectId = id;
      inspLast = '';
      insp.hidden = id === null;
      if (id) renderInspector(state, net);
    },
    update(state, net) {
      cr.textContent = formatNum(state.credits);
      inc.textContent = `+${formatNum(net.income)}/s`;
      const pct = Math.round(net.eff * 100);
      eff.textContent = `${pct}% efficiency`;
      eff.className = 'pill ' + (pct >= 100 ? 'good' : pct >= 60 ? 'warn' : 'bad');
      np.textContent = state.neuralPoints > 0 ? `NP ${state.neuralPoints} (x${prestigeMultiplier(cfg, state.neuralPoints).toFixed(2)})` : '';
      const b = bottleneck(net);
      hint.textContent = b === 'cooling' ? 'Bottleneck: cooling. Buy a Cooling Unit to unlock full output.' : b === 'power' ? 'Bottleneck: power. Buy a Power Generator.' : '';
      tapBtn.firstChild!.textContent = `TAP  +${formatNum(tapValue(cfg, state))}`;
      const op = planOptimize(cfg, state);
      const showOpt = op.items.length > 0 && op.unlocked;
      optBtn.classList.toggle('on', showOpt);
      if (showOpt) {
        optBtn.innerHTML = `Optimize<small>${formatNum(op.total)}</small>`;
        optBtn.classList.toggle('poor', !canAfford(state, op));
      }
      if (inspectId) renderInspector(state, net);
      const gain = prestigeGain(cfg, state);
      rebootBtn.classList.toggle('on', gain >= 1);
      if (gain >= 1) rebootBtn.textContent = `Singularity Reboot +${gain} NP`;

      const pm = prestigeMultiplier(cfg, state.neuralPoints);
      let teaserShown = false;
      for (const d of cfg.devices) {
        const r = rows.get(d.id)!;
        const unlocked = state.lifetime >= d.unlockAt;
        const hidden = !unlocked && teaserShown;
        if (!unlocked && !hidden) teaserShown = true;
        if (hidden !== r.last.hidden) {
          r.root.style.display = hidden ? 'none' : '';
          r.last.hidden = hidden;
        }
        if (hidden) continue;
        r.lvl.textContent = `Lv ${state.levels[d.id] ?? 0}`;
        const plan = planPurchase(cfg, state, d.id);
        let subHtml: string;
        let btnHtml: string;
        let poor = false;
        if (!unlocked) {
          subHtml = `Unlocks at ${formatNum(d.unlockAt)} lifetime credits`;
          btnHtml = 'Locked';
          poor = true;
        } else {
          const lv = { ...state.levels };
          for (const id of plan.items) lv[id] = (lv[id] ?? 0) + 1;
          const gainIncome = computeNetwork(cfg, lv, pm).income - net.income;
          subHtml = describe(d.id, gainIncome, plan.infraAdded);
          btnHtml = `${formatNum(plan.total)}<small>Buy</small>`;
          poor = !canAfford(state, plan);
        }
        if (subHtml !== r.last.sub) {
          r.sub.innerHTML = subHtml;
          r.last.sub = subHtml;
        }
        if (btnHtml !== r.last.btn) {
          r.btn.innerHTML = btnHtml;
          r.last.btn = btnHtml;
        }
        if (poor !== r.last.poor) {
          r.btn.classList.toggle('poor', poor);
          r.last.poor = poor;
        }
        const lvNow = state.levels[d.id] ?? 0;
        const showMs = unlocked && d.kind === 'producer';
        let msKey = '';
        if (showMs) {
          const m = nextMilestone(cfg, lvNow);
          msKey = m ? `${m.prev}|${m.at}|${lvNow}` : 'max';
          if (msKey !== r.last.ms) {
            if (m) {
              r.msBar.style.width = `${Math.min(100, ((lvNow - m.prev) / (m.at - m.prev)) * 100)}%`;
              r.msText.textContent = `x${cfg.milestones.multiplier} income at Lv ${m.at}`;
            } else {
              r.msBar.style.width = '100%';
              r.msText.textContent = 'All milestones reached';
            }
          }
        }
        if (msKey !== r.last.ms) {
          r.ms.style.display = showMs ? '' : 'none';
          r.last.ms = msKey;
        }
        if (!unlocked !== r.last.locked) {
          r.root.classList.toggle('locked', !unlocked);
          r.last.locked = !unlocked;
        }
      }
    },
    showOffline(seconds, credits) {
      const o = document.createElement('div');
      o.className = 'overlay';
      o.innerHTML = `<div class="card"><h2>Welcome back</h2><p>Your network kept working for ${formatDuration(seconds)}.</p><div class="big">+${formatNum(credits)}</div><button>Collect</button></div>`;
      o.querySelector('button')!.addEventListener('click', () => o.remove());
      document.body.appendChild(o);
    },
    confirm(message, okLabel) {
      return new Promise<boolean>((resolve) => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = `<div class="card"><p style="color:var(--text)">${message}</p><div style="display:flex;gap:10px;justify-content:center;margin-top:14px"><button data-v="0" style="background:#2a3158;color:var(--text)">Cancel</button><button data-v="1">${okLabel}</button></div></div>`;
        o.querySelectorAll('button').forEach((b) =>
          b.addEventListener('click', () => {
            o.remove();
            resolve(b.getAttribute('data-v') === '1');
          }),
        );
        document.body.appendChild(o);
      });
    },
    floatText(text) {
      const f = document.createElement('span');
      f.className = 'float';
      f.textContent = text;
      tapBtn.appendChild(f);
      setTimeout(() => f.remove(), 820);
    },
  };
}

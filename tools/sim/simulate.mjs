#!/usr/bin/env node
// AI Empire economy simulator (v0). Pure Node, no dependencies.
// Usage: node tools/sim/simulate.mjs [--days 7] [--sessions 3] [--minutes 15] [--json]
// Simulates a greedy "reasonable" player: during sessions it buys the best
// income-gain-per-cost upgrade each second; between sessions it earns offline income.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const eco = JSON.parse(readFileSync(join(here, "../../packages/data/economy.json"), "utf8"));

function arg(name, def) {
  const i = process.argv.indexOf("--" + name);
  return i >= 0 ? Number(process.argv[i + 1]) : def;
}
const DAYS = arg("days", 7);
const SESSIONS = arg("sessions", 3);
const MINUTES = arg("minutes", 15);
const AS_JSON = process.argv.includes("--json");

const devices = eco.devices;
const byId = Object.fromEntries(devices.map((d) => [d.id, d]));

export function milestoneMult(level) {
  let m = 1;
  for (const l of eco.milestones.levels) if (level >= l) m *= eco.milestones.multiplier;
  return m;
}

export function cost(dev, level) {
  return dev.baseCost * Math.pow(dev.costGrowth, level);
}

export function computeIncome(levels, prestigeMult = 1) {
  let demandP = 0, demandH = 0, raw = 0;
  let supplyP = eco.starterSupply.power, supplyC = eco.starterSupply.cooling;
  for (const d of devices) {
    const n = levels[d.id] || 0;
    if (d.kind === "producer") {
      raw += d.baseIncome * n * milestoneMult(n);
      demandP += d.power * n;
      demandH += d.heat * n;
    } else if (d.kind === "power") supplyP += d.supply * n;
    else if (d.kind === "cooling") supplyC += d.supply * n;
  }
  const powerSat = demandP > 0 ? Math.min(1, supplyP / demandP) : 1;
  const coolSat = demandH > 0 ? Math.min(1, supplyC / demandH) : 1;
  const eff = Math.min(powerSat, coolSat);
  const hubN = levels.network_hub || 0;
  const link = 1 + Math.min(eco.hub.maxBonus, eco.hub.bonusPerLevel * hubN);
  return { income: raw * eff * link * prestigeMult, eff, powerSat, coolSat, link };
}

function prestigePoints(lifetime) {
  return Math.floor(eco.prestige.k * Math.sqrt(lifetime / eco.prestige.T));
}

function fmt(n) {
  if (n < 1000) return n.toFixed(n < 10 ? 2 : 0);
  const u = ["", "K", "M", "B", "T", "Qa", "Qi"];
  let i = 0;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return n.toFixed(2) + u[i];
}

const state = { credits: eco.startingCredits ?? 0, lifetime: 0, levels: {}, t: 0, play: 0 };
const log = { firstBuy: {}, dayRows: [], events: [] };

// A "bundle" = one device level plus the cheapest power/cooling needed to
// keep the network unthrottled. This mirrors how a real player thinks.
function bundleFor(d) {
  const levels = { ...state.levels };
  const items = [];
  let total = 0;
  const buy = (dev) => {
    const lv = levels[dev.id] || 0;
    const c = cost(dev, lv);
    levels[dev.id] = lv + 1;
    items.push(dev.id);
    total += c;
  };
  buy(d);
  const powerDev = byId.power_gen, coolDev = byId.cooling;
  for (let i = 0; i < 40; i++) {
    const r = computeIncome(levels);
    if (r.eff >= 0.999) break;
    const needP = r.powerSat <= r.coolSat;
    const dev = needP ? powerDev : coolDev;
    if (state.lifetime < dev.unlockAt) break;
    buy(dev);
  }
  return { items, total, income: computeIncome(levels).income };
}

function bestPurchase() {
  const base = computeIncome(state.levels).income;
  let best = null;
  for (const d of devices) {
    if (state.lifetime < d.unlockAt) continue;
    const b = bundleFor(d);
    const gain = b.income - base;
    if (gain <= 0) continue;
    const score = gain / b.total;
    if (!best || score > best.score) best = { ...b, score };
  }
  return best;
}

function buyLoop() {
  // Buy greedily while affordable; if the best-by-ROI bundle is unaffordable, wait (save up).
  for (let guard = 0; guard < 500; guard++) {
    const b = bestPurchase();
    if (!b || b.total > state.credits) return;
    for (const id of b.items) {
      const dev = byId[id];
      const lv = state.levels[id] || 0;
      state.credits -= cost(dev, lv);
      state.levels[id] = lv + 1;
      if (lv === 0 && log.firstBuy[id] === undefined) {
        log.firstBuy[id] = { play: state.play, day: Math.floor(state.t / 86400) + 1 };
      }
    }
  }
}

const sessionLen = MINUTES * 60;
const dayLen = 86400;
const starts = Array.from({ length: SESSIONS }, (_, i) => Math.floor(((i + 0.5) / SESSIONS) * dayLen));

let lastSessionEnd = 0;
for (let day = 0; day < DAYS; day++) {
  for (const s of starts) {
    const start = day * dayLen + s;
    // Offline phase
    if (start > lastSessionEnd) {
      const gap = Math.min(start - lastSessionEnd, eco.offline.capHours * 3600);
      const earned = computeIncome(state.levels).income * gap * eco.offline.rate;
      state.credits += earned;
      state.lifetime += earned;
    }
    state.t = start;
    buyLoop();
    for (let sec = 0; sec < sessionLen; sec++) {
      const inc = computeIncome(state.levels).income;
      state.credits += inc;
      state.lifetime += inc;
      state.t++;
      state.play++;
      buyLoop();
    }
    lastSessionEnd = state.t;
  }
  const c = computeIncome(state.levels);
  log.dayRows.push({
    day: day + 1,
    lifetime: state.lifetime,
    income: c.income,
    eff: c.eff,
    np: prestigePoints(state.lifetime),
    levels: { ...state.levels },
  });
}

if (AS_JSON) {
  console.log(JSON.stringify(log, null, 2));
} else {
  console.log(`AI Empire economy sim: ${DAYS} days, ${SESSIONS} sessions/day x ${MINUTES} min\n`);
  console.log("First purchase of each device (play time):");
  for (const d of devices) {
    const f = log.firstBuy[d.id];
    const t = f && f.play;
    const label = f === undefined ? "never" : (t < 120 ? t + "s" : t < 7200 ? (t / 60).toFixed(1) + " min" : (t / 3600).toFixed(1) + " h") + ` (day ${f.day})`;
    console.log(`  ${d.id.padEnd(12)} ${label}`);
  }
  console.log("\nDay  Lifetime     Income/s   Eff   NP   Levels");
  for (const r of log.dayRows) {
    const lv = devices.map((d) => `${d.id.split("_")[0]}:${r.levels[d.id] || 0}`).join(" ");
    console.log(
      `${String(r.day).padStart(3)}  ${fmt(r.lifetime).padStart(9)}  ${fmt(r.income).padStart(9)}  ${(r.eff * 100).toFixed(0).padStart(3)}%  ${String(r.np).padStart(3)}  ${lv}`
    );
  }
}

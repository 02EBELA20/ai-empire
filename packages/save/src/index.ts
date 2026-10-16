import type { GameState } from '@sim';

export const SAVE_VERSION = 1;

export interface SaveEnvelope {
  version: number;
  savedAt: number;
  state: GameState;
}

/** Minimal storage surface so tests (and later native storage) can stand in for localStorage. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function serialize(state: GameState, nowMs: number): string {
  const env: SaveEnvelope = { version: SAVE_VERSION, savedAt: nowMs, state: { ...state, lastSeenMs: nowMs } };
  return JSON.stringify(env);
}

function finiteNonNeg(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

/**
 * Parses and validates a save. Returns null for corrupt data or saves from a newer game version.
 * Migrations from older versions are added here as `if (version < N)` steps.
 */
export function deserialize(json: string, knownDeviceIds: readonly string[]): GameState | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const env = raw as Partial<SaveEnvelope>;
  if (typeof env.version !== 'number' || env.version > SAVE_VERSION || env.version < 1) return null;
  const s = env.state as Partial<GameState> | undefined;
  if (!s || typeof s !== 'object') return null;
  if (
    !finiteNonNeg(s.credits) ||
    !finiteNonNeg(s.lifetime) ||
    !finiteNonNeg(s.neuralPoints) ||
    !finiteNonNeg(s.playSeconds) ||
    !finiteNonNeg(s.lastSeenMs)
  ) {
    return null;
  }
  const levels: Record<string, number> = {};
  const src = (s.levels ?? {}) as Record<string, unknown>;
  for (const id of knownDeviceIds) {
    const v = src[id];
    if (v === undefined) continue;
    if (!finiteNonNeg(v)) return null;
    levels[id] = Math.floor(v);
  }
  return {
    credits: s.credits,
    lifetime: s.lifetime,
    neuralPoints: Math.floor(s.neuralPoints),
    playSeconds: s.playSeconds,
    lastSeenMs: s.lastSeenMs,
    levels,
  };
}

export function saveGame(storage: StorageLike, key: string, state: GameState, nowMs: number): void {
  try {
    storage.setItem(key, serialize(state, nowMs));
  } catch {
    // Storage can be full or blocked (private mode); the game keeps running without persistence.
  }
}

export function loadGame(storage: StorageLike, key: string, knownDeviceIds: readonly string[]): GameState | null {
  let json: string | null = null;
  try {
    json = storage.getItem(key);
  } catch {
    return null;
  }
  return json ? deserialize(json, knownDeviceIds) : null;
}

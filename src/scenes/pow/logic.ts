// Pure logic behind the Proof of Work lesson's controls. No React, no three.js.

const finite = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, finite(v, lo)));

/** Small seeded random generator (mulberry32), so every simulation can be replayed in tests. */
export function rng(seed: number): () => number {
  let a = Math.floor(finite(seed, 0)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- The lottery: share of hashrate against blocks won ----------

/** Shares of miner A, you and miner C. The other two always split the rest 5 : 6. */
export function splitShares(yours: number): [number, number, number] {
  const you = clamp(yours, 0, 1);
  const rest = 1 - you;
  return [(rest * 5) / 11, you, (rest * 6) / 11];
}

/** Each block goes to one miner with probability equal to its share. Returns blocks won per miner. */
export function simulateRace(shares: readonly number[], rounds: number, random: () => number): number[] {
  const wins = shares.map(() => 0);
  const weights = shares.map((s) => Math.max(0, finite(s, 0)));
  const total = weights.reduce((a, b) => a + b, 0);
  const n = Math.floor(clamp(rounds, 0, 1_000_000));
  if (total <= 0 || wins.length === 0) return wins;
  for (let r = 0; r < n; r++) {
    let x = random() * total;
    let winner = weights.length - 1;
    for (let i = 0; i < weights.length; i++) {
      x -= weights[i];
      if (x < 0) {
        winner = i;
        break;
      }
    }
    wins[winner]++;
  }
  return wins;
}

/** Mean and standard deviation of the number of blocks won out of `rounds` with the given share. */
export function expectedWins(share: number, rounds: number): { mean: number; sd: number } {
  const p = clamp(share, 0, 1);
  const n = Math.max(0, finite(rounds, 0));
  return { mean: n * p, sd: Math.sqrt(n * p * (1 - p)) };
}

// ---------- Propagation and stale blocks ----------

export const BLOCK_INTERVAL = 600;

/**
 * Chance that somebody else finds a competing block while a new block is still travelling,
 * if the rest of the network needs `delay` seconds to hear of it: 1 - e^(-delay / interval).
 */
export function staleChance(delay: number, interval = BLOCK_INTERVAL): number {
  const d = Math.max(0, finite(delay, 0));
  const t = Math.max(1e-9, finite(interval, BLOCK_INTERVAL));
  return 1 - Math.exp(-d / t);
}

/** A second block found `gap` seconds after the first causes a fork only if the first has not arrived yet. */
export const causesFork = (delay: number, gap: number): boolean => finite(gap, 0) < finite(delay, 0);

// ---------- Difficulty retargeting (Bitcoin's rule) ----------

export const RETARGET_BLOCKS = 2016;
export const TARGET_TIMESPAN = 14 * 24 * 60 * 60; // 1,209,600 s
export const MIN_TIMESPAN = TARGET_TIMESPAN / 4;
export const MAX_TIMESPAN = TARGET_TIMESPAN * 4;

/** Average seconds per block when the difficulty and the hashrate are given relative to the same baseline. */
export function blockTime(difficulty: number, hashrate: number): number {
  const d = Math.max(1e-9, finite(difficulty, 1));
  const h = Math.max(1e-9, finite(hashrate, 1));
  return (BLOCK_INTERVAL * d) / h;
}

export interface Retarget {
  /** Measured seconds from the first to the last block of the period. */
  actual: number;
  /** The same after limiting it to a quarter and four times two weeks. */
  clamped: number;
  /** New difficulty divided by old difficulty. */
  factor: number;
  difficulty: number;
  /** Which limit was hit, if any. */
  limit: 'none' | 'up' | 'down';
}

/** new_target = old_target × clamp(actual, 3.5 days, 8 weeks) / two weeks; difficulty moves the other way. */
export function retarget(difficulty: number, actualTimespan: number): Retarget {
  const d = Math.max(1e-9, finite(difficulty, 1));
  const actual = Math.max(0, finite(actualTimespan, TARGET_TIMESPAN));
  const clamped = Math.min(MAX_TIMESPAN, Math.max(MIN_TIMESPAN, actual));
  const factor = TARGET_TIMESPAN / clamped;
  return { actual, clamped, factor, difficulty: d * factor, limit: actual < MIN_TIMESPAN ? 'up' : actual > MAX_TIMESPAN ? 'down' : 'none' };
}

export interface Period extends Retarget {
  /** Average seconds per block during the period. */
  spacing: number;
  /** Seconds it takes to find all 2016 blocks. */
  duration: number;
}

/**
 * One whole period at a constant hashrate. As in Bitcoin, the timespan is measured between the
 * first and the last block of the period, so it covers 2015 intervals, not 2016.
 */
export function minePeriod(difficulty: number, hashrate: number): Period {
  const spacing = blockTime(difficulty, hashrate);
  return { spacing, duration: spacing * RETARGET_BLOCKS, ...retarget(difficulty, spacing * (RETARGET_BLOCKS - 1)) };
}

// ---------- Double-spend race (Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System", section 11) ----------

/** Probability that an attacker with share `q` ever makes up a deficit of `behind` blocks. */
export function catchUp(q: number, behind: number): number {
  const a = clamp(q, 0, 1);
  const d = Math.max(0, Math.floor(finite(behind, 0)));
  if (d === 0 || a >= 0.5) return 1;
  if (a <= 0) return 0;
  return (a / (1 - a)) ** d;
}

/**
 * Probability that the attacker catches up after the merchant has waited for `z` confirmations:
 * 1 - Σ_{k=0..z} Poisson(k; λ) × (1 - (q/p)^(z-k)), with λ = z × q / p.
 */
export function attackSuccess(q: number, z: number): number {
  const a = clamp(q, 0, 1);
  const n = Math.max(0, Math.floor(finite(z, 0)));
  if (a >= 0.5) return 1;
  if (a <= 0) return 0;
  const p = 1 - a;
  const lambda = (n * a) / p;
  // Written as a sum of positive terms (the same quantity) so that tiny results are not lost to rounding:
  // Σ_{k≤z} Poisson(k) × (q/p)^(z-k)  +  Σ_{k>z} Poisson(k).
  let sum = 0;
  let poisson = Math.exp(-lambda);
  for (let k = 0; k <= n + 200; k++) {
    if (k > 0) poisson *= lambda / k;
    sum += k <= n ? poisson * (a / p) ** (n - k) : poisson;
  }
  return Math.min(1, Math.max(0, sum));
}

/** Blocks the attacker is expected to have mined in secret by the time the honest chain has `z` more. */
export function secretProgress(q: number, z: number): number {
  const a = clamp(q, 0, 0.999);
  return (Math.max(0, finite(z, 0)) * a) / (1 - a);
}

export type RaceEvent = 'H' | 'A';
export interface Attempt {
  /** Who found each block, in order. */
  events: RaceEvent[];
  honest: number;
  attacker: number;
  caughtUp: boolean;
}

const MAX_EVENTS = 600;

/**
 * One attempt. First the honest chain grows to `z` blocks while the attacker mines in secret.
 * From there the attacker either catches up, which happens with probability (q/p)^deficit, or
 * falls behind for good; the outcome is drawn with exactly that probability and the rest of
 * the race is then played out to match it.
 */
export function simulateAttack(q: number, z: number, random: () => number): Attempt {
  const a = clamp(q, 0, 1);
  const n = Math.max(1, Math.floor(finite(z, 1)));
  const events: RaceEvent[] = [];
  let honest = 0;
  let attacker = 0;
  const step = (pAttacker: number) => {
    if (random() < pAttacker) {
      attacker++;
      events.push('A');
    } else {
      honest++;
      events.push('H');
    }
  };
  while (honest < n && events.length < MAX_EVENTS) step(a);
  if (honest < n) {
    // Only when the attacker has nearly everything: it is far ahead already.
    return { events, honest, attacker, caughtUp: true };
  }
  if (attacker >= honest) return { events, honest, attacker, caughtUp: true };
  const wins = random() < catchUp(a, honest - attacker);
  if (wins) {
    // Given that it catches up, the race looks like one with the two shares swapped.
    const fast = Math.max(a, 1 - a);
    while (attacker < honest) {
      if (events.length >= MAX_EVENTS) {
        attacker++;
        events.push('A');
      } else step(fast);
    }
    return { events, honest, attacker, caughtUp: true };
  }
  // It never catches up: play a few more blocks and let it give up.
  for (let i = 0; i < 6; i++) {
    if (attacker + 1 >= honest) {
      honest++;
      events.push('H');
    } else step(Math.min(a, 1 - a));
  }
  return { events, honest, attacker, caughtUp: false };
}

/** Counts after the first `shown` events of an attempt. */
export function replay(events: readonly RaceEvent[], shown: number): { honest: number; attacker: number } {
  let honest = 0;
  let attacker = 0;
  const n = Math.min(events.length, Math.max(0, Math.floor(finite(shown, 0))));
  for (let i = 0; i < n; i++) {
    if (events[i] === 'A') attacker++;
    else honest++;
  }
  return { honest, attacker };
}

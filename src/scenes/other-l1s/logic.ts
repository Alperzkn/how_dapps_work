import { sha256 } from '../../sim/sha256';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

/* ---------- Trilemma: three sliders sharing one budget ---------- */

/** Points shared by security, decentralization and scalability. Each slider runs 0–100. */
export const BUDGET = 180;
export const TRI_MAX = 100;
export type Tri = [number, number, number];

export const TRI_PRESETS: Record<'bitcoin' | 'solana' | 'cosmos', Tri> = {
  bitcoin: [90, 80, 10],
  solana: [60, 30, 90],
  cosmos: [40, 55, 85],
};

/**
 * Sets slider `i` to `value` and takes the difference from the other two, in
 * proportion to what they hold, so the three always add up to BUDGET.
 */
export function rebalance(v: Tri, i: number, value: number): Tri {
  const idx = clamp(Math.round(i), 0, 2);
  const [a, b] = [0, 1, 2].filter((j) => j !== idx);
  const nv = clamp(Math.round(value), Math.max(0, BUDGET - 2 * TRI_MAX), Math.min(TRI_MAX, BUDGET));
  const rest = BUDGET - nv;
  const sum = Math.max(0, v[a]) + Math.max(0, v[b]);
  const share = sum > 0 ? Math.max(0, v[a]) / sum : 0.5;
  const na = clamp(Math.round(rest * share), Math.max(0, rest - TRI_MAX), Math.min(TRI_MAX, rest));
  const out: Tri = [0, 0, 0];
  out[idx] = nv;
  out[a] = na;
  out[b] = rest - na;
  return out;
}

/** Index of the corner that was given up, or -1 when the three are close to each other. */
export function weakest(v: Tri): number {
  const min = Math.min(...v);
  const max = Math.max(...v);
  if (max - min < 20) return -1;
  return v.indexOf(min);
}

/* ---------- Solana: scheduling by write locks ---------- */

export const SOL_TXS = 20;
export const SOL_CORES = 4;

export interface SolTx {
  id: number;
  /** The account this transaction writes to. Account 0 is the shared, "hot" one. */
  account: number;
}

/** `sharePct` percent of the pending transactions write the same account; the rest each write their own. */
export function makeTxs(total: number, sharePct: number): SolTx[] {
  const n = Math.round(clamp(total, 0, 500));
  const hot = Math.round((n * clamp(sharePct, 0, 100)) / 100);
  return Array.from({ length: n }, (_, id) => ({ id, account: id < hot ? 0 : id + 1 }));
}

/**
 * Greedy lock-based scheduling: in each round a core takes the next pending
 * transaction whose write account is not already locked in that round.
 */
export function schedule(txs: SolTx[], cores: number): SolTx[][] {
  const c = Math.max(1, Math.round(clamp(cores, 1, 64)));
  let pending = [...txs];
  const rounds: SolTx[][] = [];
  while (pending.length > 0) {
    const locked = new Set<number>();
    const round: SolTx[] = [];
    const later: SolTx[] = [];
    for (const tx of pending) {
      if (round.length < c && !locked.has(tx.account)) {
        locked.add(tx.account);
        round.push(tx);
      } else later.push(tx);
    }
    rounds.push(round);
    pending = later;
  }
  return rounds;
}

export interface SolStats {
  total: number;
  hot: number;
  rounds: number;
  /** Transactions finished per round, on average. */
  throughput: number;
  /** How many times faster than running everything one by one. */
  speedup: number;
  /** Running at once in the first round. */
  parallelNow: number;
  /** Waiting in the first round only because the shared account is locked. */
  lockQueue: number;
}

export function solStats(total: number, sharePct: number, cores: number): SolStats {
  const txs = makeTxs(total, sharePct);
  const rounds = schedule(txs, cores);
  const hot = txs.filter((t) => t.account === 0).length;
  const n = rounds.length;
  return {
    total: txs.length,
    hot,
    rounds: n,
    throughput: n > 0 ? txs.length / n : 0,
    speedup: n > 0 ? txs.length / n : 1,
    parallelNow: n > 0 ? rounds[0].length : 0,
    lockQueue: Math.max(0, hot - 1),
  };
}

/* ---------- Solana: the Proof of History hash chain ---------- */

export interface PohEntry {
  n: number;
  hash: string;
  /** A transaction mixed in at this position. */
  event?: string;
}

export const POH_SEED = sha256('proof of history: seed');

/** One step of the clock: hash the previous output, mixing in an event if one arrived. */
export const pohNext = (prev: string, event?: string) => (event ? sha256(prev + sha256(event)) : sha256(prev));

export function pohAppend(entries: PohEntry[], event?: string): PohEntry[] {
  const prev = entries.length ? entries[entries.length - 1].hash : POH_SEED;
  const entry: PohEntry = { n: entries.length + 1, hash: pohNext(prev, event) };
  if (event) entry.event = event;
  return [...entries, entry];
}

/** Recomputes the whole sequence, as a verifier would. */
export function pohVerify(entries: PohEntry[], seed = POH_SEED): boolean {
  let prev = seed;
  for (const e of entries) {
    if (pohNext(prev, e.event) !== e.hash) return false;
    prev = e.hash;
  }
  return true;
}

/* ---------- Avalanche: repeated random subsampling ---------- */

/** Small seeded generator (mulberry32) so a run can be repeated exactly. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SNOW_NODES = 24;
/** Consecutive successful polls needed to decide. Real networks use about 20; 4 keeps the demo short. */
export const SNOW_BETA = 4;
export const SNOW_MAX_K = 10;
export const SNOW_MAX_ROUNDS = 200;

export interface SnowNode {
  /** 0 = blue block, 1 = orange block. */
  pref: 0 | 1;
  streak: number;
  decided: boolean;
}

/** Exactly round(n · bluePct / 100) nodes start on blue, placed at random. */
export function snowInit(n: number, bluePct: number, seed: number): SnowNode[] {
  const count = Math.round(clamp(n, 1, 200));
  const blue = Math.round((count * clamp(bluePct, 0, 100)) / 100);
  const prefs: (0 | 1)[] = Array.from({ length: count }, (_, i) => (i < blue ? 0 : 1));
  const r = rng(seed);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [prefs[i], prefs[j]] = [prefs[j], prefs[i]];
  }
  return prefs.map((pref) => ({ pref, streak: 0, decided: false }));
}

export const clampK = (k: number, n = SNOW_NODES) => Math.round(clamp(k, 1, Math.min(SNOW_MAX_K, n - 1)));
export const clampAlpha = (alpha: number, k: number) => Math.round(clamp(alpha, 1, k));

/** `k` distinct peers of node `self`, uniformly at random. */
export function samplePeers(n: number, self: number, k: number, r: () => number): number[] {
  const pool: number[] = [];
  for (let i = 0; i < n; i++) if (i !== self) pool.push(i);
  const take = Math.min(Math.max(0, Math.round(k)), pool.length);
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(r() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, take);
}

export interface SnowRound {
  nodes: SnowNode[];
  /** Who node 0 asked this round, to draw in the scene. */
  sample: number[];
}

/**
 * One round for every undecided node, all reading the preferences as they were
 * at the start of the round. A poll succeeds when at least `alpha` of the `k`
 * sampled peers prefer the same block; `beta` successes in a row decide.
 */
export function snowRound(nodes: SnowNode[], kIn: number, alphaIn: number, beta: number, r: () => number): SnowRound {
  const n = nodes.length;
  if (n < 2) return { nodes: nodes.map((x) => ({ ...x, decided: true })), sample: [] };
  const k = clampK(kIn, n);
  const alpha = clampAlpha(alphaIn, k);
  let sample: number[] = [];
  const next = nodes.map((node, i) => {
    const peers = samplePeers(n, i, k, r);
    if (i === 0) sample = peers;
    if (node.decided) return node;
    const orange = peers.reduce((s, p) => s + nodes[p].pref, 0);
    const blue = peers.length - orange;
    const winner: 0 | 1 | null = blue === orange ? null : blue > orange ? 0 : 1;
    if (winner === null || Math.max(blue, orange) < alpha) return { ...node, streak: 0 };
    const streak = winner === node.pref ? node.streak + 1 : 1;
    return { pref: winner, streak, decided: streak >= beta };
  });
  return { nodes: next, sample };
}

export interface SnowTally {
  blue: number;
  orange: number;
  decided: number;
  allDecided: boolean;
  /** Every node decided, and all on the same block. */
  agreed: boolean;
  /** Two nodes decided on different blocks: a safety failure. */
  split: boolean;
}

export function snowTally(nodes: SnowNode[]): SnowTally {
  const orange = nodes.reduce((s, x) => s + x.pref, 0);
  const done = nodes.filter((x) => x.decided);
  const doneOrange = done.reduce((s, x) => s + x.pref, 0);
  const allDecided = done.length === nodes.length;
  const split = doneOrange > 0 && doneOrange < done.length;
  return { blue: nodes.length - orange, orange, decided: done.length, allDecided, agreed: allDecided && !split, split };
}

export function snowRun(nodes: SnowNode[], k: number, alpha: number, beta: number, r: () => number, maxRounds = SNOW_MAX_ROUNDS) {
  let cur = nodes;
  let sample: number[] = [];
  let rounds = 0;
  while (rounds < maxRounds && !snowTally(cur).allDecided) {
    const step = snowRound(cur, k, alpha, beta, r);
    cur = step.nodes;
    sample = step.sample;
    rounds++;
  }
  return { nodes: cur, sample, rounds, decided: snowTally(cur).allDecided };
}

/* ---------- Cosmos: voting power against the two-thirds threshold ---------- */

/** Voting power of the five validators on the example chain, in percent. */
export const POWERS = [30, 25, 20, 15, 10];

export interface BftStatus {
  total: number;
  online: number;
  /** Percent of voting power online / offline, 0–100. */
  onlinePct: number;
  offlinePct: number;
  /** Strictly more than two thirds of the power can precommit. */
  canCommit: boolean;
}

export function bftStatus(powers: number[], isOnline: boolean[]): BftStatus {
  const total = powers.reduce((s, p) => s + Math.max(0, p), 0);
  const online = powers.reduce((s, p, i) => s + (isOnline[i] ? Math.max(0, p) : 0), 0);
  const onlinePct = total > 0 ? (online / total) * 100 : 0;
  return { total, online, onlinePct, offlinePct: total > 0 ? 100 - onlinePct : 0, canCommit: total > 0 && online * 3 > total * 2 };
}

/* ---------- Cosmos: an IBC token transfer, step by step ---------- */

export type IbcPhase = 'idle' | 'escrowed' | 'relayed' | 'verified' | 'minted' | 'acked' | 'expired' | 'refunded';

export interface IbcState {
  phase: IbcPhase;
  /** Blocks passed on chain B since the packet was sent. */
  clock: number;
  balanceA: number;
  escrowA: number;
  vouchersB: number;
}

export const IBC_AMOUNT = 10;
export const IBC_START = 100;
/** The packet is void once chain B is this many blocks past the send. */
export const IBC_TIMEOUT = 3;

export const ibcInitial = (): IbcState => ({ phase: 'idle', clock: 0, balanceA: IBC_START, escrowA: 0, vouchersB: 0 });

/** Advances the transfer by one step. A relayer is needed to carry anything between the chains. */
export function ibcNext(s: IbcState, relayerOnline: boolean): IbcState {
  switch (s.phase) {
    case 'idle':
      return { ...s, phase: 'escrowed', clock: 0, balanceA: s.balanceA - IBC_AMOUNT, escrowA: s.escrowA + IBC_AMOUNT };
    case 'escrowed': {
      if (relayerOnline) return { ...s, phase: 'relayed' };
      const clock = s.clock + 1;
      return { ...s, clock, phase: clock >= IBC_TIMEOUT ? 'expired' : 'escrowed' };
    }
    case 'relayed':
      return { ...s, phase: 'verified' };
    case 'verified':
      return { ...s, phase: 'minted', vouchersB: s.vouchersB + IBC_AMOUNT };
    case 'minted':
      // The acknowledgement also travels with a relayer; until then A simply keeps the escrow.
      return relayerOnline ? { ...s, phase: 'acked' } : s;
    case 'expired':
      // Proving the timeout to chain A needs a relayer too. Until then the coins stay locked, not lost.
      return relayerOnline ? { ...s, phase: 'refunded', balanceA: s.balanceA + s.escrowA, escrowA: 0 } : { ...s, clock: s.clock + 1 };
    default:
      return ibcInitial();
  }
}

/* ---------- Comparison: one criterion at a time ---------- */

export type ChainId = 'sol' | 'ava' | 'cos';
export type Criterion = 'block' | 'final' | 'vals' | 'hw';
export const CRITERIA: Criterion[] = ['block', 'final', 'vals', 'hw'];
export const CHAINS: ChainId[] = ['sol', 'ava', 'cos'];

/**
 * Sort keys taken from the figures in the lesson text (midpoints of the quoted
 * ranges). `better` says which end ranks first. Equal keys tie.
 */
export const COMPARE: Record<Criterion, { better: 'low' | 'high'; key: Record<ChainId, number> }> = {
  // seconds per block: ≈ 0.25 · ≈ 1–2 · ≈ 1–6
  block: { better: 'low', key: { sol: 0.25, ava: 1.5, cos: 3.5 } },
  // seconds to finality: ≈ 8 · ≈ 1–2 · one block (1–6)
  final: { better: 'low', key: { sol: 8, ava: 1.5, cos: 3.5 } },
  // validators: several hundred · several hundred · 100–200 per chain
  vals: { better: 'high', key: { sol: 500, ava: 500, cos: 150 } },
  // hardware needed: server-grade (2) · modest (1) · modest (1)
  hw: { better: 'low', key: { sol: 2, ava: 1, cos: 1 } },
};

export interface Ranked {
  chain: ChainId;
  /** 1 is best; chains with equal keys share a rank. */
  rank: number;
  /** Bar length 0.15–1 for the scene, on a log scale. */
  bar: number;
}

export function rankChains(c: Criterion): Ranked[] {
  const { better, key } = COMPARE[c];
  const dir = better === 'low' ? 1 : -1;
  const sorted = [...CHAINS].sort((a, b) => dir * (key[a] - key[b]));
  const logs = CHAINS.map((id) => Math.log(key[id]));
  const lo = Math.min(...logs);
  const hi = Math.max(...logs);
  return sorted.map((chain) => {
    const rank = 1 + CHAINS.filter((o) => dir * (key[o] - key[chain]) < 0).length;
    const t = hi > lo ? (Math.log(key[chain]) - lo) / (hi - lo) : 1;
    return { chain, rank, bar: 0.15 + 0.85 * t };
  });
}

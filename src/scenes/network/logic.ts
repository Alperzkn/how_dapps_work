// Pure logic behind the network lesson's controls. No React, no three.js.
import { addressOf, publicKeyOf, signText, verifyText, type Signature } from '../../sim/keys';
import { sha256 } from '../../sim/sha256';

const int = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(v) ? v : lo)));

// ---------- Step 1: how many copies are left ----------

export type NodeKind = 'full' | 'light';

/**
 * Which nodes are switched off: the first `count` entries of `order`, plus `extra` when given.
 * At least one node always stays on, so `count` is cut short if needed.
 */
export function offlineSet(total: number, order: readonly number[], count: number, extra: number | null = null): boolean[] {
  const off = Array.from({ length: Math.max(0, total) }, () => false);
  let left = off.length;
  if (extra !== null && extra >= 0 && extra < off.length && left > 1) {
    off[extra] = true;
    left--;
  }
  let want = int(count, 0, off.length);
  for (const i of order) {
    if (want <= 0 || left <= 1) break;
    if (i < 0 || i >= off.length || off[i]) continue;
    off[i] = true;
    left--;
    want--;
  }
  return off;
}

export interface LedgerStatus {
  online: number;
  fullOnline: number;
  lightOnline: number;
  /** The whole ledger can still be read and checked: at least one full node is up. */
  available: boolean;
}

export function ledgerStatus(kinds: readonly NodeKind[], offline: readonly boolean[]): LedgerStatus {
  let fullOnline = 0;
  let lightOnline = 0;
  kinds.forEach((k, i) => {
    if (offline[i]) return;
    if (k === 'full') fullOnline++;
    else lightOnline++;
  });
  return { online: fullOnline + lightOnline, fullOnline, lightOnline, available: fullOnline > 0 };
}

// ---------- Step 2: gossip on a real graph ----------

export interface Pt {
  x: number;
  z: number;
}
export type Edge = [number, number];

const d2 = (a: Pt, b: Pt) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
const norm = (a: number, b: number): Edge => (a < b ? [a, b] : [b, a]);

/**
 * The peer graph when every node dials its `fanout` nearest neighbours.
 * A minimum spanning tree is always included so the network is never split,
 * which also makes the edge set for a larger fan-out a superset of a smaller one.
 */
export function buildGraph(points: readonly Pt[], fanout: number): Edge[] {
  const n = points.length;
  if (n < 2) return [];
  const k = int(fanout, 1, n - 1);
  const seen = new Set<string>();
  const edges: Edge[] = [];
  const add = (a: number, b: number) => {
    const e = norm(a, b);
    const key = `${e[0]}-${e[1]}`;
    if (a === b || seen.has(key)) return;
    seen.add(key);
    edges.push(e);
  };

  // Prim's algorithm for the spanning tree.
  const inTree = Array.from({ length: n }, () => false);
  inTree[0] = true;
  for (let step = 1; step < n; step++) {
    let best: Edge | null = null;
    let bestD = Number.POSITIVE_INFINITY;
    for (let a = 0; a < n; a++) {
      if (!inTree[a]) continue;
      for (let b = 0; b < n; b++) {
        if (inTree[b]) continue;
        const d = d2(points[a], points[b]);
        if (d < bestD) {
          bestD = d;
          best = [a, b];
        }
      }
    }
    if (!best) break;
    inTree[best[1]] = true;
    add(best[0], best[1]);
  }

  for (let a = 0; a < n; a++) {
    const near = points
      .map((_, b) => b)
      .filter((b) => b !== a)
      .sort((p, q) => d2(points[a], points[p]) - d2(points[a], points[q]) || p - q);
    for (const b of near.slice(0, k)) add(a, b);
  }
  return edges.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
}

export interface GossipResult {
  /** Hops from the origin to each node; -1 if it can never be reached. */
  dist: number[];
  /** How many nodes have the message after 0, 1, 2, … hops. */
  reached: number[];
  /** Hops until nobody new can be reached. */
  hops: number;
  /** True when every node ends up with the message. */
  all: boolean;
}

/** Breadth-first flood: in each round every node that has the message tells all its peers. */
export function gossip(total: number, edges: readonly Edge[], origin: number): GossipResult {
  const n = Math.max(0, total);
  const dist = Array.from({ length: n }, () => -1);
  if (n === 0) return { dist, reached: [0], hops: 0, all: true };
  const from = int(origin, 0, n - 1);
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    if (a < 0 || b < 0 || a >= n || b >= n || a === b) continue;
    adj[a].push(b);
    adj[b].push(a);
  }
  dist[from] = 0;
  const reached = [1];
  let frontier = [from];
  while (frontier.length) {
    const next: number[] = [];
    for (const a of frontier) {
      for (const b of adj[a]) {
        if (dist[b] !== -1) continue;
        dist[b] = dist[a] + 1;
        next.push(b);
      }
    }
    if (next.length) reached.push(reached[reached.length - 1] + next.length);
    frontier = next;
  }
  return { dist, reached, hops: reached.length - 1, all: reached[reached.length - 1] === n };
}

// ---------- Steps 3-4: a node checks a block ----------

export type Defect = 'none' | 'signature' | 'balance' | 'parent';
export const DEFECTS: readonly Defect[] = ['none', 'signature', 'balance', 'parent'];
/** The order in which the node runs its checks; it stops at the first failure. */
export const CHECK_ORDER = ['parent', 'signature', 'balance'] as const;
export type CheckName = (typeof CHECK_ORDER)[number];
export type CheckState = 'ok' | 'bad' | 'skipped';

export interface DemoBlock {
  parentHash: string;
  tx: { fromPublicKey: string; message: string; amount: number; signature: Signature };
}

/** What the checking node already knows: the tip it would attach the block to, and the sender's balance. */
export interface NodeView {
  tipHash: string;
  balance: number;
}

// Demo keys only. Never use them for anything real.
const OWNER_KEY = '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318';
const THIEF_KEY = '0x7f2c1b0e5d9a4836c1e0f7b2a9d8c6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9';
const TIP_HEADER = 'height 840000|prev 0000000000000000000172014ba58d66|txs 3050';
const OTHER_HEADER = 'height 839990|prev 00000000000000000002c0ffee15dead|txs 2811';
export const DEMO_BALANCE = 5;

export const demoView = (): NodeView => ({ tipHash: sha256(TIP_HEADER), balance: DEMO_BALANCE });

const cache = new Map<Defect, DemoBlock>();

/** Builds a block that is valid, or that breaks exactly one rule. Signatures and hashes are real. */
export function makeBlock(defect: Defect): DemoBlock {
  const hit = cache.get(defect);
  if (hit) return hit;
  const fromPublicKey = publicKeyOf(OWNER_KEY);
  const amount = defect === 'balance' ? DEMO_BALANCE + 4 : 2;
  const message = `pay ${amount} from ${addressOf(fromPublicKey)} nonce 7`;
  // A forged payment: signed by somebody else's key, but claiming to come from the owner.
  const signature = signText(message, defect === 'signature' ? THIEF_KEY : OWNER_KEY);
  const block: DemoBlock = {
    parentHash: sha256(defect === 'parent' ? OTHER_HEADER : TIP_HEADER),
    tx: { fromPublicKey, message, amount, signature },
  };
  cache.set(defect, block);
  return block;
}

export interface CheckResult {
  checks: CheckState[];
  /** Index into CHECK_ORDER of the failed check, or -1. */
  failed: number;
  valid: boolean;
}

/** Runs the three checks in order and stops at the first one that fails. */
export function checkBlock(block: DemoBlock, view: NodeView): CheckResult {
  const pass: Record<CheckName, () => boolean> = {
    parent: () => block.parentHash === view.tipHash,
    signature: () => verifyText(block.tx.message, block.tx.signature, block.tx.fromPublicKey),
    balance: () => Number.isFinite(block.tx.amount) && block.tx.amount >= 0 && block.tx.amount <= view.balance,
  };
  const checks: CheckState[] = [];
  let failed = -1;
  CHECK_ORDER.forEach((name, i) => {
    if (failed !== -1) checks.push('skipped');
    else if (pass[name]()) checks.push('ok');
    else {
      checks.push('bad');
      failed = i;
    }
  });
  return { checks, failed, valid: failed === -1 };
}

export type Standing = 'ok' | 'pruned' | 'cut';
export const CUT_AFTER = 3;

/**
 * How a peer is treated after relaying `invalid` bad blocks. The penalty grows with the square
 * of the count, as gossipsub's invalid-message term does; the cut-off itself is a demo value.
 */
export function peerStanding(invalid: number): { count: number; score: number; standing: Standing } {
  const count = int(invalid, 0, 99);
  const score = count === 0 ? 0 : -(count * count);
  return { count, score, standing: count === 0 ? 'ok' : count >= CUT_AFTER ? 'cut' : 'pruned' };
}

// ---------- Step 5: resolving a fork ----------

export type Side = 'A' | 'B';
export const MAX_BRANCH = 4;

export interface ForkState {
  /** Blocks on each branch after the common ancestor. */
  a: number;
  b: number;
  /** The branch followed by the nodes that heard A first, and by those that heard B first. */
  follow: [Side, Side];
  /** Blocks rolled back by the nodes that switched on the last move (0 if nobody switched). */
  reorgDepth: number;
  /** Which groups switched on the last move: [heard A first, heard B first]. */
  switched: [boolean, boolean];
}

export const FORK_START: ForkState = { a: 1, b: 1, follow: ['A', 'B'], reorgDepth: 0, switched: [false, false] };

/**
 * The next block is found on `side`. Every block carries the same work, so the heavier branch
 * is the one with more blocks. On a tie each node stays on the branch it is already following.
 */
export function addBlock(s: ForkState, side: Side): ForkState {
  const full = side === 'A' ? s.a >= MAX_BRANCH : s.b >= MAX_BRANCH;
  if (full) return { ...s, reorgDepth: 0, switched: [false, false] };
  const a = s.a + (side === 'A' ? 1 : 0);
  const b = s.b + (side === 'B' ? 1 : 0);
  if (a === b) return { a, b, follow: s.follow, reorgDepth: 0, switched: [false, false] };
  const heavy: Side = a > b ? 'A' : 'B';
  const switched: [boolean, boolean] = [s.follow[0] !== heavy, s.follow[1] !== heavy];
  // The switching nodes undo every block of the branch they were on.
  const reorgDepth = switched[0] || switched[1] ? (heavy === 'A' ? s.b : s.a) : 0;
  return { a, b, follow: [heavy, heavy], reorgDepth, switched };
}

/** Blocks on a branch that is lighter than the other and that no node follows any more. */
export function staleBlocks(s: ForkState): { a: number; b: number; total: number } {
  const a = s.a < s.b && !s.follow.includes('A') ? s.a : 0;
  const b = s.b < s.a && !s.follow.includes('B') ? s.b : 0;
  return { a, b, total: a + b };
}

/** How many nodes follow each branch, given the sizes of the two groups. */
export function followers(s: ForkState, groupA: number, groupB: number): { a: number; b: number; switched: number } {
  const a = (s.follow[0] === 'A' ? groupA : 0) + (s.follow[1] === 'A' ? groupB : 0);
  const switched = (s.switched[0] ? groupA : 0) + (s.switched[1] ? groupB : 0);
  return { a, b: groupA + groupB - a, switched };
}

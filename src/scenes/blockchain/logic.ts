import { sha256 } from '../../sim/sha256';

export const ORIGINAL = ['Genesis', 'Ayşe → Ben: 5', 'Ben → Cem: 2', 'Cem → Ayşe: 1'];

const ZERO = '0'.repeat(64);
export const blockHash = (index: number, prev: string, data: string) => sha256(`${index}|${prev}|${data}`);

export interface ChainBlock {
  data: string;
  /** The previous block's hash as written inside this block. */
  storedPrev: string;
  hash: string;
  edited: boolean;
  /** True once this block's stored link was rewritten to match its changed parent. */
  redone: boolean;
  /** Does the stored link match the parent's current hash? */
  linkOk: boolean;
  /** False for every block at or after the first bad link. */
  linked: boolean;
}

/**
 * Each block stores the hash its predecessor had when the chain was built.
 * Editing a block changes its hash, so the next block points at a fingerprint that no longer exists.
 * `redone[i]` rewrites block i's stored link to its parent's current hash, which in turn changes
 * block i's own hash and breaks the link of block i + 1.
 */
export function computeChain(data: string[], redone: boolean[] = []): ChainBlock[] {
  const out: ChainBlock[] = [];
  let originalPrev = ZERO;
  let actualPrev = ZERO;
  let intact = true;
  ORIGINAL.forEach((original, i) => {
    const value = data[i] ?? original;
    const storedPrev = redone[i] ? actualPrev : originalPrev;
    const linkOk = storedPrev === actualPrev;
    if (!linkOk) intact = false;
    const hash = blockHash(i, storedPrev, value);
    out.push({ data: value, storedPrev, hash, edited: value !== original, redone: storedPrev !== originalPrev, linkOk, linked: intact });
    actualPrev = hash;
    originalPrev = blockHash(i, originalPrev, original);
  });
  return out;
}

/** Index of the first block whose stored link is wrong, or -1 when the chain is consistent. */
export const firstBroken = (chain: ChainBlock[]) => chain.findIndex((b) => !b.linkOk);

/** How many blocks still carry a link that does not match (the first bad one and everything after it). */
export const brokenCount = (chain: ChainBlock[]) => chain.filter((b) => !b.linked).length;

/** Number of positions at which two equally long hex strings differ. */
export function hexDiff(a: string, b: string): number {
  const n = Math.max(a.length, b.length);
  let count = 0;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) count++;
  return count;
}

/** Number of differing bits between two hex strings of the same length. */
export function bitDiff(a: string, b: string): number {
  const n = Math.max(a.length, b.length);
  let count = 0;
  for (let i = 0; i < n; i++) {
    let x = (parseInt(a[i] ?? '0', 16) || 0) ^ (parseInt(b[i] ?? '0', 16) || 0);
    while (x) {
      count += x & 1;
      x >>= 1;
    }
  }
  return count;
}

export const MIN_SHARE = 0.01;
export const MAX_SHARE = 0.49;
export const MIN_DEPTH = 1;
export const MAX_DEPTH = 12;

const clampShare = (q: number) => (Number.isFinite(q) ? Math.min(Math.max(q, 0), 1) : 0);
const clampDepth = (z: number) => (Number.isFinite(z) ? Math.max(0, Math.floor(z)) : 0);

/** Probability that an attacker with share q ever makes up a deficit of z blocks: (q/p)^z. */
export function catchUpFromBehind(q: number, z: number): number {
  const share = clampShare(q);
  const depth = clampDepth(z);
  if (share >= 0.5 || depth === 0) return 1;
  if (share <= 0) return 0;
  return Math.pow(share / (1 - share), depth);
}

/** Blocks the attacker is expected to have found while the honest network found z: λ = z·q/p. */
export function attackerExpectedBlocks(q: number, z: number): number {
  const share = Math.min(clampShare(q), 0.999);
  return (clampDepth(z) * share) / (1 - share);
}

/**
 * Nakamoto's catch-up probability (Bitcoin whitepaper, section 11).
 * The recipient waits for z blocks. Meanwhile the attacker, mining in secret, has found k blocks,
 * Poisson-distributed with mean λ = z·q/p, and from there must still make up z − k:
 *   P = 1 − Σ_{k=0..z} (λ^k e^−λ / k!) · (1 − (q/p)^(z−k))
 * Computed in the equivalent all-positive form  Σ_{k≤z} Pois(k)·(q/p)^(z−k) + Σ_{k>z} Pois(k)
 * so that very small results do not vanish in rounding.
 */
export function catchUpProbability(q: number, z: number): number {
  const share = clampShare(q);
  const depth = clampDepth(z);
  if (share >= 0.5 || depth === 0) return 1;
  if (share <= 0) return 0;
  const ratio = share / (1 - share);
  const lambda = depth * ratio;
  let poisson = Math.exp(-lambda);
  let sum = 0;
  for (let k = 0; k <= depth; k++) {
    sum += poisson * Math.pow(ratio, depth - k);
    poisson *= lambda / (k + 1);
  }
  // Tail: the attacker is already ahead.
  for (let k = depth + 1; k < depth + 400 && poisson > 1e-320; k++) {
    sum += poisson;
    poisson *= lambda / (k + 1);
  }
  return Math.min(Math.max(sum, 0), 1);
}

/** What else a chain can record. The course itself follows `payments`. */
export const USES = ['payments', 'ownership', 'identity', 'supply', 'votes', 'games'] as const;
export type UseId = (typeof USES)[number];

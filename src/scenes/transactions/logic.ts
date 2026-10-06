// Pure rules behind the transactions scene: fee market, block space, confirmations and gossip.

/** Gas used by a plain ETH transfer. */
export const GAS_TRANSFER = 21_000;
/** Alice's maxFeePerGas, in gwei: the ceiling she signed. */
export const MAX_FEE = 30;
/** How many of the waiting transactions fit into one block in this model. */
export const BLOCK_SLOTS = 3;
/** Effective tips of the five other waiting transactions, in gwei. */
export const OTHER_TIPS = [5, 3, 1.8, 1.5, 1];

export const MIN_TIP = 0;
export const MAX_TIP = 8;
export const DEFAULT_TIP = 2;
export const MIN_BASE = 5;
export const MAX_BASE = 40;
export const DEFAULT_BASE = 20;
/** The confirmation counter stops here (Bitcoin's customary six). */
export const MAX_CONFIRMATIONS = 6;

const finite = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);
const clamp = (v: number, lo: number, hi: number, fallback: number) => Math.min(Math.max(finite(v, fallback), lo), hi);

export const clampTip = (v: number) => clamp(v, MIN_TIP, MAX_TIP, DEFAULT_TIP);
export const clampBase = (v: number) => clamp(v, MIN_BASE, MAX_BASE, DEFAULT_BASE);

/** EIP-1559: a transaction can only be included while its fee ceiling covers the base fee. */
export const canInclude = (maxFee: number, baseFee: number) => finite(maxFee, 0) >= finite(baseFee, 0);

/**
 * EIP-1559 priority fee actually paid per gas: min(maxPriorityFeePerGas, maxFeePerGas − baseFee).
 * Zero when the ceiling is below the base fee (the transaction is not includable at all).
 */
export function effectiveTip(maxPriorityFee: number, maxFee: number, baseFee: number): number {
  const room = finite(maxFee, 0) - finite(baseFee, 0);
  return Math.max(0, Math.min(Math.max(finite(maxPriorityFee, 0), 0), room));
}

export type TxId = 'alice' | number;

export interface Mempool {
  /** Waiting transactions, best tip first. Numbers index OTHER_TIPS. */
  order: TxId[];
  /** Alice's place in the queue, starting at 0. */
  rank: number;
  includable: boolean;
  /** What Alice really pays the producer per gas, in gwei. */
  effective: number;
  inNextBlock: boolean;
  /** 1 = the next block, 2 = the one after; 0 = never, at this base fee. */
  inclusionBlock: number;
}

/**
 * Orders the waiting transactions the simple way: highest effective tip first.
 * On equal tips the transaction that was already waiting goes first, and Alice's arrived last.
 */
export function mempool(tip: number, baseFee: number, maxFee = MAX_FEE): Mempool {
  const includable = canInclude(maxFee, baseFee);
  const effective = effectiveTip(tip, maxFee, baseFee);
  const others: TxId[] = OTHER_TIPS.map((_, i) => i);
  const ahead = includable ? OTHER_TIPS.filter((t) => t >= effective).length : OTHER_TIPS.length;
  const order: TxId[] = [...others.slice(0, ahead), 'alice', ...others.slice(ahead)];
  const inclusionBlock = includable ? Math.floor(ahead / BLOCK_SLOTS) + 1 : 0;
  return { order, rank: ahead, includable, effective, inNextBlock: inclusionBlock === 1, inclusionBlock };
}

/** Confirmations of a transaction included in block `inclusionBlock` once `blocksMade` blocks exist. */
export function confirmationsAt(blocksMade: number, inclusionBlock: number): number {
  const made = Math.max(0, Math.floor(finite(blocksMade, 0)));
  if (inclusionBlock <= 0 || made < inclusionBlock) return 0;
  return made - inclusionBlock + 1;
}

/** How many blocks the scene lets the learner produce: until six confirmations, or a few if never included. */
export const maxBlocks = (inclusionBlock: number) => (inclusionBlock > 0 ? inclusionBlock + MAX_CONFIRMATIONS - 1 : 4);

export interface Fee {
  /** gasUsed × baseFee, destroyed. In gwei. */
  burned: number;
  /** gasUsed × effective tip, paid to the block producer. In gwei. */
  toProducer: number;
  total: number;
  totalEth: number;
}

/** What a transaction costs under EIP-1559. Prices in gwei per gas; 1 ETH = 10^9 gwei. */
export function feeBreakdown(gasUsed: number, baseFee: number, tip: number): Fee {
  const gas = Math.max(0, finite(gasUsed, 0));
  const burned = gas * Math.max(0, finite(baseFee, 0));
  const toProducer = gas * Math.max(0, finite(tip, 0));
  const total = burned + toProducer;
  return { burned, toProducer, total, totalEth: total / 1e9 };
}

/** The four nodes of the scene and which pairs are connected. */
export const NODE_COUNT = 4;
export const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
];

/** Hops each node is away from the node that heard the transaction first (breadth-first gossip). */
export function gossipHops(first: number): number[] {
  const start = Math.min(Math.max(Math.floor(finite(first, 0)), 0), NODE_COUNT - 1);
  const hops = Array<number>(NODE_COUNT).fill(-1);
  hops[start] = 0;
  const queue = [start];
  while (queue.length) {
    const at = queue.shift()!;
    for (const [a, b] of EDGES) {
      const next = a === at ? b : b === at ? a : -1;
      if (next >= 0 && hops[next] < 0) {
        hops[next] = hops[at] + 1;
        queue.push(next);
      }
    }
  }
  return hops;
}

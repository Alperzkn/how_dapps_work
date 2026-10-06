import { sha256 } from '../../sim/sha256';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

/** Illustrative exchange rate used to show fees in dollars. */
export const ETH_USD = 2000;
export const TRANSFER_GAS = 21_000;
export const gweiToUsd = (gwei: number) => (Number.isFinite(gwei) ? gwei * 1e-9 * ETH_USD : 0);

/* ---------- Step 1: L1 block space and the EIP-1559 base fee ---------- */

/** A block may use up to twice its gas target (EIP-1559 elasticity multiplier 2). */
export const MAX_FILL = 200;
export const MAX_DEMAND = 300;
export const START_BASE_FEE = 2;
const MIN_BASE_FEE = 0.01;
const MAX_BASE_FEE = 100_000;

/** Gas used by the next block, in percent of the target, given demand in percent of the target. */
export const blockFill = (demandPct: number) => clamp(demandPct, 0, MAX_FILL);
/** Demand that does not fit in the block, in percent of the target. */
export const leftOut = (demandPct: number) => Math.max(0, clamp(demandPct, 0, MAX_DEMAND) - MAX_FILL);

/**
 * EIP-1559: the base fee moves by (used − target) / target / 8 per block,
 * so +12.5% after a full block and −12.5% after an empty one.
 */
export function nextBaseFee(baseFee: number, usedPct: number): number {
  const used = blockFill(usedPct);
  const base = clamp(baseFee, MIN_BASE_FEE, MAX_BASE_FEE);
  return clamp(base * (1 + (used - 100) / 100 / 8), MIN_BASE_FEE, MAX_BASE_FEE);
}

export function baseFeeAfter(baseFee: number, demandPct: number, blocks: number): number {
  let fee = baseFee;
  for (let i = 0; i < Math.max(0, Math.round(clamp(blocks, 0, 1000))); i++) fee = nextBaseFee(fee, demandPct);
  return fee;
}

/* ---------- Steps 2 and 6: what a batch costs on L1 ---------- */

/** EIP-4844: 4096 field elements of 32 bytes. */
export const BLOB_BYTES = 4096 * 32;
/** Blob gas charged per blob, always for the whole blob. */
export const GAS_PER_BLOB = 131_072;
/** Blobs per block on Ethereum mainnet as of 2026 (after the January 2026 parameter fork). */
export const BLOB_TARGET = 14;
export const BLOB_MAX = 21;
/** Nodes must serve blobs for 4096 epochs, about 18 days. */
export const BLOB_RETENTION_DAYS = 18;
/** Gas per non-zero calldata byte for a data-heavy transaction since EIP-7623 (16 before it). */
export const CALLDATA_GAS_PER_BYTE = 40;
/** Illustrative size of one simple transfer after compression. */
export const TX_BYTES = 100;
/** Intrinsic gas of the batch transaction itself. */
export const BATCH_TX_GAS = 21_000;
/** Rough gas to verify one validity proof on L1 (ethereum.org cites about 500,000). */
export const ZK_VERIFY_GAS = 500_000;

export const BATCH_SIZES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
export const batchSizeAt = (index: number) => BATCH_SIZES[Math.round(clamp(index, 0, BATCH_SIZES.length - 1))];

/** The blob-price slider is logarithmic: 10^exp gwei, from 1 wei to 100 gwei. */
export const BLOB_EXP_MIN = -9;
export const BLOB_EXP_MAX = 2;
export const blobGweiAt = (exp: number) => 10 ** clamp(exp, BLOB_EXP_MIN, BLOB_EXP_MAX);
/** EIP-7918: the blob fee stops falling once it is below 1/16 of the execution base fee. */
export const effectiveBlobGwei = (blobGwei: number, gasGwei: number) => Math.max(clamp(blobGwei, 1e-9, 1e6), clamp(gasGwei, 0, 1e6) / 16);

export const blobsNeeded = (bytes: number) => (bytes > 0 ? Math.ceil(bytes / BLOB_BYTES) : 0);

export type DataMode = 'blob' | 'calldata';

export interface BatchCost {
  n: number;
  bytes: number;
  blobs: number;
  /** How full the last blob paid for is, 0–100. */
  blobFillPct: number;
  /** Execution gas: the batch transaction, calldata if used, proof verification if any. */
  execGas: number;
  blobGas: number;
  /** Whole batch, in gwei. */
  totalGwei: number;
  perTxGwei: number;
  perTxUsd: number;
  /** The same transfer sent straight to L1. */
  l1TxUsd: number;
  /** How many times cheaper than L1; 0 when it is not cheaper to state. */
  timesCheaper: number;
}

export function batchCost(nIn: number, gasGweiIn: number, blobGweiIn: number, mode: DataMode, proofGas = 0): BatchCost {
  const n = Math.max(1, Math.round(clamp(nIn, 1, 1_000_000)));
  const gasGwei = clamp(gasGweiIn, 0, 1e6);
  const bytes = n * TX_BYTES;
  const blobs = mode === 'blob' ? blobsNeeded(bytes) : 0;
  const execGas = BATCH_TX_GAS + Math.max(0, proofGas) + (mode === 'calldata' ? bytes * CALLDATA_GAS_PER_BYTE : 0);
  const blobGas = blobs * GAS_PER_BLOB;
  const totalGwei = execGas * gasGwei + blobGas * effectiveBlobGwei(blobGweiIn, gasGwei);
  const perTxGwei = totalGwei / n;
  const l1Gwei = TRANSFER_GAS * gasGwei;
  return {
    n,
    bytes,
    blobs,
    blobFillPct: blobs > 0 ? (bytes / (blobs * BLOB_BYTES)) * 100 : 0,
    execGas,
    blobGas,
    totalGwei,
    perTxGwei,
    perTxUsd: gweiToUsd(perTxGwei),
    l1TxUsd: gweiToUsd(l1Gwei),
    timesCheaper: perTxGwei > 0 ? l1Gwei / perTxGwei : 0,
  };
}

/* ---------- Step 3: the sequencer and forced inclusion ---------- */

/** Hours after which a transaction sent to the L1 inbox must be part of the chain (12 on OP Stack chains, 24 on Arbitrum One). */
export const FORCE_WINDOW_H = 12;
export const WAIT_STEP_H = 4;

export type SeqPhase = 'idle' | 'stuck' | 'soft' | 'batched' | 'final' | 'queued' | 'included' | 'forced';
export type SeqAction = 'send' | 'force' | 'next';
export interface SeqState {
  phase: SeqPhase;
  /** Hours the transaction has been waiting in the L1 inbox. */
  waited: number;
}
export const seqInitial = (): SeqState => ({ phase: 'idle', waited: 0 });

export function seqStep(s: SeqState, action: SeqAction, sequencerOnline: boolean): SeqState {
  if (action === 'send') {
    if (s.phase !== 'idle' && s.phase !== 'stuck') return s;
    return { phase: sequencerOnline ? 'soft' : 'stuck', waited: 0 };
  }
  if (action === 'force') {
    // Allowed whenever the transaction is not yet on L1.
    if (s.phase !== 'idle' && s.phase !== 'stuck' && s.phase !== 'soft') return s;
    return { phase: 'queued', waited: 0 };
  }
  switch (s.phase) {
    case 'stuck':
      return sequencerOnline ? { phase: 'soft', waited: 0 } : s;
    case 'soft':
      // Without the sequencer the promise never reaches L1.
      return sequencerOnline ? { phase: 'batched', waited: 0 } : s;
    case 'batched':
      return { phase: 'final', waited: 0 };
    case 'queued': {
      if (sequencerOnline) return { phase: 'included', waited: s.waited };
      const waited = s.waited + WAIT_STEP_H;
      return waited >= FORCE_WINDOW_H ? { phase: 'forced', waited: FORCE_WINDOW_H } : { phase: 'queued', waited };
    }
    case 'final':
    case 'included':
    case 'forced':
      return seqInitial();
    default:
      return s;
  }
}

/** Where the transaction's data lives: nowhere yet, only with the sequencer, or on L1. */
export const seqOnL1 = (p: SeqPhase) => p === 'batched' || p === 'final' || p === 'queued' || p === 'included' || p === 'forced';

/* ---------- Step 4: optimistic rollups, fraud proofs by bisection ---------- */

export const TRACE_STEPS = 16;
export const CHALLENGE_DAYS = 7;
export const BOND = 1;

const stepHash = (prev: string, i: number) => sha256(`${prev}|step ${i}`);

/** The correct execution: state 0 plus one state after each of the 16 steps. */
export function honestTrace(): string[] {
  const t = [sha256('rollup state before the batch')];
  for (let i = 1; i <= TRACE_STEPS; i++) t.push(stepHash(t[i - 1], i));
  return t;
}

/** A trace that executes step `faultAt` wrongly and then carries on correctly from the wrong state. */
export function faultyTrace(faultAt: number): string[] {
  const f = Math.round(clamp(faultAt, 1, TRACE_STEPS));
  const honest = honestTrace();
  const t = honest.slice(0, f);
  t.push(sha256(`${honest[f - 1]}|step ${f}|plus coins for the proposer`));
  for (let i = f + 1; i <= TRACE_STEPS; i++) t.push(stepHash(t[i - 1], i));
  return t;
}

export interface Dispute {
  /** Last step both sides agree on. */
  lo: number;
  /** First step known to be in dispute. */
  hi: number;
  rounds: number;
}
export const disputeStart = (): Dispute => ({ lo: 0, hi: TRACE_STEPS, rounds: 0 });

/** One round of bisection: compare the two traces at the midpoint and keep the half that contains the disagreement. */
export function bisect(a: string[], b: string[], d: Dispute): Dispute {
  if (d.hi - d.lo <= 1) return d;
  const mid = Math.floor((d.lo + d.hi) / 2);
  return a[mid] === b[mid] ? { lo: mid, hi: d.hi, rounds: d.rounds + 1 } : { lo: d.lo, hi: mid, rounds: d.rounds + 1 };
}

/** The one step L1 executes itself: does `trace` move from state lo to state lo+1 correctly? */
export const oneStepValid = (trace: string[], lo: number) => stepHash(trace[lo], lo + 1) === trace[lo + 1];

export type OptStatus = 'none' | 'pending' | 'disputed' | 'rejected' | 'defended' | 'finalized';
export interface OptState {
  status: OptStatus;
  /** Is the proposed state root the result of a wrong execution? */
  bad: boolean;
  faultAt: number;
  day: number;
  dispute: Dispute | null;
}
export const optInitial = (): OptState => ({ status: 'none', bad: false, faultAt: 0, day: 0, dispute: null });

export const optPropose = (bad: boolean, faultAt: number): OptState => ({
  status: 'pending',
  bad,
  faultAt: Math.round(clamp(faultAt, 1, TRACE_STEPS)),
  day: 0,
  dispute: null,
});

/** One day passes. An unchallenged root becomes final after the window, right or wrong. */
export function optWait(s: OptState): OptState {
  if (s.status !== 'pending' && s.status !== 'defended') return s;
  const day = Math.min(CHALLENGE_DAYS, s.day + 1);
  return { ...s, day, status: day >= CHALLENGE_DAYS ? 'finalized' : s.status };
}

/**
 * The challenger's move: open a dispute, halve it, and finally have L1 run the
 * single disputed step. Whoever claimed the wrong step loses the bond.
 */
export function optChallenge(s: OptState): OptState {
  if (s.status === 'pending') return { ...s, status: 'disputed', dispute: disputeStart() };
  if (s.status !== 'disputed' || !s.dispute) return s;
  // The proposer's trace, and the trace of whoever is wrong: with an honest proposal that is the challenger.
  const proposer = s.bad ? faultyTrace(s.faultAt) : honestTrace();
  const challenger = s.bad ? honestTrace() : faultyTrace(s.faultAt);
  if (s.dispute.hi - s.dispute.lo > 1) return { ...s, dispute: bisect(proposer, challenger, s.dispute) };
  return { ...s, status: oneStepValid(proposer, s.dispute.lo) ? 'defended' : 'rejected' };
}

/** Bisection rounds needed for a trace of n steps. */
export const bisectionRounds = (steps: number) => Math.ceil(Math.log2(Math.max(1, steps)));

/* ---------- Step 5: zk rollups, validity proofs ---------- */

export type Balances = Record<string, number>;
export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export const ZK_START: Balances = { A: 50, B: 30, C: 20 };
export const ZK_BATCH: Transfer[] = [
  { from: 'A', to: 'B', amount: 10 },
  { from: 'B', to: 'C', amount: 5 },
  { from: 'C', to: 'A', amount: 2 },
  { from: 'A', to: 'C', amount: 7 },
];

/** Runs the batch. Returns null if any transfer is not allowed (unknown account, overspend, bad amount). */
export function execute(start: Balances, txs: Transfer[]): Balances | null {
  const b = { ...start };
  for (const t of txs) {
    if (!(t.from in b) || !(t.to in b) || !Number.isFinite(t.amount) || t.amount <= 0 || b[t.from] < t.amount) return null;
    b[t.from] -= t.amount;
    b[t.to] += t.amount;
  }
  return b;
}

export const stateRoot = (b: Balances) => sha256(Object.keys(b).sort().map((k) => `${k}:${b[k]}`).join(','));
export const dataHash = (txs: Transfer[]) => sha256(txs.map((t) => `${t.from}>${t.to}:${t.amount}`).join(';'));

/** Public inputs of a proof: the statement "running this data on this state gives that state". */
export interface Statement {
  pre: string;
  post: string;
  data: string;
}
const seal = (s: Statement) => sha256(`valid transition|${s.pre}|${s.post}|${s.data}`);

/**
 * Stand-in for the prover. A real prover runs the batch inside a circuit; like
 * it, this one can only produce a proof when the claimed result is the true one.
 */
export function prove(start: Balances, txs: Transfer[], claimedPost: string): string | null {
  const end = execute(start, txs);
  if (!end || stateRoot(end) !== claimedPost) return null;
  return seal({ pre: stateRoot(start), post: claimedPost, data: dataHash(txs) });
}

/** Stand-in for the L1 verifier: constant work, whatever the batch size. */
export const verify = (proof: string | null, s: Statement) => proof !== null && proof === seal(s);

export type Corruption = 'none' | 'root' | 'data';
export interface ZkResult {
  statement: Statement;
  /** Could the prover produce a proof for the claim it wanted to make? */
  proved: boolean;
  accepted: boolean;
  trueRoot: string;
}

/**
 * none: honest batch. root: the operator claims a state root that pays itself.
 * data: the proof is honest, but the transaction data posted to L1 was altered.
 */
export function zkAttempt(c: Corruption): ZkResult {
  const pre = stateRoot(ZK_START);
  const end = execute(ZK_START, ZK_BATCH) ?? ZK_START;
  const trueRoot = stateRoot(end);
  const claimed = c === 'root' ? stateRoot({ ...end, A: end.A + 1000 }) : trueRoot;
  const proof = prove(ZK_START, ZK_BATCH, claimed);
  const posted = c === 'data' ? ZK_BATCH.map((t, i) => (i === 0 ? { ...t, amount: t.amount + 30 } : t)) : ZK_BATCH;
  const statement = { pre, post: claimed, data: dataHash(posted) };
  // Without a proof the operator can only submit something made up.
  return { statement, proved: proof !== null, accepted: verify(proof ?? sha256('forged proof'), statement), trueRoot };
}

/* ---------- Step 7: withdrawing to L1 ---------- */

export const OPT_DELAY_H = CHALLENGE_DAYS * 24;
/** Illustrative time to generate a validity proof and have L1 verify it. */
export const ZK_DELAY_H = 3;
export const MAX_ELAPSED_H = 10 * 24;

export interface Withdrawal {
  optProgress: number;
  zkProgress: number;
  optDone: boolean;
  zkDone: boolean;
  optLeftH: number;
  zkLeftH: number;
}

export function withdrawal(elapsedIn: number): Withdrawal {
  const e = clamp(elapsedIn, 0, MAX_ELAPSED_H);
  return {
    optProgress: Math.min(1, e / OPT_DELAY_H),
    zkProgress: Math.min(1, e / ZK_DELAY_H),
    optDone: e >= OPT_DELAY_H,
    zkDone: e >= ZK_DELAY_H,
    optLeftH: Math.max(0, OPT_DELAY_H - e),
    zkLeftH: Math.max(0, ZK_DELAY_H - e),
  };
}

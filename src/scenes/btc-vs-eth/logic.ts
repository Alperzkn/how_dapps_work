// Pure logic for the Bitcoin vs Ethereum lesson: coin selection, two tiny interpreters,
// both fee markets and both supply schedules. Simplifications are stated where they are made.
import { ripemd160 } from '@noble/hashes/legacy.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { publicKeyOf, signText, verifyText, type Signature } from '../../sim/keys';

const finite = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, finite(v, lo)));

/* ---------- Ledger: UTXOs versus accounts ---------- */

/** Satoshis per bitcoin. All Bitcoin amounts below are whole satoshis. */
export const SAT = 100_000_000;
/** The model charges one flat, easy-to-see fee per transaction: 0.01 BTC. Real fees depend on size and fee rate. */
export const FLAT_FEE = 1_000_000;

export interface Utxo {
  id: string;
  owner: 'alice' | 'bob';
  value: number;
}

export interface PaymentPlan {
  ok: boolean;
  /** Coins that are consumed whole. Empty when the wallet cannot pay. */
  inputs: Utxo[];
  inputTotal: number;
  payment: number;
  /** Returned to the sender as a new coin; 0 means no change output. */
  change: number;
  fee: number;
}

/**
 * Chooses coins oldest first until they cover the payment plus the fee, then works out the
 * outputs: payment, change, and the fee that is simply left over.
 * (Real wallets use smarter selection, such as branch and bound, to avoid change and save fees.)
 */
export function planPayment(wallet: Utxo[], amount: number, fee = FLAT_FEE): PaymentPlan {
  const payment = Math.max(0, Math.round(finite(amount)));
  const cost = Math.max(0, Math.round(finite(fee)));
  const none: PaymentPlan = { ok: false, inputs: [], inputTotal: 0, payment, change: 0, fee: cost };
  if (payment <= 0) return none;
  const inputs: Utxo[] = [];
  let inputTotal = 0;
  for (const coin of wallet) {
    if (inputTotal >= payment + cost) break;
    if (!(coin.value > 0)) continue;
    inputs.push(coin);
    inputTotal += coin.value;
  }
  if (inputTotal < payment + cost) return none;
  return { ok: true, inputs, inputTotal, payment, change: inputTotal - payment - cost, fee: cost };
}

/** Removes the spent coins from the set and adds the new ones. `n` numbers the transaction. */
export function applyPayment(set: Utxo[], plan: PaymentPlan, n: number): Utxo[] {
  if (!plan.ok) return set;
  const spent = new Set(plan.inputs.map((c) => c.id));
  const next = set.filter((c) => !spent.has(c.id));
  next.push({ id: `tx${n}:0`, owner: 'bob', value: plan.payment });
  if (plan.change > 0) next.push({ id: `tx${n}:1`, owner: 'alice', value: plan.change });
  return next;
}

/** Gwei per ether. Ethereum amounts in the ledger model are whole gwei. */
export const GWEI_PER_ETH = 1_000_000_000;
export const TRANSFER_GAS = 21_000;
/** Fee of the model's plain transfer: 21,000 gas at 10 gwei. */
export const TRANSFER_FEE = TRANSFER_GAS * 10;

export interface Accounts {
  alice: number;
  bob: number;
  aliceNonce: number;
}

/** An account transfer: two balances change in place and the sender's nonce goes up by one. */
export function transfer(a: Accounts, amount: number, fee = TRANSFER_FEE): { ok: boolean; next: Accounts } {
  const value = Math.max(0, Math.round(finite(amount)));
  if (value <= 0 || a.alice < value + fee) return { ok: false, next: a };
  return { ok: true, next: { alice: a.alice - value - fee, bob: a.bob + value, aliceNonce: a.aliceNonce + 1 } };
}

/* ---------- Programs: Bitcoin Script ---------- */

export type ScriptItemKind = 'sig' | 'pubKey' | 'hash' | 'true' | 'false';
export interface ScriptItem {
  kind: ScriptItemKind;
  hex: string;
}
export type ScriptOp = '<sig>' | '<pubKey>' | 'OP_DUP' | 'OP_HASH160' | '<pubKeyHash>' | 'OP_EQUALVERIFY' | 'OP_CHECKSIG';
/** scriptSig followed by the P2PKH scriptPubKey. */
export const P2PKH: ScriptOp[] = ['<sig>', '<pubKey>', 'OP_DUP', 'OP_HASH160', '<pubKeyHash>', 'OP_EQUALVERIFY', 'OP_CHECKSIG'];

export interface Spend {
  /** What the signature commits to. Stands in for the transaction's signature hash. */
  message: string;
  signature: Signature;
  pubKey: string;
  /** The hash the coin is locked to. */
  pubKeyHash: string;
}

/** HASH160: RIPEMD-160 of SHA-256, as hex without prefix. */
export function hash160(hex: string): string {
  return bytesToHex(ripemd160(sha256(hexToBytes(hex.startsWith('0x') ? hex.slice(2) : hex))));
}

// Demonstration keys only.
const OWNER_KEY = `0x${'11'.repeat(32)}`;
const OTHER_KEY = `0x${'22'.repeat(32)}`;
const MESSAGE = 'spend coin 7f3a…:0 → Bob 0.6 BTC';

/** A spend of the model coin. With `wrongSignature` the signature comes from a key that does not own it. */
export function makeSpend(wrongSignature = false): Spend {
  const pubKey = publicKeyOf(OWNER_KEY);
  return { message: MESSAGE, signature: signText(MESSAGE, wrongSignature ? OTHER_KEY : OWNER_KEY), pubKey, pubKeyHash: hash160(pubKey) };
}

export interface ScriptState {
  /** Index of the next instruction. */
  pc: number;
  stack: ScriptItem[];
  status: 'running' | 'valid' | 'invalid';
}

export const scriptStart = (): ScriptState => ({ pc: 0, stack: [], status: 'running' });

const sigHex = (s: Signature) => s.r.slice(2) + s.s.slice(2);

/**
 * Executes one instruction of the P2PKH script on the stack. The hashes and the signature check
 * are real (SHA-256, RIPEMD-160, ECDSA over secp256k1). Simplified: the signed message is a short
 * text, not Bitcoin's transaction digest, and values are not DER or script encoded.
 */
export function scriptStep(state: ScriptState, spend: Spend, program: ScriptOp[] = P2PKH): ScriptState {
  if (state.status !== 'running' || state.pc >= program.length) return state;
  const stack = [...state.stack];
  const fail = (): ScriptState => ({ pc: state.pc + 1, stack, status: 'invalid' });
  const op = program[state.pc];
  switch (op) {
    case '<sig>':
      stack.push({ kind: 'sig', hex: sigHex(spend.signature) });
      break;
    case '<pubKey>':
      stack.push({ kind: 'pubKey', hex: spend.pubKey.slice(2) });
      break;
    case '<pubKeyHash>':
      stack.push({ kind: 'hash', hex: spend.pubKeyHash });
      break;
    case 'OP_DUP': {
      const top = stack[stack.length - 1];
      if (!top) return fail();
      stack.push({ ...top });
      break;
    }
    case 'OP_HASH160': {
      const top = stack.pop();
      if (!top) return fail();
      stack.push({ kind: 'hash', hex: hash160(top.hex) });
      break;
    }
    case 'OP_EQUALVERIFY': {
      const a = stack.pop();
      const b = stack.pop();
      if (!a || !b || a.hex !== b.hex) return fail();
      break;
    }
    case 'OP_CHECKSIG': {
      const pubKey = stack.pop();
      const sig = stack.pop();
      if (!pubKey || !sig) return fail();
      const ok = verifyText(spend.message, { r: `0x${sig.hex.slice(0, 64)}`, s: `0x${sig.hex.slice(64, 128)}` }, `0x${pubKey.hex}`);
      stack.push({ kind: ok ? 'true' : 'false', hex: ok ? '01' : '' });
      break;
    }
  }
  const pc = state.pc + 1;
  if (pc < program.length) return { pc, stack, status: 'running' };
  // The spend is valid only if the script ends with a true value on top of the stack.
  return { pc, stack, status: stack[stack.length - 1]?.kind === 'true' ? 'valid' : 'invalid' };
}

export function scriptRun(spend: Spend, program: ScriptOp[] = P2PKH): ScriptState {
  let s = scriptStart();
  for (let i = 0; i <= program.length && s.status === 'running'; i++) s = scriptStep(s, spend, program);
  return s;
}

/* ---------- Programs: a few EVM opcodes ---------- */

export type EvmOp = { op: 'PUSH1'; arg: number } | { op: 'SLOAD' | 'ADD' | 'SSTORE' | 'STOP' };
/** `count = count + n` for storage slot 0, as in `Counter.add(n)`. */
export const counterProgram = (n: number): EvmOp[] => [{ op: 'PUSH1', arg: 0 }, { op: 'SLOAD' }, { op: 'PUSH1', arg: clamp(Math.round(n), 0, 255) }, { op: 'ADD' }, { op: 'PUSH1', arg: 0 }, { op: 'SSTORE' }, { op: 'STOP' }];
export const opName = (o: EvmOp) => (o.op === 'PUSH1' ? `PUSH1 ${o.arg}` : o.op);

export const GAS = {
  /** Paid by every transaction before any code runs. */
  intrinsic: 21_000,
  /** PUSH1 and ADD (the "very low" tier). */
  veryLow: 3,
  /** First access to a storage slot in a transaction (EIP-2929). */
  coldSload: 2_100,
  warmAccess: 100,
  /** SSTORE that changes a slot from one non-zero value to another, slot already warm (5,000 − 2,100). */
  sstoreReset: 2_900,
  /** SSTORE that sets a zero slot to non-zero. */
  sstoreSet: 20_000,
  /** SSTORE fails if no more than this much gas is left (EIP-2200). */
  sstoreSentry: 2_300,
} as const;

const WORD = 1n << 256n;

export interface EvmState {
  pc: number;
  stack: bigint[];
  /** Storage slot 0 now, and its value before the transaction. */
  slot: bigint;
  original: bigint;
  warm: boolean;
  gasLimit: number;
  gasLeft: number;
  /** Gas charged by the latest step (the intrinsic gas right after the start). */
  lastCost: number;
  status: 'running' | 'done' | 'out-of-gas';
}

/** A transaction with `gasLimit` arrives: the intrinsic 21,000 gas is charged before the first opcode. */
export function evmStart(gasLimit: number, slotValue: bigint): EvmState {
  const limit = Math.max(0, Math.floor(finite(gasLimit)));
  const enough = limit >= GAS.intrinsic;
  return { pc: 0, stack: [], slot: slotValue, original: slotValue, warm: false, gasLimit: limit, gasLeft: enough ? limit - GAS.intrinsic : 0, lastCost: enough ? GAS.intrinsic : limit, status: enough ? 'running' : 'out-of-gas' };
}

/**
 * Executes one opcode with its real gas cost (EIP-2929 and EIP-2200 pricing for one clean slot;
 * refunds are left out). Running out of gas undoes the storage change and uses up all the gas.
 */
export function evmStep(s: EvmState, program: EvmOp[]): EvmState {
  if (s.status !== 'running' || s.pc >= program.length) return s;
  const o = program[s.pc];
  const stack = [...s.stack];
  let { slot, warm } = s;
  const outOfGas = (): EvmState => ({ ...s, pc: s.pc + 1, slot: s.original, gasLeft: 0, lastCost: s.gasLeft, status: 'out-of-gas' });
  let cost = 0;
  let done = false;
  switch (o.op) {
    case 'PUSH1':
      cost = GAS.veryLow;
      stack.push(BigInt(o.arg));
      break;
    case 'ADD': {
      cost = GAS.veryLow;
      const a = stack.pop() ?? 0n;
      const b = stack.pop() ?? 0n;
      stack.push((a + b) % WORD);
      break;
    }
    case 'SLOAD':
      stack.pop(); // the key: this model has only slot 0
      cost = warm ? GAS.warmAccess : GAS.coldSload;
      warm = true;
      stack.push(slot);
      break;
    case 'SSTORE': {
      if (s.gasLeft <= GAS.sstoreSentry) return outOfGas();
      stack.pop(); // the key
      const value = stack.pop() ?? 0n;
      if (!warm) cost += GAS.coldSload;
      warm = true;
      if (value === slot || slot !== s.original) cost += GAS.warmAccess;
      else cost += s.original === 0n ? GAS.sstoreSet : GAS.sstoreReset;
      slot = value;
      break;
    }
    case 'STOP':
      done = true;
      break;
  }
  if (cost > s.gasLeft) return outOfGas();
  const pc = s.pc + 1;
  return { ...s, pc, stack, slot, warm, gasLeft: s.gasLeft - cost, lastCost: cost, status: done || pc >= program.length ? 'done' : 'running' };
}

export function evmRun(gasLimit: number, slotValue: bigint, program: EvmOp[]): EvmState {
  let s = evmStart(gasLimit, slotValue);
  for (let i = 0; i <= program.length && s.status === 'running'; i++) s = evmStep(s, program);
  return s;
}

/* ---------- Fees: the Bitcoin mempool ---------- */

export interface MempoolTx {
  id: string;
  /** satoshis per virtual byte */
  feeRate: number;
  vsize: number;
}
export interface RankedTx extends MempoolTx {
  /** Place in the queue, 1 = best fee rate. */
  rank: number;
  included: boolean;
  fee: number;
}

/**
 * Fills the space left in the next block from the top of the mempool by fee rate. Ties go to the
 * transaction that arrived first. Simplified: no ancestor packages, and the model block has room
 * for only a few transactions.
 */
export function fillBlock(mempool: MempoolTx[], capacityVb: number): RankedTx[] {
  const order = mempool.map((t, i) => ({ t, i })).sort((a, b) => finite(b.t.feeRate) - finite(a.t.feeRate) || a.i - b.i);
  let left = Math.max(0, finite(capacityVb));
  const out: RankedTx[] = new Array(mempool.length);
  order.forEach(({ t, i }, k) => {
    const included = t.vsize > 0 && t.vsize <= left;
    if (included) left -= t.vsize;
    out[i] = { ...t, rank: k + 1, included, fee: Math.round(Math.max(0, finite(t.feeRate)) * Math.max(0, t.vsize)) };
  });
  return out;
}

/* ---------- Fees: EIP-1559 ---------- */

export const GWEI = 1_000_000_000n;
export const BASE_FEE_MAX_CHANGE_DENOMINATOR = 8n;

/** The EIP-1559 base fee of the next block, in wei, exactly as the EIP computes it. */
export function nextBaseFee(baseFee: bigint, gasUsed: bigint, gasTarget: bigint): bigint {
  if (gasTarget <= 0n || gasUsed === gasTarget) return baseFee;
  if (gasUsed > gasTarget) {
    const delta = (baseFee * (gasUsed - gasTarget)) / gasTarget / BASE_FEE_MAX_CHANGE_DENOMINATOR;
    return baseFee + (delta > 1n ? delta : 1n);
  }
  return baseFee - (baseFee * (gasTarget - gasUsed)) / gasTarget / BASE_FEE_MAX_CHANGE_DENOMINATOR;
}

export interface FeeSplit {
  /** False when the base fee is above the sender's maxFeePerGas: the transaction has to wait. */
  included: boolean;
  /** Priority fee per gas actually paid, in wei. */
  tipPerGas: bigint;
  burned: bigint;
  tipped: bigint;
}

/** What a transaction pays under EIP-1559: `gasUsed × baseFee` is burned, `gasUsed × tip` goes to the proposer. */
export function feeSplit(gasUsed: bigint, baseFee: bigint, maxFee: bigint, maxPriority: bigint): FeeSplit {
  if (maxFee < baseFee) return { included: false, tipPerGas: 0n, burned: 0n, tipped: 0n };
  const tipPerGas = maxPriority < maxFee - baseFee ? maxPriority : maxFee - baseFee;
  return { included: true, tipPerGas, burned: gasUsed * baseFee, tipped: gasUsed * tipPerGas };
}

/** Gas used by a block that is `percent` of the target full (0 … 200). */
export function gasAtFullness(percent: number, gasTarget: bigint): bigint {
  return (gasTarget * BigInt(Math.round(clamp(percent, 0, 200)))) / 100n;
}

/* ---------- Supply ---------- */

export const HALVING_INTERVAL = 210_000;
export const INITIAL_SUBSIDY = 50 * SAT;
/** After this many halvings the subsidy has been shifted down to zero. */
export const LAST_HALVING = 33;

/** Block subsidy in satoshis after `halvings` halvings: 50 BTC >> halvings. */
export function subsidyAfter(halvings: number): number {
  const h = Math.floor(clamp(halvings, 0, 64));
  return h >= 64 ? 0 : Math.floor(INITIAL_SUBSIDY / 2 ** h);
}

/** Satoshis issued by all blocks before the given halving (exact integer arithmetic). */
export function issuedBefore(halvings: number): number {
  const h = Math.floor(clamp(halvings, 0, 64));
  let total = 0;
  for (let i = 0; i < h; i++) total += HALVING_INTERVAL * subsidyAfter(i);
  return total;
}

/** Everything that will ever be issued: 2,099,999,997,690,000 satoshis. */
export const MAX_SUPPLY = issuedBefore(64);

const SECONDS_PER_YEAR = 31_557_600;
export const SLOTS_PER_YEAR = SECONDS_PER_YEAR / 12;
const EPOCHS_PER_YEAR = SLOTS_PER_YEAR / 32;
const BASE_REWARD_FACTOR = 64;

/**
 * Approximate ether issued per year for a given amount staked: the consensus spec's
 * `base_reward_per_increment = 10^9 × 64 / √(total stake in gwei)` summed over all stake and all
 * epochs, i.e. about 166 × √(ETH staked). This is the ceiling with every validator doing its duties perfectly.
 */
export function annualIssuance(stakedEth: number): number {
  const staked = Math.max(0, finite(stakedEth));
  return (BASE_REWARD_FACTOR * Math.sqrt(staked * 1e9) * EPOCHS_PER_YEAR) / 1e9;
}

/** Approximate ether burned per year if every block uses `gasPerBlock` at an average base fee (in gwei). Blob fees are left out. */
export function annualBurn(avgBaseFeeGwei: number, gasPerBlock: number): number {
  return (Math.max(0, finite(avgBaseFeeGwei)) * Math.max(0, finite(gasPerBlock)) * SLOTS_PER_YEAR) / 1e9;
}

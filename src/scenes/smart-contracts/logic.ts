// Pure logic for the smart-contracts lesson: address derivation, storage slots,
// a small contract the learner can call, a tiny EVM interpreter with real gas
// costs, and a reentrancy simulation. Nothing here touches React.
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { abiWord, encodeCall } from '../../sim/keys';

const strip = (hex: string) => (hex.startsWith('0x') ? hex.slice(2) : hex);

/** Keccak-256 of raw bytes given as hex, returned as 0x-prefixed hex. */
export const keccakHex = (hex: string): string => `0x${bytesToHex(keccak_256(hexToBytes(strip(hex))))}`;

// ---------------------------------------------------------------- RLP and addresses

export type RlpItem = Uint8Array | RlpItem[];

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Big-endian bytes of a non-negative integer with no leading zeros; zero is the empty string. */
export function intBytes(n: bigint): Uint8Array {
  if (n <= 0n) return new Uint8Array(0);
  let hex = n.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  return hexToBytes(hex);
}

function rlpLength(len: number, offset: number): Uint8Array {
  if (len < 56) return Uint8Array.of(offset + len);
  const l = intBytes(BigInt(len));
  return concat([Uint8Array.of(offset + 55 + l.length), l]);
}

/** Recursive Length Prefix encoding, as defined in the Ethereum yellow paper. */
export function rlpEncode(item: RlpItem): Uint8Array {
  if (item instanceof Uint8Array) {
    if (item.length === 1 && item[0] < 0x80) return item;
    return concat([rlpLength(item.length, 0x80), item]);
  }
  const body = concat(item.map(rlpEncode));
  return concat([rlpLength(body.length, 0xc0), body]);
}

const clampNonce = (nonce: number) => (Number.isFinite(nonce) ? Math.max(0, Math.floor(nonce)) : 0);

/** rlp([sender, nonce]) as hex: the bytes that are hashed to get a CREATE address. */
export function createPreimage(sender: string, nonce: number): string {
  return `0x${bytesToHex(rlpEncode([hexToBytes(strip(sender)), intBytes(BigInt(clampNonce(nonce)))]))}`;
}

/** Address of a contract deployed by `sender` with this account nonce: keccak256(rlp([sender, nonce]))[12:]. */
export function createAddress(sender: string, nonce: number): string {
  return `0x${strip(keccakHex(createPreimage(sender, nonce))).slice(24)}`;
}

/** CREATE2 (EIP-1014): keccak256(0xff ++ deployer ++ salt ++ keccak256(initCode))[12:]. */
export function create2Address(deployer: string, salt: string, initCode: string): string {
  const pre = `ff${strip(deployer).toLowerCase()}${strip(salt).padStart(64, '0')}${strip(keccakHex(initCode))}`;
  return `0x${strip(keccakHex(pre)).slice(24)}`;
}

/** Storage slot of `mapping(address => …)` declared at `slot`, for `key`: keccak256(pad32(key) ++ pad32(slot)). */
export function mappingSlot(key: string, slot: bigint): string {
  return keccakHex(abiWord(key) + abiWord(slot));
}

/** 0x1234…abcd */
export function shortHex(hex: string, head = 6, tail = 4): string {
  const h = hex.startsWith('0x') ? hex : `0x${hex}`;
  return h.length <= head + tail + 3 ? h : `${h.slice(0, head)}…${h.slice(-tail)}`;
}

/** Calldata with the zero padding of each argument collapsed: 0x2e1a7d4d 0…de0b6b3a7640000 */
export function shortCalldata(data: string): string {
  const body = strip(data);
  const words: string[] = [];
  for (let i = 8; i < body.length; i += 64) {
    const w = body.slice(i, i + 64).replace(/^0+/, '');
    words.push(w.length === 64 ? w : `0…${w || '0'}`);
  }
  return [`0x${body.slice(0, 8)}`, ...words].join(' ');
}

// ---------------------------------------------------------------- accounts used in the scenes

/** Well-known public test accounts (Hardhat / Anvil #0, #1, #2). Never use them for real funds. */
export const ALICE = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
export const BOB = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
export const CAROL = '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';

export const WEI = 10n ** 18n;

// ---------------------------------------------------------------- the piggy bank contract

/** Storage layout of the example contract: `count` in slot 0, `balances` mapping at slot 1. */
export const COUNT_SLOT = 0n;
export const BALANCES_SLOT = 1n;

export interface Bank {
  /** slot 0 */
  count: bigint;
  /** balances[address] in wei; each lives at mappingSlot(address, 1) */
  balances: Record<string, bigint>;
  /** ETH the contract account itself holds, in wei. */
  eth: bigint;
  /** ETH each caller still has in their own account (fees are left out). */
  wallets: Record<string, bigint>;
}

export const newBank = (): Bank => ({
  count: 0n,
  balances: {},
  eth: 0n,
  wallets: { [ALICE]: 5n * WEI, [BOB]: 5n * WEI, [CAROL]: 5n * WEI },
});

export type BankFn = 'deposit' | 'withdraw' | 'increment';
export type BankError = 'insufficient-balance' | 'insufficient-funds';

export const BANK_SIGNATURES: Record<BankFn, string> = {
  deposit: 'deposit()',
  withdraw: 'withdraw(uint256)',
  increment: 'increment()',
};

export interface BankResult {
  state: Bank;
  ok: boolean;
  error?: BankError;
  fn: BankFn;
  signature: string;
  /** The transaction's data field. */
  calldata: string;
  /** The transaction's value field, in wei. */
  value: bigint;
}

/**
 * Runs one call against the piggy bank. A failed call returns the state it was
 * given, untouched: that is what a revert means.
 */
export function bankCall(state: Bank, fn: BankFn, caller: string, amount: bigint = 0n): BankResult {
  const who = caller.toLowerCase();
  const amt = amount > 0n ? amount : 0n;
  const signature = BANK_SIGNATURES[fn];
  const base = {
    fn,
    signature,
    calldata: encodeCall(signature, fn === 'withdraw' ? [amt] : []),
    value: fn === 'deposit' ? amt : 0n,
  };
  const fail = (error: BankError): BankResult => ({ ...base, state, ok: false, error });
  const balance = state.balances[who] ?? 0n;
  const wallet = state.wallets[who] ?? 0n;

  if (fn === 'increment') return { ...base, ok: true, state: { ...state, count: state.count + 1n } };
  if (fn === 'deposit') {
    // The node rejects a transaction whose sender cannot cover its value.
    if (wallet < amt) return fail('insufficient-funds');
    return {
      ...base,
      ok: true,
      state: {
        ...state,
        eth: state.eth + amt,
        balances: { ...state.balances, [who]: balance + amt },
        wallets: { ...state.wallets, [who]: wallet - amt },
      },
    };
  }
  // withdraw: require(balances[msg.sender] >= amount)
  if (balance < amt) return fail('insufficient-balance');
  return {
    ...base,
    ok: true,
    state: {
      ...state,
      eth: state.eth - amt,
      balances: { ...state.balances, [who]: balance - amt },
      wallets: { ...state.wallets, [who]: wallet + amt },
    },
  };
}

// ---------------------------------------------------------------- a tiny EVM

/** Gas constants. Sources: EIP-2929 (cold/warm), EIP-2200 and EIP-3529 (SSTORE), EIP-3855 (PUSH0). */
export const GAS = {
  /** Intrinsic cost of any transaction. */
  TX: 21_000,
  COLD_SLOAD: 2_100,
  WARM_READ: 100,
  SSTORE_SET: 20_000,
  /** 5000 - COLD_SLOAD_COST */
  SSTORE_RESET: 2_900,
  /** SSTORE fails if no more than this much gas is left (EIP-2200). */
  SSTORE_SENTRY: 2_300,
} as const;

const MOD = 1n << 256n;
const STACK_LIMIT = 1024;

interface OpInfo {
  name: string;
  /** Static gas; SLOAD and SSTORE are priced dynamically. */
  gas: number;
  /** Items taken from the stack. */
  pops: number;
  /** Bytes of immediate data following the opcode. */
  imm: number;
}

export const OPCODES: Record<number, OpInfo> = {
  0x00: { name: 'STOP', gas: 0, pops: 0, imm: 0 },
  0x01: { name: 'ADD', gas: 3, pops: 2, imm: 0 },
  0x02: { name: 'MUL', gas: 5, pops: 2, imm: 0 },
  0x03: { name: 'SUB', gas: 3, pops: 2, imm: 0 },
  0x50: { name: 'POP', gas: 2, pops: 1, imm: 0 },
  0x54: { name: 'SLOAD', gas: 0, pops: 1, imm: 0 },
  0x55: { name: 'SSTORE', gas: 0, pops: 2, imm: 0 },
  0x5f: { name: 'PUSH0', gas: 2, pops: 0, imm: 0 },
  0x60: { name: 'PUSH1', gas: 3, pops: 0, imm: 1 },
  0x80: { name: 'DUP1', gas: 3, pops: 1, imm: 0 },
  0x90: { name: 'SWAP1', gas: 3, pops: 2, imm: 0 },
};

/** `count = count + 1` on slot 0, written directly in bytecode. */
export const INCREMENT_CODE = '0x5f546001015f5500';

export interface Instr {
  pc: number;
  op: number;
  name: string;
  /** Immediate value of a PUSH. */
  arg?: bigint;
}

/** Splits bytecode into instructions. Unknown bytes become INVALID. */
export function disassemble(code: string): Instr[] {
  const bytes = hexToBytes(strip(code));
  const out: Instr[] = [];
  for (let pc = 0; pc < bytes.length; ) {
    const op = bytes[pc];
    const info = OPCODES[op];
    if (!info) {
      out.push({ pc, op, name: 'INVALID' });
      pc += 1;
      continue;
    }
    const instr: Instr = { pc, op, name: info.name };
    if (info.imm) instr.arg = BigInt(`0x${bytesToHex(bytes.slice(pc + 1, pc + 1 + info.imm)).padEnd(info.imm * 2, '0')}`);
    out.push(instr);
    pc += 1 + info.imm;
  }
  return out;
}

export type EvmStatus = 'running' | 'stopped' | 'out-of-gas' | 'invalid';

/** Storage is keyed by the slot number in decimal. */
export type Storage = Record<string, bigint>;

export interface EvmState {
  /** Index into the instruction list (not the byte offset). */
  ip: number;
  /** Top of the stack is the last element. */
  stack: bigint[];
  storage: Storage;
  /** Storage as it was when the transaction started; a failed call goes back to it. */
  original: Storage;
  /** Slots already touched in this transaction (EIP-2929). */
  warm: string[];
  gasLeft: number;
  gasStart: number;
  status: EvmStatus;
  /** Gas charged by the most recent step. */
  lastCost: number;
  /** Name of the most recently executed instruction. */
  lastOp: string;
  steps: number;
}

const clampGas = (g: number) => (Number.isFinite(g) ? Math.max(0, Math.floor(g)) : 0);

export function evmInit(gas: number, storage: Storage = {}): EvmState {
  const g = clampGas(gas);
  return { ip: 0, stack: [], storage: { ...storage }, original: { ...storage }, warm: [], gasLeft: g, gasStart: g, status: 'running', lastCost: 0, lastOp: '', steps: 0 };
}

/** What the next instruction would cost in the current state, or null if it cannot run at all. */
export function nextCost(program: Instr[], s: EvmState): number | null {
  const instr = program[s.ip];
  if (!instr || s.status !== 'running') return null;
  const info = OPCODES[instr.op];
  if (!info || s.stack.length < info.pops) return null;
  const top = s.stack[s.stack.length - 1];
  if (instr.op === 0x54) return s.warm.includes(top.toString()) ? GAS.WARM_READ : GAS.COLD_SLOAD;
  if (instr.op === 0x55) {
    const key = top.toString();
    const value = s.stack[s.stack.length - 2];
    const current = s.storage[key] ?? 0n;
    const original = s.original[key] ?? 0n;
    const cold = s.warm.includes(key) ? 0 : GAS.COLD_SLOAD;
    if (value === current) return GAS.WARM_READ + cold;
    if (original === current) return (original === 0n ? GAS.SSTORE_SET : GAS.SSTORE_RESET) + cold;
    return GAS.WARM_READ + cold;
  }
  return info.gas;
}

/**
 * Executes one instruction and returns the new state. Running out of gas or an
 * invalid instruction consumes all remaining gas and restores the storage.
 * Gas refunds are not modelled (none of the supported programs clear a slot).
 */
export function evmStep(program: Instr[], s: EvmState): EvmState {
  if (s.status !== 'running') return s;
  const instr = program[s.ip];
  // Running off the end of the code is an implicit STOP.
  if (!instr) return { ...s, status: 'stopped', lastCost: 0, lastOp: 'STOP', steps: s.steps + 1 };
  const halt = (status: 'out-of-gas' | 'invalid'): EvmState => ({
    ...s,
    status,
    gasLeft: 0,
    lastCost: s.gasLeft,
    lastOp: instr.name,
    storage: { ...s.original },
    steps: s.steps + 1,
  });
  const cost = nextCost(program, s);
  if (cost === null) return halt('invalid');
  if (cost > s.gasLeft) return halt('out-of-gas');
  if (instr.op === 0x55 && s.gasLeft <= GAS.SSTORE_SENTRY) return halt('out-of-gas');

  const stack = [...s.stack];
  let storage = s.storage;
  let warm = s.warm;
  let status: EvmStatus = 'running';
  const pop = () => stack.pop() as bigint;
  switch (instr.op) {
    case 0x00:
      status = 'stopped';
      break;
    case 0x01:
      stack.push((pop() + pop()) % MOD);
      break;
    case 0x02:
      stack.push((pop() * pop()) % MOD);
      break;
    case 0x03: {
      const a = pop();
      const b = pop();
      stack.push((a - b + MOD) % MOD);
      break;
    }
    case 0x50:
      pop();
      break;
    case 0x54: {
      const key = pop().toString();
      if (!warm.includes(key)) warm = [...warm, key];
      stack.push(storage[key] ?? 0n);
      break;
    }
    case 0x55: {
      const key = pop().toString();
      const value = pop();
      if (!warm.includes(key)) warm = [...warm, key];
      storage = { ...storage, [key]: value };
      break;
    }
    case 0x5f:
      stack.push(0n);
      break;
    case 0x60:
      stack.push(instr.arg ?? 0n);
      break;
    case 0x80: {
      const a = pop();
      stack.push(a, a);
      break;
    }
    case 0x90: {
      const a = pop();
      const b = pop();
      stack.push(a, b);
      break;
    }
  }
  if (stack.length > STACK_LIMIT) return halt('invalid');
  return {
    ...s,
    ip: status === 'running' ? s.ip + 1 : s.ip,
    stack,
    storage,
    warm,
    gasLeft: s.gasLeft - cost,
    status,
    lastCost: cost,
    lastOp: instr.name,
    steps: s.steps + 1,
  };
}

/** Runs until the program halts. `maxSteps` only guards against a programming mistake. */
export function evmRun(program: Instr[], gas: number, storage: Storage = {}, maxSteps = 10_000): EvmState {
  let s = evmInit(gas, storage);
  for (let i = 0; i < maxSteps && s.status === 'running'; i += 1) s = evmStep(program, s);
  return s;
}

export interface TxResult {
  /** False when the gas limit does not even cover the intrinsic 21,000: such a transaction is never included. */
  valid: boolean;
  ok: boolean;
  status: EvmStatus;
  gasLimit: number;
  /** Gas available to the code after the intrinsic cost. */
  execGas: number;
  /** Total gas charged, intrinsic cost included. */
  gasUsed: number;
  /** Gas handed back to the sender. */
  gasUnused: number;
  /** Fee in gwei: gasUsed × gasPrice. */
  feeGwei: number;
  storage: Storage;
  /** Index of the instruction where execution ended. */
  haltedAt: number;
  /** Gas the program needs in order to finish, intrinsic cost included. */
  gasNeeded: number;
}

/** A transaction with empty calldata that runs `program` at the destination, at a fixed gas price. */
export function sendTx(program: Instr[], gasLimit: number, storage: Storage, gasPriceGwei: number): TxResult {
  const limit = clampGas(gasLimit);
  const price = Number.isFinite(gasPriceGwei) ? Math.max(0, gasPriceGwei) : 0;
  const free = evmRun(program, 30_000_000, storage);
  const gasNeeded = GAS.TX + (free.gasStart - free.gasLeft);
  if (limit < GAS.TX) {
    return { valid: false, ok: false, status: 'out-of-gas', gasLimit: limit, execGas: 0, gasUsed: 0, gasUnused: limit, feeGwei: 0, storage: { ...storage }, haltedAt: 0, gasNeeded };
  }
  const execGas = limit - GAS.TX;
  const end = evmRun(program, execGas, storage);
  const ok = end.status === 'stopped';
  const gasUsed = ok ? GAS.TX + (execGas - end.gasLeft) : limit;
  return { valid: true, ok, status: end.status, gasLimit: limit, execGas, gasUsed, gasUnused: limit - gasUsed, feeGwei: gasUsed * price, storage: end.storage, haltedAt: end.ip, gasNeeded };
}

// ---------------------------------------------------------------- reentrancy

export interface AttackConfig {
  /** ETH other users have deposited in the vault. */
  others: number;
  /** ETH the attacker deposits first. */
  deposit: number;
  /** True: the vault zeroes the balance before sending (checks-effects-interactions). */
  effectsFirst: boolean;
}

export type AttackKind = 'start' | 'call' | 'write' | 'send' | 'revert' | 'done';

export interface AttackEvent {
  kind: AttackKind;
  /** Nesting depth of the withdraw() frame the event belongs to; 0 before and after the transaction. */
  depth: number;
  /** State right after the event. */
  vault: number;
  attacker: number;
  /** balances[attacker] as recorded by the vault. */
  recorded: number;
}

export interface AttackResult {
  events: AttackEvent[];
  /** The whole transaction reverted. */
  reverted: boolean;
  vault: number;
  attacker: number;
  recorded: number;
  maxDepth: number;
  /** ETH the attacker ends up with beyond their own deposit. */
  stolen: number;
}

/** The EVM allows at most 1024 nested calls. */
export const CALL_DEPTH_LIMIT = 1024;

class Revert extends Error {}

const whole = (n: number, max: number) => (Number.isFinite(n) ? Math.min(max, Math.max(0, Math.floor(n))) : 0);

/**
 * One attack transaction against a vault whose withdraw() pays out the caller's
 * whole recorded balance. The attacker's receive() calls withdraw() again while
 * the vault still holds at least one more deposit.
 */
export function simulateAttack(config: AttackConfig): AttackResult {
  const others = whole(config.others, 500);
  const deposit = whole(config.deposit, 500);
  const initial = { vault: others + deposit, attacker: 0, recorded: deposit };
  let st = { ...initial };
  const events: AttackEvent[] = [{ kind: 'start', depth: 0, ...st }];
  let maxDepth = 0;
  const log = (kind: AttackKind, depth: number) => events.push({ kind, depth, ...st });

  const withdraw = (depth: number): void => {
    if (depth > CALL_DEPTH_LIMIT) throw new Revert();
    maxDepth = Math.max(maxDepth, depth);
    const entry = { ...st };
    log('call', depth);
    const fail = (): never => {
      // A reverting frame undoes everything it changed.
      st = entry;
      log('revert', depth);
      throw new Revert();
    };
    const amount = st.recorded;
    // require(amount > 0)
    if (amount <= 0) fail();
    if (config.effectsFirst) {
      st = { ...st, recorded: 0 };
      log('write', depth);
    }
    // msg.sender.call{value: amount}(""): a new frame; if it fails, only its own changes are undone.
    const before = { ...st };
    let ok = true;
    try {
      st = { ...st, vault: st.vault - amount, attacker: st.attacker + amount };
      log('send', depth);
      // Attacker.receive()
      if (st.vault >= amount) withdraw(depth + 1);
    } catch (e) {
      if (!(e instanceof Revert)) throw e;
      st = before;
      ok = false;
    }
    // require(ok)
    if (!ok) fail();
    if (!config.effectsFirst) {
      st = { ...st, recorded: 0 };
      log('write', depth);
    }
  };

  let reverted = false;
  try {
    withdraw(1);
  } catch (e) {
    if (!(e instanceof Revert)) throw e;
    reverted = true;
    st = { ...initial };
    log('revert', 0);
  }
  if (!reverted) log('done', 0);
  return { events, reverted, ...st, maxDepth, stolen: Math.max(0, st.attacker - deposit) };
}

// ---------------------------------------------------------------- account fields

/** codeHash of an account with no code: keccak256 of the empty string. */
export const EMPTY_CODE_HASH = keccakHex('0x');
/** storageRoot of an account with no storage: keccak256(rlp("")), the root of an empty trie. */
export const EMPTY_TRIE_ROOT = keccakHex('0x80');

/**
 * storageRoot of an account whose storage holds exactly one non-zero slot.
 * The trie is then a single leaf: rlp([hexPrefix(keccak256(slot)), rlp(value)]).
 */
export function singleSlotStorageRoot(slot: bigint, value: bigint): string {
  if (value <= 0n) return EMPTY_TRIE_ROOT;
  const path = hexToBytes(`20${strip(keccakHex(abiWord(slot)))}`);
  return keccakHex(bytesToHex(rlpEncode([path, rlpEncode(intBytes(value))])));
}

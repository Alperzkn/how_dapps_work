// Pure logic behind the dapp lesson's controls: real calldata, a tiny ERC-20, its logs, and a wallet that signs.
import { abiWord, addressOf, encodeCall, keccakText, publicKeyOf, selector, signText, verifyText } from '../../sim/keys';

/* ---------- People and addresses ---------- */

export type Who = 'ayse' | 'ben' | 'cem';
export const WHO: Who[] = ['ayse', 'ben', 'cem'];

/** A well-known public test key (Hardhat / Anvil account #0). Never use it for real funds. */
export const WALLET_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const WALLET_PUBLIC = publicKeyOf(WALLET_KEY);

/** Ayşe is the wallet's owner, so her address is derived from the key; the others are made up. */
export const PEOPLE: Record<Who, { name: string; address: string }> = {
  ayse: { name: 'Ayşe', address: addressOf(WALLET_PUBLIC) },
  ben: { name: 'Ben', address: `0x${'2'.repeat(40)}` },
  cem: { name: 'Cem', address: `0x${'3'.repeat(40)}` },
};
/** The token contract being called (the first address a fresh Hardhat node deploys to). */
export const TOKEN_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
/** An address the user has never dealt with, for the suspicious request. */
export const UNKNOWN_SPENDER = '0x8f3a1b2c4d5e6f708192a3b4c5d6e7f80912c41d';
export const MAX_UINT256 = 2n ** 256n - 1n;

/** 0x1234…abcd */
export function shortHex(hex: string, head = 6, tail = 4): string {
  return hex.length <= head + tail + 1 ? hex : `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

/* ---------- Calldata ---------- */

export type Fn = 'transfer' | 'approve' | 'balanceOf';
export const FNS: Fn[] = ['transfer', 'approve', 'balanceOf'];
export const SIGNATURES: Record<Fn, string> = {
  transfer: 'transfer(address,uint256)',
  approve: 'approve(address,uint256)',
  balanceOf: 'balanceOf(address)',
};
export const MAX_AMOUNT = 1000;
const DECIMALS = 18n;

/** Whole tokens the amount box accepts: an integer from 0 to MAX_AMOUNT. Junk counts as 0. */
export function cleanAmount(value: number | string): number {
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(Math.floor(n), 0), MAX_AMOUNT);
}

/** Whole tokens to the contract's 18-decimal units. */
export const toUnits = (tokens: number): bigint => BigInt(cleanAmount(tokens)) * 10n ** DECIMALS;

export interface Call {
  fn: Fn;
  signature: string;
  /** 4 bytes, 0x-prefixed. */
  selector: string;
  /** One 64-hex-digit word per argument. */
  words: string[];
  /** selector followed by the words: exactly what goes in the transaction's data field. */
  data: string;
}

/** Calldata for one of the three token functions; `amount` in whole tokens (ignored by balanceOf). */
export function buildCall(fn: Fn, target: string, amount: number | bigint = 0): Call {
  const units = typeof amount === 'bigint' ? amount : toUnits(amount);
  const args: (bigint | string)[] = fn === 'balanceOf' ? [target] : [target, units];
  const signature = SIGNATURES[fn];
  return { fn, signature, selector: selector(signature), words: args.map(abiWord), data: encodeCall(signature, args) };
}

/** A 32-byte word with its leading zeros collapsed: 000…8ac7230489e80000, 000…222222…222222, ffff…ffffffff */
export function shortWord(word: string): string {
  if (!word) return '';
  const significant = word.replace(/^0+/, '');
  if (significant.length === word.length) return `${word.slice(0, 4)}…${word.slice(-8)}`;
  if (significant.length <= 20) return `000…${significant || '0'}`;
  return `000…${significant.slice(0, 6)}…${significant.slice(-6)}`;
}

/* ---------- A tiny ERC-20 and its logs ---------- */

export type EventName = 'Transfer' | 'Approval';
export const TOPIC0: Record<EventName, string> = {
  Transfer: keccakText('Transfer(address,address,uint256)'),
  Approval: keccakText('Approval(address,address,uint256)'),
};

export interface Log {
  id: number;
  event: EventName;
  /** Transfer: from, to. Approval: owner, spender. */
  from: Who;
  to: Who;
  value: number;
  block: number;
}

export interface TokenState {
  balances: Record<Who, number>;
  /** allowance[owner][spender], keyed "owner>spender". */
  allowances: Record<string, number>;
  logs: Log[];
  block: number;
}

const FIRST_BLOCK = 20_000_001;

/** The token after three earlier transfers, so the log already has some history. */
export function initialToken(): TokenState {
  return {
    balances: { ayse: 100, ben: 20, cem: 5 },
    allowances: {},
    logs: [
      { id: 1, event: 'Transfer', from: 'ben', to: 'ayse', value: 40, block: FIRST_BLOCK },
      { id: 2, event: 'Transfer', from: 'ayse', to: 'cem', value: 5, block: FIRST_BLOCK + 3 },
      { id: 3, event: 'Transfer', from: 'cem', to: 'ben', value: 2, block: FIRST_BLOCK + 9 },
    ],
    block: FIRST_BLOCK + 9,
  };
}

export type Outcome = 'transferred' | 'approved' | 'read' | 'insufficient';

export interface Execution {
  state: TokenState;
  ok: boolean;
  outcome: Outcome;
  /** balanceOf: the value returned. */
  returned?: number;
  /** The log emitted, when there is one. */
  log?: Log;
}

/**
 * Run one call from `sender` against the token. A transfer of more than the
 * balance reverts and changes nothing; a read changes nothing and emits no log.
 */
export function execute(state: TokenState, fn: Fn, sender: Who, target: Who, amount: number): Execution {
  const value = cleanAmount(amount);
  if (fn === 'balanceOf') return { state, ok: true, outcome: 'read', returned: state.balances[target] };
  if (fn === 'transfer' && value > state.balances[sender]) return { state, ok: false, outcome: 'insufficient' };
  const block = state.block + 1;
  const id = (state.logs[state.logs.length - 1]?.id ?? 0) + 1;
  if (fn === 'approve') {
    const log: Log = { id, event: 'Approval', from: sender, to: target, value, block };
    return { state: { ...state, allowances: { ...state.allowances, [`${sender}>${target}`]: value }, logs: [...state.logs, log], block }, ok: true, outcome: 'approved', log };
  }
  const balances = { ...state.balances };
  balances[sender] -= value;
  balances[target] += value;
  const log: Log = { id, event: 'Transfer', from: sender, to: target, value, block };
  return { state: { ...state, balances, logs: [...state.logs, log], block }, ok: true, outcome: 'transferred', log };
}

export type FilterKind = 'all' | 'from' | 'to';
export const FILTERS: FilterKind[] = ['all', 'from', 'to'];
export interface Filter {
  kind: FilterKind;
  who: Who;
}

/** topic1/topic2 of an indexed address: the address left-padded to 32 bytes. */
export const addressTopic = (address: string) => `0x${abiWord(address)}`;

/** The `topics` array of the eth_getLogs query: Transfer events, optionally from or to one address. */
export function topicsFor(filter: Filter): (string | null)[] {
  const t = addressTopic(PEOPLE[filter.who].address);
  if (filter.kind === 'from') return [TOPIC0.Transfer, t];
  if (filter.kind === 'to') return [TOPIC0.Transfer, null, t];
  return [TOPIC0.Transfer];
}

/** The topics a log carries. */
export const topicsOf = (log: Log): string[] => [TOPIC0[log.event], addressTopic(PEOPLE[log.from].address), addressTopic(PEOPLE[log.to].address)];

/** True if a node would return this log for these topics: positional match, null is a wildcard. */
export function matches(log: Log, topics: (string | null)[]): boolean {
  const own = topicsOf(log);
  return topics.every((t, i) => t === null || t === own[i]);
}

export const filterLogs = (logs: Log[], filter: Filter): Log[] => {
  const topics = topicsFor(filter);
  return logs.filter((l) => matches(l, topics));
};

/* ---------- The wallet prompt ---------- */

export type RequestKind = 'transfer' | 'unlimited';

export interface WalletRequest {
  kind: RequestKind;
  /** The contract the transaction is sent to. */
  to: string;
  call: Call;
  /** The address inside the calldata: the recipient or the spender. */
  target: string;
  unlimited: boolean;
  /** The exact text the wallet signs. */
  message: string;
}

/** What the site hands the wallet: an ordinary transfer to Ben, or an unlimited approval to a stranger. */
export function walletRequest(kind: RequestKind): WalletRequest {
  const target = kind === 'transfer' ? PEOPLE.ben.address : UNKNOWN_SPENDER;
  const call = kind === 'transfer' ? buildCall('transfer', target, 10) : buildCall('approve', target, MAX_UINT256);
  return { kind, to: TOKEN_ADDRESS, call, target, unlimited: kind === 'unlimited', message: `to:${TOKEN_ADDRESS} value:0 data:${call.data}` };
}

export interface Signed {
  r: string;
  s: string;
  /** Checked against the wallet's public key. */
  valid: boolean;
  signer: string;
}

/** Sign the request with the wallet's key and verify the result, as a node would. */
export function signRequest(request: WalletRequest): Signed {
  const sig = signText(request.message, WALLET_KEY);
  return { ...sig, valid: verifyText(request.message, sig, WALLET_PUBLIC), signer: PEOPLE.ayse.address };
}

/* ---------- Read or write through an RPC node ---------- */

export type RpcMode = 'read' | 'write';

export interface RpcFacts {
  method: string;
  /** Does it cost gas, need a signature, reach every node, wait for a block? */
  gas: boolean;
  signature: boolean;
  gossiped: boolean;
  waitsForBlock: boolean;
}

export const RPC: Record<RpcMode, RpcFacts> = {
  read: { method: 'eth_call', gas: false, signature: false, gossiped: false, waitsForBlock: false },
  write: { method: 'eth_sendRawTransaction', gas: true, signature: true, gossiped: true, waitsForBlock: true },
};

/** Which provider answers: the first one unless it is down and the app has switched. null = nobody. */
export function activeProvider(down: boolean, switched: boolean): 0 | 1 | null {
  if (!down) return switched ? 1 : 0;
  return switched ? 1 : null;
}

/* ---------- Shutting the server down ---------- */

export interface Outage {
  /** The ordinary app needs its company server. */
  normalApp: boolean;
  /** The contract keeps running whatever happens to a website. */
  contract: true;
  /** Can the user still reach the contract through some frontend? */
  dapp: boolean;
}

export function outage(shutDown: boolean, otherFrontend: boolean): Outage {
  return { normalApp: !shutDown, contract: true, dapp: !shutDown || otherFrontend };
}

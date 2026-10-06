// Pure logic for the tokens lesson: exact unit conversion, a small ERC-20 and
// ERC-721 state machine, and WETH-style wrapping. Nothing here touches React.
import { encodeCall } from '../../sim/keys';

/** Well-known public test accounts (Hardhat / Anvil #0 and #1). Never use them for real funds. */
export const ALICE = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
export const BOB = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
/** The exchange contract in the scenes: the second contract account #0 would deploy. */
export const DEX = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512';
export const ZERO = '0x0000000000000000000000000000000000000000';
/** type(uint256).max: what an "unlimited" approval really sets. */
export const MAX_UINT256 = (1n << 256n) - 1n;

// ---------------------------------------------------------------- units

const pow10 = (n: number) => 10n ** BigInt(n);
const clampDecimals = (d: number) => (Number.isFinite(d) ? Math.min(36, Math.max(0, Math.floor(d))) : 0);

/**
 * Turns what a person types ("1.5") into the raw integer a token contract
 * stores. Returns null for anything that is not a plain non-negative decimal
 * or that has more fractional digits than the token supports.
 */
export function parseUnits(text: string, decimals: number): bigint | null {
  const d = clampDecimals(decimals);
  const t = text.trim().replace(',', '.');
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const [int = '', frac = ''] = t.split('.');
  if (frac.length > d && /[1-9]/.test(frac.slice(d))) return null;
  if (int.length > 40) return null;
  return BigInt(int || '0') * pow10(d) + BigInt(frac.slice(0, d).padEnd(d, '0') || '0');
}

/** The raw integer as people read it: exact, no rounding, trailing zeros removed. */
export function formatUnits(raw: bigint, decimals: number): string {
  const d = clampDecimals(decimals);
  const neg = raw < 0n;
  const digits = (neg ? -raw : raw).toString().padStart(d + 1, '0');
  const int = digits.slice(0, digits.length - d);
  const frac = digits.slice(digits.length - d).replace(/0+$/, '');
  return `${neg ? '-' : ''}${int}${frac ? `.${frac}` : ''}`;
}

/** Adds thousands separators to the integer part of a decimal string. */
export function groupDigits(value: string, lang: 'en' | 'tr' = 'en'): string {
  const [int, frac] = value.split('.');
  const sep = lang === 'tr' ? '.' : ',';
  const point = lang === 'tr' ? ',' : '.';
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return frac ? `${grouped}${point}${frac}` : grouped;
}

/** Digits of only the leading characters of an input, for a text field that must hold an integer. */
export function parseRaw(text: string, maxDigits = 30): bigint {
  const digits = text.replace(/\D/g, '').slice(0, maxDigits);
  return digits ? BigInt(digits) : 0n;
}

// ---------------------------------------------------------------- ERC-20

export interface Erc20 {
  decimals: number;
  totalSupply: bigint;
  balances: Record<string, bigint>;
  /** allowances[owner][spender] */
  allowances: Record<string, Record<string, bigint>>;
}

export interface TokenEvent {
  name: 'Transfer' | 'Approval';
  from: string;
  to: string;
  value: bigint;
}

export type Erc20Error = 'insufficient-balance' | 'insufficient-allowance' | 'zero-address';

export interface Erc20Result {
  state: Erc20;
  ok: boolean;
  error?: Erc20Error;
  events: TokenEvent[];
  signature: string;
  calldata: string;
}

export const ERC20_SIGNATURES = {
  transfer: 'transfer(address,uint256)',
  approve: 'approve(address,uint256)',
  transferFrom: 'transferFrom(address,address,uint256)',
  balanceOf: 'balanceOf(address)',
  allowance: 'allowance(address,address)',
  totalSupply: 'totalSupply()',
  decimals: 'decimals()',
  mint: 'mint(address,uint256)',
  burn: 'burn(uint256)',
} as const;

const lc = (a: string) => a.toLowerCase();
const nonNeg = (v: bigint) => (v > 0n ? v : 0n);

export function newErc20(decimals: number, initial: Record<string, bigint>): Erc20 {
  const balances: Record<string, bigint> = {};
  let totalSupply = 0n;
  for (const [who, amount] of Object.entries(initial)) {
    balances[lc(who)] = nonNeg(amount);
    totalSupply += nonNeg(amount);
  }
  return { decimals: clampDecimals(decimals), totalSupply, balances, allowances: {} };
}

export const balanceOf = (s: Erc20, who: string): bigint => s.balances[lc(who)] ?? 0n;
export const allowanceOf = (s: Erc20, owner: string, spender: string): bigint => s.allowances[lc(owner)]?.[lc(spender)] ?? 0n;

const result = (state: Erc20, signature: string, args: (bigint | string)[], events: TokenEvent[] = [], error?: Erc20Error): Erc20Result => ({
  state,
  ok: !error,
  error,
  events: error ? [] : events,
  signature,
  calldata: encodeCall(signature, args),
});

/** Moves balance; shared by transfer and transferFrom. Null when the sender does not have enough. */
function move(s: Erc20, from: string, to: string, value: bigint): Erc20 | null {
  const bal = balanceOf(s, from);
  if (bal < value) return null;
  const balances = { ...s.balances, [lc(from)]: bal - value };
  balances[lc(to)] = (balances[lc(to)] ?? 0n) + value;
  return { ...s, balances };
}

/** transfer(to, value), sent by `caller`. A failed call returns the state unchanged. */
export function transfer(s: Erc20, caller: string, to: string, value: bigint): Erc20Result {
  const v = nonNeg(value);
  const args = [to, v];
  if (lc(to) === ZERO) return result(s, ERC20_SIGNATURES.transfer, args, [], 'zero-address');
  const next = move(s, caller, to, v);
  if (!next) return result(s, ERC20_SIGNATURES.transfer, args, [], 'insufficient-balance');
  return result(next, ERC20_SIGNATURES.transfer, args, [{ name: 'Transfer', from: lc(caller), to: lc(to), value: v }]);
}

/** approve(spender, value): overwrites the allowance, it does not add to it. */
export function approve(s: Erc20, caller: string, spender: string, value: bigint): Erc20Result {
  const v = value > MAX_UINT256 ? MAX_UINT256 : nonNeg(value);
  const args = [spender, v];
  if (lc(spender) === ZERO) return result(s, ERC20_SIGNATURES.approve, args, [], 'zero-address');
  const owner = lc(caller);
  const state = { ...s, allowances: { ...s.allowances, [owner]: { ...s.allowances[owner], [lc(spender)]: v } } };
  return result(state, ERC20_SIGNATURES.approve, args, [{ name: 'Approval', from: owner, to: lc(spender), value: v }]);
}

/**
 * transferFrom(from, to, value), sent by `caller` (the spender). The allowance
 * is checked before the balance and is reduced by `value`, except when it is
 * type(uint256).max, which OpenZeppelin's ERC20 treats as infinite.
 */
export function transferFrom(s: Erc20, caller: string, from: string, to: string, value: bigint): Erc20Result {
  const v = nonNeg(value);
  const args = [from, to, v];
  const sig = ERC20_SIGNATURES.transferFrom;
  const allowed = allowanceOf(s, from, caller);
  if (allowed < v) return result(s, sig, args, [], 'insufficient-allowance');
  if (lc(to) === ZERO) return result(s, sig, args, [], 'zero-address');
  const moved = move(s, from, to, v);
  if (!moved) return result(s, sig, args, [], 'insufficient-balance');
  const owner = lc(from);
  const state = allowed === MAX_UINT256 ? moved : { ...moved, allowances: { ...moved.allowances, [owner]: { ...moved.allowances[owner], [lc(caller)]: allowed - v } } };
  return result(state, sig, args, [{ name: 'Transfer', from: owner, to: lc(to), value: v }]);
}

/** Creates new tokens: total supply and one balance grow together. Emits Transfer from the zero address. */
export function mint(s: Erc20, to: string, value: bigint): Erc20Result {
  const v = nonNeg(value);
  const args = [to, v];
  if (lc(to) === ZERO) return result(s, ERC20_SIGNATURES.mint, args, [], 'zero-address');
  const state = { ...s, totalSupply: s.totalSupply + v, balances: { ...s.balances, [lc(to)]: balanceOf(s, to) + v } };
  return result(state, ERC20_SIGNATURES.mint, args, [{ name: 'Transfer', from: ZERO, to: lc(to), value: v }]);
}

/** Destroys the caller's own tokens: total supply and the balance shrink together. Emits Transfer to the zero address. */
export function burn(s: Erc20, caller: string, value: bigint): Erc20Result {
  const v = nonNeg(value);
  const bal = balanceOf(s, caller);
  if (bal < v) return result(s, ERC20_SIGNATURES.burn, [v], [], 'insufficient-balance');
  const state = { ...s, totalSupply: s.totalSupply - v, balances: { ...s.balances, [lc(caller)]: bal - v } };
  return result(state, ERC20_SIGNATURES.burn, [v], [{ name: 'Transfer', from: lc(caller), to: ZERO, value: v }]);
}

/** Sum of every balance; always equals totalSupply. */
export const sumOfBalances = (s: Erc20): bigint => Object.values(s.balances).reduce((a, b) => a + b, 0n);

// ---------------------------------------------------------------- WETH

export interface Weth {
  /** ETH in the holder's own account, in wei. */
  walletEth: bigint;
  /** WETH the holder owns: balanceOf[holder]. */
  walletWeth: bigint;
  /** WETH owned by everybody else. */
  othersWeth: bigint;
  /** ETH held by the WETH contract account. */
  contractEth: bigint;
}

export const newWeth = (walletEth: bigint, othersWeth: bigint): Weth => ({ walletEth: nonNeg(walletEth), walletWeth: 0n, othersWeth: nonNeg(othersWeth), contractEth: nonNeg(othersWeth) });

export const wethSupply = (w: Weth): bigint => w.walletWeth + w.othersWeth;

export interface WethResult {
  state: Weth;
  ok: boolean;
  signature: string;
  calldata: string;
  /** msg.value of the call, in wei. */
  value: bigint;
}

/** deposit() payable: ETH goes in, the same amount of WETH is credited. */
export function wethDeposit(w: Weth, amount: bigint): WethResult {
  const v = nonNeg(amount);
  const base = { signature: 'deposit()', calldata: encodeCall('deposit()', []), value: v };
  if (w.walletEth < v) return { ...base, state: w, ok: false };
  return { ...base, ok: true, state: { ...w, walletEth: w.walletEth - v, walletWeth: w.walletWeth + v, contractEth: w.contractEth + v } };
}

/** withdraw(wad): WETH is destroyed, the same amount of ETH is sent back. */
export function wethWithdraw(w: Weth, amount: bigint): WethResult {
  const v = nonNeg(amount);
  const base = { signature: 'withdraw(uint256)', calldata: encodeCall('withdraw(uint256)', [v]), value: 0n };
  if (w.walletWeth < v) return { ...base, state: w, ok: false };
  return { ...base, ok: true, state: { ...w, walletEth: w.walletEth + v, walletWeth: w.walletWeth - v, contractEth: w.contractEth - v } };
}

/** Moves the holder's WETH balance to `target` by wrapping or unwrapping the difference. */
export function wethSetWrapped(w: Weth, target: bigint): WethResult {
  const total = w.walletEth + w.walletWeth;
  const t = target < 0n ? 0n : target > total ? total : target;
  return t >= w.walletWeth ? wethDeposit(w, t - w.walletWeth) : wethWithdraw(w, w.walletWeth - t);
}

// ---------------------------------------------------------------- ERC-721

export interface Erc721 {
  /** owners[tokenId] */
  owners: Record<string, string>;
  /** Single-token approvals: approved[tokenId] */
  approved: Record<string, string>;
}

export type Erc721Error = 'nonexistent-token' | 'incorrect-owner' | 'not-authorized' | 'zero-address';

export interface Erc721Result {
  state: Erc721;
  ok: boolean;
  error?: Erc721Error;
  signature: string;
  calldata: string;
  /** Transfer(from, to, tokenId) on success. */
  event?: { from: string; to: string; tokenId: bigint };
}

export const ERC721_SIGNATURES = {
  transferFrom: 'transferFrom(address,address,uint256)',
  safeTransferFrom: 'safeTransferFrom(address,address,uint256)',
  ownerOf: 'ownerOf(uint256)',
  approve: 'approve(address,uint256)',
} as const;

export function newErc721(owners: Record<string, string>): Erc721 {
  return { owners: Object.fromEntries(Object.entries(owners).map(([id, o]) => [id, lc(o)])), approved: {} };
}

/** The owner of a token id, or null if it was never minted. */
export const ownerOf = (s: Erc721, tokenId: bigint): string | null => s.owners[tokenId.toString()] ?? null;

/** How many token ids an address owns. The count says nothing about which ones. */
export const nftBalanceOf = (s: Erc721, who: string): number => Object.values(s.owners).filter((o) => o === lc(who)).length;

/** approve(to, tokenId): the owner lets one other address move one token. */
export function nftApprove(s: Erc721, caller: string, to: string, tokenId: bigint): Erc721Result {
  const sig = ERC721_SIGNATURES.approve;
  const base = { signature: sig, calldata: encodeCall(sig, [to, tokenId]) };
  const owner = ownerOf(s, tokenId);
  if (!owner) return { ...base, state: s, ok: false, error: 'nonexistent-token' };
  if (owner !== lc(caller)) return { ...base, state: s, ok: false, error: 'not-authorized' };
  return { ...base, ok: true, state: { ...s, approved: { ...s.approved, [tokenId.toString()]: lc(to) } } };
}

/** transferFrom(from, to, tokenId), sent by `caller`: the owner or the address approved for that token. */
export function nftTransferFrom(s: Erc721, caller: string, from: string, to: string, tokenId: bigint): Erc721Result {
  const sig = ERC721_SIGNATURES.transferFrom;
  const base = { signature: sig, calldata: encodeCall(sig, [from, to, tokenId]) };
  const fail = (error: Erc721Error): Erc721Result => ({ ...base, state: s, ok: false, error });
  const id = tokenId.toString();
  const owner = ownerOf(s, tokenId);
  if (lc(to) === ZERO) return fail('zero-address');
  if (!owner) return fail('nonexistent-token');
  if (owner !== lc(caller) && s.approved[id] !== lc(caller)) return fail('not-authorized');
  if (owner !== lc(from)) return fail('incorrect-owner');
  const approved = { ...s.approved };
  delete approved[id];
  return { ...base, ok: true, state: { owners: { ...s.owners, [id]: lc(to) }, approved }, event: { from: owner, to: lc(to), tokenId } };
}

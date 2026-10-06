// Pure logic behind the Uniswap v4 lesson's controls. No React, no three.js.
import { getAmountOut } from '../../sim/ammV2';
import { dynamicFeeBps, netDeltas } from '../../sim/v4Hook';

const int = (n: number, lo: number, hi: number) => Math.min(Math.max(Number.isFinite(n) ? Math.round(n) : lo, lo), hi);
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/* ---------- Step "singleton": what creating a pool costs ---------- */

export const START_POOLS = 3;
export const MAX_EXTRA_POOLS = 3;
/** Illustrative: deploying a v3 pool contract costs a few million gas. */
export const OLD_POOL_GAS = 4_500_000;
/** Uniswap's v4 announcement puts pool creation at 99% less gas; applied to the figure above. */
export const V4_POOL_GAS = OLD_POOL_GAS / 100;

export interface DeployTotals {
  oldContracts: number;
  oldGas: number;
  v4Contracts: number;
  v4Pools: number;
  v4Gas: number;
}

/** Totals after the learner has opened `oldExtra` pools the v2 / v3 way and `v4Extra` pools the v4 way. */
export function deployTotals(oldExtra: number, v4Extra: number): DeployTotals {
  const o = int(oldExtra, 0, MAX_EXTRA_POOLS);
  const v = int(v4Extra, 0, MAX_EXTRA_POOLS);
  return { oldContracts: START_POOLS + o, oldGas: o * OLD_POOL_GAS, v4Contracts: 1, v4Pools: START_POOLS + v, v4Gas: v * V4_POOL_GAS };
}

/* ---------- Step "flash": a route through one to three pools ---------- */

export const ROUTE_TOKENS = ['ETH', 'USDC', 'DAI', 'WBTC'] as const;
export type RouteToken = (typeof ROUTE_TOKENS)[number];
export const MAX_HOPS = 3;
/** Illustrative exchange rates of the three pools on the route (output per unit of input, after the fee). */
const HOP_RATE = [2000, 0.9995, 1 / 60000];
const AMOUNT_IN = 1;

export const clampHops = (hops: number) => int(hops, 1, MAX_HOPS);

/** Amount of each token along the route: [ETH in, after hop 1, after hop 2, ...]. */
export function routeAmounts(hops: number): number[] {
  const out = [AMOUNT_IN];
  for (let i = 0; i < clampHops(hops); i++) out.push(round6(out[i] * HOP_RATE[i]));
  return out;
}

export type FlashCallKind = 'idle' | 'unlock' | 'swap' | 'settle' | 'take' | 'end';

export interface FlashCall {
  kind: FlashCallKind;
  /** Zero-based hop, for swaps. */
  hop?: number;
  from?: RouteToken;
  to?: RouteToken;
  /** Token and amount paid in (settle) or taken out (take). */
  token?: RouteToken;
  amount?: number;
}

/** The calls of one transaction, in order. Index 0 is "nothing called yet"; the last is the check when unlock returns. */
export function flashCalls(hops: number, skipSettle: boolean): FlashCall[] {
  const n = clampHops(hops);
  const amounts = routeAmounts(n);
  const calls: FlashCall[] = [{ kind: 'idle' }, { kind: 'unlock' }];
  for (let i = 0; i < n; i++) calls.push({ kind: 'swap', hop: i, from: ROUTE_TOKENS[i], to: ROUTE_TOKENS[i + 1] });
  if (!skipSettle) calls.push({ kind: 'settle', token: ROUTE_TOKENS[0], amount: amounts[0] });
  calls.push({ kind: 'take', token: ROUTE_TOKENS[n], amount: amounts[n] });
  calls.push({ kind: 'end' });
  return calls;
}

export type FlashStatus = 'idle' | 'open' | 'settled' | 'reverted';

export interface FlashState {
  calls: FlashCall[];
  /** Clamped index of the last call made. */
  index: number;
  call: FlashCall;
  /** Net delta per token as the caller sees it: negative = owes the manager, positive = is owed. */
  deltas: Record<RouteToken, number>;
  /** How many currencies still have a non-zero delta. */
  nonZero: number;
  status: FlashStatus;
  swapsDone: number;
  /** Token transfers so far: v3 moves tokens in and out of every pool, v4 only the net amounts. */
  transfersV3: number;
  transfersV4: number;
  /** Transfers for the whole route. */
  totalV3: number;
  totalV4: number;
}

export function flashState(hops: number, skipSettle: boolean, index: number): FlashState {
  const n = clampHops(hops);
  const calls = flashCalls(n, skipSettle);
  const at = int(index, 0, calls.length - 1);
  const amounts = routeAmounts(n);
  const entries: { token: string; amount: number }[] = [];
  let swapsDone = 0;
  let moved = 0;
  for (const c of calls.slice(0, at + 1)) {
    if (c.kind === 'swap' && c.hop !== undefined) {
      entries.push({ token: ROUTE_TOKENS[c.hop], amount: -amounts[c.hop] }, { token: ROUTE_TOKENS[c.hop + 1], amount: amounts[c.hop + 1] });
      swapsDone++;
    } else if (c.kind === 'settle' && c.token) {
      entries.push({ token: c.token, amount: c.amount ?? 0 });
      moved++;
    } else if (c.kind === 'take' && c.token) {
      entries.push({ token: c.token, amount: -(c.amount ?? 0) });
      moved++;
    }
  }
  const net = netDeltas(entries);
  const deltas = { ETH: 0, USDC: 0, DAI: 0, WBTC: 0 } as Record<RouteToken, number>;
  for (const t of ROUTE_TOKENS) deltas[t] = net[t] ?? 0;
  const nonZero = Object.keys(net).length;
  const ended = calls[at].kind === 'end';
  const status: FlashStatus = at === 0 ? 'idle' : !ended ? 'open' : nonZero === 0 ? 'settled' : 'reverted';
  return {
    calls,
    index: at,
    call: calls[at],
    deltas,
    nonZero,
    status,
    swapsDone,
    transfersV3: swapsDone * 2,
    // A revert undoes every transfer made inside the transaction.
    transfersV4: status === 'reverted' ? 0 : moved,
    totalV3: n * 2,
    totalV4: 2,
  };
}

/* ---------- Step "hooks": what a pool's hook does to a swap ---------- */

export const HOOK_FEATURES = ['dynamic', 'limit', 'twamm', 'malicious'] as const;
export type HookFeature = (typeof HOOK_FEATURES)[number];
export type HookSet = Record<HookFeature, boolean>;

/** Bit positions from v4-core Hooks.sol. */
export const BEFORE_SWAP_BIT = 7;
export const AFTER_SWAP_BIT = 6;
export const AFTER_SWAP_RETURNS_DELTA_BIT = 2;

/** Swap-related permission flags the chosen behaviours need. */
export function hookFlags(on: Partial<HookSet>): number {
  let f = 0;
  if (on.dynamic || on.twamm) f |= 1 << BEFORE_SWAP_BIT;
  if (on.limit || on.malicious) f |= 1 << AFTER_SWAP_BIT;
  if (on.malicious) f |= 1 << AFTER_SWAP_RETURNS_DELTA_BIT;
  return f;
}

/** The set bits, highest first. */
export function flagBits(flags: number): number[] {
  const f = int(flags, 0, 0x3fff);
  const bits: number[] = [];
  for (let b = 13; b >= 0; b--) if (f & (1 << b)) bits.push(b);
  return bits;
}

/** Last four hex digits of a hook address carrying these flags. */
export const hookAddressSuffix = (flags: number) => int(flags, 0, 0xffff).toString(16).toUpperCase().padStart(4, '0');

export const HOOK_POOL = { eth: 1000, usdc: 2_000_000 };
export const HOOK_SWAP_IN = 10;
export const STATIC_FEE_BPS = 30;
/** The toy dynamic-fee hook sees 6% recent volatility. */
export const HOOK_VOLATILITY = 0.06;
/** ETH the TWAMM hook still has to sell for its long-term order when the swap arrives. */
export const TWAMM_PENDING = 5;
/** A resting order that buys ETH once the price falls to this many USDC. */
export const LIMIT_PRICE = 1980;
/** Share of the output the malicious hook keeps for itself. */
export const SKIM = 0.1;

export interface HookSwap {
  flags: number;
  /** Whether the manager calls the hook at each point. */
  before: boolean;
  after: boolean;
  /** What happens at each point, in order. */
  beforeActs: HookFeature[];
  afterActs: HookFeature[];
  feeBps: number;
  /** ETH the hook sold ahead of the swap. */
  twammSold: number;
  /** USDC the pool pays out for the swap. */
  poolOut: number;
  /** USDC the hook keeps. */
  hookTake: number;
  /** USDC that reaches the swapper. */
  received: number;
  /** USDC per ETH after the swap. */
  priceAfter: number;
  ordersFilled: number;
}

/** Sell `HOOK_SWAP_IN` ETH into the pool with the chosen hook behaviours attached. */
export function hookSwap(on: Partial<HookSet>): HookSwap {
  const flags = hookFlags(on);
  const before = (flags & (1 << BEFORE_SWAP_BIT)) !== 0;
  const after = (flags & (1 << AFTER_SWAP_BIT)) !== 0;
  let { eth, usdc } = HOOK_POOL;
  const feeBps = on.dynamic ? dynamicFeeBps(HOOK_VOLATILITY) : STATIC_FEE_BPS;
  let twammSold = 0;
  if (on.twamm) {
    // The overdue part of the long-term order trades first and moves the price.
    twammSold = TWAMM_PENDING;
    usdc -= getAmountOut(twammSold, eth, usdc, feeBps);
    eth += twammSold;
  }
  const poolOut = getAmountOut(HOOK_SWAP_IN, eth, usdc, feeBps);
  eth += HOOK_SWAP_IN;
  usdc -= poolOut;
  const priceAfter = eth > 0 ? usdc / eth : 0;
  const hookTake = on.malicious ? poolOut * SKIM : 0;
  return {
    flags,
    before,
    after,
    beforeActs: HOOK_FEATURES.filter((f) => on[f] && (f === 'twamm' || f === 'dynamic')),
    afterActs: HOOK_FEATURES.filter((f) => on[f] && (f === 'limit' || f === 'malicious')),
    feeBps,
    twammSold,
    poolOut,
    hookTake,
    received: poolOut - hookTake,
    priceAfter,
    ordersFilled: on.limit && priceAfter <= LIMIT_PRICE ? 1 : 0,
  };
}

/* ---------- Step "choose": which version fits ---------- */

export interface Needs {
  lp: 'passive' | 'active';
  custom: boolean;
  pair: 'volatile' | 'stable';
}

export type FitReason = 'custom' | 'passiveVolatile' | 'passiveStable' | 'activeVolatile' | 'activeStable';

export function suggestVersion(needs: Needs): { version: 2 | 3 | 4; reason: FitReason } {
  if (needs.custom) return { version: 4, reason: 'custom' };
  if (needs.lp === 'active') return { version: 3, reason: needs.pair === 'stable' ? 'activeStable' : 'activeVolatile' };
  return needs.pair === 'stable' ? { version: 3, reason: 'passiveStable' } : { version: 2, reason: 'passiveVolatile' };
}

// Pure MEV math on a v2-style constant-product pool. Plain numbers, for illustration.
import { getAmountOut, swapV2 } from '../../sim/ammV2';

export const FEE_BPS = 30;
const GAMMA = 1 - FEE_BPS / 10_000;

const nn = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/** Reserves as seen by one swap direction: `rIn` is the token being sold into the pool. */
export interface Reserves {
  rIn: number;
  rOut: number;
}

export interface SandwichInput extends Reserves {
  /** What the victim sells (same token as rIn). */
  victimIn: number;
  /** Slippage tolerance as a fraction: 0.01 = 1%. */
  tolerance: number;
  /** Attacker's total gas cost for both transactions, in the rIn token. */
  gas: number;
}

export interface SandwichResult {
  /** Victim's output with nobody in front. */
  cleanOut: number;
  /** amountOutMin: the victim's transaction reverts below this. */
  minOut: number;
  /** Largest front-run that still lets the victim's swap succeed. */
  maxFront: number;
  /** The attacker's most profitable front-run, at most maxFront. */
  frontIn: number;
  /** Tokens the attacker buys in the front-run and sells in the back-run. */
  frontOut: number;
  /** What the back-run returns, in the rIn token. */
  backOut: number;
  /** Victim's output if that sandwich is carried out. */
  attackedOut: number;
  /** backOut - frontIn, before gas. */
  gross: number;
  /** gross - gas. */
  net: number;
  /** There is room in front of the victim at all. */
  possible: boolean;
  /** A rational attacker goes ahead: possible and net > 0. */
  attacked: boolean;
  /** What the victim actually receives: attackedOut when attacked, otherwise cleanOut. */
  victimOut: number;
  /** cleanOut - victimOut. */
  victimLoss: number;
  /** Reserves at the start and after each transaction that really happens (front-run, victim, back-run). */
  stages: [Reserves, Reserves, Reserves, Reserves];
}

interface Trial {
  frontOut: number;
  victimOut: number;
  backOut: number;
  gross: number;
  stages: [Reserves, Reserves, Reserves, Reserves];
}

/** Runs front-run of size `a`, then the victim, then the back-run of everything the attacker bought. */
function trySandwich(rIn: number, rOut: number, victimIn: number, a: number): Trial {
  const s1 = swapV2(rIn, rOut, a, FEE_BPS);
  const s2 = swapV2(s1.x, s1.y, victimIn, FEE_BPS);
  // The back-run sells the other token, so the reserves swap roles.
  const s3 = swapV2(s2.y, s2.x, s1.out, FEE_BPS);
  return {
    frontOut: s1.out,
    victimOut: s2.out,
    backOut: s3.out,
    gross: s3.out - a,
    stages: [
      { rIn, rOut },
      { rIn: s1.x, rOut: s1.y },
      { rIn: s2.x, rOut: s2.y },
      { rIn: s3.y, rOut: s3.x },
    ],
  };
}

/**
 * The best sandwich against one exact-input swap: maximise the attacker's profit
 * subject to the victim still receiving at least amountOutMin.
 */
export function sandwich(input: SandwichInput): SandwichResult {
  const rIn = nn(input.rIn);
  const rOut = nn(input.rOut);
  const victimIn = nn(input.victimIn);
  const tolerance = Math.min(nn(input.tolerance), 0.5);
  const gas = nn(input.gas);

  const cleanOut = getAmountOut(victimIn, rIn, rOut, FEE_BPS);
  const minOut = cleanOut * (1 - tolerance);
  const none = trySandwich(rIn, rOut, victimIn, 0);
  const idle: SandwichResult = {
    cleanOut,
    minOut,
    maxFront: 0,
    frontIn: 0,
    frontOut: 0,
    backOut: 0,
    attackedOut: cleanOut,
    gross: 0,
    net: -gas,
    possible: false,
    attacked: false,
    victimOut: cleanOut,
    victimLoss: 0,
    stages: [none.stages[0], none.stages[0], none.stages[2], none.stages[2]],
  };
  if (cleanOut <= 0 || tolerance <= 0) return idle;

  // 1. The constraint: the victim's output falls as the front-run grows, so bisect for the limit.
  const victimOutAt = (a: number) => trySandwich(rIn, rOut, victimIn, a).victimOut;
  let lo = 0;
  let hi = rIn;
  for (let i = 0; i < 40 && victimOutAt(hi) >= minOut; i++) hi *= 2;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (victimOutAt(mid) >= minOut) lo = mid;
    else hi = mid;
  }
  const maxFront = lo;
  if (maxFront <= rIn * 1e-9) return idle;

  // 2. The objective: scan, then refine around the best point (the profit has a single peak).
  const grossAt = (a: number) => trySandwich(rIn, rOut, victimIn, a).gross;
  const N = 48;
  let best = maxFront;
  let bestGross = grossAt(maxFront);
  for (let i = 1; i < N; i++) {
    const a = (maxFront * i) / N;
    const g = grossAt(a);
    if (g > bestGross) {
      best = a;
      bestGross = g;
    }
  }
  let a0 = Math.max(0, best - maxFront / N);
  let a1 = Math.min(maxFront, best + maxFront / N);
  for (let i = 0; i < 50; i++) {
    const m1 = a0 + (a1 - a0) / 3;
    const m2 = a1 - (a1 - a0) / 3;
    if (grossAt(m1) < grossAt(m2)) a0 = m1;
    else a1 = m2;
  }
  const refined = (a0 + a1) / 2;
  const frontIn = grossAt(refined) >= bestGross ? refined : best;

  const t = trySandwich(rIn, rOut, victimIn, frontIn);
  const net = t.gross - gas;
  const attacked = net > 0;
  return {
    cleanOut,
    minOut,
    maxFront,
    frontIn,
    frontOut: t.frontOut,
    backOut: t.backOut,
    attackedOut: t.victimOut,
    gross: t.gross,
    net,
    possible: true,
    attacked,
    victimOut: attacked ? t.victimOut : cleanOut,
    victimLoss: attacked ? cleanOut - t.victimOut : 0,
    stages: attacked ? t.stages : idle.stages,
  };
}

export interface SplitResult {
  /** Total the victim receives over all parts. */
  victimOut: number;
  /** The same trade in one piece with nobody in front. */
  singleCleanOut: number;
  /** Attacker's total net profit. */
  attackerNet: number;
  /** How many of the parts get sandwiched. */
  attacks: number;
  /** Victim's loss to sandwiching, in the output token. */
  victimLoss: number;
}

/**
 * The victim's trade cut into `parts` equal swaps in separate blocks. Between two parts the pool is
 * assumed to be arbitraged back to its starting reserves. A private swap is never sandwiched.
 */
export function splitTrade(input: SandwichInput, parts: number, isPrivate: boolean): SplitResult {
  const n = Math.min(Math.max(Math.round(Number.isFinite(parts) ? parts : 1), 1), 100);
  const single = sandwich(input);
  const one = sandwich({ ...input, victimIn: nn(input.victimIn) / n });
  const hit = one.attacked && !isPrivate;
  const each = hit ? one.attackedOut : one.cleanOut;
  return {
    victimOut: each * n,
    singleCleanOut: single.cleanOut,
    attackerNet: hit ? one.net * n : 0,
    attacks: hit ? n : 0,
    victimLoss: hit ? (one.cleanOut - one.attackedOut) * n : 0,
  };
}

export interface ArbResult {
  /** sellEth: the pool price is above the market, so sell ETH into it. buyEth: the opposite. */
  dir: 'none' | 'sellEth' | 'buyEth';
  amountIn: number;
  amountOut: number;
  /** In USDC, valuing ETH at the outside price, before gas. */
  profit: number;
  /** Pool reserves after the arbitrage. */
  eth: number;
  usdc: number;
  /** Pool price after the arbitrage (USDC per ETH). */
  price: number;
}

/**
 * The profit-maximising arbitrage between a pool (eth, usdc) and an outside market at `market`
 * USDC per ETH. Inside the fee band nothing is worth doing.
 */
export function optimalArb(eth: number, usdc: number, market: number): ArbResult {
  const x = nn(eth);
  const y = nn(usdc);
  const p = nn(market);
  const stay: ArbResult = { dir: 'none', amountIn: 0, amountOut: 0, profit: 0, eth: x, usdc: y, price: x > 0 ? y / x : 0 };
  if (x === 0 || y === 0 || p === 0) return stay;
  // Sell ETH while the marginal USDC per ETH exceeds the market: gamma*x*y / (x + gamma*dx)^2 = p.
  const dx = (Math.sqrt((GAMMA * x * y) / p) - x) / GAMMA;
  if (dx > 0) {
    const s = swapV2(x, y, dx, FEE_BPS);
    const profit = s.out - dx * p;
    return profit > 0 ? { dir: 'sellEth', amountIn: dx, amountOut: s.out, profit, eth: s.x, usdc: s.y, price: s.priceAfter } : stay;
  }
  // Buy ETH while a marginal USDC buys more than 1/p ETH: gamma*x*y*p / (y + gamma*dy)^2 = 1.
  const dy = (Math.sqrt(GAMMA * x * y * p) - y) / GAMMA;
  if (dy > 0) {
    const s = swapV2(y, x, dy, FEE_BPS);
    const profit = s.out * p - dy;
    return profit > 0 ? { dir: 'buyEth', amountIn: dy, amountOut: s.out, profit, eth: s.y, usdc: s.x, price: s.y > 0 ? s.x / s.y : 0 } : stay;
  }
  return stay;
}

export interface PendingTx {
  /** buy: pays USDC, receives ETH. sell: pays ETH, receives USDC. */
  kind: 'buy' | 'sell';
  amount: number;
}

export interface Fill {
  out: number;
  /** USDC per ETH actually paid or received. */
  price: number;
}

/** Executes the transactions against one pool in the given order; fills are indexed like `txs`. */
export function runOrder(eth: number, usdc: number, txs: PendingTx[], order: number[]): { fills: Fill[]; eth: number; usdc: number } {
  let x = nn(eth);
  let y = nn(usdc);
  const fills: Fill[] = txs.map(() => ({ out: 0, price: 0 }));
  const seen = new Set<number>();
  for (const i of order) {
    const tx = txs[i];
    if (!tx || seen.has(i)) continue;
    seen.add(i);
    const amount = nn(tx.amount);
    if (tx.kind === 'buy') {
      const s = swapV2(y, x, amount, FEE_BPS);
      fills[i] = { out: s.out, price: s.out > 0 ? amount / s.out : 0 };
      y = s.x;
      x = s.y;
    } else {
      const s = swapV2(x, y, amount, FEE_BPS);
      fills[i] = { out: s.out, price: amount > 0 ? s.out / amount : 0 };
      x = s.x;
      y = s.y;
    }
  }
  return { fills, eth: x, usdc: y };
}

/** Highest tip first; equal tips keep their current relative order. */
export function orderByTip(tips: number[], current: number[]): number[] {
  const tip = (i: number) => (Number.isFinite(tips[i]) ? tips[i] : 0);
  return current
    .map((i, at) => ({ i, at }))
    .sort((a, b) => tip(b.i) - tip(a.i) || a.at - b.at)
    .map((e) => e.i);
}

/** Moves the item at `index` one place up (-1) or down (+1); out-of-range moves change nothing. */
export function move(order: number[], index: number, by: -1 | 1): number[] {
  const to = index + by;
  if (index < 0 || index >= order.length || to < 0 || to >= order.length) return order;
  const next = [...order];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

/** Toy model: how much of a block's value each competing builder can capture. */
export const BUILDER_SKILL = [1, 0.96, 0.9, 0.8];
/** Toy model: share of the value a proposer captures building alone from the public mempool. */
export const LOCAL_SHARE = 0.5;

export interface AuctionResult {
  /** What the proposer is paid. */
  proposer: number;
  /** What the winning builder keeps. */
  builder: number;
  /** Each builder's bid; index 0 wins. Empty when the proposer builds locally. */
  bids: number[];
}

/**
 * Toy sealed-bid block auction. Each builder can realise value * skill; the best builder wins by
 * just beating the runner-up (or, alone, the proposer's own local block).
 */
export function blockAuction(value: number, builders: number, boost: boolean): AuctionResult {
  const v = nn(value);
  const n = Math.min(Math.max(Math.round(Number.isFinite(builders) ? builders : 1), 1), BUILDER_SKILL.length);
  const local = v * LOCAL_SHARE;
  if (!boost) return { proposer: local, builder: 0, bids: [] };
  const worth = BUILDER_SKILL.slice(0, n).map((s) => v * s);
  const winning = n > 1 ? Math.max(worth[1], local) : local;
  // Losing builders bid what the block is worth to them; the winner shades down to the runner-up.
  const bids = worth.map((w, i) => (i === 0 ? winning : w));
  return { proposer: winning, builder: worth[0] - winning, bids };
}

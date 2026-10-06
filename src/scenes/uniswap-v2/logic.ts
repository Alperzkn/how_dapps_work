// Pure math behind the Uniswap v2 lesson's controls, built on src/sim/ammV2.
import { getAmountOut, impermanentLoss, lpMinted, swapV2 } from '../../sim/ammV2';

/** The example pool: 100 ETH and 200,000 USDC, so 1 ETH = 2,000 USDC. */
export const X0 = 100;
export const Y0 = 200_000;
export const P0 = Y0 / X0;
/** The 0.3% swap fee as a fraction. */
export const FEE = 0.003;
/** LP supply of the example pool: the geometric mean of the first deposit (MINIMUM_LIQUIDITY ignored). */
export const SUPPLY0 = Math.sqrt(X0 * Y0);

const num = (n: number) => (Number.isFinite(n) ? n : 0);
const pos = (n: number) => Math.max(num(n), 0);
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(num(n), lo), hi);

/* ---------- Swap in either direction ---------- */

export type Dir = 'eth' | 'usdc';
/** The swap slider runs 0..MAX_UNITS; one unit is 1 ETH or 2,000 USDC (1% of that reserve). */
export const MAX_UNITS = 100;
export const UNIT: Record<Dir, number> = { eth: 1, usdc: P0 };

export interface Quote {
  dir: Dir;
  /** Amount sold, in the sold token. */
  amountIn: number;
  /** Amount received, in the other token. */
  out: number;
  /** Reserves after the swap: x is ETH, y is USDC. */
  x: number;
  y: number;
  /** USDC per ETH. */
  priceBefore: number;
  priceAfter: number;
  /** Average price actually traded at, USDC per ETH. */
  paid: number;
  impact: number;
  /** New pool price / old pool price. */
  ratio: number;
}

/** Sell `units` slider units of one token into a pool holding `x` ETH and `y` USDC. */
export function quoteSwap(dir: Dir, units: number, x = X0, y = Y0): Quote {
  const amountIn = clamp(units, 0, MAX_UNITS) * UNIT[dir];
  const priceBefore = x > 0 ? y / x : 0;
  const s = dir === 'eth' ? swapV2(x, y, amountIn) : swapV2(y, x, amountIn);
  const nx = dir === 'eth' ? s.x : s.y;
  const ny = dir === 'eth' ? s.y : s.x;
  const priceAfter = nx > 0 ? ny / nx : 0;
  const paid = amountIn > 0 && s.out > 0 ? (dir === 'eth' ? s.out / amountIn : amountIn / s.out) : priceBefore;
  return { dir, amountIn, out: s.out, x: nx, y: ny, priceBefore, priceAfter, paid, impact: s.impact, ratio: priceBefore > 0 ? priceAfter / priceBefore : 1 };
}

/* ---------- Arbitrage back to an outside market price ---------- */

export interface Arb {
  /** Token the arbitrageur sells into the pool; null when the pool is already within the fee of the market. */
  dir: Dir | null;
  amountIn: number;
  out: number;
  x: number;
  y: number;
  /** Pool price afterwards, USDC per ETH. */
  price: number;
  /** Profit in USDC, valuing ETH at the market price. */
  profit: number;
}

/**
 * The profit-maximizing trade against a pool whose price differs from `market`.
 * The arbitrageur trades until the next unit would cost exactly the market
 * price after the fee, so the pool ends within 0.3% of the market, not on it.
 */
export function arbitrage(x: number, y: number, market: number, feeBps = 30): Arb {
  const rx = pos(x);
  const ry = pos(y);
  const p = pos(market);
  const idle: Arb = { dir: null, amountIn: 0, out: 0, x: rx, y: ry, price: rx > 0 ? ry / rx : 0, profit: 0 };
  if (rx === 0 || ry === 0 || p === 0) return idle;
  const g = 1 - clamp(feeBps, 0, 9_999) / 10_000;
  // ETH is cheap in the pool: sell USDC for ETH.
  const dy = (Math.sqrt(g * p * rx * ry) - ry) / g;
  if (dy > 1e-9) {
    const out = getAmountOut(dy, ry, rx, feeBps);
    const nx = rx - out;
    const ny = ry + dy;
    return { dir: 'usdc', amountIn: dy, out, x: nx, y: ny, price: ny / nx, profit: out * p - dy };
  }
  // ETH is expensive in the pool: sell ETH for USDC.
  const dx = (Math.sqrt((g * rx * ry) / p) - rx) / g;
  if (dx > 1e-9) {
    const out = getAmountOut(dx, rx, ry, feeBps);
    const nx = rx + dx;
    const ny = ry - out;
    return { dir: 'eth', amountIn: dx, out, x: nx, y: ny, price: ny / nx, profit: out - dx * p };
  }
  return idle;
}

/* ---------- Order book next to the pool ---------- */

export interface Ask {
  /** USDC per ETH. */
  price: number;
  /** ETH offered at that price. */
  size: number;
}

export type Depth = 'busy' | 'thin' | 'empty';
export const DEPTHS: Depth[] = ['busy', 'thin', 'empty'];
/** Three states of the same market: many sellers, a few, none. Best price first. */
export const BOOKS: Record<Depth, Ask[]> = {
  busy: [
    { price: 2002, size: 4 },
    { price: 2006, size: 6 },
    { price: 2012, size: 8 },
    { price: 2025, size: 12 },
  ],
  thin: [
    { price: 2015, size: 1 },
    { price: 2090, size: 2 },
    { price: 2400, size: 2 },
  ],
  empty: [],
};
export const MAX_BUY = 40;

export interface BookFill {
  /** ETH taken from each ask, in book order. */
  fills: number[];
  filled: number;
  unfilled: number;
  cost: number;
  /** Average USDC per ETH for the filled part; 0 when nothing filled. */
  avg: number;
  /** Price of the last ask touched; 0 when nothing filled. */
  worst: number;
}

/** A market buy walks up the asks until the order is filled or the book runs out. */
export function marketBuy(asks: Ask[], size: number): BookFill {
  let left = pos(size);
  let cost = 0;
  let worst = 0;
  const fills = asks.map((a) => {
    const take = Math.min(left, pos(a.size));
    if (take > 0) {
      left -= take;
      cost += take * a.price;
      worst = a.price;
    }
    return take;
  });
  const filled = pos(size) - left;
  return { fills, filled, unfilled: left, cost, avg: filled > 0 ? cost / filled : 0, worst };
}

/** Input needed for an exact output, after the fee. Mirrors UniswapV2Library.getAmountIn (without the +1 wei). 0 if the pool cannot pay that much. */
export function getAmountIn(amountOut: number, reserveIn: number, reserveOut: number, feeBps = 30): number {
  const out = pos(amountOut);
  const rin = pos(reserveIn);
  const rout = pos(reserveOut);
  if (out === 0 || rin === 0 || out >= rout) return 0;
  return (rin * out) / ((rout - out) * (1 - clamp(feeBps, 0, 9_999) / 10_000));
}

export interface PoolBuy {
  cost: number;
  avg: number;
  x: number;
  y: number;
}

/** Buy an exact amount of ETH from the pool, paying USDC. */
export function poolBuy(eth: number, x = X0, y = Y0): PoolBuy {
  const size = clamp(eth, 0, x * 0.99);
  const cost = getAmountIn(size, y, x);
  return { cost, avg: size > 0 ? cost / size : x > 0 ? y / x : 0, x: x - size, y: y + cost };
}

/* ---------- Adding and removing liquidity ---------- */

export const MAX_DEPOSIT_ETH = 50;
export const MAX_DEPOSIT_USDC = MAX_DEPOSIT_ETH * P0;

export interface Deposit {
  eth: number;
  usdc: number;
  /** LP tokens minted for this deposit. */
  minted: number;
  /** The depositor's fraction of the pool afterwards, 0..1. */
  share: number;
  /** Reserves and supply after the deposit. */
  x: number;
  y: number;
  supply: number;
  /** What burning those LP tokens returns right away. */
  backEth: number;
  backUsdc: number;
  /** Value given away to the other LPs by depositing off-ratio, in USDC at the pool price. */
  gift: number;
  /** Which side limited the mint; null when the deposit is in ratio (or empty). */
  limiting: Dir | null;
}

/** Deposit `eth` and `usdc` into a pool holding `x`, `y` with `supply` LP tokens outstanding. */
export function addLiquidity(eth: number, usdc: number, x = X0, y = Y0, supply = SUPPLY0): Deposit {
  const dx = pos(eth);
  const dy = pos(usdc);
  const minted = lpMinted(dx, dy, x, y, supply);
  const nx = x + dx;
  const ny = y + dy;
  const total = supply + minted;
  const share = total > 0 ? minted / total : 0;
  const backEth = share * nx;
  const backUsdc = share * ny;
  const price = nx > 0 ? ny / nx : 0;
  const a = x > 0 ? dx / x : 0;
  const b = y > 0 ? dy / y : 0;
  const limiting: Dir | null = Math.abs(a - b) < 1e-9 ? null : a < b ? 'eth' : 'usdc';
  const gift = Math.max(0, (dx - backEth) * price + (dy - backUsdc));
  return { eth: dx, usdc: dy, minted, share, x: nx, y: ny, supply: total, backEth, backUsdc, gift: limiting ? gift : 0, limiting };
}

/** USDC that matches `eth` at the pool ratio (the Router's `quote`). */
export const matching = (eth: number, x = X0, y = Y0) => (x > 0 ? (pos(eth) * y) / x : 0);

/* ---------- Fees: volume through the pool ---------- */

/** The fee step's pool: the example pool after you added 10 ETH + 20,000 USDC. You own 1/11 of it. */
export const FEE_POOL = addLiquidity(10, matching(10));
export const MAX_TRADES = 200;
/** Every other simulated trade sells this much ETH; the ones in between buy it back. */
export const TRADE_ETH = 5;

export interface Volume {
  trades: number;
  x: number;
  y: number;
  /** Growth of x · y as a fraction. */
  kGrowth: number;
  /** Growth of √k per LP token as a fraction: the return on every share. */
  shareGrowth: number;
  /** Total traded, in USDC. */
  volume: number;
  /** Fees left in the pool, in USDC. */
  fees: number;
  /** Value of a `share` of the pool now, and the part of it that came from fees, in USDC at the pool price. */
  value: number;
  income: number;
}

/**
 * Push `n` trades through the pool, alternating direction: one trader sells
 * TRADE_ETH, the next buys ETH with USDC until the price is back at `market`,
 * and so on. Liquidity is neither added nor removed, so every bit of growth in
 * √k is fee income.
 */
export function simulateTrades(n: number, share = FEE_POOL.share, x0 = FEE_POOL.x, y0 = FEE_POOL.y, market = P0): Volume {
  const trades = Math.round(clamp(n, 0, MAX_TRADES));
  const g = 1 - FEE;
  let x = x0;
  let y = y0;
  let volume = 0;
  let fees = 0;
  for (let i = 0; i < trades; i++) {
    if (i % 2 === 0) {
      const s = swapV2(x, y, TRADE_ETH);
      volume += TRADE_ETH * s.priceBefore;
      fees += TRADE_ETH * FEE * s.priceBefore;
      x = s.x;
      y = s.y;
    } else {
      // USDC in that leaves (y + dy) / (x − out) = market: a quadratic in dy.
      const b = (1 + g) * y;
      const dy = Math.max(0, (-b + Math.sqrt(b * b - 4 * g * (y * y - market * x * y))) / (2 * g));
      const s = swapV2(y, x, dy);
      volume += dy;
      fees += dy * FEE;
      y = s.x;
      x = s.y;
    }
  }
  const k0 = x0 * y0;
  const shareGrowth = k0 > 0 ? Math.sqrt((x * y) / k0) - 1 : 0;
  const price = x > 0 ? y / x : 0;
  const value = pos(share) * (x * price + y);
  return { trades, x, y, kGrowth: k0 > 0 ? (x * y) / k0 - 1 : 0, shareGrowth, volume, fees, value, income: value - value / (1 + shareGrowth) };
}

/* ---------- Risks: slippage tolerance ---------- */

/** The trade being protected: sell 10 ETH into the example pool. */
export const SLIP_TRADE = 10;
export const TOL_MIN = 0.001;
export const TOL_MAX = 0.05;
export const MOVE_MAX = 0.1;

export interface Slippage {
  quoted: number;
  minOut: number;
  executed: number;
  /** How far below the quote the trade executes, as a fraction. */
  shortfall: number;
  reverts: boolean;
  /** Reserves once the earlier trades, and yours if it went through, have run. */
  x: number;
  y: number;
  price: number;
}

/**
 * You are quoted on the example pool and send the swap with `tolerance`.
 * Before it executes, other trades push the ETH price down by `move`.
 */
export function slippage(tolerance: number, move: number, amountIn = SLIP_TRADE): Slippage {
  const tol = clamp(tolerance, 0, 1);
  const m = clamp(move, 0, 0.99);
  const quoted = getAmountOut(amountIn, X0, Y0);
  const minOut = quoted * (1 - tol);
  // The same k at a price (1 − m) times lower.
  const x1 = X0 / Math.sqrt(1 - m);
  const y1 = Y0 * Math.sqrt(1 - m);
  const s = swapV2(x1, y1, amountIn);
  const reverts = s.out < minOut - 1e-9;
  const x = reverts ? x1 : s.x;
  const y = reverts ? y1 : s.y;
  return { quoted, minOut, executed: s.out, shortfall: quoted > 0 ? Math.max(0, 1 - s.out / quoted) : 0, reverts, x, y, price: y / x };
}

/* ---------- Risks: impermanent loss ---------- */

export const R_MIN = 0.25;
export const R_MAX = 4;
/** The LP position being followed: 10% of the example pool (10 ETH + 20,000 USDC at deposit). */
export const IL_SHARE = 0.1;

/** Slider position −100..100 to a price ratio 0.25..4, on a log scale so halving and doubling are symmetric. */
export const ratioOf = (slider: number) => R_MAX ** (clamp(slider, -100, 100) / 100);
export const sliderOf = (ratio: number) => (Math.log(clamp(ratio, R_MIN, R_MAX)) / Math.log(R_MAX)) * 100;

export interface PriceMove {
  r: number;
  price: number;
  /** Pool reserves once arbitrage has moved it to the new price (fees ignored). */
  x: number;
  y: number;
  /** USDC value of the position if the tokens had stayed in the wallet, and in the pool. */
  hold: number;
  inPool: number;
  il: number;
  /** hold − inPool: the fee income needed to break even. */
  loss: number;
  /** Trading volume through the whole pool that would pay this LP that much in fees. */
  volumeToOffset: number;
  /** What the position holds now. */
  eth: number;
  usdc: number;
}

/** The outside price changes by `ratio`; arbitrage trades the pool to the new price. */
export function priceMove(ratio: number, share = IL_SHARE): PriceMove {
  const r = clamp(ratio, R_MIN, R_MAX);
  const s = clamp(share, 0, 1);
  const price = P0 * r;
  const x = X0 / Math.sqrt(r);
  const y = Y0 * Math.sqrt(r);
  const hold = s * (X0 * price + Y0);
  const il = impermanentLoss(r);
  const inPool = hold * (1 + il);
  const loss = Math.max(0, hold - inPool);
  return { r, price, x, y, hold, inPool, il, loss, volumeToOffset: s > 0 ? loss / (FEE * s) : 0, eth: s * x, usdc: s * y };
}

// Pure logic behind the Uniswap v3 lesson's controls. Plain numbers, human units:
// token0 = ETH (x), token1 = USDC (y), price = USDC per ETH.
import { getAmountOut, impermanentLoss } from '../../sim/ammV2';
import { amountsForLiquidity, capitalEfficiency, inRange, liquidityForValue, priceToTick, snapTick, tickToPrice } from '../../sim/ammV3';

const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
const fin = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback);
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(Number.isFinite(v) ? v : lo, lo), hi);

/* ---------- A swap walking across ranges of constant liquidity ---------- */

/** One range between two initialized ticks: constant liquidity L from `lo` to `hi`. */
export interface PoolBin {
  lo: number;
  hi: number;
  L: number;
}

/** Equal-width ranges starting at `start`; `heights[i] * unit` is the liquidity of range i. */
export function makeBins(start: number, width: number, heights: number[], unit: number): PoolBin[] {
  const s = pos(start);
  const w = pos(width);
  if (s === 0 || w === 0) return [];
  return heights.map((h, i) => ({ lo: s + i * w, hi: s + (i + 1) * w, L: pos(h) * pos(unit) }));
}

/** Index of the range holding `price` (lo <= price < hi), clamped to the pool. */
export function binIndex(bins: PoolBin[], price: number): number {
  for (let i = 0; i < bins.length; i++) if (price < bins[i].hi) return i;
  return Math.max(0, bins.length - 1);
}

/** Value of everything the pool holds at `price`, in USDC. */
export function poolValue(bins: PoolBin[], price: number): number {
  const p = pos(price);
  let total = 0;
  for (const b of bins) {
    const { x, y } = amountsForLiquidity(b.L, p, b.lo, b.hi);
    total += fin(x) * p + fin(y);
  }
  return total;
}

export interface WalkStep {
  bin: number;
  L: number;
  priceStart: number;
  priceEnd: number;
  /** Input used for the trade itself, without the fee. */
  amountIn: number;
  amountOut: number;
  fee: number;
}

export interface WalkResult {
  /** true: USDC in, ETH out, price rises. false: ETH in, USDC out, price falls. */
  buy: boolean;
  /** Input actually taken, fee included. */
  amountIn: number;
  amountOut: number;
  fee: number;
  priceStart: number;
  priceEnd: number;
  /** USDC per ETH actually paid or received; the start price when nothing was swapped. */
  avgPrice: number;
  ticksCrossed: number;
  startBin: number;
  endBin: number;
  /** Liquidity of the range the price ends in. */
  activeL: number;
  /** Input left over because the pool ran out of liquidity. */
  unfilled: number;
  exhausted: boolean;
  steps: WalkStep[];
}

/**
 * Swap `amountIn` (USDC when buying ETH, ETH when selling) through the ranges, the way
 * UniswapV3Pool.swap does: trade inside the current range with its liquidity
 * (Δ√P = Δy / L upward, Δ(1/√P) = Δx / L downward), take the fee from the input, and
 * when the range's edge is reached cross into the next one.
 */
export function walkSwap(bins: PoolBin[], price: number, amountIn: number, buy: boolean, feeBps = 30): WalkResult {
  const fee = clamp(feeBps, 0, 9_999) / 10_000;
  const want = pos(amountIn);
  const empty: WalkResult = { buy, amountIn: 0, amountOut: 0, fee: 0, priceStart: pos(price), priceEnd: pos(price), avgPrice: pos(price), ticksCrossed: 0, startBin: 0, endBin: 0, activeL: 0, unfilled: want, exhausted: false, steps: [] };
  if (bins.length === 0 || pos(price) === 0) return empty;

  let p = clamp(price, bins[0].lo, bins[bins.length - 1].hi);
  let i = binIndex(bins, p);
  const priceStart = p;
  const startBin = i;
  let remaining = want;
  let out = 0;
  let feePaid = 0;
  let crossed = 0;
  let exhausted = false;
  const steps: WalkStep[] = [];
  const dust = want * 1e-12;

  for (let guard = bins.length + 2; remaining > dust && guard > 0; guard--) {
    const b = bins[i];
    const sp = Math.sqrt(p);
    const target = buy ? b.hi : b.lo;
    const st = Math.sqrt(target);
    const net = remaining * (1 - fee);
    // Input that takes the price all the way to this range's edge.
    const need = pos(buy ? b.L * (st - sp) : b.L * (1 / st - 1 / sp));
    const from = p;
    let stepIn: number;
    let stepOut: number;
    let stepFee: number;
    let reached: boolean;
    if (b.L > 0 && net < need) {
      const sn = buy ? sp + net / b.L : 1 / (1 / sp + net / b.L);
      stepIn = net;
      stepFee = remaining - net;
      stepOut = pos(buy ? b.L * (1 / sp - 1 / sn) : b.L * (sp - sn));
      p = sn * sn;
      reached = false;
    } else {
      stepIn = need;
      stepFee = (need * fee) / (1 - fee);
      stepOut = pos(buy ? b.L * (1 / sp - 1 / st) : b.L * (sp - st));
      p = target;
      reached = true;
    }
    remaining = Math.max(0, remaining - stepIn - stepFee);
    out += stepOut;
    feePaid += stepFee;
    steps.push({ bin: i, L: b.L, priceStart: from, priceEnd: p, amountIn: stepIn, amountOut: stepOut, fee: stepFee });
    if (reached) {
      const j = buy ? i + 1 : i - 1;
      if (j < 0 || j >= bins.length) {
        exhausted = true;
        break;
      }
      i = j;
      crossed++;
    }
  }

  const unfilled = exhausted ? remaining : 0;
  const taken = want - unfilled;
  const avg = buy ? taken / out : out / taken;
  return {
    buy,
    amountIn: taken,
    amountOut: out,
    fee: feePaid,
    priceStart,
    priceEnd: p,
    avgPrice: taken > 0 && out > 0 && Number.isFinite(avg) ? avg : priceStart,
    ticksCrossed: crossed,
    startBin,
    endBin: i,
    activeL: bins[i].L,
    unfilled,
    exhausted,
    steps,
  };
}

export interface V2Quote {
  amountOut: number;
  avgPrice: number;
  priceEnd: number;
}

/** The same swap against a v2 pool worth `tvl` USDC at `price` (half in each token). */
export function v2Quote(tvl: number, price: number, amountIn: number, buy: boolean, feeBps = 30): V2Quote {
  const p = pos(price);
  const a = pos(amountIn);
  const y = pos(tvl) / 2;
  const x = p > 0 ? y / p : 0;
  if (p === 0 || y === 0 || a === 0) return { amountOut: 0, avgPrice: p, priceEnd: p };
  const out = buy ? getAmountOut(a, y, x, feeBps) : getAmountOut(a, x, y, feeBps);
  const avg = buy ? a / out : out / a;
  const end = buy ? (y + a) / (x - out) : (y - out) / (x + a);
  return { amountOut: out, avgPrice: out > 0 && Number.isFinite(avg) ? avg : p, priceEnd: Number.isFinite(end) && end > 0 ? end : p };
}

/* ---------- Step 1: how much of a v2 pool a price move ever uses ---------- */

export interface IdleShare {
  lower: number;
  upper: number;
  /** Fraction (0..1) of a full-range position's capital needed for prices in [lower, upper]. */
  used: number;
  /** 1 / used: how much deeper the same money is when concentrated on that range. */
  gain: number;
}

/** A price that only ever moves ±movePct % around `price`. */
export function idleShare(movePct: number, price = 2000): IdleShare {
  const p = pos(price) || 1;
  const m = clamp(movePct, 0.01, 99) / 100;
  const lower = p * (1 - m);
  const upper = p * (1 + m);
  const gain = Math.max(1, fin(capitalEfficiency(p, lower, upper), 1));
  return { lower, upper, used: 1 / gain, gain };
}

/* ---------- Fee tiers and a simulated day ---------- */

export interface TierModel {
  feeBps: number;
  spacing: number;
  /** Illustrative daily volume of that pool, in USDC. */
  volume: number;
  /** Illustrative liquidity L that all other LPs keep active at every price. */
  poolL: number;
}

/** Fee and tick spacing are the real ones; volume and depth are made-up round numbers for an ETH/USDC-like pair. */
export const TIER_MODELS: TierModel[] = [
  { feeBps: 5, spacing: 10, volume: 300e6, poolL: 45e6 },
  { feeBps: 30, spacing: 60, volume: 30e6, poolL: 30e6 },
  { feeBps: 100, spacing: 200, volume: 1.5e6, poolL: 8e6 },
];

export type PathKind = 'calm' | 'trend' | 'volatile';
export const PATH_KINDS: PathKind[] = ['calm', 'trend', 'volatile'];
/** Busier markets trade more: share of the tier's normal daily volume. */
const PATH_VOLUME: Record<PathKind, number> = { calm: 0.6, trend: 1, volatile: 1.6 };
const TAU = Math.PI * 2;

/** A fixed day of prices: `n + 1` points starting exactly at `start`. */
export function dayPath(kind: PathKind, start = 2000, n = 48): number[] {
  const s = pos(start) || 1;
  const steps = Math.max(1, Math.floor(pos(n)) || 1);
  return Array.from({ length: steps + 1 }, (_, t) => {
    const u = t / steps;
    const move =
      kind === 'calm'
        ? 0.01 * Math.sin(TAU * 1.5 * u) + 0.004 * Math.sin(TAU * 5 * u)
        : kind === 'trend'
          ? 0.085 * u + 0.01 * Math.sin(TAU * 3 * u)
          : 0.065 * Math.sin(TAU * 1.75 * u) + 0.025 * Math.sin(TAU * 7 * u);
    return s * (1 + move);
  });
}

export interface SnappedRange {
  tickLower: number;
  tickUpper: number;
  lower: number;
  upper: number;
}

/** A ±widthPct % range around `price`, widened outward to ticks the pool's spacing allows. */
export function snapRange(price: number, widthPct: number, spacing: number): SnappedRange {
  const p = pos(price) || 1;
  const w = clamp(widthPct, 0.01, 99) / 100;
  const s = Math.max(1, Math.floor(pos(spacing)) || 1);
  const tickLower = snapTick(priceToTick(p * (1 - w)), s);
  let tickUpper = snapTick(priceToTick(p * (1 + w)), s);
  if (tickToPrice(tickUpper) < p * (1 + w) * (1 - 1e-9)) tickUpper += s;
  if (tickUpper <= tickLower) tickUpper = tickLower + s;
  return { tickLower, tickUpper, lower: tickToPrice(tickLower), upper: tickToPrice(tickUpper) };
}

export interface DayResult extends SnappedRange {
  path: number[];
  /** Per interval (path.length - 1 of them): was the price inside the range, and the fees earned. */
  inside: boolean[];
  earned: number[];
  /** Fraction of the day spent in range, 0..1. */
  timeInRange: number;
  fees: number;
  /** The position's liquidity and its share of the active liquidity while in range. */
  L: number;
  share: number;
  /** Value at the end of the day, value of just holding the deposit, and the difference (<= 0). */
  value: number;
  hold: number;
  loss: number;
  /** fees + loss. */
  net: number;
}

/**
 * One day for a `capital`-sized position of ±widthPct % around the start price.
 * Each interval trades an equal slice of the tier's volume; while the price is in range the
 * position earns volume × fee × its share of the active liquidity. Illustrative only.
 */
export function simulateDay(tier: TierModel, widthPct: number, kind: PathKind, capital = 10_000, start = 2000): DayResult {
  const path = dayPath(kind, start);
  const p0 = path[0];
  const range = snapRange(p0, widthPct, tier.spacing);
  const L = fin(liquidityForValue(capital, p0, range.lower, range.upper));
  const poolL = pos(tier.poolL);
  const share = L + poolL > 0 ? L / (L + poolL) : 0;
  const n = path.length - 1;
  const slice = (pos(tier.volume) * PATH_VOLUME[kind]) / n;
  const rate = clamp(tier.feeBps, 0, 10_000) / 10_000;
  const inside: boolean[] = [];
  const earned: number[] = [];
  let fees = 0;
  let count = 0;
  for (let t = 1; t <= n; t++) {
    const ok = inRange(path[t], range.lower, range.upper);
    const fee = ok ? slice * rate * share : 0;
    inside.push(ok);
    earned.push(fee);
    fees += fee;
    if (ok) count++;
  }
  const end = path[n];
  const a0 = amountsForLiquidity(L, p0, range.lower, range.upper);
  const a1 = amountsForLiquidity(L, end, range.lower, range.upper);
  const value = fin(a1.x * end + a1.y);
  const hold = fin(a0.x * end + a0.y);
  const loss = Math.min(0, value - hold);
  return { ...range, path, inside, earned, timeInRange: count / n, fees, L, share, value, hold, loss, net: fees + loss };
}

/* ---------- Last step: the price leaves the range ---------- */

export interface PositionMove {
  active: boolean;
  /** Tokens held now by a position that was worth `capital` at the entry price. */
  eth: number;
  usdc: number;
  value: number;
  /** Value now of simply holding the tokens that were deposited. */
  hold: number;
  /** value / hold - 1: 0 = no loss, -0.05 = 5% worse than holding. */
  il: number;
  /** The same for a full-range v2 position and the same price move. */
  v2il: number;
  /** Share of the position's value that is ETH, 0..1. */
  ethShare: number;
}

export function positionMove(capital: number, entry: number, lower: number, upper: number, price: number): PositionMove {
  const p = pos(price);
  const e = pos(entry);
  const L = fin(liquidityForValue(capital, e, lower, upper));
  const a0 = amountsForLiquidity(L, e, lower, upper);
  const a1 = amountsForLiquidity(L, p, lower, upper);
  const value = fin(a1.x * p + a1.y);
  const hold = fin(a0.x * p + a0.y);
  const il = hold > 0 ? Math.min(0, value / hold - 1) : 0;
  return {
    active: L > 0 && inRange(p, lower, upper),
    eth: fin(a1.x),
    usdc: fin(a1.y),
    value,
    hold,
    il: fin(il),
    v2il: e > 0 && p > 0 ? fin(impermanentLoss(p / e)) : 0,
    ethShare: value > 0 ? clamp((a1.x * p) / value, 0, 1) : 0,
  };
}

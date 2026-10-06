// Uniswap v3 concentrated-liquidity math, in plain numbers for illustration.

const TICK_BASE = 1.0001;
export const MIN_TICK = -887272;
export const MAX_TICK = 887272;

const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/** price = 1.0001^tick */
export function tickToPrice(tick: number): number {
  const t = Math.min(Math.max(Number.isFinite(tick) ? tick : 0, MIN_TICK), MAX_TICK);
  return TICK_BASE ** t;
}

/** The greatest tick whose price is <= the given price. */
export function priceToTick(price: number): number {
  const p = pos(price);
  if (p === 0) return MIN_TICK;
  const t = Math.floor(Math.log(p) / Math.log(TICK_BASE) + 1e-9);
  return Math.min(Math.max(t, MIN_TICK), MAX_TICK);
}

/** Rounds a tick down to a usable one for the pool's tick spacing. */
export function snapTick(tick: number, spacing: number): number {
  const s = Math.max(1, Math.floor(pos(spacing)) || 1);
  return Math.floor(tick / s) * s;
}

/** sqrtPriceX96 as the contracts store it: sqrt(price) * 2^96. */
export function sqrtPriceX96(price: number): bigint {
  return BigInt(Math.floor(Math.sqrt(pos(price)) * 2 ** 48)) * 2n ** 48n;
}

/** Orders a range so that lower <= upper and both are positive. */
function range(pa: number, pb: number): [number, number] {
  const a = pos(pa);
  const b = pos(pb);
  return a <= b ? [a, b] : [b, a];
}

/**
 * Token amounts held by a position with liquidity L over [pa, pb] at price p.
 * Below the range it is all X; above it, all Y.
 */
export function amountsForLiquidity(L: number, p: number, pa: number, pb: number): { x: number; y: number } {
  const liq = pos(L);
  const [a, b] = range(pa, pb);
  if (liq === 0 || a === 0 || a === b) return { x: 0, y: 0 };
  const sa = Math.sqrt(a);
  const sb = Math.sqrt(b);
  const sp = Math.min(Math.max(Math.sqrt(pos(p)), sa), sb);
  return { x: liq * (1 / sp - 1 / sb), y: liq * (sp - sa) };
}

/** Liquidity L obtained by spending a total `value` (measured in Y) on [pa, pb] at price p. */
export function liquidityForValue(value: number, p: number, pa: number, pb: number): number {
  const unit = amountsForLiquidity(1, p, pa, pb);
  const cost = unit.x * pos(p) + unit.y;
  return cost > 0 ? pos(value) / cost : 0;
}

/**
 * How many times more liquidity the same capital provides in [pa, pb]
 * than in a full-range (v2 style) position, at price p. 1 for unusable ranges.
 */
export function capitalEfficiency(p: number, pa: number, pb: number): number {
  const price = pos(p);
  const [a, b] = range(pa, pb);
  if (price === 0 || a === 0 || a === b || !inRange(price, a, b)) return 1;
  const sp = Math.sqrt(price);
  const v3 = 2 * sp - Math.sqrt(a) - price / Math.sqrt(b);
  return v3 > 0 ? (2 * sp) / v3 : 1;
}

export const inRange = (p: number, pa: number, pb: number) => {
  const [a, b] = range(pa, pb);
  return p >= a && p < b;
};

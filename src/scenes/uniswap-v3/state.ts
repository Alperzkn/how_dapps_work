import { create } from 'zustand';
import { amountsForLiquidity, capitalEfficiency, inRange, liquidityForValue, priceToTick } from '../../sim/ammV3';

/** The price axis of the scene: USDC per ETH. */
export const P_MIN = 1000;
export const P_MAX = 3000;
/** Width of one drawn bin, and the step of the bound sliders. */
export const BIN = 50;
export const PRICE_STEP = 10;
/** Value of the example position, in USDC. */
export const CAPITAL = 10_000;

const AXIS_HALF = 6;
/** World x of a price on the axis. */
export const xOf = (price: number) => ((price - (P_MIN + P_MAX) / 2) / ((P_MAX - P_MIN) / 2)) * AXIS_HALF;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(Number.isFinite(v) ? v : lo, lo), hi);
const snap = (v: number, step: number) => Math.round(v / step) * step;

export interface Derived {
  tickLower: number;
  tickUpper: number;
  tickNow: number;
  active: boolean;
  /** Tokens held by a CAPITAL-sized position. */
  eth: number;
  usdc: number;
  /** Liquidity per unit of capital relative to a full-range position; never below 1. */
  ratio: number;
  /** capitalEfficiency while in range, 0 when the position is inactive. */
  efficiency: number;
}

export function derive(lower: number, upper: number, price: number): Derived {
  const L = liquidityForValue(CAPITAL, price, lower, upper);
  const { x, y } = amountsForLiquidity(L, price, lower, upper);
  const fullRange = CAPITAL / (2 * Math.sqrt(price));
  const raw = fullRange > 0 ? L / fullRange : 1;
  const active = inRange(price, lower, upper);
  return {
    tickLower: priceToTick(lower),
    tickUpper: priceToTick(upper),
    tickNow: priceToTick(price),
    active,
    eth: Number.isFinite(x) ? x : 0,
    usdc: Number.isFinite(y) ? y : 0,
    ratio: Number.isFinite(raw) && raw > 1 ? raw : 1,
    // Exactly on the lower bound the position is active but capitalEfficiency() treats it as unusable; the ratio is the same quantity.
    efficiency: !active ? 0 : price > Math.min(lower, upper) ? capitalEfficiency(price, lower, upper) : Math.max(1, Number.isFinite(raw) ? raw : 1),
  };
}

interface PositionState {
  lower: number;
  upper: number;
  price: number;
  setLower: (v: number) => void;
  setUpper: (v: number) => void;
  setPrice: (v: number) => void;
  reset: () => void;
}

const START = { lower: 1800, upper: 2200, price: 2000 };

export const usePosition = create<PositionState>((set) => ({
  ...START,
  // The lower bound always stays at least one bin under the upper bound.
  setLower: (v) => set((s) => ({ lower: clamp(snap(v, BIN), P_MIN, s.upper - BIN) })),
  setUpper: (v) => set((s) => ({ upper: clamp(snap(v, BIN), s.lower + BIN, P_MAX) })),
  setPrice: (v) => set({ price: clamp(snap(v, PRICE_STEP), P_MIN, P_MAX) }),
  reset: () => set(START),
}));

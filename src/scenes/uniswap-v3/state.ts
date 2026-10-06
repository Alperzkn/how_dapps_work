import { create } from 'zustand';
import { amountsForLiquidity, capitalEfficiency, inRange, liquidityForValue, priceToTick } from '../../sim/ammV3';
import { makeBins, PATH_KINDS, poolValue, TIER_MODELS, v2Quote, walkSwap, type PathKind, type V2Quote, type WalkResult } from './logic';

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

/* ---------- Step "idle": how far the price really moves ---------- */

export const MOVE_MIN = 1;
export const MOVE_MAX = 50;
export const MOVE_STEP = 0.5;
const MOVE_START = 7.5;

interface IdleState {
  move: number;
  setMove: (v: number) => void;
}

export const useIdle = create<IdleState>((set) => ({
  move: MOVE_START,
  setMove: (v) => set({ move: clamp(snap(v, MOVE_STEP), MOVE_MIN, MOVE_MAX) }),
}));

/* ---------- Step "crossing": a pool made of ranges with different liquidity ---------- */

/** Liquidity of each range, in units of POOL_UNIT. Every boundary is an initialized tick. */
export const POOL_HEIGHTS = [0.4, 0.6, 0.9, 1.2, 1.6, 2.1, 2.6, 3, 3.4, 2.9, 2.5, 2, 1.5, 1.1, 0.8, 0.6, 0.4];
export const POOL_UNIT = 1_000_000;
export const POOL_BIN = 50;
export const POOL_START = 1575;
export const POOL_PRICE = 2000;
export const POOL_FEE_BPS = 30;
export const POOL_BINS = makeBins(POOL_START, POOL_BIN, POOL_HEIGHTS, POOL_UNIT);
/** Everything the pool holds at the starting price, in USDC; the v2 pool it is compared with gets the same. */
export const POOL_TVL = poolValue(POOL_BINS, POOL_PRICE);

/** The swap size is set in USDC; a sale sends that much worth of ETH at the starting price. */
export const SWAP_MAX = 6_000_000;
export const SWAP_STEP = 100_000;
const SWAP_START = 3_000_000;

export interface SwapQuote {
  /** Amount sent in, in the input token (USDC when buying, ETH when selling). */
  input: number;
  walk: WalkResult;
  v2: V2Quote;
}

export function quoteSwap(size: number, buy: boolean): SwapQuote {
  const usd = clamp(size, 0, SWAP_MAX);
  const input = buy ? usd : usd / POOL_PRICE;
  return { input, walk: walkSwap(POOL_BINS, POOL_PRICE, input, buy, POOL_FEE_BPS), v2: v2Quote(POOL_TVL, POOL_PRICE, input, buy, POOL_FEE_BPS) };
}

interface SwapState {
  size: number;
  buy: boolean;
  setSize: (v: number) => void;
  setBuy: (v: boolean) => void;
}

export const useSwapSim = create<SwapState>((set) => ({
  size: SWAP_START,
  buy: true,
  setSize: (v) => set({ size: clamp(snap(v, SWAP_STEP), 0, SWAP_MAX) }),
  setBuy: (buy) => set({ buy }),
}));

/* ---------- Steps "fees-nft" and "fee-day": a tier, a range width and a day of prices ---------- */

export const WIDTH_MIN = 1;
export const WIDTH_MAX = 30;
export const WIDTH_STEP = 0.5;
const WIDTH_START = 5;

interface FeeState {
  /** Index into TIER_MODELS. */
  tier: number;
  width: number;
  path: PathKind;
  setTier: (v: number) => void;
  setWidth: (v: number) => void;
  setPath: (v: PathKind) => void;
}

export const useFees = create<FeeState>((set) => ({
  tier: 1,
  width: WIDTH_START,
  path: 'calm',
  setTier: (v) => set({ tier: clamp(Math.round(v), 0, TIER_MODELS.length - 1) }),
  setWidth: (v) => set({ width: clamp(snap(v, WIDTH_STEP), WIDTH_MIN, WIDTH_MAX) }),
  setPath: (path) => set({ path: PATH_KINDS.includes(path) ? path : 'calm' }),
}));

/* ---------- Step "efficiency": the position was opened at this price ---------- */

export const ENTRY = 2000;

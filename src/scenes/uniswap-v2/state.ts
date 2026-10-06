import { create } from 'zustand';
import { MAX_BUY, MAX_DEPOSIT_ETH, MAX_DEPOSIT_USDC, MAX_TRADES, MAX_UNITS, MOVE_MAX, TOL_MAX, TOL_MIN, type Depth, type Dir } from './logic';

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(Math.max(v, lo), hi) : lo);

export type RiskMode = 'slippage' | 'il';

interface V2State {
  /** Swap size in slider units (1 ETH or 2,000 USDC each) and the token being sold. */
  units: number;
  dir: Dir;
  /** Swap step: an arbitrageur has traded the pool back toward the market price. */
  arb: boolean;
  /** Order-book step: ETH to market-buy and how full the book is. */
  buy: number;
  depth: Depth;
  /** Pool step: the learner's deposit. `depUsdc` is used only while `unbalanced`. */
  depEth: number;
  depUsdc: number;
  unbalanced: boolean;
  removed: boolean;
  /** Fee step: trades pushed through the pool. */
  trades: number;
  /** Risk step. */
  riskMode: RiskMode;
  tol: number;
  move: number;
  /** Position of the price slider, −100..100 (log scale, 0 = unchanged). */
  ilSlider: number;
  setUnits: (v: number) => void;
  setDir: (d: Dir) => void;
  setArb: (on: boolean) => void;
  setBuy: (v: number) => void;
  setDepth: (d: Depth) => void;
  setDepEth: (v: number) => void;
  setDepUsdc: (v: number) => void;
  setUnbalanced: (on: boolean) => void;
  setRemoved: (on: boolean) => void;
  setTrades: (v: number) => void;
  setRiskMode: (m: RiskMode) => void;
  setTol: (v: number) => void;
  setMove: (v: number) => void;
  setIlSlider: (v: number) => void;
}

export const DEFAULT_UNITS = 10;

export const useV2 = create<V2State>((set) => ({
  units: DEFAULT_UNITS,
  dir: 'eth',
  arb: false,
  buy: 5,
  depth: 'busy',
  depEth: 10,
  depUsdc: 10_000,
  unbalanced: false,
  removed: false,
  trades: 40,
  riskMode: 'slippage',
  tol: 0.005,
  move: 0.004,
  ilSlider: 50,
  // A new swap makes the earlier arbitrage stale.
  setUnits: (v) => set({ units: clamp(v, 0, MAX_UNITS), arb: false }),
  setDir: (dir) => set({ dir, arb: false }),
  setArb: (arb) => set({ arb }),
  setBuy: (v) => set({ buy: clamp(v, 0, MAX_BUY) }),
  setDepth: (depth) => set({ depth }),
  setDepEth: (v) => set({ depEth: clamp(v, 0, MAX_DEPOSIT_ETH), removed: false }),
  setDepUsdc: (v) => set({ depUsdc: clamp(v, 0, MAX_DEPOSIT_USDC), removed: false }),
  setUnbalanced: (unbalanced) => set({ unbalanced, removed: false }),
  setRemoved: (removed) => set({ removed }),
  setTrades: (v) => set({ trades: Math.round(clamp(v, 0, MAX_TRADES)) }),
  setRiskMode: (riskMode) => set({ riskMode }),
  setTol: (v) => set({ tol: clamp(v, TOL_MIN, TOL_MAX) }),
  setMove: (v) => set({ move: clamp(v, 0, MOVE_MAX) }),
  setIlSlider: (v) => set({ ilSlider: clamp(v, -100, 100) }),
}));

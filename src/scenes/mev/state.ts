import { create } from 'zustand';
import { move, orderByTip, type PendingTx, type SandwichInput } from './logic';

/** Market price of the example pair, USDC per ETH. */
export const PRICE = 2000;
/** Pool depths the slider steps through: the USDC side of the pool. */
export const DEPTHS = [500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000];
export const TRADE = { min: 5_000, max: 200_000, step: 5_000 };
/** Slippage tolerance in percent. */
export const TOL = { min: 0, max: 5, step: 0.1 };
/** Attacker's gas for both transactions, in USDC. An illustrative figure. */
export const GAS = { min: 0, max: 100, step: 5 };
export const MARKET = { min: 1800, max: 2200, step: 10 };
export const PARTS = { min: 1, max: 10 };
export const TIP = { min: 0, max: 5, step: 0.5 };
/** Value of a block to the best builder, in ETH. */
export const BLOCK_VALUE = { min: 0.05, max: 1, step: 0.05 };

/** The ordering game: three swaps against the same pool. Index 0 is the learner. */
export const GAME_TXS: PendingTx[] = [
  { kind: 'buy', amount: 40_000 },
  { kind: 'buy', amount: 60_000 },
  { kind: 'sell', amount: 30 },
];
/** Priority fees of the other two traders, in gwei. */
export const OTHER_TIPS = [2, 3];
export const GAME_POOL = { eth: 1000, usdc: 2_000_000 };

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(Number.isFinite(v) ? v : lo, lo), hi);

interface MevState {
  trade: number;
  depthIndex: number;
  tol: number;
  gas: number;
  /** Which point of the sandwich the pool shows: 0 start, 1 after the front-run, 2 after the victim, 3 after the back-run. */
  stage: number;
  order: number[];
  tip: number;
  byTip: boolean;
  market: number;
  arbDone: boolean;
  isPrivate: boolean;
  parts: number;
  blockValue: number;
  builders: number;
  boost: boolean;
  set: (patch: Partial<Omit<MevState, 'set' | 'moveTx' | 'setTip' | 'setByTip'>>) => void;
  moveTx: (index: number, by: -1 | 1) => void;
  setTip: (v: number) => void;
  setByTip: (on: boolean) => void;
}

const START_ORDER = [1, 0, 2];

export const useMev = create<MevState>((set) => ({
  trade: 40_000,
  depthIndex: 2,
  tol: 1,
  gas: 10,
  stage: 3,
  order: START_ORDER,
  tip: 1,
  byTip: false,
  market: 2080,
  arbDone: false,
  isPrivate: false,
  parts: 1,
  blockValue: 0.3,
  builders: 3,
  boost: true,
  set: (patch) =>
    set((s) => ({
      ...patch,
      trade: clamp(patch.trade ?? s.trade, TRADE.min, TRADE.max),
      depthIndex: Math.round(clamp(patch.depthIndex ?? s.depthIndex, 0, DEPTHS.length - 1)),
      tol: clamp(patch.tol ?? s.tol, TOL.min, TOL.max),
      gas: clamp(patch.gas ?? s.gas, GAS.min, GAS.max),
      stage: Math.round(clamp(patch.stage ?? s.stage, 0, 3)),
      market: clamp(patch.market ?? s.market, MARKET.min, MARKET.max),
      parts: Math.round(clamp(patch.parts ?? s.parts, PARTS.min, PARTS.max)),
      blockValue: clamp(patch.blockValue ?? s.blockValue, BLOCK_VALUE.min, BLOCK_VALUE.max),
      builders: Math.round(clamp(patch.builders ?? s.builders, 1, 4)),
    })),
  moveTx: (index, by) => set((s) => (s.byTip ? s : { order: move(s.order, index, by) })),
  setTip: (v) =>
    set((s) => {
      const tip = clamp(v, TIP.min, TIP.max);
      return { tip, order: s.byTip ? orderByTip([tip, ...OTHER_TIPS], s.order) : s.order };
    }),
  setByTip: (on) => set((s) => ({ byTip: on, order: on ? orderByTip([s.tip, ...OTHER_TIPS], s.order) : s.order })),
}));

/** The sandwich input for the current sliders: the victim sells USDC for ETH. */
export function sandwichInput(s: Pick<MevState, 'trade' | 'depthIndex' | 'tol' | 'gas'>): SandwichInput {
  const usdc = DEPTHS[s.depthIndex] ?? DEPTHS[2];
  return { rIn: usdc, rOut: usdc / PRICE, victimIn: s.trade, tolerance: s.tol / 100, gas: s.gas };
}

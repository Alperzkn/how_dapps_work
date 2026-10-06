import { create } from 'zustand';
import { impermanentLoss, swapV2 } from '../../sim/ammV2';

/** The example pool: 100 ETH and 200,000 USDC, so 1 ETH = 2,000 USDC. */
export const X0 = 100;
export const Y0 = 200_000;
/** The slider sells up to the whole ETH reserve again, which roughly quarters the price. */
export const MAX_IN = 100;
export const DEFAULT_IN = 10;
/** Slippage tolerance used for the "minimum received" figure. */
export const TOLERANCE = 0.005;

const clampIn = (v: number) => (Number.isFinite(v) ? Math.min(Math.max(v, 0), MAX_IN) : 0);

export interface Quote {
  dx: number;
  out: number;
  x: number;
  y: number;
  priceBefore: number;
  priceAfter: number;
  /** Average price paid: USDC received per ETH sold. */
  paid: number;
  impact: number;
  minOut: number;
  /** New pool price / old pool price. */
  ratio: number;
  /** Impermanent loss if the market price really moved by `ratio`. */
  il: number;
}

export function quote(amountIn: number): Quote {
  const dx = clampIn(amountIn);
  const s = swapV2(X0, Y0, dx);
  const ratio = s.priceBefore > 0 ? s.priceAfter / s.priceBefore : 1;
  return {
    dx,
    out: s.out,
    x: s.x,
    y: s.y,
    priceBefore: s.priceBefore,
    priceAfter: s.priceAfter,
    paid: dx > 0 ? s.out / dx : s.priceBefore,
    impact: s.impact,
    minOut: s.out * (1 - TOLERANCE),
    ratio,
    il: impermanentLoss(ratio),
  };
}

interface SwapState {
  dx: number;
  setDx: (v: number) => void;
}

export const useSwap = create<SwapState>((set) => ({
  dx: DEFAULT_IN,
  setDx: (v) => set({ dx: clampIn(v) }),
}));

import { create } from 'zustand';
import { dynamicFeeBps } from '../../sim/v4Hook';

export const VOL_MAX = 10;
export const VOL_STEP = 0.5;

interface FeeState {
  /** Recent volatility in percent, 0-10. */
  volatility: number;
  setVolatility: (v: number) => void;
}

export const useFee = create<FeeState>((set) => ({
  volatility: 2,
  setVolatility: (v) => set({ volatility: Math.min(Math.max(Number.isFinite(v) ? v : 0, 0), VOL_MAX) }),
}));

/** Fee the toy hook charges at a given volatility (percent), in basis points. */
export const feeBpsFor = (volatilityPct: number) => dynamicFeeBps(volatilityPct / 100);

import { create } from 'zustand';
import { dynamicFeeBps } from '../../sim/v4Hook';
import { clampHops, flashCalls, MAX_EXTRA_POOLS, type HookFeature, type HookSet, type Needs } from './logic';

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

interface PlayState {
  /* singleton: pools the learner opened each way */
  oldExtra: number;
  v4Extra: number;
  deployOld: () => void;
  deployV4: () => void;
  resetDeploy: () => void;

  /* flash: the route and how far the transaction has got */
  hops: number;
  skipSettle: boolean;
  callIndex: number;
  setHops: (n: number) => void;
  setSkipSettle: (on: boolean) => void;
  nextCall: () => void;

  /* hooks: behaviours of the pool's hook, and the last swap */
  hook: HookSet;
  /** Goes up with every swap; restarts the animation. */
  swapRun: number;
  /** True once a swap has run with the current hook. */
  swapped: boolean;
  toggleHook: (f: HookFeature) => void;
  runSwap: () => void;

  /* choose: the learner's answers */
  needs: Needs;
  setNeeds: (n: Partial<Needs>) => void;
}

export const usePlay = create<PlayState>((set) => ({
  oldExtra: 0,
  v4Extra: 0,
  deployOld: () => set((s) => ({ oldExtra: Math.min(s.oldExtra + 1, MAX_EXTRA_POOLS) })),
  deployV4: () => set((s) => ({ v4Extra: Math.min(s.v4Extra + 1, MAX_EXTRA_POOLS) })),
  resetDeploy: () => set({ oldExtra: 0, v4Extra: 0 }),

  hops: 2,
  skipSettle: false,
  // Rests after both swaps: the middle token has already cancelled out.
  callIndex: 3,
  setHops: (n) => set({ hops: clampHops(n), callIndex: 0 }),
  setSkipSettle: (on) => set({ skipSettle: on, callIndex: 0 }),
  nextCall: () => set((s) => ({ callIndex: s.callIndex >= flashCalls(s.hops, s.skipSettle).length - 1 ? 0 : s.callIndex + 1 })),

  hook: { dynamic: true, limit: true, twamm: false, malicious: false },
  swapRun: 0,
  swapped: false,
  toggleHook: (f) => set((s) => ({ hook: { ...s.hook, [f]: !s.hook[f] }, swapped: false })),
  runSwap: () => set((s) => ({ swapRun: s.swapRun + 1, swapped: true })),

  needs: { lp: 'passive', custom: false, pair: 'volatile' },
  setNeeds: (n) => set((s) => ({ needs: { ...s.needs, ...n } })),
}));

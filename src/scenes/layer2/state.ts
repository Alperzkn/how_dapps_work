import { create } from 'zustand';
import {
  BATCH_SIZES,
  BLOB_EXP_MAX,
  BLOB_EXP_MIN,
  MAX_DEMAND,
  MAX_ELAPSED_H,
  START_BASE_FEE,
  TRACE_STEPS,
  nextBaseFee,
  optChallenge,
  optInitial,
  optPropose,
  optWait,
  seqInitial,
  seqStep,
  zkAttempt,
  type Corruption,
  type DataMode,
  type OptState,
  type SeqAction,
  type SeqState,
  type ZkResult,
} from './logic';

const num = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);
const within = (v: number, lo: number, hi: number, fallback = lo) => Math.min(hi, Math.max(lo, num(v, fallback)));

export const GAS_MIN = 0.1;
export const GAS_MAX = 100;
export const MAX_DAYS_OLD = 30;

interface L2State {
  /** Step 1: demand for block space in percent of the gas target, and the base fee it has led to. */
  demand: number;
  baseFee: number;
  blocks: number;
  setDemand: (v: number) => void;
  produce: (count: number) => void;
  resetFee: () => void;

  /** Steps 2, 5 and 6: the batch and the prices on L1. */
  batchIndex: number;
  gasGwei: number;
  blobExp: number;
  mode: DataMode;
  daysOld: number;
  setBatchIndex: (v: number) => void;
  setGasGwei: (v: number) => void;
  setBlobExp: (v: number) => void;
  setMode: (m: DataMode) => void;
  setDaysOld: (v: number) => void;

  /** Step 3. */
  sequencerOnline: boolean;
  seq: SeqState;
  setSequencerOnline: (v: boolean) => void;
  seqDo: (a: SeqAction) => void;

  /** Step 4. */
  opt: OptState;
  proposals: number;
  propose: (bad: boolean) => void;
  challenge: () => void;
  waitDay: () => void;

  /** Step 5. */
  corruption: Corruption;
  zk: ZkResult | null;
  setCorruption: (c: Corruption) => void;
  proveAndVerify: () => void;

  /** Step 7: hours since the withdrawal was started, or null before it. */
  elapsed: number | null;
  startWithdrawal: () => void;
  advance: (hours: number) => void;
}

export const useL2 = create<L2State>((set) => ({
  demand: 150,
  baseFee: START_BASE_FEE,
  blocks: 0,
  setDemand: (v) => set({ demand: Math.round(within(v, 0, MAX_DEMAND, 100)) }),
  produce: (count) =>
    set((s) => {
      let fee = s.baseFee;
      for (let i = 0; i < count; i++) fee = nextBaseFee(fee, s.demand);
      return { baseFee: fee, blocks: s.blocks + count };
    }),
  resetFee: () => set({ baseFee: START_BASE_FEE, blocks: 0 }),

  batchIndex: BATCH_SIZES.indexOf(100),
  gasGwei: 10,
  blobExp: 0,
  mode: 'blob',
  daysOld: 0,
  setBatchIndex: (v) => set({ batchIndex: Math.round(within(v, 0, BATCH_SIZES.length - 1)) }),
  setGasGwei: (v) => set({ gasGwei: within(v, GAS_MIN, GAS_MAX, 10) }),
  setBlobExp: (v) => set({ blobExp: within(v, BLOB_EXP_MIN, BLOB_EXP_MAX, 0) }),
  setMode: (mode) => set({ mode }),
  setDaysOld: (v) => set({ daysOld: Math.round(within(v, 0, MAX_DAYS_OLD)) }),

  sequencerOnline: true,
  seq: seqInitial(),
  setSequencerOnline: (sequencerOnline) => set({ sequencerOnline }),
  seqDo: (a) => set((s) => ({ seq: seqStep(s.seq, a, s.sequencerOnline) })),

  opt: optInitial(),
  proposals: 0,
  // The wrong step moves around from one bad proposal to the next.
  propose: (bad) => set((s) => ({ opt: optPropose(bad, 1 + ((s.proposals * 7 + 10) % TRACE_STEPS)), proposals: s.proposals + 1 })),
  challenge: () => set((s) => ({ opt: optChallenge(s.opt) })),
  waitDay: () => set((s) => ({ opt: optWait(s.opt) })),

  corruption: 'none',
  zk: null,
  setCorruption: (corruption) => set({ corruption, zk: null }),
  proveAndVerify: () => set((s) => ({ zk: zkAttempt(s.corruption) })),

  elapsed: null,
  startWithdrawal: () => set({ elapsed: 0 }),
  advance: (hours) => set((s) => (s.elapsed === null ? {} : { elapsed: within(s.elapsed + hours, 0, MAX_ELAPSED_H) })),
}));

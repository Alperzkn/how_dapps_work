import { create } from 'zustand';
import {
  POWERS,
  SNOW_BETA,
  SNOW_MAX_ROUNDS,
  SNOW_NODES,
  TRI_PRESETS,
  clampAlpha,
  clampK,
  ibcInitial,
  ibcNext,
  pohAppend,
  rebalance,
  rng,
  snowInit,
  snowRound,
  snowRun,
  snowTally,
  type Criterion,
  type IbcState,
  type PohEntry,
  type SnowNode,
  type Tri,
} from './logic';

export type Preset = keyof typeof TRI_PRESETS;
export type SolTab = 'lanes' | 'clock';
export type CosTab = 'votes' | 'ibc';
/** Names of the transactions the learner can drop into the hash chain. */
const EVENTS = ['tx A', 'tx B', 'tx C', 'tx D', 'tx E', 'tx F'];
export const POH_MAX = 400;

const pohStart = () => [1, 2, 3, 4, 5].reduce<PohEntry[]>((e) => pohAppend(e), []);

const snowStart = (split: number, seed: number) => ({
  nodes: snowInit(SNOW_NODES, split, seed),
  round: 0,
  sample: [] as number[],
  stalled: false,
});

interface L1State {
  tri: Tri;
  preset: Preset | null;
  setTri: (i: number, value: number) => void;
  setPreset: (p: Preset) => void;

  solTab: SolTab;
  setSolTab: (t: SolTab) => void;
  /** Percent of pending transactions that write the same account. */
  share: number;
  setShare: (v: number) => void;
  poh: PohEntry[];
  tick: () => void;
  insertEvent: () => void;
  resetPoh: () => void;

  k: number;
  alpha: number;
  /** Percent of nodes that start on blue. */
  split: number;
  seed: number;
  nodes: SnowNode[];
  round: number;
  sample: number[];
  /** "Run until decided" hit the round limit. */
  stalled: boolean;
  setK: (v: number) => void;
  setAlpha: (v: number) => void;
  setSplit: (v: number) => void;
  snowStep: () => void;
  snowFinish: () => void;
  snowReset: () => void;

  cosTab: CosTab;
  setCosTab: (t: CosTab) => void;
  online: boolean[];
  toggleValidator: (i: number) => void;
  relayerOnline: boolean;
  setRelayerOnline: (v: boolean) => void;
  ibc: IbcState;
  ibcStep: () => void;

  criterion: Criterion | null;
  setCriterion: (c: Criterion | null) => void;
}

const num = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);

export const useL1 = create<L1State>((set, get) => ({
  tri: TRI_PRESETS.bitcoin,
  preset: 'bitcoin',
  setTri: (i, value) => set((s) => ({ tri: rebalance(s.tri, i, value), preset: null })),
  setPreset: (p) => set({ tri: TRI_PRESETS[p], preset: p }),

  solTab: 'lanes',
  setSolTab: (solTab) => set({ solTab }),
  share: 25,
  setShare: (v) => set({ share: Math.min(100, Math.max(0, Math.round(num(v, 0)))) }),
  poh: pohStart(),
  tick: () => set((s) => (s.poh.length >= POH_MAX ? {} : { poh: pohAppend(s.poh) })),
  insertEvent: () =>
    set((s) => {
      if (s.poh.length >= POH_MAX) return {};
      const used = s.poh.filter((e) => e.event).length;
      return { poh: pohAppend(s.poh, EVENTS[used % EVENTS.length]) };
    }),
  resetPoh: () => set({ poh: pohStart() }),

  k: 5,
  alpha: 4,
  split: 50,
  seed: 1,
  ...snowStart(50, 1),
  setK: (v) =>
    set((s) => {
      const k = clampK(num(v, 1));
      return { k, alpha: clampAlpha(s.alpha, k), ...snowStart(s.split, s.seed) };
    }),
  setAlpha: (v) => set((s) => ({ alpha: clampAlpha(num(v, 1), s.k), ...snowStart(s.split, s.seed) })),
  setSplit: (v) =>
    set((s) => {
      const split = Math.min(100, Math.max(0, Math.round(num(v, 50))));
      return { split, ...snowStart(split, s.seed) };
    }),
  snowStep: () => {
    const s = get();
    if (snowTally(s.nodes).allDecided) return;
    // A fresh generator per round, derived from the seed, so stepping and running agree on nothing but the rule.
    const step = snowRound(s.nodes, s.k, s.alpha, SNOW_BETA, rng(s.seed * 7919 + s.round + 1));
    set({ nodes: step.nodes, sample: step.sample, round: s.round + 1, stalled: false });
  },
  snowFinish: () => {
    const s = get();
    const left = Math.max(0, SNOW_MAX_ROUNDS - s.round);
    const out = snowRun(s.nodes, s.k, s.alpha, SNOW_BETA, rng(s.seed * 7919 + s.round + 1), left);
    set({ nodes: out.nodes, sample: out.sample.length ? out.sample : s.sample, round: s.round + out.rounds, stalled: !out.decided });
  },
  snowReset: () => set((s) => ({ seed: s.seed + 1, ...snowStart(s.split, s.seed + 1) })),

  cosTab: 'votes',
  setCosTab: (cosTab) => set({ cosTab }),
  online: POWERS.map(() => true),
  toggleValidator: (i) => set((s) => ({ online: s.online.map((v, j) => (j === i ? !v : v)) })),
  relayerOnline: true,
  setRelayerOnline: (relayerOnline) => set({ relayerOnline }),
  ibc: ibcInitial(),
  ibcStep: () => set((s) => ({ ibc: ibcNext(s.ibc, s.relayerOnline) })),

  criterion: null,
  setCriterion: (criterion) => set({ criterion }),
}));

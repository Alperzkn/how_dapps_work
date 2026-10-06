import { create } from 'zustand';
import { computeChain, firstBroken, MAX_DEPTH, MAX_SHARE, MIN_DEPTH, MIN_SHARE, ORIGINAL, type UseId } from './logic';

export { computeChain, ORIGINAL };

/** The block the text box edits when the learner has not picked another one. */
export const DEFAULT_BLOCK = 1;
export const DEFAULT_SHARE = 0.1;
export const DEFAULT_DEPTH = 6;
export const MAX_TEXT = 40;

const NONE = ORIGINAL.map(() => false);
const clamp = (v: number, lo: number, hi: number, fallback: number) => (Number.isFinite(v) ? Math.min(Math.max(v, lo), hi) : fallback);

interface ChainState {
  /** Tamper step: the data in each block, which block the box edits, and which later blocks were redone. */
  data: string[];
  redone: boolean[];
  selected: number;
  setData: (index: number, value: string) => void;
  select: (index: number) => void;
  /** Rewrites the stored link of the first block whose link is wrong. */
  redoNext: () => void;
  reset: () => void;

  /** Fingerprint step: the typed text (null = the translated sample) and what it was one edit ago. */
  text: string | null;
  prevText: string | null;
  setText: (value: string, previous: string) => void;

  /** History step: attacker's share of mining power and how many blocks bury the payment. */
  share: number;
  depth: number;
  setShare: (q: number) => void;
  setDepth: (z: number) => void;

  /** Uses step: which kind of record is highlighted. */
  use: UseId;
  setUse: (use: UseId) => void;
}

export const useChain = create<ChainState>((set) => ({
  data: ORIGINAL,
  redone: NONE,
  selected: DEFAULT_BLOCK,
  // Any new edit invalidates repairs made so far: they were computed for the old content.
  setData: (index, value) => set((s) => ({ data: s.data.map((d, i) => (i === index ? value : d)), redone: NONE })),
  select: (index) => set({ selected: clamp(Math.round(index), 0, ORIGINAL.length - 1, DEFAULT_BLOCK) }),
  redoNext: () =>
    set((s) => {
      const at = firstBroken(computeChain(s.data, s.redone));
      return at < 0 ? s : { redone: s.redone.map((r, i) => r || i === at) };
    }),
  reset: () => set({ data: ORIGINAL, redone: NONE }),

  text: null,
  prevText: null,
  setText: (value, previous) => set({ text: value.slice(0, MAX_TEXT), prevText: previous }),

  share: DEFAULT_SHARE,
  depth: DEFAULT_DEPTH,
  setShare: (q) => set({ share: clamp(q, MIN_SHARE, MAX_SHARE, DEFAULT_SHARE) }),
  setDepth: (z) => set({ depth: clamp(Math.round(z), MIN_DEPTH, MAX_DEPTH, DEFAULT_DEPTH) }),

  use: 'payments',
  setUse: (use) => set({ use }),
}));

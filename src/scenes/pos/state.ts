import { create } from 'zustand';
import { advanceEpochs, clampStake, initialChain, pickProposer, runSlots, SLOTS_PER_EPOCH, type ChainState } from './logic';

/** The model network: seven validators in a row. The learner is the one in the middle. */
export const COUNT = 7;
export const YOU = 3;
/** Stake of the six other validators, left to right (skipping the learner), in ETH. */
const OTHER_STAKES = [320, 640, 160, 960, 480, 1280];
export const OTHERS_TOTAL = OTHER_STAKES.reduce((a, b) => a + b, 0);
export const stakesWith = (you: number): number[] => [...OTHER_STAKES.slice(0, YOU), you, ...OTHER_STAKES.slice(YOU)];

/** Order in which the other validators join the learner in being slashed: smallest stake first. */
export const ACCOMPLICES = stakesWith(0)
  .map((s, i) => ({ s, i }))
  .filter((v) => v.i !== YOU)
  .sort((a, b) => a.s - b.s)
  .map((v) => v.i);

/** How far the "skip ahead" button jumps: 512 epochs is about 2.3 days. */
export const SKIP_EPOCHS = 512;
export const DEFAULT_SHARE = 40;

export type AttackSide = 'pow' | 'pos';

interface Draw {
  seed: number;
  /** Slots drawn so far. */
  slots: number;
  tally: number[];
  /** Proposer of the latest slot. */
  last: number;
}

const firstDraw = (stake: number, seed: number): Draw => {
  const last = pickProposer(stakesWith(stake), seed, 0).index;
  const tally = Array.from({ length: COUNT }, (_, i) => (i === last ? 1 : 0));
  return { seed, slots: 1, tally, last };
};

interface PosState extends Draw {
  stake: number;
  offline: boolean[];
  chain: ChainState;
  slashed: boolean;
  /** How many validators are slashed in the same window, the learner included (1 … 7). */
  slashedCount: number;
  attackShare: number;
  attackSide: AttackSide;
  setStake: (v: number) => void;
  draw: (count: number) => void;
  resetDraw: () => void;
  toggleOffline: (i: number) => void;
  advance: (epochs: number) => void;
  resetChain: () => void;
  setSlashed: (v: boolean) => void;
  setSlashedCount: (v: number) => void;
  setAttackShare: (v: number) => void;
  setAttackSide: (v: AttackSide) => void;
}

const SEED = 2026;
const allOnline = () => Array.from({ length: COUNT }, () => false);
const clampInt = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(v) ? v : lo)));

export const usePos = create<PosState>((set, get) => ({
  stake: 32,
  ...firstDraw(32, SEED),
  offline: allOnline(),
  chain: initialChain(stakesWith(32)),
  slashed: false,
  slashedCount: 1,
  attackShare: DEFAULT_SHARE,
  attackSide: 'pos',
  setStake: (v) => {
    const stake = clampStake(v);
    if (stake === get().stake) return;
    // Different stake, different odds and balances: earlier draws and epochs no longer apply.
    set({ stake, ...firstDraw(stake, get().seed), chain: initialChain(stakesWith(stake)) });
  },
  draw: (count) => {
    const s = get();
    const picks = runSlots(stakesWith(s.stake), s.seed, s.slots, clampInt(count, 1, SLOTS_PER_EPOCH * 32));
    if (!picks.length) return;
    const tally = [...s.tally];
    for (const p of picks) if (p >= 0) tally[p]++;
    set({ tally, slots: s.slots + picks.length, last: picks[picks.length - 1] });
  },
  resetDraw: () => set(firstDraw(get().stake, get().seed + 1)),
  toggleOffline: (i) => set({ offline: get().offline.map((o, k) => (k === i ? !o : o)) }),
  advance: (epochs) => {
    const s = get();
    set({ chain: advanceEpochs(s.chain, s.offline.map((o) => !o), clampInt(epochs, 1, 4096)) });
  },
  resetChain: () => set({ chain: initialChain(stakesWith(get().stake)), offline: allOnline() }),
  setSlashed: (slashed) => set(slashed ? { slashed } : { slashed, slashedCount: 1 }),
  setSlashedCount: (v) => set({ slashedCount: clampInt(v, 1, COUNT) }),
  setAttackShare: (v) => set({ attackShare: clampInt(v, 0, 100) }),
  setAttackSide: (attackSide) => set({ attackSide }),
}));

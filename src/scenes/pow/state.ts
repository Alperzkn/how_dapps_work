import { create } from 'zustand';
import { mineStep } from '../../sim/pow';
import { causesFork, minePeriod, rng, simulateAttack, simulateRace, splitShares, type Attempt, type Period } from './logic';

export const MIN_ZEROS = 1;
export const MAX_ZEROS = 5;
/** Hard stop for one run. At 5 zeros (about 1M tries on average) this is reached about 2% of the time. */
export const MAX_ATTEMPTS = 4_000_000;

/** Hashes per call to the search, and how long one timer tick may work before yielding to the page. */
const SLICE = 250;
const BUDGET_MS = 8;

export type MineStatus = 'idle' | 'mining' | 'found' | 'stopped' | 'capped';

/** The candidate block's contents. `run` changes it so every new search has a different answer. */
export const headerFor = (run: number) => `height 840001|prev 00000000000000000002a7c4|txs 2413|run ${run}`;

interface MiningState {
  zeros: number;
  status: MineStatus;
  run: number;
  /** Next nonce to try, or the winning nonce once found. */
  nonce: number;
  attempts: number;
  hash: string;
  elapsedMs: number;
  setZeros: (zeros: number) => void;
  /** Starts a new search, or continues one that was stopped. */
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const clampZeros = (z: number) => Math.min(MAX_ZEROS, Math.max(MIN_ZEROS, Math.round(Number.isFinite(z) ? z : MIN_ZEROS)));

let timer: ReturnType<typeof setTimeout> | null = null;
let lastTick = 0;

const cancel = () => {
  if (timer !== null) clearTimeout(timer);
  timer = null;
};

const fresh = { status: 'idle' as MineStatus, nonce: 0, attempts: 0, hash: '', elapsedMs: 0 };

export const useMining = create<MiningState>((set, get) => {
  const tick = () => {
    timer = null;
    const s = get();
    if (s.status !== 'mining') return;
    const header = headerFor(s.run);
    const t0 = now();
    let { nonce, attempts, hash } = s;
    let found = false;
    while (attempts < MAX_ATTEMPTS && now() - t0 < BUDGET_MS) {
      const r = mineStep(header, nonce, s.zeros, Math.min(SLICE, MAX_ATTEMPTS - attempts));
      attempts += r.tried;
      nonce = r.nonce;
      hash = r.hash;
      if (r.found) {
        found = true;
        break;
      }
    }
    const t1 = now();
    const elapsedMs = s.elapsedMs + Math.max(0, t1 - lastTick);
    lastTick = t1;
    const status: MineStatus = found ? 'found' : attempts >= MAX_ATTEMPTS ? 'capped' : 'mining';
    set({ nonce, attempts, hash, elapsedMs, status });
    if (status === 'mining') timer = setTimeout(tick, 0);
  };

  return {
    zeros: 3,
    run: 0,
    ...fresh,
    setZeros: (zeros) => {
      cancel();
      set({ zeros: clampZeros(zeros), ...fresh });
    },
    start: () => {
      const s = get();
      if (s.status === 'mining') return;
      cancel();
      lastTick = now();
      if (s.status === 'stopped') set({ status: 'mining' });
      else set({ ...fresh, status: 'mining', run: s.run + 1 });
      timer = setTimeout(tick, 0);
    },
    stop: () => {
      cancel();
      if (get().status === 'mining') set({ status: 'stopped' });
    },
    reset: () => {
      cancel();
      set({ ...fresh });
    },
  };
});

// ---------- The other steps' experiments ----------

const num = (v: number, lo: number, hi: number, step = 1) => {
  const x = Number.isFinite(v) ? v : lo;
  return Math.min(hi, Math.max(lo, Math.round(x / step) * step));
};

export const SHARE = { min: 1, max: 90, start: 45 };
export const BATCH = 100;
export const DELAY = { min: 1, max: 20, start: 2 };
/** Seconds after your block at which miner C finds its own. */
export const RIVAL_GAP = 5;
export const HASHRATE = { min: 0.25, max: 4, step: 0.25, start: 2 };
export const ATTACKER = { min: 1, max: 60, start: 30 };
export const CONFIRMATIONS = { min: 1, max: 12, start: 6 };
const RACE_SEED = 20_090_103;

export type Rival = 'none' | 'late' | 'fork' | 'youWin' | 'rivalWins';

interface LabState {
  /** Your share of the hashrate in percent, and the blocks won so far by miner A, you and miner C. */
  share: number;
  wins: number[];
  rounds: number;
  /** Seconds a block needs to reach the other miners, and what happened to miner C's competing block. */
  delay: number;
  rival: Rival;
  /** Network hashrate and difficulty, both relative to where the demo starts. */
  hashrate: number;
  difficulty: number;
  periods: number;
  last: Period | null;
  /** Attacker's share in percent, confirmations the merchant waits for, and the attempts made. */
  attacker: number;
  confirmations: number;
  attempt: Attempt | null;
  attempts: number;
  successes: number;
  seed: number;
  setShare: (percent: number) => void;
  runBlocks: () => void;
  resetRace: () => void;
  setDelay: (seconds: number) => void;
  /** Miner C finds a block; then the next block settles the fork; then everything starts over. */
  advanceRival: () => void;
  setHashrate: (h: number) => void;
  nextPeriod: () => void;
  resetRetarget: () => void;
  setAttacker: (percent: number) => void;
  setConfirmations: (z: number) => void;
  raceOnce: () => void;
}

const firstBatch = (share: number) => simulateRace(splitShares(share / 100), BATCH, rng(RACE_SEED));

export const useLab = create<LabState>((set) => ({
  share: SHARE.start,
  wins: firstBatch(SHARE.start),
  rounds: BATCH,
  delay: DELAY.start,
  rival: 'none',
  hashrate: HASHRATE.start,
  difficulty: 1,
  periods: 0,
  last: null,
  attacker: ATTACKER.start,
  confirmations: CONFIRMATIONS.start,
  attempt: null,
  attempts: 0,
  successes: 0,
  seed: 1,
  setShare: (percent) => {
    const share = num(percent, SHARE.min, SHARE.max);
    set({ share, wins: firstBatch(share), rounds: BATCH });
  },
  runBlocks: () =>
    set((s) => {
      const more = simulateRace(splitShares(s.share / 100), BATCH, rng(RACE_SEED + s.seed * 7919));
      return { wins: s.wins.map((w, i) => w + more[i]), rounds: s.rounds + BATCH, seed: s.seed + 1 };
    }),
  resetRace: () => set((s) => ({ wins: firstBatch(s.share), rounds: BATCH })),
  setDelay: (seconds) => set({ delay: num(seconds, DELAY.min, DELAY.max), rival: 'none' }),
  advanceRival: () =>
    set((s) => {
      if (s.rival === 'none') return { rival: causesFork(s.delay, RIVAL_GAP) ? 'fork' : 'late' };
      if (s.rival === 'fork') {
        // The next block is found by you or miner A (on your block) or by miner C (on its own).
        const shares = splitShares(SHARE.start / 100);
        const onYours = rng(RACE_SEED + s.seed * 104_729)() < shares[0] + shares[1];
        return { rival: onYours ? 'youWin' : 'rivalWins', seed: s.seed + 1 };
      }
      return { rival: 'none' };
    }),
  setHashrate: (h) => set({ hashrate: num(h, HASHRATE.min, HASHRATE.max, HASHRATE.step) }),
  nextPeriod: () =>
    set((s) => {
      const last = minePeriod(s.difficulty, s.hashrate);
      return { last, difficulty: last.difficulty, periods: s.periods + 1 };
    }),
  resetRetarget: () => set({ hashrate: HASHRATE.start, difficulty: 1, periods: 0, last: null }),
  setAttacker: (percent) => set({ attacker: num(percent, ATTACKER.min, ATTACKER.max), attempt: null, attempts: 0, successes: 0 }),
  setConfirmations: (z) => set({ confirmations: num(z, CONFIRMATIONS.min, CONFIRMATIONS.max), attempt: null, attempts: 0, successes: 0 }),
  raceOnce: () =>
    set((s) => {
      const attempt = simulateAttack(s.attacker / 100, s.confirmations, rng(RACE_SEED + s.seed * 15_485_867));
      return { attempt, attempts: s.attempts + 1, successes: s.successes + (attempt.caughtUp ? 1 : 0), seed: s.seed + 1 };
    }),
}));

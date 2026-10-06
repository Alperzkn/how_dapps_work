import { create } from 'zustand';
import { mineStep } from '../../sim/pow';

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

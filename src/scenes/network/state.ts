import { create } from 'zustand';
import { addBlock, CUT_AFTER, FORK_START, type Defect, type ForkState, type Side } from './logic';

export const NODE_COUNT = 9;
export const MIN_FANOUT = 1;
export const MAX_FANOUT = NODE_COUNT - 1;

const int = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(v) ? v : lo)));

interface NetworkState {
  /** Step 1: how many nodes are switched off, and whether the biggest one is among them. */
  offline: number;
  bigDown: boolean;
  /** Step 2: where the transaction starts, peers per node, and a counter that restarts the wave. */
  origin: number;
  fanout: number;
  wave: number;
  /** Steps 3-4: which rule the incoming block breaks, and how many bad blocks the cheater has sent. */
  defect: Defect;
  badSent: number;
  /** Step 5. */
  fork: ForkState;
  setOffline: (n: number) => void;
  setBigDown: (on: boolean) => void;
  setOrigin: (i: number) => void;
  setFanout: (k: number) => void;
  send: () => void;
  setDefect: (d: Defect) => void;
  sendBad: () => void;
  resetBad: () => void;
  land: (side: Side) => void;
  resetFork: () => void;
}

export const useNetwork = create<NetworkState>((set) => ({
  offline: 0,
  bigDown: false,
  origin: 0,
  fanout: 2,
  wave: 0,
  defect: 'none',
  badSent: 1,
  fork: FORK_START,
  // `offline` is the total switched off; the biggest node, when down, is one of them.
  setOffline: (n) => set((s) => ({ offline: int(n, 0, NODE_COUNT - 1), bigDown: int(n, 0, NODE_COUNT - 1) > 0 && s.bigDown })),
  setBigDown: (on) => set((s) => ({ bigDown: on, offline: on ? Math.max(1, s.offline) : s.offline })),
  setOrigin: (i) => set({ origin: int(i, 0, NODE_COUNT - 1) }),
  setFanout: (k) => set({ fanout: int(k, MIN_FANOUT, MAX_FANOUT) }),
  send: () => set((s) => ({ wave: s.wave + 1 })),
  setDefect: (defect) => set({ defect }),
  sendBad: () => set((s) => ({ badSent: Math.min(CUT_AFTER, s.badSent + 1) })),
  resetBad: () => set({ badSent: 1 }),
  land: (side) => set((s) => ({ fork: addBlock(s.fork, side) })),
  resetFork: () => set({ fork: FORK_START }),
}));

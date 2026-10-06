import { create } from 'zustand';
import { sha256 } from '../../sim/sha256';

export const ORIGINAL = ['Genesis', 'Ayşe → Ben: 5', 'Ben → Cem: 2', 'Cem → Ayşe: 1'];
export const EDITABLE = 1;

const ZERO = '0'.repeat(64);
const blockHash = (index: number, prev: string, data: string) => sha256(`${index}|${prev}|${data}`);

export interface ChainBlock {
  data: string;
  /** The previous block's hash as written into this block when it was made. */
  storedPrev: string;
  hash: string;
  edited: boolean;
  /** False once any earlier block was edited: the stored link no longer matches. */
  linked: boolean;
}

/**
 * Each block stores the hash its predecessor had when the chain was built.
 * Editing a block changes its hash, so every later block points at a fingerprint that no longer exists.
 */
export function computeChain(data: string[]): ChainBlock[] {
  const out: ChainBlock[] = [];
  let storedPrev = ZERO;
  let intact = true;
  ORIGINAL.forEach((original, i) => {
    const value = data[i] ?? original;
    out.push({ data: value, storedPrev, hash: blockHash(i, storedPrev, value), edited: value !== original, linked: intact });
    if (value !== original) intact = false;
    storedPrev = blockHash(i, storedPrev, original);
  });
  return out;
}

interface ChainState {
  data: string[];
  setData: (index: number, value: string) => void;
  reset: () => void;
}

export const useChain = create<ChainState>((set) => ({
  data: ORIGINAL,
  setData: (index, value) => set((s) => ({ data: s.data.map((d, i) => (i === index ? value : d)) })),
  reset: () => set({ data: ORIGINAL }),
}));

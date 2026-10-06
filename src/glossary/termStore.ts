import { create } from 'zustand';

interface TermState {
  /** Terms opened one from another; the last is shown. Empty means closed. */
  stack: string[];
  open: (id: string) => void;
  push: (id: string) => void;
  back: () => void;
  close: () => void;
}

export const useTermStore = create<TermState>((set) => ({
  stack: [],
  open: (id) => set({ stack: [id] }),
  push: (id) => set((s) => (s.stack[s.stack.length - 1] === id ? s : { stack: [...s.stack, id] })),
  back: () => set((s) => ({ stack: s.stack.slice(0, -1) })),
  close: () => set({ stack: [] }),
}));

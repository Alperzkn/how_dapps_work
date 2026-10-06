import { create } from 'zustand';
import { cleanAmount, execute, initialToken, signRequest, walletRequest, type Filter, type FilterKind, type Fn, type Outcome, type RequestKind, type RpcMode, type Signed, type TokenState, type Who } from './logic';

export type Decision = 'pending' | 'confirmed' | 'rejected';

/** The last call sent to the contract, kept so the scene can show its result. */
export interface LastRun {
  /** Counts every call, so the scene can replay its drop-in animation. */
  id: number;
  fn: Fn;
  target: Who;
  amount: number;
  ok: boolean;
  outcome: Outcome;
  returned?: number;
}

interface DappState {
  /** Step 1: the operator switches its servers off; the learner may open another frontend. */
  shutDown: boolean;
  otherFrontend: boolean;
  /** Step 3: the wallet prompt. */
  reqKind: RequestKind;
  decision: Decision;
  signature: Signed | null;
  /** Step 4: read or write, and which provider answers. */
  rpcMode: RpcMode;
  providerDown: boolean;
  switched: boolean;
  /** Steps 5 and 6: the call being built, the token it runs against and the log filter. */
  fn: Fn;
  target: Who;
  amount: number;
  token: TokenState;
  last: LastRun | null;
  filter: Filter;
  setShutDown: (on: boolean) => void;
  setOtherFrontend: (on: boolean) => void;
  setReqKind: (k: RequestKind) => void;
  decide: (d: Decision) => void;
  setRpcMode: (m: RpcMode) => void;
  setProviderDown: (on: boolean) => void;
  setSwitched: (on: boolean) => void;
  setFn: (f: Fn) => void;
  setTarget: (w: Who) => void;
  setAmount: (v: number | string) => void;
  /** Send the call as built; `fn` overrides the chosen function (the events step always transfers). */
  run: (fn?: Fn) => void;
  setFilterKind: (k: FilterKind) => void;
  setFilterWho: (w: Who) => void;
}

export const useDapp = create<DappState>((set, get) => ({
  shutDown: false,
  otherFrontend: false,
  reqKind: 'transfer',
  decision: 'pending',
  signature: null,
  rpcMode: 'read',
  providerDown: false,
  switched: false,
  fn: 'transfer',
  target: 'ben',
  amount: 10,
  token: initialToken(),
  last: null,
  filter: { kind: 'all', who: 'ayse' },
  // Another frontend only makes sense while the official one is gone.
  setShutDown: (shutDown) => set({ shutDown, otherFrontend: false }),
  setOtherFrontend: (otherFrontend) => set({ otherFrontend }),
  // A new request starts undecided.
  setReqKind: (reqKind) => set({ reqKind, decision: 'pending', signature: null }),
  decide: (decision) => set({ decision, signature: decision === 'confirmed' ? signRequest(walletRequest(get().reqKind)) : null }),
  setRpcMode: (rpcMode) => set({ rpcMode }),
  setProviderDown: (providerDown) => set({ providerDown, switched: providerDown ? get().switched : false }),
  setSwitched: (switched) => set({ switched }),
  setFn: (fn) => set({ fn }),
  setTarget: (target) => set({ target }),
  setAmount: (v) => set({ amount: cleanAmount(v) }),
  run: (override) => {
    const { token, target, amount, last } = get();
    const fn = override ?? get().fn;
    const r = execute(token, fn, 'ayse', target, amount);
    set({ token: r.state, last: { id: (last?.id ?? 0) + 1, fn, target, amount, ok: r.ok, outcome: r.outcome, returned: r.returned } });
  },
  setFilterKind: (kind) => set({ filter: { ...get().filter, kind } }),
  setFilterWho: (who) => set({ filter: { ...get().filter, who } }),
}));

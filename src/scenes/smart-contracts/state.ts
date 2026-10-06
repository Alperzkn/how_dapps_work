import { create } from 'zustand';
import { ALICE, BOB, CAROL, INCREMENT_CODE, WEI, bankCall, disassemble, evmInit, evmStep, newBank, type Bank, type BankFn, type BankResult, type EvmState } from './logic';

export type Inspect = 'eoa' | 'contract';
export type KeyId = 'alice' | 'bob' | 'carol';
export const KEY_ADDRESS: Record<KeyId, string> = { alice: ALICE, bob: BOB, carol: CAROL };
export const KEY_IDS: KeyId[] = ['alice', 'bob', 'carol'];

/** Deploy step: the sender's nonce. */
export const MAX_NONCE = 20;

/** The program both EVM steps run. */
export const PROGRAM = disassemble(INCREMENT_CODE);
/** Gas the stepper starts with: enough to finish. */
export const STEPPER_GAS = 30_000;

/** Gas step: the transaction's gas limit and a fixed gas price. */
export const MIN_GAS_LIMIT = 21_000;
export const MAX_GAS_LIMIT = 50_000;
export const GAS_LIMIT_STEP = 500;
export const DEFAULT_GAS_LIMIT = 50_000;
export const GAS_PRICE_GWEI = 20;

/** Reentrancy step. */
export const MAX_OTHERS = 12;
export const DEFAULT_OTHERS = 9;

const clamp = (v: number, lo: number, hi: number, fallback: number) => (Number.isFinite(v) ? Math.min(Math.max(Math.round(v), lo), hi) : fallback);

interface ContractsState {
  inspect: Inspect;
  setInspect: (v: Inspect) => void;

  nonce: number;
  setNonce: (n: number) => void;

  /** The piggy bank, shared by the call and storage steps. */
  bank: Bank;
  last: BankResult | null;
  /** Counts calls, so the scene can replay the packet animation. */
  seq: number;
  call: (fn: BankFn, caller?: string) => void;
  resetBank: () => void;
  key: KeyId;
  setKey: (k: KeyId) => void;

  evm: EvmState;
  step: () => void;
  run: () => void;
  resetEvm: () => void;

  gasLimit: number;
  nonZero: boolean;
  setGasLimit: (g: number) => void;
  setNonZero: (v: boolean) => void;

  others: number;
  effectsFirst: boolean;
  /** How many events of the attack trace have played. */
  attackStep: number;
  setOthers: (n: number) => void;
  setEffectsFirst: (v: boolean) => void;
  setAttackStep: (n: number) => void;
}

export const useContracts = create<ContractsState>((set) => ({
  inspect: 'contract',
  setInspect: (inspect) => set({ inspect }),

  nonce: 0,
  setNonce: (n) => set({ nonce: clamp(n, 0, MAX_NONCE, 0) }),

  bank: newBank(),
  last: null,
  seq: 0,
  call: (fn, caller = ALICE) =>
    set((s) => {
      const r = bankCall(s.bank, fn, caller, WEI);
      return { bank: r.state, last: r, seq: s.seq + 1 };
    }),
  resetBank: () => set({ bank: newBank(), last: null, seq: 0 }),
  key: 'alice',
  setKey: (key) => set({ key }),

  evm: evmInit(STEPPER_GAS),
  step: () => set((s) => ({ evm: evmStep(PROGRAM, s.evm) })),
  run: () =>
    set((s) => {
      let e = s.evm;
      for (let i = 0; i < 100 && e.status === 'running'; i += 1) e = evmStep(PROGRAM, e);
      return { evm: e };
    }),
  resetEvm: () => set({ evm: evmInit(STEPPER_GAS) }),

  gasLimit: DEFAULT_GAS_LIMIT,
  nonZero: false,
  setGasLimit: (g) => set({ gasLimit: clamp(g, MIN_GAS_LIMIT, MAX_GAS_LIMIT, DEFAULT_GAS_LIMIT) }),
  setNonZero: (nonZero) => set({ nonZero }),

  others: DEFAULT_OTHERS,
  effectsFirst: false,
  attackStep: 0,
  setOthers: (n) => set({ others: clamp(n, 0, MAX_OTHERS, DEFAULT_OTHERS), attackStep: 0 }),
  setEffectsFirst: (effectsFirst) => set({ effectsFirst, attackStep: 0 }),
  setAttackStep: (n) => set({ attackStep: Math.max(0, Math.floor(Number.isFinite(n) ? n : 0)) }),
}));

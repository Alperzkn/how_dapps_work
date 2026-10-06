import { create } from 'zustand';
import {
  applyPayment,
  counterProgram,
  evmRun,
  evmStart,
  evmStep,
  gasAtFullness,
  GWEI,
  GWEI_PER_ETH,
  LAST_HALVING,
  makeSpend,
  nextBaseFee,
  planPayment,
  SAT,
  scriptRun,
  scriptStart,
  scriptStep,
  transfer,
  type Accounts,
  type EvmState,
  type MempoolTx,
  type PaymentPlan,
  type ScriptState,
  type Utxo,
} from './logic';

export type Side = 'btc' | 'eth';

/* ---------- Ledger ---------- */

/** Alice starts with four coins worth 2 BTC, and with 2 ETH in her account. */
const WALLET: Utxo[] = [0.5, 0.3, 0.8, 0.4].map((v, i) => ({ id: `a${i}`, owner: 'alice', value: Math.round(v * SAT) }));
const ACCOUNTS: Accounts = { alice: 2 * GWEI_PER_ETH, bob: GWEI_PER_ETH, aliceNonce: 7 };
/** The payment slider, in hundredths of a coin. */
export const AMOUNT = { min: 10, max: 100, step: 5, initial: 60 };
/** Slider value (hundredths of a coin) to satoshis or gwei: both units have at least 8 decimals. */
export const toSats = (hundredths: number) => hundredths * (SAT / 100);
export const toGwei = (hundredths: number) => hundredths * (GWEI_PER_ETH / 100);

/* ---------- Programs ---------- */

export const GAS_LIMIT = 60_000;
export const LOW_GAS_LIMIT = 25_000;
export const SLOT_START = 5n;
export const PROGRAM = counterProgram(3);
const spends = { right: makeSpend(false), wrong: makeSpend(true) };
export const spendFor = (wrong: boolean) => (wrong ? spends.wrong : spends.right);
const gasFor = (low: boolean) => (low ? LOW_GAS_LIMIT : GAS_LIMIT);

/* ---------- Fees ---------- */

/** Five transactions already waiting, each 200 vB, and room for three in the next block. */
export const OTHER_TXS: MempoolTx[] = [12, 40, 2, 25, 5].map((feeRate, i) => ({ id: `t${i}`, feeRate, vsize: 200 }));
export const YOUR_VSIZE = 200;
export const BLOCK_SPACE = 600;
export const FEE_RATE = { min: 1, max: 60, initial: 20 };
/** The model block: a 30M gas limit, so the target is 15M. */
export const GAS_TARGET = 15_000_000n;
export const START_BASE_FEE = 10n * GWEI;
/** The learner's transfer on the Ethereum side: fee cap and tip. */
export const MAX_FEE = 30n * GWEI;
export const MAX_PRIORITY = 2n * GWEI;
/** Base fees kept for the bar chart, oldest first. */
export const HISTORY = 6;

/* ---------- Supply ---------- */

export const STAKED = { min: 5, max: 80, initial: 36 };
export const BURN_FEE = { min: 0, max: 60, step: 0.5, initial: 5 };

interface State {
  side: Side;
  setSide: (side: Side) => void;

  amount: number;
  utxos: Utxo[];
  accounts: Accounts;
  /** Transactions sent so far. */
  sent: number;
  /** The latest Bitcoin payment, for labelling its outputs. */
  lastPlan: PaymentPlan | null;
  setAmount: (v: number) => void;
  send: () => void;
  resetLedger: () => void;

  /** True until the learner touches a control: the scene plays both programs by itself. */
  auto: boolean;
  wrongSig: boolean;
  lowGas: boolean;
  script: ScriptState;
  evm: EvmState;
  autoTick: () => void;
  stepProgram: () => void;
  runProgram: () => void;
  resetProgram: () => void;
  setWrongSig: (v: boolean) => void;
  setLowGas: (v: boolean) => void;

  feeRate: number;
  fullness: number;
  /** Base fee of each recent block in wei, oldest first; the last one is the current block's. */
  baseFees: bigint[];
  blockNumber: number;
  setFeeRate: (v: number) => void;
  setFullness: (v: number) => void;
  nextBlock: () => void;
  resetFees: () => void;

  halvings: number;
  staked: number;
  burnFee: number;
  setHalvings: (v: number) => void;
  setStaked: (v: number) => void;
  setBurnFee: (v: number) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
const finished = (s: State) => s.script.status !== 'running' && s.evm.status !== 'running';
let rest = 0;

export const useChains = create<State>((set, get) => ({
  side: 'btc',
  setSide: (side) => set({ side }),

  amount: AMOUNT.initial,
  utxos: WALLET,
  accounts: ACCOUNTS,
  sent: 0,
  lastPlan: null,
  setAmount: (v) => set({ amount: Math.round(clamp(v, AMOUNT.min, AMOUNT.max) / AMOUNT.step) * AMOUNT.step }),
  send: () => {
    const s = get();
    const plan = planPayment(
      s.utxos.filter((c) => c.owner === 'alice'),
      toSats(s.amount),
    );
    const eth = transfer(s.accounts, toGwei(s.amount));
    if (!plan.ok && !eth.ok) return;
    set({ utxos: applyPayment(s.utxos, plan, s.sent + 1), accounts: eth.next, sent: s.sent + 1, lastPlan: plan.ok ? plan : s.lastPlan });
  },
  resetLedger: () => set({ utxos: WALLET, accounts: ACCOUNTS, sent: 0, lastPlan: null }),

  // Both programs start finished, so a still scene (reduced motion) shows the result.
  auto: true,
  wrongSig: false,
  lowGas: false,
  script: scriptRun(spends.right),
  evm: evmRun(GAS_LIMIT, SLOT_START, PROGRAM),
  autoTick: () => {
    const s = get();
    if (!s.auto) return;
    if (finished(s)) {
      // Hold the result for a moment, then start over.
      if (++rest < 3) return;
      rest = 0;
      set({ script: scriptStart(), evm: evmStart(gasFor(s.lowGas), SLOT_START) });
      return;
    }
    set({ script: scriptStep(s.script, spendFor(s.wrongSig)), evm: evmStep(s.evm, PROGRAM) });
  },
  stepProgram: () => {
    const s = get();
    // The first press takes over from the automatic run and starts both programs from the top.
    const script = s.auto ? scriptStart() : s.script;
    const evm = s.auto ? evmStart(gasFor(s.lowGas), SLOT_START) : s.evm;
    set(s.side === 'btc' ? { auto: false, evm, script: scriptStep(script, spendFor(s.wrongSig)) } : { auto: false, script, evm: evmStep(evm, PROGRAM) });
  },
  runProgram: () => {
    const s = get();
    const idle = { script: s.auto ? scriptStart() : s.script, evm: s.auto ? evmStart(gasFor(s.lowGas), SLOT_START) : s.evm };
    set(s.side === 'btc' ? { ...idle, auto: false, script: scriptRun(spendFor(s.wrongSig)) } : { ...idle, auto: false, evm: evmRun(gasFor(s.lowGas), SLOT_START, PROGRAM) });
  },
  resetProgram: () => set({ auto: false, script: scriptStart(), evm: evmStart(gasFor(get().lowGas), SLOT_START) }),
  // Changing the input reruns that program to its end, so the effect shows at once.
  setWrongSig: (wrongSig) => set({ wrongSig, auto: false, script: scriptRun(spendFor(wrongSig)), evm: get().auto ? evmRun(gasFor(get().lowGas), SLOT_START, PROGRAM) : get().evm }),
  setLowGas: (lowGas) => set({ lowGas, auto: false, evm: evmRun(gasFor(lowGas), SLOT_START, PROGRAM), script: get().auto ? scriptRun(spendFor(get().wrongSig)) : get().script }),

  feeRate: FEE_RATE.initial,
  fullness: 150,
  baseFees: [START_BASE_FEE],
  blockNumber: 1,
  setFeeRate: (v) => set({ feeRate: Math.round(clamp(v, FEE_RATE.min, FEE_RATE.max)) }),
  setFullness: (v) => set({ fullness: Math.round(clamp(v, 0, 200)) }),
  nextBlock: () => {
    const s = get();
    const base = s.baseFees[s.baseFees.length - 1];
    const next = nextBaseFee(base, gasAtFullness(s.fullness, GAS_TARGET), GAS_TARGET);
    set({ baseFees: [...s.baseFees, next].slice(-HISTORY), blockNumber: s.blockNumber + 1 });
  },
  resetFees: () => set({ baseFees: [START_BASE_FEE], blockNumber: 1 }),

  halvings: 4,
  staked: STAKED.initial,
  burnFee: BURN_FEE.initial,
  setHalvings: (v) => set({ halvings: Math.round(clamp(v, 0, LAST_HALVING)) }),
  setStaked: (v) => set({ staked: Math.round(clamp(v, STAKED.min, STAKED.max)) }),
  setBurnFee: (v) => set({ burnFee: Math.round(clamp(v, BURN_FEE.min, BURN_FEE.max) / BURN_FEE.step) * BURN_FEE.step }),
}));

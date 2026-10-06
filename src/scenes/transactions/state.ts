import { create } from 'zustand';
import { addressOf, keccakText, publicKeyOf, randomPrivateKey } from '../../sim/keys';
import { clampBase, clampTip, DEFAULT_BASE, DEFAULT_TIP, NODE_COUNT } from './logic';

export interface KeyPair {
  privateKey: string;
  publicKey: string;
  address: string;
}

/** Derives the public key and address. Demo keys only: never use one for real funds. */
export function keyPair(privateKey: string): KeyPair {
  const publicKey = publicKeyOf(privateKey);
  return { privateKey, publicKey, address: addressOf(publicKey) };
}

// Fixed starting keys, so the scene looks the same on every visit until the learner makes a new wallet.
const ALICE = keyPair(keccakText('how-dapps-work demo key: Alice'));
export const BOB = keyPair(keccakText('how-dapps-work demo key: Bob'));

export const MAX_MESSAGE = 40;

interface TxState {
  /** Alice's current wallet. */
  wallet: KeyPair;
  /** How many wallets the learner has generated. */
  generated: number;
  newWallet: () => void;

  /** The text in the message box; null = the translated default. */
  message: string | null;
  /** The text the current signature was made over; null = the translated default. */
  signedMessage: string | null;
  /** Whose public key checks the signature. */
  verifier: 'alice' | 'bob';
  setMessage: (text: string) => void;
  /** Signs whatever is in the box right now. */
  sign: () => void;
  setVerifier: (who: 'alice' | 'bob') => void;

  /** Which node the wallet hands the transaction to. */
  first: number;
  setFirst: (node: number) => void;

  /** Alice's maxPriorityFeePerGas and the current base fee, in gwei. */
  tip: number;
  baseFee: number;
  setTip: (gwei: number) => void;
  setBaseFee: (gwei: number) => void;

  /** Blocks produced since the transaction entered the mempool (at least 1 once a block exists). */
  blocks: number;
  produce: (max: number) => void;
  restart: () => void;
}

export const useTx = create<TxState>((set) => ({
  wallet: ALICE,
  generated: 0,
  newWallet: () => set((s) => ({ wallet: keyPair(randomPrivateKey()), generated: s.generated + 1 })),

  message: null,
  signedMessage: null,
  verifier: 'alice',
  setMessage: (text) => set({ message: text.slice(0, MAX_MESSAGE) }),
  sign: () => set((s) => ({ signedMessage: s.message })),
  setVerifier: (who) => set({ verifier: who }),

  first: 0,
  setFirst: (node) => set({ first: Math.min(Math.max(Math.round(Number.isFinite(node) ? node : 0), 0), NODE_COUNT - 1) }),

  // Changing the fees changes who gets into which block, so block production starts over.
  tip: DEFAULT_TIP,
  baseFee: DEFAULT_BASE,
  setTip: (gwei) => set({ tip: clampTip(gwei), blocks: 1 }),
  setBaseFee: (gwei) => set({ baseFee: clampBase(gwei), blocks: 1 }),

  blocks: 1,
  produce: (max) => set((s) => ({ blocks: Math.min(s.blocks + 1, Math.max(1, Math.floor(max))) })),
  restart: () => set({ blocks: 1 }),
}));

import { create } from 'zustand';
import {
  ALICE,
  BOB,
  DEX,
  MAX_UINT256,
  approve,
  balanceOf,
  burn,
  mint,
  newErc20,
  newErc721,
  newWeth,
  nftTransferFrom,
  parseRaw,
  parseUnits,
  transfer,
  transferFrom,
  wethSetWrapped,
  type Erc20,
  type Erc20Result,
  type Erc721,
  type Erc721Result,
  type Weth,
  type WethResult,
} from './logic';

export const DECIMALS = 18;
export const UNIT = 10n ** BigInt(DECIMALS);
export const tokens = (n: number) => BigInt(Math.round(n)) * UNIT;

export type Who = 'alice' | 'bob' | 'dex';
export const ADDRESS: Record<Who, string> = { alice: ALICE, bob: BOB, dex: DEX };
export const WHO: Who[] = ['alice', 'bob', 'dex'];

const freshToken = () => newErc20(DECIMALS, { [ALICE]: tokens(100), [BOB]: tokens(20), [DEX]: 0n });

/** Supply step: how much one press mints or burns. */
export const MINT_STEP = 50;
/** Approve step: what the exchange tries to pull with its first button. */
export const PULL = 30;
export const MAX_ALLOW = 100;
export const DEFAULT_ALLOW = 40;

/** Decimals step. */
export const DECIMAL_CHOICES = [0, 6, 8, 18] as const;
export const DEFAULT_RAW = '2500000';
export const MAX_RAW_DIGITS = 24;

/** Wrap step: Alice's ETH, and WETH that other people already hold. */
export const WALLET_ETH = 10;
export const OTHERS_WETH = 5;
const freshWeth = () => newWeth(tokens(WALLET_ETH), tokens(OTHERS_WETH));

/** NFT step. */
export const TOKEN_IDS = [1, 2, 3, 4] as const;
const freshNft = () => newErc721({ '1': ALICE, '2': ALICE, '3': BOB, '4': ALICE });

/** What the last ERC-20 call was, so the scene can animate it. */
export type TokenAction = 'transfer' | 'mint' | 'burn' | 'approve' | 'transferFrom';

interface TokensState {
  token: Erc20;
  last: (Erc20Result & { action: TokenAction }) | null;
  seq: number;
  amountText: string;
  to: Who;
  setAmountText: (t: string) => void;
  setTo: (w: Who) => void;
  sendTransfer: () => void;
  doMint: () => void;
  doBurn: () => void;
  allow: number;
  unlimited: boolean;
  setAllow: (n: number) => void;
  setUnlimited: (v: boolean) => void;
  doApprove: () => void;
  doRevoke: () => void;
  /** The exchange calls transferFrom(Alice, DEX, amount); `all` asks for Alice's whole balance. */
  doPull: (all: boolean) => void;
  resetToken: () => void;

  rawText: string;
  decimals: number;
  setRawText: (t: string) => void;
  setDecimals: (d: number) => void;

  weth: Weth;
  lastWeth: WethResult | null;
  wethSeq: number;
  setWrapped: (n: number) => void;

  nft: Erc721;
  tokenId: number;
  caller: 'alice' | 'bob';
  lastNft: Erc721Result | null;
  nftSeq: number;
  setTokenId: (id: number) => void;
  setCaller: (c: 'alice' | 'bob') => void;
  sendNft: () => void;
  resetNft: () => void;
}

const clamp = (v: number, lo: number, hi: number, fallback: number) => (Number.isFinite(v) ? Math.min(Math.max(Math.round(v), lo), hi) : fallback);

export const useTokens = create<TokensState>((set) => {
  const apply = (action: TokenAction, run: (t: Erc20) => Erc20Result) =>
    set((s) => {
      const r = run(s.token);
      return { token: r.state, last: { ...r, action }, seq: s.seq + 1 };
    });
  return {
    token: freshToken(),
    last: null,
    seq: 0,
    amountText: '25',
    to: 'bob',
    setAmountText: (t) => set({ amountText: t.slice(0, 30) }),
    setTo: (to) => set({ to }),
    sendTransfer: () =>
      set((s) => {
        const value = parseUnits(s.amountText, DECIMALS);
        if (value === null) return {};
        const r = transfer(s.token, ALICE, ADDRESS[s.to], value);
        return { token: r.state, last: { ...r, action: 'transfer' }, seq: s.seq + 1 };
      }),
    doMint: () => apply('mint', (t) => mint(t, ALICE, tokens(MINT_STEP))),
    doBurn: () => apply('burn', (t) => burn(t, ALICE, tokens(MINT_STEP))),
    allow: DEFAULT_ALLOW,
    unlimited: false,
    setAllow: (n) => set({ allow: clamp(n, 0, MAX_ALLOW, DEFAULT_ALLOW) }),
    setUnlimited: (unlimited) => set({ unlimited }),
    doApprove: () => set((s) => {
      const r = approve(s.token, ALICE, DEX, s.unlimited ? MAX_UINT256 : tokens(s.allow));
      return { token: r.state, last: { ...r, action: 'approve' }, seq: s.seq + 1 };
    }),
    doRevoke: () => apply('approve', (t) => approve(t, ALICE, DEX, 0n)),
    doPull: (all) => apply('transferFrom', (t) => transferFrom(t, DEX, ALICE, DEX, all ? balanceOf(t, ALICE) : tokens(PULL))),
    resetToken: () => set({ token: freshToken(), last: null, seq: 0 }),

    rawText: DEFAULT_RAW,
    decimals: 6,
    setRawText: (t) => set({ rawText: parseRaw(t, MAX_RAW_DIGITS).toString() }),
    setDecimals: (d) => set({ decimals: clamp(d, 0, 18, 18) }),

    weth: freshWeth(),
    lastWeth: null,
    wethSeq: 0,
    setWrapped: (n) =>
      set((s) => {
        const r = wethSetWrapped(s.weth, tokens(clamp(n, 0, WALLET_ETH, 0)));
        if (r.state === s.weth || r.state.walletWeth === s.weth.walletWeth) return {};
        return { weth: r.state, lastWeth: r, wethSeq: s.wethSeq + 1 };
      }),

    nft: freshNft(),
    tokenId: 2,
    caller: 'alice',
    lastNft: null,
    nftSeq: 0,
    // A new choice clears the last result, so an old "revert" does not stick to another token.
    setTokenId: (id) => set({ tokenId: clamp(id, 1, 4, 1), lastNft: null }),
    setCaller: (caller) => set({ caller, lastNft: null }),
    sendNft: () =>
      set((s) => {
        const from = ADDRESS[s.caller];
        const to = s.caller === 'alice' ? BOB : ALICE;
        const r = nftTransferFrom(s.nft, from, from, to, BigInt(s.tokenId));
        return { nft: r.state, lastNft: r, nftSeq: s.nftSeq + 1 };
      }),
    resetNft: () => set({ nft: freshNft(), lastNft: null, nftSeq: 0 }),
  };
});

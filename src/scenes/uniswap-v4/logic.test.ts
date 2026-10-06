import { describe, expect, it } from 'vitest';
import {
  clampHops,
  deployTotals,
  flagBits,
  flashCalls,
  flashState,
  HOOK_FEATURES,
  hookAddressSuffix,
  hookFlags,
  hookSwap,
  MAX_EXTRA_POOLS,
  OLD_POOL_GAS,
  ROUTE_TOKENS,
  routeAmounts,
  suggestVersion,
  V4_POOL_GAS,
  type HookSet,
} from './logic';

const finite = (o: object) => Object.values(o).every((v) => typeof v !== 'number' || Number.isFinite(v));

describe('deployTotals', () => {
  it('starts with three pools on each side and no gas spent', () => {
    expect(deployTotals(0, 0)).toEqual({ oldContracts: 3, oldGas: 0, v4Contracts: 1, v4Pools: 3, v4Gas: 0 });
  });
  it('adds a contract per pool the old way, only an entry in v4', () => {
    const t = deployTotals(2, 3);
    expect(t.oldContracts).toBe(5);
    expect(t.oldGas).toBe(2 * OLD_POOL_GAS);
    expect(t.v4Contracts).toBe(1);
    expect(t.v4Pools).toBe(6);
    expect(t.v4Gas).toBe(3 * V4_POOL_GAS);
    expect(V4_POOL_GAS).toBe(OLD_POOL_GAS / 100);
  });
  it('clamps out-of-range and broken input', () => {
    expect(deployTotals(99, -5)).toEqual(deployTotals(MAX_EXTRA_POOLS, 0));
    expect(finite(deployTotals(NaN, Infinity))).toBe(true);
  });
});

describe('flash route', () => {
  it('clamps the hop count', () => {
    expect([0, 1, 2, 3, 9, NaN].map(clampHops)).toEqual([1, 1, 2, 3, 3, 1]);
  });
  it('matches the amounts used in the lesson text', () => {
    expect(routeAmounts(2)).toEqual([1, 2000, 1999]);
    expect(routeAmounts(3)[3]).toBeCloseTo(0.033317, 6);
  });
  it('lists the calls in order', () => {
    expect(flashCalls(2, false).map((c) => c.kind)).toEqual(['idle', 'unlock', 'swap', 'swap', 'settle', 'take', 'end']);
    expect(flashCalls(1, true).map((c) => c.kind)).toEqual(['idle', 'unlock', 'swap', 'take', 'end']);
    expect(flashCalls(3, false)).toHaveLength(8);
  });
  it('nets the middle token away after the second swap', () => {
    const s = flashState(2, false, 3);
    expect(s.deltas).toEqual({ ETH: -1, USDC: 0, DAI: 1999, WBTC: 0 });
    expect(s.nonZero).toBe(2);
    expect(s.status).toBe('open');
    expect(s.transfersV3).toBe(4);
    expect(s.transfersV4).toBe(0);
  });
  it('shows the middle token on the tab after the first swap only', () => {
    expect(flashState(2, false, 2).deltas).toEqual({ ETH: -1, USDC: 2000, DAI: 0, WBTC: 0 });
  });
  it.each([1, 2, 3])('settles to zero with %i hop(s): v3 needs two transfers per hop, v4 two in total', (hops) => {
    const last = flashCalls(hops, false).length - 1;
    const s = flashState(hops, false, last);
    expect(s.status).toBe('settled');
    expect(s.nonZero).toBe(0);
    expect(Object.values(s.deltas).every((d) => d === 0)).toBe(true);
    expect(s.transfersV3).toBe(hops * 2);
    expect(s.totalV3).toBe(hops * 2);
    expect(s.transfersV4).toBe(2);
    expect(s.totalV4).toBe(2);
  });
  it.each([1, 2, 3])('reverts with %i hop(s) when settle is forgotten', (hops) => {
    const last = flashCalls(hops, true).length - 1;
    const s = flashState(hops, true, last);
    expect(s.status).toBe('reverted');
    expect(s.deltas.ETH).toBe(-1);
    expect(s.nonZero).toBe(1);
    expect(s.transfersV4).toBe(0);
  });
  it('is idle at index 0 and clamps the index', () => {
    expect(flashState(3, false, 0).status).toBe('idle');
    expect(flashState(3, false, -4).index).toBe(0);
    expect(flashState(3, false, 999).status).toBe('settled');
    expect(flashState(NaN, false, NaN).status).toBe('idle');
  });
  it('never produces a non-finite number', () => {
    for (const hops of [1, 2, 3])
      for (const skip of [false, true])
        for (let i = 0; i < 9; i++) {
          const s = flashState(hops, skip, i);
          expect(ROUTE_TOKENS.every((t) => Number.isFinite(s.deltas[t]))).toBe(true);
          expect(finite(s)).toBe(true);
        }
  });
});

describe('hooks', () => {
  const none: HookSet = { dynamic: false, limit: false, twamm: false, malicious: false };
  const all: HookSet = { dynamic: true, limit: true, twamm: true, malicious: true };

  it('encodes the swap permissions in the address bits', () => {
    expect(hookFlags(none)).toBe(0);
    expect(hookAddressSuffix(hookFlags(none))).toBe('0000');
    expect(hookAddressSuffix(hookFlags({ dynamic: true, limit: true }))).toBe('00C0');
    expect(hookAddressSuffix(hookFlags({ twamm: true }))).toBe('0080');
    expect(hookAddressSuffix(hookFlags({ limit: true }))).toBe('0040');
    expect(hookAddressSuffix(hookFlags({ malicious: true }))).toBe('0044');
    expect(hookAddressSuffix(hookFlags(all))).toBe('00C4');
    expect(flagBits(hookFlags(all))).toEqual([7, 6, 2]);
    expect(flagBits(0)).toEqual([]);
    expect(flagBits(NaN)).toEqual([]);
  });
  it('a pool without a hook is a plain 0.30% swap with no callbacks', () => {
    const s = hookSwap(none);
    expect(s.before).toBe(false);
    expect(s.after).toBe(false);
    expect(s.feeBps).toBe(30);
    expect(s.received).toBeCloseTo(19743.16, 1);
    expect(s.hookTake).toBe(0);
    expect(s.ordersFilled).toBe(0);
  });
  it('the dynamic fee is set in beforeSwap and lowers the output', () => {
    const s = hookSwap({ dynamic: true });
    expect(s.before).toBe(true);
    expect(s.after).toBe(false);
    expect(s.feeBps).toBe(62);
    expect(s.received).toBeLessThan(hookSwap(none).received);
  });
  it('TWAMM trades first, in beforeSwap, and worsens the price', () => {
    const s = hookSwap({ twamm: true });
    expect(s.beforeActs).toEqual(['twamm']);
    expect(s.twammSold).toBe(5);
    expect(s.received).toBeLessThan(hookSwap(none).received);
  });
  it('a limit order is filled in afterSwap without changing the swap', () => {
    const s = hookSwap({ limit: true });
    expect(s.afterActs).toEqual(['limit']);
    expect(s.ordersFilled).toBe(1);
    expect(s.received).toBe(hookSwap(none).received);
  });
  it('the malicious hook keeps a tenth of the output', () => {
    const s = hookSwap({ malicious: true });
    expect(s.hookTake).toBeCloseTo(s.poolOut * 0.1, 9);
    expect(s.received + s.hookTake).toBeCloseTo(s.poolOut, 9);
    expect(s.poolOut).toBe(hookSwap(none).poolOut);
  });
  it('every combination gives finite, positive results', () => {
    for (let m = 0; m < 16; m++) {
      const on = Object.fromEntries(HOOK_FEATURES.map((f, i) => [f, Boolean(m & (1 << i))])) as HookSet;
      const s = hookSwap(on);
      expect(finite(s)).toBe(true);
      expect(s.received).toBeGreaterThan(0);
      expect(s.priceAfter).toBeGreaterThan(0);
      expect(s.before).toBe(on.dynamic || on.twamm);
      expect(s.after).toBe(on.limit || on.malicious);
    }
  });
});

describe('suggestVersion', () => {
  it('custom logic always means v4', () => {
    for (const lp of ['passive', 'active'] as const)
      for (const pair of ['volatile', 'stable'] as const) expect(suggestVersion({ lp, custom: true, pair })).toEqual({ version: 4, reason: 'custom' });
  });
  it('covers the four standard cases', () => {
    expect(suggestVersion({ lp: 'passive', custom: false, pair: 'volatile' })).toEqual({ version: 2, reason: 'passiveVolatile' });
    expect(suggestVersion({ lp: 'passive', custom: false, pair: 'stable' })).toEqual({ version: 3, reason: 'passiveStable' });
    expect(suggestVersion({ lp: 'active', custom: false, pair: 'volatile' })).toEqual({ version: 3, reason: 'activeVolatile' });
    expect(suggestVersion({ lp: 'active', custom: false, pair: 'stable' })).toEqual({ version: 3, reason: 'activeStable' });
  });
});

import { describe, expect, it } from 'vitest';
import { getAmountOut, impermanentLoss, lpMinted, swapV2 } from './ammV2';
import { amountsForLiquidity, capitalEfficiency, inRange, liquidityForValue, priceToTick, snapTick, sqrtPriceX96, tickToPrice } from './ammV3';
import { expectedAttempts, mineStep } from './pow';
import { sha256 } from './sha256';
import { dynamicFeeBps, netDeltas } from './v4Hook';

const finite = (...ns: number[]) => ns.every((n) => Number.isFinite(n));

describe('pow', () => {
  it('finds a nonce whose hash meets the difficulty', () => {
    const r = mineStep('block-1', 0, 2, 100_000);
    expect(r.found).toBe(true);
    expect(r.hash.startsWith('00')).toBe(true);
    expect(sha256(`block-1|${r.nonce}`)).toBe(r.hash);
    expect(r.tried).toBe(r.nonce + 1);
  });

  it('resumes from where a slice stopped', () => {
    const whole = mineStep('block-2', 0, 2, 100_000);
    let r = mineStep('block-2', 0, 2, 7);
    while (!r.found) r = mineStep('block-2', r.nonce, 2, 7);
    expect(r.nonce).toBe(whole.nonce);
  });

  it('clamps silly inputs instead of hanging or throwing', () => {
    expect(mineStep('x', 0, 0, 5).found).toBe(true);
    expect(mineStep('x', -4, Number.NaN, 0).found).toBe(true);
    expect(mineStep('x', 0, 99, 50)).toMatchObject({ found: false, tried: 50 });
    expect(expectedAttempts(3)).toBe(4096);
    expect(expectedAttempts(99)).toBe(16 ** 8);
  });
});

describe('uniswap v2', () => {
  it('matches the contract formula', () => {
    // 1000 * 997 * 100000 / (100000 * 1000 + 1000 * 997)
    expect(getAmountOut(1000, 100_000, 100_000)).toBeCloseTo(987.158034, 5);
    expect(getAmountOut(1000, 100_000, 100_000, 0)).toBeCloseTo(990.09901, 5);
  });

  it('never lets k decrease and moves the price against the trader', () => {
    for (const dx of [0.001, 1, 500, 50_000, 1e9]) {
      const s = swapV2(1000, 2000, dx);
      expect(s.x * s.y).toBeGreaterThanOrEqual(1000 * 2000);
      expect(s.priceAfter).toBeLessThan(s.priceBefore);
      expect(s.y).toBeGreaterThan(0);
      expect(s.impact).toBeGreaterThan(0);
      expect(s.impact).toBeLessThan(1);
    }
  });

  it('returns finite, harmless values for zero, negative and oversized input', () => {
    for (const dx of [0, -5, Number.NaN, Infinity, 1e30]) {
      const s = swapV2(1000, 2000, dx);
      expect(finite(s.x, s.y, s.out, s.priceBefore, s.priceAfter, s.impact)).toBe(true);
      expect(s.out).toBeGreaterThanOrEqual(0);
      expect(s.out).toBeLessThanOrEqual(2000);
    }
    expect(swapV2(1000, 2000, 0)).toMatchObject({ x: 1000, y: 2000, out: 0, impact: 0 });
    expect(swapV2(0, 0, 10).out).toBe(0);
  });

  it('computes impermanent loss', () => {
    expect(impermanentLoss(1)).toBeCloseTo(0, 12);
    expect(impermanentLoss(4)).toBeCloseTo(-0.2, 12);
    expect(impermanentLoss(0.25)).toBeCloseTo(-0.2, 12);
    expect(impermanentLoss(2)).toBeCloseTo(-0.05719, 4);
    expect(impermanentLoss(0)).toBe(-1);
    expect(impermanentLoss(-3)).toBe(-1);
  });

  it('mints LP tokens pro rata, by the smaller side', () => {
    expect(lpMinted(100, 400, 0, 0, 0)).toBe(200);
    expect(lpMinted(10, 20, 100, 200, 1000)).toBeCloseTo(100, 9);
    expect(lpMinted(10, 100, 100, 200, 1000)).toBeCloseTo(100, 9);
  });
});

describe('uniswap v3', () => {
  it('converts ticks and prices both ways', () => {
    expect(tickToPrice(0)).toBe(1);
    expect(tickToPrice(1)).toBeCloseTo(1.0001, 10);
    expect(tickToPrice(-1)).toBeCloseTo(1 / 1.0001, 10);
    for (const t of [-200_000, -60, 0, 1, 60, 6931, 200_000]) expect(priceToTick(tickToPrice(t))).toBe(t);
    expect(priceToTick(2)).toBe(6931);
    expect(priceToTick(0)).toBe(-887272);
    expect(snapTick(6931, 60)).toBe(6900);
    expect(snapTick(-1, 60)).toBe(-60);
  });

  it('encodes sqrtPriceX96', () => {
    expect(sqrtPriceX96(1)).toBe(2n ** 96n);
    expect(sqrtPriceX96(4)).toBe(2n ** 97n);
  });

  it('holds only X below the range and only Y above it', () => {
    const below = amountsForLiquidity(1000, 0.5, 1, 4);
    expect(below.y).toBe(0);
    expect(below.x).toBeCloseTo(1000 * (1 / 1 - 1 / 2), 9);
    const above = amountsForLiquidity(1000, 9, 1, 4);
    expect(above.x).toBe(0);
    expect(above.y).toBeCloseTo(1000 * (2 - 1), 9);
    const inside = amountsForLiquidity(1000, 2.25, 1, 4);
    expect(inside.x).toBeCloseTo(1000 * (1 / 1.5 - 1 / 2), 9);
    expect(inside.y).toBeCloseTo(1000 * (1.5 - 1), 9);
  });

  it('shows the capital efficiency of a narrow range', () => {
    // A +/-10% style range [p/1.21, p*1.21] is 1/(1 - 1/1.1) = 11x; [p/1.1025, p*1.1025] is 21x.
    expect(capitalEfficiency(1, 1 / 1.21, 1.21)).toBeCloseTo(11, 6);
    expect(capitalEfficiency(2000, 2000 / 1.1025, 2000 * 1.1025)).toBeCloseTo(21, 6);
    expect(capitalEfficiency(1, 0.5, 2)).toBeCloseTo(1 / (1 - Math.SQRT1_2), 6);
    expect(capitalEfficiency(1, 1e-12, 1e12)).toBeCloseTo(1, 4);
  });

  it('is consistent: the liquidity bought for a value is worth that value', () => {
    const L = liquidityForValue(1000, 2000, 1500, 2500);
    const a = amountsForLiquidity(L, 2000, 1500, 2500);
    expect(a.x * 2000 + a.y).toBeCloseTo(1000, 6);
  });

  it('survives reversed, empty and out-of-range inputs', () => {
    expect(amountsForLiquidity(10, 2, 4, 1)).toEqual(amountsForLiquidity(10, 2, 1, 4));
    expect(amountsForLiquidity(10, 2, 3, 3)).toEqual({ x: 0, y: 0 });
    expect(amountsForLiquidity(-1, 2, 1, 4)).toEqual({ x: 0, y: 0 });
    expect(capitalEfficiency(1, 2, 2)).toBe(1);
    expect(capitalEfficiency(5, 1, 2)).toBe(1);
    expect(capitalEfficiency(Number.NaN, 1, 2)).toBe(1);
    expect(capitalEfficiency(1, 2, 0.5)).toBeCloseTo(capitalEfficiency(1, 0.5, 2), 12);
    expect(liquidityForValue(100, 2, 3, 3)).toBe(0);
    expect(inRange(2, 1, 4)).toBe(true);
    expect(inRange(4, 1, 4)).toBe(false);
    expect(inRange(2, 4, 1)).toBe(true);
  });
});

describe('uniswap v4 helpers', () => {
  it('scales the fee with volatility and clamps it', () => {
    expect(dynamicFeeBps(0)).toBe(5);
    expect(dynamicFeeBps(0.05)).toBe(53);
    expect(dynamicFeeBps(0.1)).toBe(100);
    expect(dynamicFeeBps(5)).toBe(100);
    expect(dynamicFeeBps(-1)).toBe(5);
    expect(dynamicFeeBps(Number.NaN)).toBe(5);
    expect(dynamicFeeBps(0.05, 30, 10)).toBe(30);
  });

  it('nets intermediate tokens of a multi-hop swap to zero', () => {
    const net = netDeltas([
      { token: 'ETH', amount: -1 },
      { token: 'USDC', amount: 3000 },
      { token: 'USDC', amount: -3000 },
      { token: 'DAI', amount: 2995 },
    ]);
    expect(net).toEqual({ ETH: -1, DAI: 2995 });
  });
});

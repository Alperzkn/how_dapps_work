import { describe, expect, it } from 'vitest';
import { getAmountOut, impermanentLoss } from '../../sim/ammV2';
import { capitalEfficiency } from '../../sim/ammV3';
import { binIndex, dayPath, idleShare, makeBins, PATH_KINDS, poolValue, positionMove, simulateDay, snapRange, TIER_MODELS, v2Quote, walkSwap } from './logic';
import { BIN, CAPITAL, ENTRY, MOVE_MAX, MOVE_MIN, MOVE_STEP, P_MAX, P_MIN, POOL_BINS, POOL_PRICE, POOL_TVL, quoteSwap, SWAP_MAX, SWAP_STEP, WIDTH_MAX, WIDTH_MIN, WIDTH_STEP } from './state';

/** Every number anywhere inside a result must be finite. */
function allFinite(v: unknown): boolean {
  if (typeof v === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.every(allFinite);
  if (v && typeof v === 'object') return Object.values(v).every(allFinite);
  return true;
}

describe('walkSwap', () => {
  const one = [{ lo: 1000, hi: 4000, L: 1000 }];

  it('inside one range it is the constant-product formula on virtual reserves', () => {
    // At P = 2000 with L = 1000 the virtual reserves are x = L/sqrt(P), y = L*sqrt(P).
    const x = 1000 / Math.sqrt(2000);
    const y = 1000 * Math.sqrt(2000);
    const buy = walkSwap(one, 2000, 500, true, 30);
    expect(buy.ticksCrossed).toBe(0);
    expect(buy.amountOut).toBeCloseTo(getAmountOut(500, y, x, 30), 9);
    expect(buy.amountIn).toBeCloseTo(500, 9);
    expect(buy.fee).toBeCloseTo(1.5, 9);
    expect(buy.priceEnd).toBeGreaterThan(2000);
    const sell = walkSwap(one, 2000, 0.2, false, 30);
    expect(sell.amountOut).toBeCloseTo(getAmountOut(0.2, x, y, 30), 9);
    expect(sell.priceEnd).toBeLessThan(2000);
    expect(sell.avgPrice).toBeLessThan(2000);
    expect(buy.avgPrice).toBeGreaterThan(2000);
  });

  it('crosses into the next range when one is used up and switches liquidity', () => {
    const bins = makeBins(1900, 100, [1, 3, 2], 1000);
    // From 2050, the USDC needed to reach 2100 with L = 3000, plus the fee on it.
    const need = 3000 * (Math.sqrt(2100) - Math.sqrt(2050));
    const gross = need / 0.997;
    const exact = walkSwap(bins, 2050, gross, true, 30);
    expect(exact.priceEnd).toBeCloseTo(2100, 6);
    const more = walkSwap(bins, 2050, gross + 1000, true, 30);
    expect(more.ticksCrossed).toBe(1);
    expect(more.endBin).toBe(2);
    expect(more.activeL).toBe(2000);
    expect(more.steps).toHaveLength(2);
    expect(more.steps[0].priceEnd).toBe(2100);
    // The second leg: 997 USDC after the fee at L = 2000.
    expect(Math.sqrt(more.priceEnd)).toBeCloseTo(Math.sqrt(2100) + 997 / 2000, 9);
    expect(more.amountIn).toBeCloseTo(gross + 1000, 6);
    expect(more.fee).toBeCloseTo((gross + 1000) * 0.003, 6);
    // Downward: liquidity of the lower range takes over.
    const down = walkSwap(bins, 2050, 5, false, 30);
    expect(down.ticksCrossed).toBe(1);
    expect(down.endBin).toBe(0);
    expect(down.activeL).toBe(1000);
    expect(down.priceEnd).toBeLessThan(2000);
  });

  it('conserves value: output equals the sum of the legs and never exceeds what the ranges hold', () => {
    const r = walkSwap(POOL_BINS, POOL_PRICE, 4_000_000, true, 30);
    expect(r.steps.reduce((s, x) => s + x.amountOut, 0)).toBeCloseTo(r.amountOut, 9);
    expect(r.steps.reduce((s, x) => s + x.amountIn + x.fee, 0)).toBeCloseTo(r.amountIn, 4);
    expect(r.ticksCrossed).toBe(r.steps.length - 1);
    // Without a fee, swapping there and back returns the input.
    const there = walkSwap(POOL_BINS, POOL_PRICE, 4_000_000, true, 0);
    const moved = POOL_BINS.map((b) => ({ ...b }));
    const back = walkSwap(moved, there.priceEnd, there.amountOut, false, 0);
    expect(back.amountOut).toBeCloseTo(4_000_000, 3);
    expect(back.priceEnd).toBeCloseTo(POOL_PRICE, 6);
  });

  it('stops at the end of the pool and reports what was not filled', () => {
    const bins = makeBins(1900, 100, [1, 1], 1000);
    const r = walkSwap(bins, 2000, 1e9, true, 30);
    expect(r.exhausted).toBe(true);
    expect(r.priceEnd).toBe(2100);
    expect(r.unfilled).toBeGreaterThan(0);
    expect(r.amountIn + r.unfilled).toBeCloseTo(1e9, 3);
    const d = walkSwap(bins, 2000, 1e9, false, 30);
    expect(d.exhausted).toBe(true);
    expect(d.priceEnd).toBe(1900);
    expect(allFinite(r) && allFinite(d)).toBe(true);
  });

  it('handles zero, negative, NaN and empty inputs without NaN', () => {
    for (const amount of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      for (const buy of [true, false]) {
        const r = walkSwap(POOL_BINS, POOL_PRICE, amount, buy);
        expect(allFinite(r)).toBe(true);
        expect(r.amountOut).toBe(0);
        expect(r.avgPrice).toBe(POOL_PRICE);
        expect(r.ticksCrossed).toBe(0);
      }
    }
    expect(allFinite(walkSwap([], 2000, 100, true))).toBe(true);
    expect(allFinite(walkSwap(POOL_BINS, Number.NaN, 100, true))).toBe(true);
    expect(allFinite(walkSwap(POOL_BINS, 99_999, 100, false, 20_000))).toBe(true);
    expect(allFinite(walkSwap(makeBins(1900, 100, [0, 0], 1), 1950, 100, true))).toBe(true);
    expect(binIndex(POOL_BINS, 0)).toBe(0);
    expect(binIndex(POOL_BINS, 1e9)).toBe(POOL_BINS.length - 1);
    expect(binIndex(POOL_BINS, POOL_PRICE)).toBe(8);
  });

  it('every stop of the lesson slider, both directions, is finite and monotonic', () => {
    for (const buy of [true, false]) {
      let lastPrice = POOL_PRICE;
      let lastCrossed = 0;
      for (let size = 0; size <= SWAP_MAX; size += SWAP_STEP) {
        const q = quoteSwap(size, buy);
        expect(allFinite(q)).toBe(true);
        expect(q.walk.exhausted).toBe(false);
        expect(q.walk.amountIn).toBeCloseTo(q.input, 6);
        if (buy) expect(q.walk.priceEnd).toBeGreaterThanOrEqual(lastPrice);
        else expect(q.walk.priceEnd).toBeLessThanOrEqual(lastPrice);
        expect(q.walk.ticksCrossed).toBeGreaterThanOrEqual(lastCrossed);
        lastPrice = q.walk.priceEnd;
        lastCrossed = q.walk.ticksCrossed;
        // The concentrated pool always gives the better average price for the same capital here.
        if (size > 0) {
          if (buy) expect(q.walk.avgPrice).toBeLessThan(q.v2.avgPrice);
          else expect(q.walk.avgPrice).toBeGreaterThan(q.v2.avgPrice);
        }
      }
      expect(lastCrossed).toBeGreaterThanOrEqual(4);
    }
    expect(quoteSwap(0, true).walk.ticksCrossed).toBe(0);
    expect(quoteSwap(Number.NaN, true).input).toBe(0);
    expect(quoteSwap(1e12, false).input).toBe(SWAP_MAX / POOL_PRICE);
  });
});

describe('poolValue and v2Quote', () => {
  it('values a single range like its token amounts', () => {
    // Below the price the range is all USDC: L * (sqrt(hi) - sqrt(lo)).
    expect(poolValue([{ lo: 1600, hi: 1700, L: 10 }], 2000)).toBeCloseTo(10 * (Math.sqrt(1700) - Math.sqrt(1600)), 9);
    // Above the price it is all ETH, valued at the price.
    expect(poolValue([{ lo: 2100, hi: 2200, L: 10 }], 2000)).toBeCloseTo(10 * (1 / Math.sqrt(2100) - 1 / Math.sqrt(2200)) * 2000, 9);
    expect(POOL_TVL).toBeGreaterThan(10e6);
    expect(POOL_TVL).toBeLessThan(20e6);
    expect(poolValue([], 2000)).toBe(0);
    expect(poolValue(POOL_BINS, Number.NaN)).toBe(0);
  });

  it('quotes a v2 pool of the same value', () => {
    const q = v2Quote(8_000_000, 2000, 100_000, true, 30);
    expect(q.amountOut).toBeCloseTo(getAmountOut(100_000, 4_000_000, 2000, 30), 9);
    expect(q.avgPrice).toBeGreaterThan(2000);
    expect(q.priceEnd).toBeGreaterThan(q.avgPrice);
    const s = v2Quote(8_000_000, 2000, 50, false, 30);
    expect(s.amountOut).toBeCloseTo(getAmountOut(50, 2000, 4_000_000, 30), 9);
    expect(s.avgPrice).toBeLessThan(2000);
    for (const args of [[0, 2000, 5], [8e6, 0, 5], [8e6, 2000, 0], [Number.NaN, Number.NaN, Number.NaN]] as const) {
      expect(allFinite(v2Quote(args[0], args[1], args[2], true))).toBe(true);
      expect(allFinite(v2Quote(args[0], args[1], args[2], false))).toBe(true);
    }
    expect(v2Quote(8e6, 2000, 0, true).avgPrice).toBe(2000);
  });
});

describe('idleShare', () => {
  it('matches the figures quoted in the lesson', () => {
    const a = idleShare(7.5);
    expect(a.lower).toBeCloseTo(1850, 9);
    expect(a.upper).toBeCloseTo(2150, 9);
    expect(a.used * 100).toBeCloseTo(3.7, 1);
    expect(a.gain).toBeCloseTo(capitalEfficiency(2000, 1850, 2150), 9);
    // 0.99 - 1.01 around 1.00: about 0.5%, i.e. 200x.
    expect(idleShare(1, 1).used * 100).toBeCloseTo(0.5, 2);
  });

  it('grows with the move and stays within 0..1 at every slider stop', () => {
    let last = 0;
    for (let m = MOVE_MIN; m <= MOVE_MAX; m += MOVE_STEP) {
      const r = idleShare(m);
      expect(allFinite(r)).toBe(true);
      expect(r.used).toBeGreaterThan(last);
      expect(r.used).toBeLessThan(1);
      last = r.used;
    }
    expect(idleShare(MOVE_MAX).used).toBeCloseTo(0.238, 2);
    for (const bad of [0, -3, 500, Number.NaN]) expect(allFinite(idleShare(bad, bad))).toBe(true);
  });
});

describe('fee day', () => {
  it('paths are deterministic, start at the start price and stay positive', () => {
    for (const kind of PATH_KINDS) {
      const p = dayPath(kind);
      expect(p).toHaveLength(49);
      expect(p[0]).toBe(2000);
      expect(p).toEqual(dayPath(kind));
      expect(Math.min(...p)).toBeGreaterThan(1700);
      expect(Math.max(...p)).toBeLessThan(2300);
    }
    const spread = (k: (typeof PATH_KINDS)[number]) => Math.max(...dayPath(k)) - Math.min(...dayPath(k));
    expect(spread('calm')).toBeLessThan(spread('trend'));
    expect(spread('trend')).toBeLessThan(spread('volatile'));
    expect(dayPath('trend')[48]).toBeCloseTo(2170, 6);
    expect(allFinite(dayPath('calm', Number.NaN, Number.NaN))).toBe(true);
  });

  it('snaps a range outward to the tick spacing', () => {
    for (const { spacing } of TIER_MODELS) {
      for (const w of [WIDTH_MIN, 5, WIDTH_MAX]) {
        const r = snapRange(2000, w, spacing);
        expect(Math.abs(r.tickLower % spacing)).toBe(0);
        expect(Math.abs(r.tickUpper % spacing)).toBe(0);
        expect(r.lower).toBeLessThanOrEqual(2000 * (1 - w / 100));
        expect(r.upper).toBeGreaterThanOrEqual(2000 * (1 + w / 100) * (1 - 1e-9));
        // Never more than one spacing wider than asked on either side.
        expect(r.lower).toBeGreaterThan(2000 * (1 - w / 100) * 1.0001 ** -spacing);
        expect(r.upper).toBeLessThan(2000 * (1 + w / 100) * 1.0001 ** spacing);
      }
    }
    expect(allFinite(snapRange(Number.NaN, Number.NaN, Number.NaN))).toBe(true);
    const tiny = snapRange(2000, 0, 200);
    expect(tiny.tickUpper).toBeGreaterThan(tiny.tickLower);
  });

  it('earns volume x fee x share while in range and nothing outside', () => {
    const tier = TIER_MODELS[1];
    const r = simulateDay(tier, 5, 'calm');
    expect(r.timeInRange).toBe(1);
    // calm day: 60% of 30M volume at 0.30%, shared by L / (L + poolL).
    expect(r.fees).toBeCloseTo(30e6 * 0.6 * 0.003 * r.share, 6);
    expect(r.share).toBeCloseTo(r.L / (r.L + tier.poolL), 12);
    expect(r.earned.reduce((s, x) => s + x, 0)).toBeCloseTo(r.fees, 9);
    const out = simulateDay(tier, 1, 'trend');
    expect(out.timeInRange).toBeLessThan(0.5);
    expect(out.inside[out.inside.length - 1]).toBe(false);
    expect(out.earned[out.earned.length - 1]).toBe(0);
    expect(out.loss).toBeLessThan(0);
    expect(out.net).toBeCloseTo(out.fees + out.loss, 9);
  });

  it('narrow earns more per hour in range but spends less time there', () => {
    const tier = TIER_MODELS[1];
    const narrow = simulateDay(tier, 2, 'volatile');
    const wide = simulateDay(tier, WIDTH_MAX, 'volatile');
    expect(wide.timeInRange).toBe(1);
    expect(narrow.timeInRange).toBeLessThan(1);
    expect(Math.max(...narrow.earned)).toBeGreaterThan(Math.max(...wide.earned) * 5);
    expect(Math.abs(narrow.loss)).toBeGreaterThan(Math.abs(wide.loss));
    expect(dayPath('volatile')[48]).toBeCloseTo(2000 * (1 - 0.065), 6);
  });

  it('is finite for every tier, path and slider stop', () => {
    for (const tier of TIER_MODELS) {
      for (const kind of PATH_KINDS) {
        for (let w = WIDTH_MIN; w <= WIDTH_MAX; w += WIDTH_STEP) {
          const r = simulateDay(tier, w, kind);
          expect(allFinite(r)).toBe(true);
          expect(r.timeInRange).toBeGreaterThanOrEqual(0);
          expect(r.timeInRange).toBeLessThanOrEqual(1);
          expect(r.fees).toBeGreaterThanOrEqual(0);
          expect(r.fees).toBeLessThan(CAPITAL * 0.05);
          expect(r.loss).toBeLessThanOrEqual(0);
          expect(r.lower).toBeLessThan(2000);
          expect(r.upper).toBeGreaterThan(2000);
        }
      }
    }
    expect(allFinite(simulateDay({ feeBps: Number.NaN, spacing: 0, volume: -1, poolL: 0 }, Number.NaN, 'calm', Number.NaN, Number.NaN))).toBe(true);
  });
});

describe('positionMove', () => {
  it('holds both tokens in range, one beyond a bound, and stops being active', () => {
    const start = positionMove(CAPITAL, ENTRY, 1800, 2200, 2000);
    expect(start.active).toBe(true);
    expect(start.value).toBeCloseTo(CAPITAL, 6);
    expect(start.il).toBeCloseTo(0, 12);
    expect(start.eth).toBeGreaterThan(0);
    expect(start.usdc).toBeGreaterThan(0);
    const above = positionMove(CAPITAL, ENTRY, 1800, 2200, 2400);
    expect(above.active).toBe(false);
    expect(above.eth).toBe(0);
    expect(above.ethShare).toBe(0);
    expect(above.value).toBeCloseTo(positionMove(CAPITAL, ENTRY, 1800, 2200, 2200).value, 6);
    const below = positionMove(CAPITAL, ENTRY, 1800, 2200, 1500);
    expect(below.active).toBe(false);
    expect(below.usdc).toBe(0);
    expect(below.ethShare).toBe(1);
    expect(below.il).toBeLessThan(below.v2il);
  });

  it('in range the loss is the v2 loss multiplied by the liquidity ratio', () => {
    const m = positionMove(CAPITAL, ENTRY, 1800, 2200, 2100);
    const n = capitalEfficiency(ENTRY, 1800, 2200);
    // Loss in USDC is n times a v2 position's; both are measured against (almost) the same hold value.
    const v2 = positionMove(CAPITAL, ENTRY, 1e-9, 1e12, 2100);
    expect(v2.il).toBeCloseTo(impermanentLoss(2100 / 2000), 6);
    expect((m.hold - m.value) / (v2.hold - v2.value)).toBeCloseTo(n, 2);
    expect(m.v2il).toBeCloseTo(impermanentLoss(1.05), 12);
  });

  it('is finite over the whole slider grid', () => {
    for (let lo = P_MIN; lo < P_MAX; lo += BIN * 4) {
      for (let hi = lo + BIN; hi <= P_MAX; hi += BIN * 4) {
        for (const price of [P_MIN, lo, (lo + hi) / 2, hi, P_MAX]) {
          const r = positionMove(CAPITAL, ENTRY, lo, hi, price);
          expect(allFinite(r)).toBe(true);
          expect(r.il).toBeLessThanOrEqual(1e-12);
          expect(r.il).toBeGreaterThanOrEqual(-1);
        }
      }
    }
    expect(allFinite(positionMove(Number.NaN, Number.NaN, Number.NaN, Number.NaN, Number.NaN))).toBe(true);
    expect(allFinite(positionMove(CAPITAL, ENTRY, 2000, 2000, 0))).toBe(true);
  });
});

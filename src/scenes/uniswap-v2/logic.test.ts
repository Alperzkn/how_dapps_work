import { describe, expect, it } from 'vitest';
import { getAmountOut, impermanentLoss } from '../../sim/ammV2';
import {
  addLiquidity, arbitrage, BOOKS, FEE_POOL, getAmountIn, marketBuy, matching, MAX_BUY, MAX_TRADES, MAX_UNITS, MOVE_MAX, P0, poolBuy, priceMove,
  quoteSwap, R_MAX, R_MIN, ratioOf, simulateTrades, sliderOf, slippage, SUPPLY0, TOL_MAX, TOL_MIN, X0, Y0,
} from './logic';

const finite = (o: object) => Object.values(o).every((v) => typeof v !== 'number' || Number.isFinite(v));

describe('quoteSwap', () => {
  it('matches the lesson text for 10 ETH', () => {
    const q = quoteSwap('eth', 10);
    expect(q.out).toBeCloseTo(18132.22, 1);
    expect(q.x).toBe(110);
    expect(q.priceAfter).toBeCloseTo(1653.35, 1);
    expect(q.impact).toBeCloseTo(0.0934, 3);
    expect(q.paid).toBeCloseTo(1813.2, 1);
  });

  it('sells USDC for ETH and moves the price up', () => {
    const q = quoteSwap('usdc', 10);
    expect(q.amountIn).toBe(20_000);
    expect(q.out).toBeCloseTo(getAmountOut(20_000, Y0, X0), 9);
    expect(q.y).toBe(220_000);
    expect(q.x).toBeCloseTo(100 - q.out, 9);
    expect(q.priceAfter).toBeGreaterThan(P0);
    expect(q.paid).toBeGreaterThan(P0);
    // Mirror image of selling 10 ETH: same fraction of the reserve, same impact.
    expect(q.impact).toBeCloseTo(quoteSwap('eth', 10).impact, 9);
  });

  it('stays finite at the slider extremes in both directions', () => {
    for (const dir of ['eth', 'usdc'] as const) {
      const zero = quoteSwap(dir, 0);
      expect(zero.out).toBe(0);
      expect(zero.priceAfter).toBe(P0);
      expect(zero.paid).toBe(P0);
      expect(zero.impact).toBe(0);
      const max = quoteSwap(dir, MAX_UNITS);
      expect(finite(max)).toBe(true);
      expect(max.x).toBeGreaterThan(0);
      expect(max.y).toBeGreaterThan(0);
      // Out-of-range and junk input is clamped.
      expect(quoteSwap(dir, 1e9)).toEqual(max);
      expect(quoteSwap(dir, -5)).toEqual(zero);
      expect(quoteSwap(dir, NaN)).toEqual(zero);
    }
  });

  it('never lets k shrink', () => {
    for (let u = 0; u <= MAX_UNITS; u += 7) {
      for (const dir of ['eth', 'usdc'] as const) {
        const q = quoteSwap(dir, u);
        expect(q.x * q.y).toBeGreaterThanOrEqual(X0 * Y0 - 1e-6);
      }
    }
  });
});

describe('arbitrage', () => {
  it('does nothing when the pool is within the fee of the market', () => {
    expect(arbitrage(X0, Y0, P0).dir).toBeNull();
    expect(arbitrage(X0, Y0, P0 * 1.002).dir).toBeNull();
    expect(arbitrage(X0, Y0, P0 * 0.998).profit).toBe(0);
  });

  it('buys ETH back after someone sold ETH, ending within the fee of the market', () => {
    const q = quoteSwap('eth', 10);
    const a = arbitrage(q.x, q.y, P0);
    expect(a.dir).toBe('usdc');
    expect(a.profit).toBeGreaterThan(0);
    expect(a.price).toBeLessThan(P0);
    expect(a.price).toBeGreaterThan(P0 * 0.996);
    // Profit-maximizing: a slightly smaller or larger trade earns less.
    for (const f of [0.98, 1.02]) {
      const dy = a.amountIn * f;
      expect(getAmountOut(dy, q.y, q.x) * P0 - dy).toBeLessThan(a.profit);
    }
    // The arbitrageur's gain is less than what the trader gave up against the market price.
    expect(a.profit).toBeLessThan(10 * P0 - q.out);
  });

  it('sells ETH after someone bought ETH', () => {
    const q = quoteSwap('usdc', 30);
    const a = arbitrage(q.x, q.y, P0);
    expect(a.dir).toBe('eth');
    expect(a.profit).toBeGreaterThan(0);
    expect(a.price).toBeGreaterThan(P0);
    expect(a.price).toBeLessThan(P0 * 1.004);
  });

  it('is finite for every slider position and for junk', () => {
    for (let u = 0; u <= MAX_UNITS; u += 5) {
      for (const dir of ['eth', 'usdc'] as const) {
        const q = quoteSwap(dir, u);
        const a = arbitrage(q.x, q.y, P0);
        expect(finite(a)).toBe(true);
        expect(a.profit).toBeGreaterThanOrEqual(0);
      }
    }
    expect(arbitrage(0, 0, P0).dir).toBeNull();
    expect(arbitrage(X0, Y0, 0).dir).toBeNull();
    expect(finite(arbitrage(NaN, Y0, P0))).toBe(true);
  });
});

describe('order book', () => {
  it('walks the asks and averages the price', () => {
    const f = marketBuy(BOOKS.busy, 6);
    expect(f.fills).toEqual([4, 2, 0, 0]);
    expect(f.filled).toBe(6);
    expect(f.unfilled).toBe(0);
    expect(f.avg).toBeCloseTo((4 * 2002 + 2 * 2006) / 6, 9);
    expect(f.worst).toBe(2006);
  });

  it('leaves the rest unfilled when the book runs out', () => {
    const f = marketBuy(BOOKS.busy, MAX_BUY);
    expect(f.filled).toBe(30);
    expect(f.unfilled).toBe(10);
    const thin = marketBuy(BOOKS.thin, 5);
    expect(thin.filled).toBe(5);
    expect(thin.avg).toBeCloseTo((2015 + 2 * 2090 + 2 * 2400) / 5, 9);
    expect(marketBuy(BOOKS.thin, 8).unfilled).toBe(3);
  });

  it('fills nothing from an empty book or for a zero order', () => {
    expect(marketBuy(BOOKS.empty, 5)).toEqual({ fills: [], filled: 0, unfilled: 5, cost: 0, avg: 0, worst: 0 });
    const none = marketBuy(BOOKS.busy, 0);
    expect(none.filled).toBe(0);
    expect(none.avg).toBe(0);
    expect(finite(marketBuy(BOOKS.busy, NaN))).toBe(true);
  });

  it('prices an exact output from the pool, the inverse of getAmountOut', () => {
    const cost = getAmountIn(5, Y0, X0);
    expect(getAmountOut(cost, Y0, X0)).toBeCloseTo(5, 9);
    expect(getAmountIn(X0, Y0, X0)).toBe(0);
    expect(getAmountIn(0, Y0, X0)).toBe(0);
    const b = poolBuy(5);
    expect(b.cost).toBeCloseTo(cost, 9);
    expect(b.x).toBe(95);
    expect(b.avg).toBeGreaterThan(P0);
    expect(poolBuy(0).avg).toBe(P0);
    expect(poolBuy(0).cost).toBe(0);
    const max = poolBuy(MAX_BUY);
    expect(finite(max)).toBe(true);
    expect(max.x).toBe(60);
    expect(finite(poolBuy(1e9))).toBe(true);
  });
});

describe('addLiquidity', () => {
  it('mints in proportion for a deposit at the pool ratio', () => {
    const d = addLiquidity(10, matching(10));
    expect(matching(10)).toBe(20_000);
    expect(d.minted).toBeCloseTo(SUPPLY0 / 10, 9);
    expect(d.share).toBeCloseTo(1 / 11, 12);
    expect(d.backEth).toBeCloseTo(10, 9);
    expect(d.backUsdc).toBeCloseTo(20_000, 6);
    expect(d.limiting).toBeNull();
    expect(d.gift).toBe(0);
  });

  it('counts only the smaller side of an unbalanced deposit', () => {
    const d = addLiquidity(10, 10_000);
    expect(d.limiting).toBe('usdc');
    expect(d.minted).toBeCloseTo(SUPPLY0 / 20, 9);
    // Burning straight away returns less ETH than went in: the surplus was shared with everyone.
    expect(d.backEth).toBeCloseTo((0.05 / 1.05) * 110, 9);
    expect(d.backUsdc).toBeCloseTo(10_000, 6);
    expect(d.gift).toBeGreaterThan(0);
    expect(addLiquidity(5, 50_000).limiting).toBe('eth');
  });

  it('handles empty and one-sided deposits', () => {
    const none = addLiquidity(0, 0);
    expect(none.minted).toBe(0);
    expect(none.share).toBe(0);
    expect(none.gift).toBe(0);
    const oneSided = addLiquidity(50, 0);
    expect(oneSided.minted).toBe(0);
    expect(oneSided.backEth).toBe(0);
    expect(oneSided.gift).toBeCloseTo(50 * (Y0 / 150), 6);
    expect(finite(addLiquidity(NaN, -3))).toBe(true);
  });
});

describe('simulateTrades', () => {
  it('starts from the fee pool with nothing earned', () => {
    const v = simulateTrades(0);
    expect(v.x).toBeCloseTo(110, 9);
    expect(v.kGrowth).toBe(0);
    expect(v.income).toBe(0);
    expect(v.value).toBeCloseTo(40_000, 6);
    expect(FEE_POOL.share).toBeCloseTo(1 / 11, 12);
  });

  it('grows k and the value of a share with every trade', () => {
    let last = simulateTrades(0);
    for (const n of [1, 2, 10, 51, MAX_TRADES]) {
      const v = simulateTrades(n);
      expect(v.kGrowth).toBeGreaterThan(last.kGrowth);
      expect(v.fees).toBeGreaterThan(last.fees);
      expect(v.income).toBeGreaterThan(last.income);
      expect(finite(v)).toBe(true);
      last = v;
    }
  });

  it('pays LPs about 0.3% of the volume', () => {
    const v = simulateTrades(MAX_TRADES);
    expect(v.fees).toBeCloseTo(v.volume * 0.003, 6);
    // After an even number of trades the price is back, so the share's income is its cut of the fees.
    expect(v.y / v.x).toBeCloseTo(P0, 6);
    expect(v.income / (v.fees * FEE_POOL.share)).toBeGreaterThan(0.97);
    expect(v.income / (v.fees * FEE_POOL.share)).toBeLessThan(1.03);
  });

  it('clamps the trade count', () => {
    expect(simulateTrades(-4)).toEqual(simulateTrades(0));
    expect(simulateTrades(1e6)).toEqual(simulateTrades(MAX_TRADES));
    expect(simulateTrades(NaN).trades).toBe(0);
  });
});

describe('slippage', () => {
  it('matches the lesson text at 0.5%', () => {
    const s = slippage(0.005, 0);
    expect(s.quoted).toBeCloseTo(18132.22, 1);
    expect(s.minOut).toBeCloseTo(18041.56, 1);
    expect(s.executed).toBeCloseTo(s.quoted, 9);
    expect(s.reverts).toBe(false);
    expect(s.shortfall).toBe(0);
  });

  it('reverts once the price has moved further than the tolerance allows', () => {
    expect(slippage(0.005, 0.004).reverts).toBe(false);
    expect(slippage(0.005, 0.02).reverts).toBe(true);
    expect(slippage(0.05, 0.02).reverts).toBe(false);
    // A reverted swap leaves the pool where the earlier trades put it.
    const s = slippage(0.005, 0.02);
    expect(s.x * s.y).toBeCloseTo(X0 * Y0, 3);
    expect(s.price).toBeCloseTo(P0 * 0.98, 6);
  });

  it('is finite at every extreme', () => {
    for (const tol of [0, TOL_MIN, TOL_MAX, 1, NaN]) {
      for (const move of [0, MOVE_MAX, 5, -1, NaN]) {
        const s = slippage(tol, move);
        expect(finite(s)).toBe(true);
        expect(s.minOut).toBeLessThanOrEqual(s.quoted);
      }
    }
  });
});

describe('priceMove', () => {
  it('reproduces the classic impermanent loss numbers', () => {
    expect(priceMove(1).il).toBeCloseTo(0, 12);
    expect(priceMove(1).loss).toBeCloseTo(0, 9);
    expect(priceMove(2).il).toBeCloseTo(-0.0572, 4);
    expect(priceMove(4).il).toBeCloseTo(-0.2, 12);
    expect(priceMove(0.25).il).toBeCloseTo(-0.2, 12);
    expect(priceMove(1.25).il).toBeCloseTo(impermanentLoss(1.25), 12);
  });

  it('agrees with the pool: the position is its share of the arbitraged reserves', () => {
    for (const r of [R_MIN, 0.5, 1, 2, R_MAX]) {
      const m = priceMove(r);
      expect(m.y / m.x).toBeCloseTo(m.price, 6);
      expect(m.x * m.y).toBeCloseTo(X0 * Y0, 3);
      expect(m.eth * m.price + m.usdc).toBeCloseTo(m.inPool, 6);
      expect(m.hold).toBeCloseTo(10 * m.price + 20_000, 6);
      expect(m.loss).toBeCloseTo(m.hold - m.inPool, 6);
      expect(m.volumeToOffset * 0.003 * 0.1).toBeCloseTo(m.loss, 6);
      expect(finite(m)).toBe(true);
    }
  });

  it('clamps the ratio and maps the slider on a log scale', () => {
    expect(priceMove(100).r).toBe(R_MAX);
    expect(priceMove(0).r).toBe(R_MIN);
    expect(priceMove(NaN).r).toBe(R_MIN);
    expect(ratioOf(0)).toBe(1);
    expect(ratioOf(100)).toBeCloseTo(4, 12);
    expect(ratioOf(-100)).toBeCloseTo(0.25, 12);
    expect(ratioOf(50)).toBeCloseTo(2, 12);
    expect(ratioOf(999)).toBeCloseTo(4, 12);
    expect(sliderOf(2)).toBeCloseTo(50, 9);
    expect(sliderOf(ratioOf(-37))).toBeCloseTo(-37, 9);
  });
});

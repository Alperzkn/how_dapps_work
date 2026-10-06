import { describe, expect, it } from 'vitest';
import { getAmountOut, swapV2 } from '../../sim/ammV2';
import { blockAuction, move, optimalArb, orderByTip, runOrder, sandwich, splitTrade, type SandwichInput } from './logic';

const base: SandwichInput = { rIn: 2_000_000, rOut: 1000, victimIn: 40_000, tolerance: 0.01, gas: 10 };
const finite = (o: object) => Object.values(o).every((v) => (typeof v === 'number' ? Number.isFinite(v) : true));

describe('sandwich', () => {
  it('finds a profitable attack on a typical trade and respects amountOutMin', () => {
    const r = sandwich(base);
    expect(r.possible).toBe(true);
    expect(r.attacked).toBe(true);
    expect(r.frontIn).toBeGreaterThan(0);
    expect(r.frontIn).toBeLessThanOrEqual(r.maxFront + 1e-6);
    expect(r.attackedOut).toBeGreaterThanOrEqual(r.minOut - 1e-9);
    expect(r.victimOut).toBeLessThan(r.cleanOut);
    expect(r.net).toBeCloseTo(r.gross - 10, 9);
    expect(r.net).toBeGreaterThan(0);
  });

  it('matches a hand-run sequence of three swaps', () => {
    const r = sandwich(base);
    const s1 = swapV2(base.rIn, base.rOut, r.frontIn);
    const s2 = swapV2(s1.x, s1.y, base.victimIn);
    const back = getAmountOut(s1.out, s2.y, s2.x);
    expect(r.frontOut).toBeCloseTo(s1.out, 9);
    expect(r.attackedOut).toBeCloseTo(s2.out, 9);
    expect(r.backOut).toBeCloseTo(back, 6);
    expect(r.stages[3].rOut).toBeCloseTo(s2.y + s1.out, 6);
  });

  it('no neighbouring front-run size is both allowed and more profitable', () => {
    for (const tolerance of [0.002, 0.01, 0.05, 0.3]) {
      const r = sandwich({ ...base, tolerance });
      const gross = (a: number) => {
        const s1 = swapV2(base.rIn, base.rOut, a);
        const s2 = swapV2(s1.x, s1.y, base.victimIn);
        return getAmountOut(s1.out, s2.y, s2.x) - a;
      };
      for (const k of [0.25, 0.5, 0.9, 0.99, 1]) expect(gross(r.maxFront * k)).toBeLessThanOrEqual(r.gross + 1e-6);
    }
  });

  it('uses the whole gap: with realistic tolerances the limit is amountOutMin, not the fees', () => {
    for (const tolerance of [0.001, 0.01, 0.05]) {
      const r = sandwich({ ...base, tolerance });
      expect(r.frontIn).toBeCloseTo(r.maxFront, 3);
      expect(r.attackedOut).toBeCloseTo(r.minOut, 6);
    }
  });

  it('is impossible with zero tolerance', () => {
    const r = sandwich({ ...base, tolerance: 0 });
    expect(r.possible).toBe(false);
    expect(r.attacked).toBe(false);
    expect(r.victimOut).toBe(r.cleanOut);
    expect(r.victimLoss).toBe(0);
  });

  it('is unprofitable for a small trade, a deep pool or expensive gas', () => {
    const small = sandwich({ ...base, victimIn: 1000 });
    expect(small.attacked).toBe(false);
    expect(small.victimOut).toBe(small.cleanOut);
    const deep = sandwich({ ...base, rIn: 200_000_000, rOut: 100_000 });
    expect(deep.attacked).toBe(false);
    const dear = sandwich({ ...base, gas: 1e9 });
    expect(dear.attacked).toBe(false);
    expect(dear.stages[1]).toEqual(dear.stages[0]);
  });

  it('profit grows with the victim trade and with the tolerance', () => {
    expect(sandwich({ ...base, victimIn: 80_000 }).net).toBeGreaterThan(sandwich(base).net);
    expect(sandwich({ ...base, tolerance: 0.03 }).net).toBeGreaterThan(sandwich(base).net);
  });

  it('stays finite at every extreme', () => {
    const cases: Partial<SandwichInput>[] = [
      { victimIn: 0 },
      { rIn: 0 },
      { rOut: 0 },
      { tolerance: 5 },
      { tolerance: -1 },
      { gas: -5 },
      { victimIn: Number.NaN },
      { tolerance: Number.POSITIVE_INFINITY },
      { victimIn: 1e12 },
    ];
    for (const c of cases) {
      const r = sandwich({ ...base, ...c });
      expect(finite(r)).toBe(true);
      expect(r.stages.every((s) => Number.isFinite(s.rIn) && Number.isFinite(s.rOut))).toBe(true);
      expect(r.victimOut).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('splitTrade', () => {
  it('one part equals the plain sandwich', () => {
    const s = splitTrade(base, 1, false);
    const r = sandwich(base);
    expect(s.victimOut).toBeCloseTo(r.victimOut, 9);
    expect(s.attackerNet).toBeCloseTo(r.net, 9);
    expect(s.attacks).toBe(1);
  });
  it('enough parts make every part not worth attacking', () => {
    const s = splitTrade(base, 10, false);
    expect(s.attacks).toBe(0);
    expect(s.attackerNet).toBe(0);
    expect(s.victimOut).toBeGreaterThan(s.singleCleanOut);
  });
  it('a private swap is never sandwiched', () => {
    const s = splitTrade(base, 1, true);
    expect(s.attacks).toBe(0);
    expect(s.victimOut).toBeCloseTo(sandwich(base).cleanOut, 9);
  });
  it('clamps silly part counts', () => {
    for (const n of [0, -3, Number.NaN, 1e9]) expect(finite(splitTrade(base, n, false))).toBe(true);
  });
});

describe('optimalArb', () => {
  it('does nothing inside the fee band', () => {
    for (const p of [2000, 1995, 2005]) expect(optimalArb(1000, 2_000_000, p).dir).toBe('none');
  });
  it('buys ETH from the pool when the market is higher, and leaves the pool at the edge of the band', () => {
    const r = optimalArb(1000, 2_000_000, 2100);
    expect(r.dir).toBe('buyEth');
    expect(r.profit).toBeGreaterThan(0);
    expect(r.price).toBeCloseTo(2100 * 0.997, 0);
    // A slightly different size earns less.
    for (const k of [0.9, 1.1]) {
      const s = swapV2(2_000_000, 1000, r.amountIn * k);
      expect(s.out * 2100 - r.amountIn * k).toBeLessThan(r.profit);
    }
  });
  it('sells ETH into the pool when the market is lower', () => {
    const r = optimalArb(1000, 2_000_000, 1900);
    expect(r.dir).toBe('sellEth');
    expect(r.profit).toBeGreaterThan(0);
    expect(r.price).toBeCloseTo(1900 / 0.997, 0);
    for (const k of [0.9, 1.1]) {
      const s = swapV2(1000, 2_000_000, r.amountIn * k);
      expect(s.out - r.amountIn * k * 1900).toBeLessThan(r.profit);
    }
  });
  it('stays finite on bad input', () => {
    for (const a of [[0, 1, 1], [1, 0, 1], [1, 1, 0], [Number.NaN, 1, 1], [1, 1, Number.POSITIVE_INFINITY]]) {
      expect(finite(optimalArb(a[0], a[1], a[2]))).toBe(true);
    }
  });
});

describe('ordering', () => {
  const txs = [
    { kind: 'buy' as const, amount: 40_000 },
    { kind: 'buy' as const, amount: 60_000 },
    { kind: 'sell' as const, amount: 30 },
  ];
  it('a buyer does better in front of another buyer and behind a seller', () => {
    const first = runOrder(1000, 2_000_000, txs, [0, 1, 2]).fills[0].out;
    const second = runOrder(1000, 2_000_000, txs, [1, 0, 2]).fills[0].out;
    const afterSell = runOrder(1000, 2_000_000, txs, [2, 0, 1]).fills[0].out;
    expect(first).toBeGreaterThan(second);
    expect(afterSell).toBeGreaterThan(first);
    expect(first).toBeCloseTo(getAmountOut(40_000, 2_000_000, 1000), 9);
  });
  it('ignores duplicates and unknown indexes', () => {
    const r = runOrder(1000, 2_000_000, txs, [0, 0, 7]);
    expect(r.fills[1].out).toBe(0);
    expect(finite(r)).toBe(true);
  });
  it('orders by tip, stable on ties', () => {
    expect(orderByTip([1, 2, 3], [0, 1, 2])).toEqual([2, 1, 0]);
    expect(orderByTip([2, 2, 3], [1, 0, 2])).toEqual([2, 1, 0]);
    expect(orderByTip([5, 2, 3], [1, 0, 2])).toEqual([0, 2, 1]);
  });
  it('moves within bounds only', () => {
    expect(move([0, 1, 2], 0, -1)).toEqual([0, 1, 2]);
    expect(move([0, 1, 2], 2, 1)).toEqual([0, 1, 2]);
    expect(move([0, 1, 2], 1, -1)).toEqual([1, 0, 2]);
    expect(move([0, 1, 2], 1, 1)).toEqual([0, 2, 1]);
  });
});

describe('blockAuction', () => {
  it('building locally pays the proposer the local share only', () => {
    expect(blockAuction(1, 3, false)).toEqual({ proposer: 0.5, builder: 0, bids: [] });
  });
  it('one builder only has to beat the local block; competition pushes the bid up', () => {
    const one = blockAuction(1, 1, true);
    const two = blockAuction(1, 2, true);
    const four = blockAuction(1, 4, true);
    expect(one.proposer).toBeCloseTo(0.5);
    expect(one.builder).toBeCloseTo(0.5);
    expect(two.proposer).toBeCloseTo(0.96);
    expect(two.builder).toBeCloseTo(0.04);
    expect(four.bids).toHaveLength(4);
    expect(four.proposer + four.builder).toBeCloseTo(1);
  });
  it('clamps', () => {
    for (const [v, n] of [[0, 0], [-1, 99], [Number.NaN, Number.NaN]]) {
      const r = blockAuction(v, n, true);
      expect(Number.isFinite(r.proposer) && Number.isFinite(r.builder)).toBe(true);
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  BLOCK_SLOTS,
  canInclude,
  clampBase,
  clampTip,
  confirmationsAt,
  DEFAULT_BASE,
  DEFAULT_TIP,
  EDGES,
  effectiveTip,
  feeBreakdown,
  GAS_TRANSFER,
  gossipHops,
  MAX_BASE,
  MAX_CONFIRMATIONS,
  MAX_FEE,
  MAX_TIP,
  maxBlocks,
  mempool,
  MIN_BASE,
  MIN_TIP,
  NODE_COUNT,
  OTHER_TIPS,
} from './logic';

describe('effectiveTip', () => {
  it('is min(maxPriorityFee, maxFee − baseFee)', () => {
    expect(effectiveTip(2, 30, 20)).toBe(2);
    expect(effectiveTip(2, 30, 29)).toBe(1);
    expect(effectiveTip(8, 30, 25)).toBe(5);
    expect(effectiveTip(2, 30, 30)).toBe(0);
  });

  it('never goes negative or non-finite', () => {
    expect(effectiveTip(2, 30, 40)).toBe(0);
    expect(effectiveTip(-3, 30, 20)).toBe(0);
    expect(effectiveTip(Number.NaN, 30, 20)).toBe(0);
    expect(effectiveTip(2, Number.NaN, Number.NaN)).toBe(0);
    expect(canInclude(30, 30)).toBe(true);
    expect(canInclude(30, 30.5)).toBe(false);
  });
});

describe('mempool', () => {
  it('puts Alice third with the default tip, inside the next block', () => {
    const m = mempool(DEFAULT_TIP, DEFAULT_BASE);
    expect(m.order).toEqual([0, 1, 'alice', 2, 3, 4]);
    expect(m.rank).toBe(2);
    expect(m.effective).toBe(2);
    expect(m.inNextBlock).toBe(true);
    expect(m.inclusionBlock).toBe(1);
  });

  it('reorders by tip across the whole slider', () => {
    expect(mempool(MIN_TIP, DEFAULT_BASE).rank).toBe(5);
    expect(mempool(MIN_TIP, DEFAULT_BASE).inclusionBlock).toBe(2);
    expect(mempool(1.5, DEFAULT_BASE).rank).toBe(4);
    expect(mempool(1.8, DEFAULT_BASE).rank).toBe(3); // tie: the earlier transaction stays ahead
    expect(mempool(1.8, DEFAULT_BASE).inNextBlock).toBe(false);
    expect(mempool(3.5, DEFAULT_BASE).rank).toBe(1);
    expect(mempool(MAX_TIP, DEFAULT_BASE).rank).toBe(0);
    for (let tip = MIN_TIP; tip <= MAX_TIP; tip += 0.5) {
      const m = mempool(tip, DEFAULT_BASE);
      expect(m.order).toHaveLength(OTHER_TIPS.length + 1);
      expect(m.order.indexOf('alice')).toBe(m.rank);
      expect(m.inNextBlock).toBe(m.rank < BLOCK_SLOTS);
    }
  });

  it('caps the tip when the base fee eats into the ceiling', () => {
    const m = mempool(5, 28);
    expect(m.effective).toBe(MAX_FEE - 28);
    expect(m.rank).toBe(2);
    expect(mempool(5, MAX_FEE).effective).toBe(0);
    expect(mempool(5, MAX_FEE).includable).toBe(true);
    expect(mempool(5, MAX_FEE).rank).toBe(5);
  });

  it('leaves Alice out entirely while the base fee is above her ceiling', () => {
    for (const base of [MAX_FEE + 1, MAX_BASE]) {
      const m = mempool(MAX_TIP, base);
      expect(m.includable).toBe(false);
      expect(m.rank).toBe(5);
      expect(m.effective).toBe(0);
      expect(m.inNextBlock).toBe(false);
      expect(m.inclusionBlock).toBe(0);
    }
    expect(mempool(DEFAULT_TIP, MIN_BASE).inNextBlock).toBe(true);
  });

  it('clamps slider input', () => {
    expect(clampTip(99)).toBe(MAX_TIP);
    expect(clampTip(-1)).toBe(MIN_TIP);
    expect(clampTip(Number.NaN)).toBe(DEFAULT_TIP);
    expect(clampBase(0)).toBe(MIN_BASE);
    expect(clampBase(1e9)).toBe(MAX_BASE);
    expect(clampBase(Number.POSITIVE_INFINITY)).toBe(DEFAULT_BASE);
    expect(clampBase(Number.NaN)).toBe(DEFAULT_BASE);
  });
});

describe('confirmations', () => {
  it('counts the inclusion block as the first confirmation', () => {
    expect(confirmationsAt(0, 1)).toBe(0);
    expect(confirmationsAt(1, 1)).toBe(1);
    expect(confirmationsAt(4, 1)).toBe(4);
    expect(confirmationsAt(1, 2)).toBe(0);
    expect(confirmationsAt(2, 2)).toBe(1);
    expect(confirmationsAt(5, 0)).toBe(0);
    expect(confirmationsAt(Number.NaN, 1)).toBe(0);
  });

  it('lets the learner reach six confirmations wherever the transaction landed', () => {
    for (const block of [1, 2]) expect(confirmationsAt(maxBlocks(block), block)).toBe(MAX_CONFIRMATIONS);
    expect(maxBlocks(0)).toBeGreaterThan(0);
  });
});

describe('feeBreakdown', () => {
  it('matches the worked example in the lesson text', () => {
    const fee = feeBreakdown(GAS_TRANSFER, 20, 2);
    expect(fee.burned).toBe(420_000);
    expect(fee.toProducer).toBe(42_000);
    expect(fee.total).toBe(462_000);
    expect(fee.totalEth).toBeCloseTo(0.000462, 12);
  });

  it('handles zero and bad input', () => {
    expect(feeBreakdown(GAS_TRANSFER, MAX_BASE, 0)).toEqual({ burned: 840_000, toProducer: 0, total: 840_000, totalEth: 0.00084 });
    expect(feeBreakdown(0, 20, 2).total).toBe(0);
    expect(feeBreakdown(Number.NaN, Number.NaN, Number.NaN)).toEqual({ burned: 0, toProducer: 0, total: 0, totalEth: 0 });
    expect(feeBreakdown(GAS_TRANSFER, -5, -1).total).toBe(0);
  });
});

describe('gossipHops', () => {
  it('reaches every node from every starting node', () => {
    for (let first = 0; first < NODE_COUNT; first++) {
      const hops = gossipHops(first);
      expect(hops[first]).toBe(0);
      expect(hops.every((h) => h >= 0)).toBe(true);
      for (const [a, b] of EDGES) expect(Math.abs(hops[a] - hops[b])).toBeLessThanOrEqual(1);
    }
  });

  it('takes longer from the edge of the network than from the middle', () => {
    expect(gossipHops(0)).toEqual([0, 1, 1, 2]);
    expect(gossipHops(1)).toEqual([1, 0, 2, 1]);
    expect(gossipHops(2)).toEqual([1, 2, 0, 3]);
    expect(gossipHops(3)).toEqual([2, 1, 3, 0]);
    expect(gossipHops(-4)).toEqual(gossipHops(0));
    expect(gossipHops(99)).toEqual(gossipHops(3));
    expect(gossipHops(Number.NaN)).toEqual(gossipHops(0));
  });
});

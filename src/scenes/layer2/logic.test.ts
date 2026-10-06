import { describe, expect, it } from 'vitest';
import {
  BATCH_SIZES,
  BLOB_BYTES,
  CHALLENGE_DAYS,
  FORCE_WINDOW_H,
  OPT_DELAY_H,
  TRACE_STEPS,
  ZK_BATCH,
  ZK_DELAY_H,
  ZK_START,
  ZK_VERIFY_GAS,
  baseFeeAfter,
  batchCost,
  batchSizeAt,
  bisect,
  bisectionRounds,
  blobGweiAt,
  blobsNeeded,
  blockFill,
  dataHash,
  disputeStart,
  effectiveBlobGwei,
  execute,
  faultyTrace,
  honestTrace,
  leftOut,
  nextBaseFee,
  oneStepValid,
  optChallenge,
  optInitial,
  optPropose,
  optWait,
  prove,
  seqInitial,
  seqOnL1,
  seqStep,
  stateRoot,
  verify,
  withdrawal,
  zkAttempt,
  type OptState,
  type SeqAction,
  type SeqState,
} from './logic';

describe('EIP-1559 base fee', () => {
  it('moves ±12.5% at the extremes and stays put at the target', () => {
    expect(nextBaseFee(8, 200)).toBeCloseTo(9);
    expect(nextBaseFee(8, 0)).toBeCloseTo(7);
    expect(nextBaseFee(8, 100)).toBeCloseTo(8);
    expect(nextBaseFee(8, 150)).toBeCloseTo(8.5);
  });
  it('demand beyond a full block cannot push harder than a full block', () => {
    expect(nextBaseFee(8, 300)).toBe(nextBaseFee(8, 200));
    expect(blockFill(300)).toBe(200);
    expect(leftOut(300)).toBe(100);
    expect(leftOut(150)).toBe(0);
    expect(leftOut(-5)).toBe(0);
  });
  it('compounds and stays finite and positive', () => {
    expect(baseFeeAfter(2, 200, 10)).toBeCloseTo(2 * 1.125 ** 10);
    for (const d of [0, 100, 300]) {
      const f = baseFeeAfter(2, d, 1000);
      expect(Number.isFinite(f)).toBe(true);
      expect(f).toBeGreaterThan(0);
    }
    expect(Number.isFinite(nextBaseFee(NaN, NaN))).toBe(true);
  });
});

describe('batch cost', () => {
  it('a blob holds 131072 bytes and is paid for whole', () => {
    expect(BLOB_BYTES).toBe(131072);
    expect(blobsNeeded(0)).toBe(0);
    expect(blobsNeeded(1)).toBe(1);
    expect(blobsNeeded(131072)).toBe(1);
    expect(blobsNeeded(131073)).toBe(2);
  });
  it('splits the fixed cost: more transactions, lower fee each', () => {
    let prev = Infinity;
    for (const n of BATCH_SIZES.filter((x) => x <= 1000)) {
      const c = batchCost(n, 10, 1, 'blob');
      expect(c.blobs).toBe(1);
      expect(c.perTxGwei).toBeLessThan(prev);
      expect(c.perTxGwei * n).toBeCloseTo(c.totalGwei);
      prev = c.perTxGwei;
    }
    const one = batchCost(1, 10, 1, 'blob');
    expect(one.totalGwei).toBeCloseTo(21000 * 10 + 131072 * 1);
    expect(one.timesCheaper).toBeLessThan(1);
    expect(batchCost(1000, 10, 1, 'blob').timesCheaper).toBeGreaterThan(500);
  });
  it('needs a second blob past 1310 transfers', () => {
    expect(batchCost(1000, 1, 1, 'blob').blobs).toBe(1);
    expect(batchCost(2000, 1, 1, 'blob').blobs).toBe(2);
    expect(batchCost(5000, 1, 1, 'blob').blobs).toBe(4);
    expect(batchCost(1000, 1, 1, 'blob').blobFillPct).toBeCloseTo((100000 / 131072) * 100);
  });
  it('calldata is charged per byte in execution gas', () => {
    const c = batchCost(1000, 10, 1, 'calldata');
    expect(c.blobs).toBe(0);
    expect(c.blobGas).toBe(0);
    expect(c.execGas).toBe(21000 + 100000 * 40);
    expect(c.perTxGwei).toBeGreaterThan(batchCost(1000, 10, 1, 'blob').perTxGwei);
  });
  it('proof verification is a fixed extra shared by the batch', () => {
    const a = batchCost(1000, 10, 1, 'blob');
    const b = batchCost(1000, 10, 1, 'blob', ZK_VERIFY_GAS);
    expect(b.totalGwei - a.totalGwei).toBeCloseTo(ZK_VERIFY_GAS * 10);
  });
  it('blob price slider is logarithmic and floored by the reserve price', () => {
    expect(blobGweiAt(-9)).toBeCloseTo(1e-9);
    expect(blobGweiAt(2)).toBeCloseTo(100);
    expect(blobGweiAt(-99)).toBeCloseTo(1e-9);
    expect(blobGweiAt(NaN)).toBeCloseTo(1e-9);
    expect(effectiveBlobGwei(1e-9, 16)).toBe(1);
    expect(effectiveBlobGwei(5, 16)).toBe(5);
  });
  it('is finite at every slider extreme', () => {
    for (const n of [0, 1, 5000, NaN])
      for (const g of [0, 0.1, 200, NaN])
        for (const e of [-9, 2])
          for (const m of ['blob', 'calldata'] as const) {
            const c = batchCost(n, g, blobGweiAt(e), m);
            for (const v of [c.totalGwei, c.perTxGwei, c.perTxUsd, c.l1TxUsd, c.timesCheaper, c.blobFillPct]) {
              expect(Number.isFinite(v)).toBe(true);
              expect(v).toBeGreaterThanOrEqual(0);
            }
          }
    expect(batchSizeAt(-3)).toBe(1);
    expect(batchSizeAt(99)).toBe(5000);
    expect(batchSizeAt(NaN)).toBe(1);
  });
});

describe('sequencer and forced inclusion', () => {
  const run = (steps: [SeqAction, boolean][]) => steps.reduce<SeqState>((s, [a, on]) => seqStep(s, a, on), seqInitial());
  it('normal path: soft confirmation, batch on L1, final', () => {
    expect(run([['send', true]]).phase).toBe('soft');
    expect(run([['send', true], ['next', true]]).phase).toBe('batched');
    expect(run([['send', true], ['next', true], ['next', true]]).phase).toBe('final');
    expect(run([['send', true], ['next', true], ['next', true], ['next', true]])).toEqual(seqInitial());
  });
  it('an offline sequencer leaves the transaction stuck, and a soft confirmation never reaches L1', () => {
    expect(run([['send', false]]).phase).toBe('stuck');
    expect(run([['send', false], ['next', false], ['next', false]]).phase).toBe('stuck');
    expect(run([['send', true], ['next', false]]).phase).toBe('soft');
    expect(seqOnL1('soft')).toBe(false);
  });
  it('forced inclusion needs no sequencer and completes when the window ends', () => {
    let s = run([['send', false], ['force', false]]);
    expect(s).toEqual({ phase: 'queued', waited: 0 });
    expect(seqOnL1(s.phase)).toBe(true);
    const seen = [];
    while (s.phase === 'queued') {
      s = seqStep(s, 'next', false);
      seen.push(s.waited);
    }
    expect(s).toEqual({ phase: 'forced', waited: FORCE_WINDOW_H });
    expect(seen).toEqual([4, 8, 12]);
  });
  it('a sequencer that comes back includes the queued transaction early', () => {
    expect(run([['force', false], ['next', false], ['next', true]])).toEqual({ phase: 'included', waited: 4 });
  });
  it('ignores actions that make no sense in the current phase', () => {
    const batched = run([['send', true], ['next', true]]);
    expect(seqStep(batched, 'send', true)).toBe(batched);
    expect(seqStep(batched, 'force', true)).toBe(batched);
  });
});

describe('fraud proof by bisection', () => {
  it('a faulty trace agrees before the fault and differs from it onwards', () => {
    const h = honestTrace();
    expect(h).toHaveLength(TRACE_STEPS + 1);
    for (const f of [1, 7, 16]) {
      const t = faultyTrace(f);
      expect(t).toHaveLength(TRACE_STEPS + 1);
      for (let i = 0; i <= TRACE_STEPS; i++) expect(t[i] === h[i]).toBe(i < f);
    }
    expect(faultyTrace(0)).toEqual(faultyTrace(1));
    expect(faultyTrace(99)).toEqual(faultyTrace(16));
  });
  it('bisection finds the faulty step in log2(n) rounds, wherever it is', () => {
    const h = honestTrace();
    expect(bisectionRounds(TRACE_STEPS)).toBe(4);
    for (let f = 1; f <= TRACE_STEPS; f++) {
      const bad = faultyTrace(f);
      let d = disputeStart();
      while (d.hi - d.lo > 1) d = bisect(bad, h, d);
      expect(d).toEqual({ lo: f - 1, hi: f, rounds: 4 });
      expect(oneStepValid(bad, d.lo)).toBe(false);
      expect(oneStepValid(h, d.lo)).toBe(true);
      expect(bisect(bad, h, d)).toBe(d);
    }
  });
  const play = (s: OptState, presses: number) => {
    for (let i = 0; i < presses; i++) s = optChallenge(s);
    return s;
  };
  it('a challenged bad root is rejected after 1 + 4 + 1 moves', () => {
    for (const f of [1, 9, 16]) {
      const s = optPropose(true, f);
      expect(play(s, 1).status).toBe('disputed');
      expect(play(s, 5)).toMatchObject({ status: 'disputed', dispute: { lo: f - 1, hi: f } });
      expect(play(s, 6).status).toBe('rejected');
      expect(play(s, 9).status).toBe('rejected');
    }
  });
  it('a challenged honest root is defended and still finalizes', () => {
    let s = play(optPropose(false, 5), 6);
    expect(s.status).toBe('defended');
    for (let i = 0; i < CHALLENGE_DAYS; i++) s = optWait(s);
    expect(s).toMatchObject({ status: 'finalized', day: CHALLENGE_DAYS, bad: false });
  });
  it('an unchallenged bad root becomes final when the window closes', () => {
    let s = optPropose(true, 3);
    for (let i = 0; i < CHALLENGE_DAYS - 1; i++) s = optWait(s);
    expect(s).toMatchObject({ status: 'pending', day: CHALLENGE_DAYS - 1 });
    s = optWait(s);
    expect(s).toMatchObject({ status: 'finalized', bad: true, day: CHALLENGE_DAYS });
    expect(optChallenge(s)).toBe(s);
    expect(optWait(s)).toBe(s);
  });
  it('time does not pass during a dispute and nothing happens before a proposal', () => {
    const d = optChallenge(optPropose(true, 3));
    expect(optWait(d)).toBe(d);
    expect(optWait(optInitial())).toEqual(optInitial());
    expect(optChallenge(optInitial())).toEqual(optInitial());
  });
});

describe('validity proofs', () => {
  it('executes the batch and conserves coins', () => {
    const end = execute(ZK_START, ZK_BATCH);
    expect(end).toEqual({ A: 35, B: 35, C: 30 });
    expect(execute(ZK_START, [{ from: 'A', to: 'B', amount: 51 }])).toBeNull();
    expect(execute(ZK_START, [{ from: 'A', to: 'Z', amount: 1 }])).toBeNull();
    expect(execute(ZK_START, [{ from: 'A', to: 'B', amount: -1 }])).toBeNull();
    expect(execute(ZK_START, [])).toEqual(ZK_START);
  });
  it('a proof exists only for the true result', () => {
    const end = execute(ZK_START, ZK_BATCH)!;
    const good = prove(ZK_START, ZK_BATCH, stateRoot(end));
    expect(good).not.toBeNull();
    expect(prove(ZK_START, ZK_BATCH, stateRoot({ ...end, A: 999 }))).toBeNull();
    const statement = { pre: stateRoot(ZK_START), post: stateRoot(end), data: dataHash(ZK_BATCH) };
    expect(verify(good, statement)).toBe(true);
    expect(verify(good, { ...statement, post: stateRoot(ZK_START) })).toBe(false);
    expect(verify(null, statement)).toBe(false);
  });
  it('honest batch verifies; a wrong root or altered data does not', () => {
    expect(zkAttempt('none')).toMatchObject({ proved: true, accepted: true });
    expect(zkAttempt('root')).toMatchObject({ proved: false, accepted: false });
    expect(zkAttempt('data')).toMatchObject({ proved: true, accepted: false });
    expect(zkAttempt('root').statement.post).not.toBe(zkAttempt('root').trueRoot);
  });
});

describe('withdrawals', () => {
  it('zk finishes at proof time, optimistic after the challenge window', () => {
    expect(withdrawal(0)).toMatchObject({ optProgress: 0, zkProgress: 0, optDone: false, zkDone: false, optLeftH: OPT_DELAY_H });
    expect(withdrawal(ZK_DELAY_H)).toMatchObject({ zkDone: true, optDone: false });
    expect(withdrawal(OPT_DELAY_H - 1).optDone).toBe(false);
    expect(withdrawal(OPT_DELAY_H)).toMatchObject({ optDone: true, optProgress: 1, optLeftH: 0 });
    expect(withdrawal(1e9)).toMatchObject({ optProgress: 1, zkProgress: 1 });
    expect(withdrawal(-5).optProgress).toBe(0);
    expect(withdrawal(NaN).zkProgress).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { sha256 } from '../../sim/sha256';
import {
  BUDGET,
  CRITERIA,
  IBC_AMOUNT,
  IBC_START,
  IBC_TIMEOUT,
  POH_SEED,
  POWERS,
  SNOW_BETA,
  SNOW_NODES,
  TRI_PRESETS,
  bftStatus,
  clampAlpha,
  clampK,
  ibcInitial,
  ibcNext,
  makeTxs,
  pohAppend,
  pohVerify,
  rankChains,
  rebalance,
  rng,
  samplePeers,
  schedule,
  snowInit,
  snowRound,
  snowRun,
  snowTally,
  solStats,
  weakest,
  type IbcState,
  type PohEntry,
  type Tri,
} from './logic';

const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);

describe('trilemma budget', () => {
  it('presets use the whole budget', () => {
    for (const p of Object.values(TRI_PRESETS)) expect(sum(p)).toBe(BUDGET);
  });
  it('keeps the sum and the 0–100 range for every slider position', () => {
    const starts: Tri[] = [[60, 60, 60], [90, 80, 10], [100, 80, 0], [0, 90, 90], [100, 0, 80]];
    for (const start of starts)
      for (let i = 0; i < 3; i++)
        for (let value = -20; value <= 120; value += 5) {
          const out = rebalance(start, i, value);
          expect(sum(out)).toBe(BUDGET);
          for (const x of out) {
            expect(Number.isInteger(x)).toBe(true);
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThanOrEqual(100);
          }
        }
  });
  it('raising one lowers the others in proportion', () => {
    expect(rebalance([60, 60, 60], 0, 100)).toEqual([100, 40, 40]);
    expect(rebalance([60, 60, 60], 2, 0)).toEqual([90, 90, 0]);
    expect(rebalance([90, 80, 10], 2, 90)).toEqual([48, 42, 90]);
  });
  it('survives NaN', () => {
    expect(sum(rebalance([60, 60, 60], 1, NaN))).toBe(BUDGET);
  });
  it('names the corner that was given up', () => {
    expect(weakest([90, 80, 10])).toBe(2);
    expect(weakest([60, 30, 90])).toBe(1);
    expect(weakest([40, 55, 85])).toBe(0);
    expect(weakest([60, 60, 60])).toBe(-1);
  });
});

describe('solana scheduling', () => {
  it('runs disjoint transactions on every core', () => {
    const rounds = schedule(makeTxs(20, 0), 4);
    expect(rounds).toHaveLength(5);
    expect(rounds.every((r) => r.length === 4)).toBe(true);
  });
  it('never puts two writers of one account in the same round and loses nothing', () => {
    for (let pct = 0; pct <= 100; pct += 5) {
      const txs = makeTxs(20, pct);
      const rounds = schedule(txs, 4);
      expect(rounds.flat().map((t) => t.id).sort((a, b) => a - b)).toEqual(txs.map((t) => t.id));
      for (const r of rounds) {
        expect(r.length).toBeLessThanOrEqual(4);
        expect(new Set(r.map((t) => t.account)).size).toBe(r.length);
      }
    }
  });
  it('contention up to 1/cores is free, beyond it the hot account sets the pace', () => {
    expect(solStats(20, 25, 4).rounds).toBe(5);
    expect(solStats(20, 50, 4)).toMatchObject({ hot: 10, rounds: 10, throughput: 2, lockQueue: 9 });
    expect(solStats(20, 100, 4)).toMatchObject({ hot: 20, rounds: 20, throughput: 1, parallelNow: 1, lockQueue: 19 });
    expect(solStats(20, 0, 4)).toMatchObject({ hot: 0, rounds: 5, throughput: 4, parallelNow: 4, lockQueue: 0 });
  });
  it('handles empty and odd input', () => {
    expect(solStats(0, 50, 4)).toMatchObject({ rounds: 0, throughput: 0 });
    expect(Number.isFinite(solStats(20, NaN, 0).throughput)).toBe(true);
    expect(schedule(makeTxs(5, 0), 1)).toHaveLength(5);
  });
});

describe('proof of history', () => {
  it('each tick is the SHA-256 of the previous output', () => {
    let e: PohEntry[] = [];
    e = pohAppend(e);
    e = pohAppend(e);
    expect(e[0].hash).toBe(sha256(POH_SEED));
    expect(e[1].hash).toBe(sha256(e[0].hash));
    expect(e.map((x) => x.n)).toEqual([1, 2]);
  });
  it('an event changes every later hash and verification catches tampering', () => {
    let plain: PohEntry[] = [];
    let mixed: PohEntry[] = [];
    for (let i = 0; i < 5; i++) {
      plain = pohAppend(plain);
      mixed = pohAppend(mixed, i === 2 ? 'tx A' : undefined);
    }
    expect(mixed[2].hash).toBe(sha256(mixed[1].hash + sha256('tx A')));
    expect(mixed[1].hash).toBe(plain[1].hash);
    expect(mixed[4].hash).not.toBe(plain[4].hash);
    expect(pohVerify(mixed)).toBe(true);
    expect(pohVerify([])).toBe(true);
    // Moving the event to another position breaks the chain.
    const moved = mixed.map((x, i) => ({ ...x, event: i === 3 ? 'tx A' : undefined }));
    expect(pohVerify(moved)).toBe(false);
  });
});

describe('avalanche sampling', () => {
  it('seeded generator repeats', () => {
    const a = rng(7);
    const b = rng(7);
    for (let i = 0; i < 20; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
  it('initial split is exact', () => {
    for (const pct of [0, 25, 50, 75, 100]) {
      const t = snowTally(snowInit(SNOW_NODES, pct, 3));
      expect(t.blue).toBe(Math.round((SNOW_NODES * pct) / 100));
      expect(t.blue + t.orange).toBe(SNOW_NODES);
    }
  });
  it('samples k distinct peers, never the node itself', () => {
    const r = rng(1);
    for (let k = 0; k <= 30; k += 3) {
      const s = samplePeers(24, 5, k, r);
      expect(s).toHaveLength(Math.min(k, 23));
      expect(new Set(s).size).toBe(s.length);
      expect(s).not.toContain(5);
    }
  });
  it('clamps k and alpha', () => {
    expect(clampK(0)).toBe(1);
    expect(clampK(99)).toBe(10);
    expect(clampK(NaN)).toBe(1);
    expect(clampAlpha(9, 4)).toBe(4);
    expect(clampAlpha(0, 4)).toBe(1);
  });
  it('a unanimous network decides in exactly beta rounds', () => {
    for (const pct of [0, 100]) {
      const out = snowRun(snowInit(SNOW_NODES, pct, 1), 5, 4, SNOW_BETA, rng(1));
      expect(out.rounds).toBe(SNOW_BETA);
      expect(snowTally(out.nodes).agreed).toBe(true);
      expect(snowTally(out.nodes).blue).toBe(pct === 100 ? SNOW_NODES : 0);
    }
  });
  it('an even split tips one way and everyone agrees', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const out = snowRun(snowInit(SNOW_NODES, 50, seed), 5, 4, SNOW_BETA, rng(seed));
      const t = snowTally(out.nodes);
      expect(out.decided).toBe(true);
      expect(t.split).toBe(false);
      expect(t.blue === 0 || t.orange === 0).toBe(true);
    }
  });
  it('one round is deterministic for a seed and decided nodes do not change', () => {
    const start = snowInit(SNOW_NODES, 50, 9);
    expect(snowRound(start, 5, 4, SNOW_BETA, rng(4))).toEqual(snowRound(start, 5, 4, SNOW_BETA, rng(4)));
    const frozen = start.map((n) => ({ ...n, decided: true }));
    expect(snowRound(frozen, 5, 3, SNOW_BETA, rng(4)).nodes).toEqual(frozen);
    expect(snowRound(start, 5, 4, SNOW_BETA, rng(4)).sample).toHaveLength(5);
  });
  it('stops at the round limit instead of looping forever', () => {
    // alpha = k = 10 on an even split: almost no poll is unanimous.
    const out = snowRun(snowInit(SNOW_NODES, 50, 2), 10, 10, SNOW_BETA, rng(2), 30);
    expect(out.rounds).toBeLessThanOrEqual(30);
  });
  it('a weak quorum can let nodes decide differently', () => {
    let splits = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const out = snowRun(snowInit(SNOW_NODES, 50, seed), 1, 1, SNOW_BETA, rng(seed));
      if (snowTally(out.nodes).split) splits++;
    }
    expect(splits).toBeGreaterThan(0);
  });
});

describe('cosmos voting power', () => {
  const all = POWERS.map(() => true);
  it('commits only with strictly more than two thirds online', () => {
    expect(bftStatus(POWERS, all)).toMatchObject({ onlinePct: 100, canCommit: true });
    expect(bftStatus(POWERS, [true, true, false, true, false])).toMatchObject({ onlinePct: 70, canCommit: true });
    expect(bftStatus(POWERS, [true, false, true, true, false])).toMatchObject({ onlinePct: 65, canCommit: false });
    expect(bftStatus(POWERS, POWERS.map(() => false))).toMatchObject({ onlinePct: 0, offlinePct: 100, canCommit: false });
    // Exactly two thirds is not enough.
    expect(bftStatus([1, 1, 1], [true, true, false]).canCommit).toBe(false);
    expect(bftStatus([], []).canCommit).toBe(false);
    expect(bftStatus([], []).onlinePct).toBe(0);
  });
});

describe('ibc transfer', () => {
  const run = (relayer: boolean[], from = ibcInitial()) => relayer.reduce<IbcState[]>((acc, on) => [...acc, ibcNext(acc[acc.length - 1], on)], [from]);
  it('completes with a relayer: escrow on A, voucher on B', () => {
    const s = run([true, true, true, true, true]);
    expect(s.map((x) => x.phase)).toEqual(['idle', 'escrowed', 'relayed', 'verified', 'minted', 'acked']);
    expect(s[5]).toMatchObject({ balanceA: IBC_START - IBC_AMOUNT, escrowA: IBC_AMOUNT, vouchersB: IBC_AMOUNT });
    expect(ibcNext(s[5], true)).toEqual(ibcInitial());
  });
  it('waits without a relayer, expires, and refunds once a relayer proves the timeout', () => {
    const s = run([true, ...Array(IBC_TIMEOUT).fill(false), false, true]);
    const phases = s.map((x) => x.phase);
    expect(phases.slice(0, 2)).toEqual(['idle', 'escrowed']);
    expect(phases[1 + IBC_TIMEOUT]).toBe('expired');
    expect(phases[2 + IBC_TIMEOUT]).toBe('expired');
    const last = s[s.length - 1];
    expect(last).toMatchObject({ phase: 'refunded', balanceA: IBC_START, escrowA: 0, vouchersB: 0 });
  });
  it('a relayer that returns in time still delivers', () => {
    const s = run([true, false, true]);
    expect(s[3].phase).toBe('relayed');
  });
  it('never creates or loses coins', () => {
    for (const pattern of [[true], [false], [true, false], [false, false, true]]) {
      let s = ibcInitial();
      for (let i = 0; i < 30; i++) {
        s = ibcNext(s, pattern[i % pattern.length]);
        expect(s.balanceA + s.escrowA).toBe(IBC_START);
        expect(s.vouchersB).toBeLessThanOrEqual(s.escrowA);
      }
    }
  });
});

describe('comparison', () => {
  it('ranks each criterion with ties and finite bars', () => {
    expect(rankChains('block').map((r) => r.chain)).toEqual(['sol', 'ava', 'cos']);
    expect(rankChains('final').map((r) => r.chain)).toEqual(['ava', 'cos', 'sol']);
    expect(rankChains('vals').map((r) => r.rank)).toEqual([1, 1, 3]);
    expect(rankChains('hw').map((r) => [r.chain, r.rank])).toEqual([['ava', 1], ['cos', 1], ['sol', 3]]);
    for (const c of CRITERIA)
      for (const r of rankChains(c)) {
        expect(r.bar).toBeGreaterThanOrEqual(0.15);
        expect(r.bar).toBeLessThanOrEqual(1);
      }
  });
});

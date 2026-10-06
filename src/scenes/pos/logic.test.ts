import { describe, expect, it } from 'vitest';
import {
  advanceEpoch,
  advanceEpochs,
  balancesEth,
  clampStake,
  effectiveEth,
  epochStatus,
  finalityDelay,
  initialChain,
  isLeaking,
  participation,
  pickProposer,
  posAttack,
  powAttack,
  runSlots,
  shares,
  slashOutcome,
} from './logic';

const OTHERS = [320, 640, 160, 960, 480, 1280];

describe('stake and shares', () => {
  it('clamps the stake to 32 … 2,048 whole ETH', () => {
    expect(clampStake(0)).toBe(32);
    expect(clampStake(5000)).toBe(2048);
    expect(clampStake(100.4)).toBe(100);
    expect(clampStake(NaN)).toBe(32);
    expect(clampStake(Infinity)).toBe(32);
  });

  it('computes shares that add up to 1 and never NaN', () => {
    const s = shares([32, ...OTHERS]);
    expect(s[0]).toBeCloseTo(32 / 3872, 12);
    expect(s.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(shares([0, 0])).toEqual([0, 0]);
    expect(shares([NaN, 10])).toEqual([0, 1]);
  });
});

describe('proposer selection', () => {
  it('is deterministic for a seed and slot', () => {
    const b = [2048, ...OTHERS];
    expect(pickProposer(b, 7, 3)).toEqual(pickProposer(b, 7, 3));
    expect(runSlots(b, 7, 0, 32)).toEqual(runSlots(b, 7, 0, 32));
    expect(runSlots(b, 7, 0, 64).slice(32)).toEqual(runSlots(b, 7, 32, 32));
  });

  it('chooses in proportion to effective balance', () => {
    const b = [960, ...OTHERS];
    const n = 40_000;
    const tally = b.map(() => 0);
    for (const i of runSlots(b, 1, 0, n)) tally[i]++;
    const expected = shares(b);
    tally.forEach((t, i) => expect(Math.abs(t / n - expected[i])).toBeLessThan(0.012));
  });

  it('never picks a validator without stake and reports nobody when there is none', () => {
    const picks = runSlots([0, 32, 0, 64], 5, 0, 500);
    expect(picks.every((i) => i === 1 || i === 3)).toBe(true);
    expect(pickProposer([0, 0], 1, 1).index).toBe(-1);
    expect(pickProposer([], 1, 1).index).toBe(-1);
    expect(runSlots([32], 1, 0, 0)).toEqual([]);
    expect(runSlots([32], 1, 0, NaN)).toEqual([]);
  });

  it('gives a 32 ETH validator a real but small chance', () => {
    const picks = runSlots([32, 2048], 3, 0, 20_000);
    const small = picks.filter((i) => i === 0).length / picks.length;
    expect(small).toBeGreaterThan(0.008);
    expect(small).toBeLessThan(0.025); // expected 32 / 2080 ≈ 1.5%
  });
});

describe('participation', () => {
  it('justifies at exactly two thirds and not below', () => {
    expect(participation([1, 1, 1], [true, true, false]).justified).toBe(true);
    expect(participation([100, 100, 101], [true, true, false]).justified).toBe(false);
    expect(participation([1, 1, 1], [true, true, true]).fraction).toBe(1);
  });

  it('handles nobody online and no stake', () => {
    const none = participation([10, 20], [false, false]);
    expect(none).toMatchObject({ online: 0, total: 30, fraction: 0, justified: false });
    expect(participation([], [])).toMatchObject({ fraction: 0, justified: false, needed: 0 });
  });
});

describe('finality and the inactivity leak', () => {
  const stakes = [2048, ...OTHERS]; // "you" hold 34.8% of 5,888
  const all = stakes.map(() => true);
  const youOff = stakes.map((_, i) => i !== 0);

  it('starts healthy and keeps finalizing while two thirds vote', () => {
    let s = initialChain(stakes);
    expect(epochStatus(s, 10)).toBe('finalized');
    expect(epochStatus(s, 11)).toBe('justified');
    expect(epochStatus(s, 12)).toBe('voting');
    s = advanceEpochs(s, all, 5);
    expect(s.epoch).toBe(17);
    expect(s.finalizedEpoch).toBe(15);
    expect(finalityDelay(s)).toBe(1);
    expect(isLeaking(s)).toBe(false);
    expect(balancesEth(s)).toEqual(stakes);
  });

  it('stops finalizing when more than a third is offline and starts leaking after four epochs', () => {
    let s = initialChain(stakes);
    s = advanceEpoch(s, youOff);
    expect(epochStatus(s, 12)).toBe('missed');
    expect(s.finalizedEpoch).toBe(10);
    s = advanceEpochs(s, youOff, 2);
    expect(isLeaking(s)).toBe(false);
    s = advanceEpoch(s, youOff);
    expect(finalityDelay(s)).toBe(5);
    expect(isLeaking(s)).toBe(true);
    expect(s.finalizedEpoch).toBe(10);
  });

  it('charges effective_balance × score / (4 × 2^24) once the leak is on', () => {
    let s = initialChain([32, 32]);
    const off = [false, true]; // half offline: never justified
    // Epochs 12..14 are closed outside the leak: the score rises by 4 and falls back to 0.
    s = advanceEpochs(s, off, 3);
    expect(s.inactivityScores[0]).toBe(0n);
    expect(s.balances[0]).toBe(32_000_000_000n);
    // Closing epoch 15: delay is now 5 > 4, the score stays at 4 and the penalty applies.
    s = advanceEpoch(s, off);
    expect(s.inactivityScores[0]).toBe(4n);
    expect(s.balances[0]).toBe(32_000_000_000n - (32_000_000_000n * 4n) / (4n * (1n << 24n)));
    expect(s.balances[1]).toBe(32_000_000_000n);
  });

  it('leaks the offline stake until the online side holds two thirds again, then finalizes', () => {
    let s = initialChain(stakes);
    let guard = 0;
    while (s.finalizedEpoch === 10 && guard++ < 20_000) s = advanceEpoch(s, youOff);
    expect(guard).toBeGreaterThan(500);
    expect(guard).toBeLessThan(5000);
    const eff = effectiveEth(s);
    const online = eff.slice(1).reduce((a, b) => a + b, 0);
    expect(online).toBe(3840);
    expect(eff[0]).toBeLessThanOrEqual(1920);
    expect(eff[0]).toBeGreaterThan(1850);
    expect(balancesEth(s).slice(1)).toEqual(OTHERS);
  });

  it('recovers when the validator comes back online', () => {
    let s = advanceEpochs(initialChain(stakes), youOff, 200);
    const before = s.balances[0];
    s = advanceEpochs(s, all, 2);
    expect(s.finalizedEpoch).toBe(s.epoch - 2);
    expect(s.balances[0]).toBe(before);
    s = advanceEpochs(s, all, 60);
    expect(s.inactivityScores[0]).toBe(0n);
  });

  it('never goes negative with everyone offline for a very long time', () => {
    const s = advanceEpochs(initialChain([32, 64]), [false, false], 30_000);
    expect(s.balances.every((b) => b >= 0n)).toBe(true);
    expect(s.effective.every((b) => b >= 0n)).toBe(true);
    expect(s.finalizedEpoch).toBe(10);
    expect(advanceEpochs(initialChain([32]), [true], NaN).epoch).toBe(12);
    expect(advanceEpoch(initialChain([0, 0]), [true, true]).finalizedEpoch).toBe(10);
  });
});

describe('slashing', () => {
  it('takes 1/4096 at once and little more for a lone offender', () => {
    const o = slashOutcome(32, 32, 32_000_000);
    expect(o.initial).toBeCloseTo(0.0078125, 9);
    expect(o.correlation).toBeCloseTo(32 * 3 * (32 / 32_000_000), 6);
    expect(o.remaining).toBeCloseTo(32 - o.initial - o.correlation, 9);
  });

  it('grows with the stake slashed together and takes everything from one third up', () => {
    const total = 3872;
    const a = slashOutcome(32, 32, total);
    const b = slashOutcome(32, 512, total);
    const c = slashOutcome(32, 992, total);
    expect(a.correlation).toBeLessThan(b.correlation);
    expect(b.correlation).toBeLessThan(c.correlation);
    expect(b.correlation).toBeCloseTo((32 * 3 * 512) / total, 3);
    const third = slashOutcome(32, total / 3 + 1, total);
    expect(third.remaining).toBe(0);
    expect(third.lostFraction).toBe(1);
    expect(slashOutcome(2048, total, total).remaining).toBe(0);
  });

  it('is safe at the extremes', () => {
    expect(slashOutcome(0, 10, 100)).toMatchObject({ initial: 0, correlation: 0, remaining: 0, lostFraction: 0 });
    expect(slashOutcome(32, 10, 0)).toMatchObject({ correlation: 0, remaining: 32, slashedShare: 0 });
    expect(slashOutcome(32, 1e9, 100).slashedShare).toBe(1);
    const o = slashOutcome(NaN, NaN, NaN);
    for (const v of Object.values(o)) expect(Number.isFinite(v)).toBe(true);
  });
});

describe('attack comparison', () => {
  it('needs a hashrate majority under proof of work and loses nothing afterwards', () => {
    expect(powAttack(50).canRewrite).toBe(false);
    expect(powAttack(51)).toMatchObject({ canRewrite: true, lostPercent: 0, keptPercent: 100 });
    expect(powAttack(0).canRewrite).toBe(false);
    expect(powAttack(250).share).toBe(100);
    expect(powAttack(NaN).share).toBe(0);
  });

  it('applies the one-third and two-thirds stake thresholds and the correlation penalty', () => {
    expect(posAttack(33)).toMatchObject({ canStall: false, canRewrite: false, lostPercent: 99 });
    expect(posAttack(34)).toMatchObject({ canStall: true, canRewrite: false, lostPercent: 100, keptPercent: 0 });
    expect(posAttack(66).canRewrite).toBe(false);
    expect(posAttack(67).canRewrite).toBe(true);
    expect(posAttack(10)).toMatchObject({ lostPercent: 30, keptPercent: 70 });
    expect(posAttack(0)).toMatchObject({ lostPercent: 0, keptPercent: 100, canStall: false });
    expect(posAttack(100)).toMatchObject({ lostPercent: 100, canRewrite: true });
  });
});

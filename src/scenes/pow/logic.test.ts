import { describe, expect, it } from 'vitest';
import {
  attackSuccess,
  blockTime,
  catchUp,
  causesFork,
  expectedWins,
  MAX_TIMESPAN,
  minePeriod,
  MIN_TIMESPAN,
  replay,
  retarget,
  rng,
  secretProgress,
  simulateAttack,
  simulateRace,
  splitShares,
  staleChance,
  TARGET_TIMESPAN,
} from './logic';

describe('rng', () => {
  it('is repeatable and stays in [0, 1)', () => {
    const a = rng(7);
    const b = rng(7);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(rng(Number.NaN)()).toBe(rng(0)());
  });
});

describe('the lottery', () => {
  it('splits the rest between the other two miners', () => {
    const [a, you, c] = splitShares(0.45);
    expect(you).toBe(0.45);
    expect(a + you + c).toBeCloseTo(1, 12);
    expect(a / c).toBeCloseTo(5 / 6, 12);
    expect(splitShares(0.01).reduce((x, y) => x + y)).toBeCloseTo(1, 12);
    expect(splitShares(0.9).reduce((x, y) => x + y)).toBeCloseTo(1, 12);
    expect(splitShares(5)).toEqual([0, 1, 0]);
    expect(splitShares(Number.NaN)[1]).toBe(0);
  });
  it('hands out exactly one block per round', () => {
    for (const share of [0.01, 0.45, 0.9]) {
      const wins = simulateRace(splitShares(share), 100, rng(3));
      expect(wins.reduce((a, b) => a + b)).toBe(100);
      expect(wins.every((w) => Number.isInteger(w) && w >= 0)).toBe(true);
    }
  });
  it('wins approach the share over many rounds', () => {
    for (const share of [0.01, 0.1, 0.45, 0.9]) {
      const n = 200_000;
      const wins = simulateRace(splitShares(share), n, rng(11));
      expect(wins[1] / n).toBeCloseTo(share, 2);
    }
  });
  it('handles empty and degenerate input', () => {
    expect(simulateRace([], 10, rng(1))).toEqual([]);
    expect(simulateRace([0, 0], 10, rng(1))).toEqual([0, 0]);
    expect(simulateRace([1, 0], 10, rng(1))).toEqual([10, 0]);
    expect(simulateRace([0.5, 0.5], Number.NaN, rng(1))).toEqual([0, 0]);
    expect(simulateRace([0.5, 0.5], -4, rng(1))).toEqual([0, 0]);
  });
  it('expected wins and spread', () => {
    expect(expectedWins(0.1, 100).mean).toBeCloseTo(10, 12);
    expect(expectedWins(0.1, 100).sd).toBeCloseTo(3, 12);
    expect(expectedWins(0.9, 0)).toEqual({ mean: 0, sd: 0 });
    expect(expectedWins(2, 100)).toEqual({ mean: 100, sd: 0 });
  });
});

describe('stale blocks', () => {
  it('grows with the delay', () => {
    expect(staleChance(0)).toBe(0);
    expect(staleChance(1)).toBeCloseTo(0.001665, 5);
    expect(staleChance(20)).toBeCloseTo(0.03278, 4);
    expect(staleChance(600)).toBeCloseTo(1 - Math.exp(-1), 12);
    expect(staleChance(-5)).toBe(0);
    expect(staleChance(Number.NaN)).toBe(0);
    expect(staleChance(6, 12)).toBeCloseTo(1 - Math.exp(-0.5), 12);
    expect(Number.isFinite(staleChance(5, 0))).toBe(true);
  });
  it('a second block forks only while the first is still travelling', () => {
    expect(causesFork(10, 5)).toBe(true);
    expect(causesFork(5, 5)).toBe(false);
    expect(causesFork(1, 5)).toBe(false);
  });
});

describe('retarget', () => {
  const WEEK = 7 * 24 * 60 * 60;
  it('keeps the difficulty when the period took two weeks', () => {
    expect(retarget(1, TARGET_TIMESPAN)).toEqual({ actual: TARGET_TIMESPAN, clamped: TARGET_TIMESPAN, factor: 1, difficulty: 1, limit: 'none' });
  });
  it('doubles after one week and halves after four', () => {
    expect(retarget(3, WEEK).difficulty).toBeCloseTo(6, 12);
    expect(retarget(3, 4 * WEEK).difficulty).toBeCloseTo(1.5, 12);
  });
  it('never moves by more than a factor of four', () => {
    expect(MIN_TIMESPAN).toBe(302_400);
    expect(MAX_TIMESPAN).toBe(4_838_400);
    const up = retarget(1, 1000);
    expect(up.factor).toBe(4);
    expect(up.limit).toBe('up');
    const down = retarget(8, 100 * WEEK);
    expect(down.difficulty).toBe(2);
    expect(down.limit).toBe('down');
    expect(retarget(1, 0).factor).toBe(4);
    expect(retarget(1, Number.NaN).factor).toBe(1);
    expect(retarget(Number.NaN, WEEK).difficulty).toBe(2);
  });
  it('block time follows difficulty / hashrate', () => {
    expect(blockTime(1, 1)).toBe(600);
    expect(blockTime(1, 2)).toBe(300);
    expect(blockTime(4, 0.25)).toBe(9600);
    expect(Number.isFinite(blockTime(1, 0))).toBe(true);
  });
  it('a whole period: the measured span covers 2015 intervals', () => {
    const p = minePeriod(1, 2);
    expect(p.spacing).toBe(300);
    expect(p.duration).toBe(604_800);
    expect(p.actual).toBe(2015 * 300);
    expect(p.difficulty).toBeCloseTo(2 * (2016 / 2015), 12);
    // At the slider's ends the change sits just inside the limit on the way up (the off-by-one) ...
    const fast = minePeriod(1, 4);
    expect(fast.limit).toBe('up');
    expect(fast.difficulty).toBe(4);
    // ... and four times slower is still allowed.
    const slow = minePeriod(1, 0.25);
    expect(slow.limit).toBe('none');
    expect(slow.difficulty).toBeCloseTo(0.25 * (2016 / 2015), 12);
    // A sixteen-fold drop is cut to a factor of four per period.
    const crash = minePeriod(4, 0.25);
    expect(crash.limit).toBe('down');
    expect(crash.difficulty).toBe(1);
    expect(minePeriod(1, 0.25).spacing).toBe(2400);
  });
  it('returns to ten minutes after enough periods', () => {
    let d = 1;
    for (let i = 0; i < 4; i++) d = minePeriod(d, 4).difficulty;
    expect(blockTime(d, 4)).toBeCloseTo(600, -1);
  });
});

describe('double-spend race', () => {
  it("matches the table in Nakamoto's paper", () => {
    // q = 0.1
    expect(attackSuccess(0.1, 0)).toBeCloseTo(1, 7);
    expect(attackSuccess(0.1, 1)).toBeCloseTo(0.2045873, 7);
    expect(attackSuccess(0.1, 2)).toBeCloseTo(0.0509779, 7);
    expect(attackSuccess(0.1, 5)).toBeCloseTo(0.0009137, 7);
    expect(attackSuccess(0.1, 6)).toBeCloseTo(0.0002428, 7);
    expect(attackSuccess(0.1, 10)).toBeCloseTo(0.0000012, 7);
    // q = 0.3
    expect(attackSuccess(0.3, 5)).toBeCloseTo(0.1773523, 7);
    expect(attackSuccess(0.3, 10)).toBeCloseTo(0.0416605, 7);
    expect(attackSuccess(0.3, 50)).toBeCloseTo(0.0000006, 7);
  });
  it('is certain from half the hashrate and impossible with none', () => {
    expect(attackSuccess(0.5, 6)).toBe(1);
    expect(attackSuccess(0.6, 12)).toBe(1);
    expect(attackSuccess(0, 1)).toBe(0);
    expect(attackSuccess(Number.NaN, 6)).toBe(0);
  });
  it('falls with every confirmation and rises with the share', () => {
    for (const q of [0.01, 0.1, 0.3, 0.45, 0.49]) {
      for (let z = 1; z < 12; z++) expect(attackSuccess(q, z + 1)).toBeLessThan(attackSuccess(q, z));
    }
    for (let z = 1; z <= 12; z++) {
      for (let q = 1; q < 49; q++) expect(attackSuccess((q + 1) / 100, z)).toBeGreaterThan(attackSuccess(q / 100, z));
    }
  });
  it('catch-up probability is (q/p)^z', () => {
    expect(catchUp(0.25, 2)).toBeCloseTo(1 / 9, 12);
    expect(catchUp(0.3, 0)).toBe(1);
    expect(catchUp(0.5, 9)).toBe(1);
    expect(catchUp(0, 3)).toBe(0);
  });
  it('expected secret progress is z q / p', () => {
    expect(secretProgress(0.3, 6)).toBeCloseTo(18 / 7, 12);
    expect(secretProgress(0.5, 4)).toBe(4);
    expect(Number.isFinite(secretProgress(1, 12))).toBe(true);
  });
  it('one attempt is consistent with its own events', () => {
    for (const q of [0.01, 0.3, 0.49, 0.5, 0.6]) {
      for (const z of [1, 6, 12]) {
        const random = rng(q * 1000 + z);
        for (let i = 0; i < 200; i++) {
          const a = simulateAttack(q, z, random);
          expect(replay(a.events, a.events.length)).toEqual({ honest: a.honest, attacker: a.attacker });
          expect(a.honest).toBeGreaterThanOrEqual(z);
          expect(a.caughtUp).toBe(a.attacker >= a.honest);
          expect(a.events.length).toBeLessThan(2000);
        }
      }
    }
    expect(replay(['A', 'H', 'H'], 2)).toEqual({ honest: 1, attacker: 1 });
    expect(replay(['A'], Number.NaN)).toEqual({ honest: 0, attacker: 0 });
  });
  it('a majority attacker always catches up', () => {
    const random = rng(5);
    for (let i = 0; i < 300; i++) expect(simulateAttack(0.6, 12, random).caughtUp).toBe(true);
  });
  it('the simulated success rate is close to the formula', () => {
    const random = rng(42);
    for (const [q, z] of [[0.3, 2], [0.4, 4], [0.1, 1]] as const) {
      const n = 20_000;
      let wins = 0;
      for (let i = 0; i < n; i++) if (simulateAttack(q, z, random).caughtUp) wins++;
      // The paper approximates the attacker's head start with a Poisson distribution, so allow a small gap.
      expect(Math.abs(wins / n - attackSuccess(q, z))).toBeLessThan(0.03);
    }
  });
});

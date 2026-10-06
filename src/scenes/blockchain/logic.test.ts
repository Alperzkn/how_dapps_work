import { describe, expect, it } from 'vitest';
import { sha256 } from '../../sim/sha256';
import {
  attackerExpectedBlocks,
  bitDiff,
  brokenCount,
  catchUpFromBehind,
  catchUpProbability,
  computeChain,
  firstBroken,
  hexDiff,
  MAX_DEPTH,
  MAX_SHARE,
  MIN_DEPTH,
  MIN_SHARE,
  ORIGINAL,
} from './logic';

describe('computeChain', () => {
  it('is consistent when nothing was edited', () => {
    const chain = computeChain(ORIGINAL);
    expect(firstBroken(chain)).toBe(-1);
    expect(brokenCount(chain)).toBe(0);
    expect(chain.every((b) => !b.edited && !b.redone && b.linked)).toBe(true);
    expect(chain[1].storedPrev).toBe(chain[0].hash);
  });

  it('breaks the link right after whichever block is edited', () => {
    for (let k = 0; k < ORIGINAL.length; k++) {
      const data = ORIGINAL.map((d, i) => (i === k ? `${d}!` : d));
      const chain = computeChain(data);
      expect(chain[k].edited).toBe(true);
      expect(chain[k].linked).toBe(true);
      expect(firstBroken(chain)).toBe(k === ORIGINAL.length - 1 ? -1 : k + 1);
      expect(brokenCount(chain)).toBe(ORIGINAL.length - 1 - k);
    }
  });

  it('redoing one block repairs its link and breaks the next one', () => {
    const data = ['Genesis', 'Ayşe → Ben: 500', ORIGINAL[2], ORIGINAL[3]];
    const clean = computeChain(ORIGINAL);
    const one = computeChain(data, [false, false, true, false]);
    expect(one[2].linkOk).toBe(true);
    expect(one[2].redone).toBe(true);
    expect(one[2].hash).not.toBe(clean[2].hash);
    expect(firstBroken(one)).toBe(3);
    const all = computeChain(data, [false, false, true, true]);
    expect(firstBroken(all)).toBe(-1);
    expect(all[3].hash).not.toBe(clean[3].hash);
  });

  it('ignores redo flags on an untouched chain and tolerates short input', () => {
    const chain = computeChain([], [true, true, true, true]);
    expect(chain.map((b) => b.hash)).toEqual(computeChain(ORIGINAL).map((b) => b.hash));
    expect(chain.some((b) => b.redone)).toBe(false);
  });
});

describe('hash differences', () => {
  it('counts differing hex characters and bits', () => {
    expect(hexDiff('abcd', 'abcd')).toBe(0);
    expect(hexDiff('abcd', 'abce')).toBe(1);
    expect(bitDiff('0f', 'f0')).toBe(8);
    expect(bitDiff('00', '01')).toBe(1);
    expect(hexDiff('', 'ab')).toBe(2);
  });

  it('shows the avalanche effect on real SHA-256 output', () => {
    const a = sha256('Hello');
    const b = sha256('Hellp');
    expect(hexDiff(a, b)).toBeGreaterThan(48);
    expect(bitDiff(a, b)).toBeGreaterThan(90);
    expect(bitDiff(a, b)).toBeLessThan(166);
  });
});

describe('catchUpProbability', () => {
  // Values printed in the Bitcoin whitepaper, section 11.
  it('matches the whitepaper table for q = 0.1', () => {
    const table: [number, number][] = [
      [0, 1],
      [1, 0.2045873],
      [2, 0.0509779],
      [3, 0.0131722],
      [4, 0.0034552],
      [5, 0.0009137],
      [6, 0.0002428],
      [7, 0.0000647],
      [8, 0.0000173],
      [9, 0.0000046],
      [10, 0.0000012],
    ];
    for (const [z, p] of table) expect(catchUpProbability(0.1, z)).toBeCloseTo(p, 7);
  });

  it('matches the whitepaper table for q = 0.3', () => {
    const table: [number, number][] = [
      [0, 1],
      [5, 0.1773523],
      [10, 0.0416605],
      [15, 0.0101008],
      [20, 0.0024804],
      [25, 0.0006132],
      [30, 0.0001522],
      [35, 0.0000379],
      [40, 0.0000095],
      [45, 0.0000024],
      [50, 0.0000006],
    ];
    for (const [z, p] of table) expect(catchUpProbability(0.3, z)).toBeCloseTo(p, 7);
  });

  it('reproduces the "z for P < 0.1%" list', () => {
    const need = (q: number) => {
      let z = 0;
      while (catchUpProbability(q, z) >= 0.001) z++;
      return z;
    };
    expect([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45].map(need)).toEqual([5, 8, 11, 15, 24, 41, 89, 340]);
  });

  it('stays a finite probability at the slider extremes and beyond', () => {
    for (const q of [MIN_SHARE, 0.1, 0.25, MAX_SHARE]) {
      for (const z of [MIN_DEPTH, 6, MAX_DEPTH]) {
        const p = catchUpProbability(q, z);
        expect(Number.isFinite(p)).toBe(true);
        expect(p).toBeGreaterThan(0);
        expect(p).toBeLessThan(1);
        // Counting the attacker's head start can only help the attacker.
        expect(p).toBeGreaterThan(catchUpFromBehind(q, z));
      }
    }
    expect(catchUpProbability(MIN_SHARE, MAX_DEPTH)).toBeLessThan(1e-12);
    expect(catchUpProbability(MAX_SHARE, MIN_DEPTH)).toBeGreaterThan(0.9);
    expect(catchUpProbability(0.5, 6)).toBe(1);
    expect(catchUpProbability(0.9, 6)).toBe(1);
    expect(catchUpProbability(0, 6)).toBe(0);
    expect(catchUpProbability(-1, 6)).toBe(0);
    expect(catchUpProbability(Number.NaN, Number.NaN)).toBe(1);
    expect(catchUpProbability(0.1, -3)).toBe(1);
  });

  it('falls as the block is buried deeper and rises with the attacker share', () => {
    for (let z = 1; z < MAX_DEPTH; z++) expect(catchUpProbability(0.2, z + 1)).toBeLessThan(catchUpProbability(0.2, z));
    for (let q = 2; q <= 49; q++) expect(catchUpProbability(q / 100, 6)).toBeGreaterThan(catchUpProbability((q - 1) / 100, 6));
  });
});

describe('simple figures', () => {
  it('computes (q/p)^z and the expected attacker progress', () => {
    expect(catchUpFromBehind(0.1, 6)).toBeCloseTo(Math.pow(1 / 9, 6), 12);
    expect(catchUpFromBehind(0.5, 6)).toBe(1);
    expect(catchUpFromBehind(0, 6)).toBe(0);
    expect(attackerExpectedBlocks(0.1, 6)).toBeCloseTo(6 / 9, 12);
    expect(attackerExpectedBlocks(MAX_SHARE, MAX_DEPTH)).toBeCloseTo((12 * 0.49) / 0.51, 12);
    expect(attackerExpectedBlocks(0, 6)).toBe(0);
    expect(Number.isFinite(attackerExpectedBlocks(1, 12))).toBe(true);
  });
});

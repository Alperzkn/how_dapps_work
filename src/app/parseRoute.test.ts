import { describe, expect, it } from 'vitest';
import { clampStep, lessonPath, parseLessonRoute } from './parseRoute';

describe('clampStep', () => {
  it('clamps out-of-range and junk steps', () => {
    expect(clampStep('99', 6)).toBe(5);
    expect(clampStep('0', 6)).toBe(0);
    expect(clampStep('-3', 6)).toBe(0);
    expect(clampStep('abc', 6)).toBe(0);
    expect(clampStep(undefined, 6)).toBe(0);
    expect(clampStep('4', 6)).toBe(3);
    expect(clampStep('2.9', 6)).toBe(1);
  });
});

describe('parseLessonRoute', () => {
  it('uses a valid level from the URL', () => {
    expect(parseLessonRoute('4', 'expert', 6, 'beginner')).toEqual({ stepIndex: 3, level: 'expert' });
  });
  it('falls back to the stored level for unknown or missing values', () => {
    expect(parseLessonRoute('99', 'guru', 6, 'intermediate')).toEqual({
      stepIndex: 5,
      level: 'intermediate',
    });
    expect(parseLessonRoute('1', null, 6, 'beginner').level).toBe('beginner');
  });
});

describe('lessonPath', () => {
  it('builds 1-based step urls', () => {
    expect(lessonPath('tr', 'uniswap-v3', 3, 'expert')).toBe('/tr/lesson/uniswap-v3/4?level=expert');
    expect(lessonPath('en', 'pow')).toBe('/en/lesson/pow/1');
  });
});

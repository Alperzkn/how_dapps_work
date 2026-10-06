import { describe, expect, it } from 'vitest';
import { createSafeStorage, detectLang } from './store';

describe('createSafeStorage', () => {
  it('falls back to memory when storage access throws', () => {
    const s = createSafeStorage(() => {
      throw new Error('SecurityError');
    });
    s.setItem('a', '1');
    expect(s.getItem('a')).toBe('1');
    s.removeItem('a');
    expect(s.getItem('a')).toBeNull();
  });

  it('falls back to memory when writes throw (quota / private mode)', () => {
    const broken = {
      setItem() {
        throw new Error('QuotaExceededError');
      },
    } as unknown as Storage;
    const s = createSafeStorage(() => broken);
    s.setItem('a', '1');
    expect(s.getItem('a')).toBe('1');
  });
});

describe('detectLang', () => {
  it('picks Turkish only for tr locales', () => {
    expect(detectLang('tr-TR')).toBe('tr');
    expect(detectLang('TR')).toBe('tr');
    expect(detectLang('en-US')).toBe('en');
    expect(detectLang('de')).toBe('en');
    expect(detectLang(undefined)).toBe('en');
  });
});

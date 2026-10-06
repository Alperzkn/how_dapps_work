import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { sha256, shortHash } from './sha256';

const ref = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

describe('sha256', () => {
  it('matches the NIST vectors', () => {
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('matches node crypto across block boundaries and for non-ASCII text', () => {
    for (const len of [54, 55, 56, 57, 63, 64, 65, 119, 120, 200]) {
      const s = 'a'.repeat(len);
      expect(sha256(s)).toBe(ref(s));
    }
    for (const s of ['Ayşe → Ben: 5', 'çğıöşü İ', '🙂']) expect(sha256(s)).toBe(ref(s));
  });
});

describe('shortHash', () => {
  it('abbreviates', () => {
    expect(shortHash('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')).toBe('ba7816…15ad');
    expect(shortHash('ba7816bf8f01cfea', 4, 0)).toBe('ba78…');
  });
});

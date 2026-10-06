import { sha256 } from './sha256';

export interface MineResult {
  found: boolean;
  /** The winning nonce, or the next nonce to try if nothing was found yet. */
  nonce: number;
  hash: string;
  tried: number;
}

/** Expected number of attempts to find a hash with `zeros` leading hex zeros. */
export const expectedAttempts = (zeros: number) => 16 ** clampZeros(zeros);

const clampZeros = (zeros: number) => Math.min(Math.max(Math.floor(Number.isFinite(zeros) ? zeros : 0), 0), 8);

/**
 * Tries up to `budget` nonces starting at `startNonce`, looking for
 * sha256(header + nonce) that starts with `zeros` hex zeros.
 * Call repeatedly with the returned nonce to search in slices without blocking the page.
 */
export function mineStep(header: string, startNonce: number, zeros: number, budget: number): MineResult {
  const prefix = '0'.repeat(clampZeros(zeros));
  let nonce = Math.max(0, Math.floor(startNonce) || 0);
  let hash = '';
  const limit = Math.max(1, Math.floor(budget) || 1);
  for (let tried = 1; tried <= limit; tried++, nonce++) {
    hash = sha256(`${header}|${nonce}`);
    if (hash.startsWith(prefix)) return { found: true, nonce, hash, tried };
  }
  return { found: false, nonce, hash, tried: limit };
}

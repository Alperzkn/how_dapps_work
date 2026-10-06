// A toy version of a Uniswap v4 dynamic-fee hook: the fee rises with volatility.

/**
 * Fee in basis points for a given recent volatility (e.g. 0.02 = 2% moves).
 * Linear from `baseBps` at zero volatility up to `maxBps` at 10% and beyond.
 */
export function dynamicFeeBps(volatility: number, baseBps = 5, maxBps = 100): number {
  const v = Number.isFinite(volatility) ? Math.min(Math.max(volatility, 0), 0.1) : 0;
  const lo = Math.max(0, baseBps);
  const hi = Math.max(lo, maxBps);
  return Math.round(lo + (hi - lo) * (v / 0.1));
}

/**
 * Flash accounting: net the deltas of a multi-hop swap so only the first input
 * and last output are actually transferred. Returns tokens that still owe/are owed.
 */
export function netDeltas(deltas: { token: string; amount: number }[]): Record<string, number> {
  const net: Record<string, number> = {};
  for (const d of deltas) net[d.token] = (net[d.token] ?? 0) + d.amount;
  for (const k of Object.keys(net)) if (Math.abs(net[k]) < 1e-12) delete net[k];
  return net;
}

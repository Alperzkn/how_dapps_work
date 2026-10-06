// Uniswap v2 constant-product math (x * y = k), in plain numbers for illustration.

const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/** Output for a given input, after the fee. Mirrors UniswapV2Library.getAmountOut. */
export function getAmountOut(amountIn: number, reserveIn: number, reserveOut: number, feeBps = 30): number {
  const dx = pos(amountIn);
  const x = pos(reserveIn);
  const y = pos(reserveOut);
  if (dx === 0 || x === 0 || y === 0) return 0;
  const dxAfterFee = dx * (1 - Math.min(Math.max(feeBps, 0), 10_000) / 10_000);
  return (dxAfterFee * y) / (x + dxAfterFee);
}

export interface SwapResult {
  /** Reserves after the swap. The fee stays in the pool, so x * y grows slightly. */
  x: number;
  y: number;
  out: number;
  /** Price of X in Y (y / x) before and after. */
  priceBefore: number;
  priceAfter: number;
  /** Average price actually paid vs. the price before, as a positive fraction. */
  impact: number;
}

/** Sell `dx` of token X into a pool holding `x` and `y`. */
export function swapV2(x: number, y: number, dx: number, feeBps = 30): SwapResult {
  const rx = pos(x);
  const ry = pos(y);
  const input = pos(dx);
  const priceBefore = rx > 0 ? ry / rx : 0;
  const out = getAmountOut(input, rx, ry, feeBps);
  const nx = rx + input;
  const ny = ry - out;
  const paid = input > 0 ? out / input : priceBefore;
  return {
    x: nx,
    y: ny,
    out,
    priceBefore,
    priceAfter: nx > 0 ? ny / nx : 0,
    impact: priceBefore > 0 ? Math.max(0, 1 - paid / priceBefore) : 0,
  };
}

/**
 * Impermanent loss of a v2 position when the price changes by `priceRatio`
 * (new price / price at deposit). 0 = no loss, -0.2 = 20% worse than holding.
 */
export function impermanentLoss(priceRatio: number): number {
  const r = pos(priceRatio);
  if (r === 0) return -1;
  return (2 * Math.sqrt(r)) / (1 + r) - 1;
}

/** LP tokens minted for a deposit into an existing pool (the smaller side counts). */
export function lpMinted(dx: number, dy: number, x: number, y: number, totalSupply: number): number {
  if (pos(x) === 0 || pos(y) === 0 || pos(totalSupply) === 0) return Math.sqrt(pos(dx) * pos(dy));
  return Math.min((pos(dx) / x) * totalSupply, (pos(dy) / y) * totalSupply);
}

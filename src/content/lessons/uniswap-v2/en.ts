import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    orderBook: 'Order book',
    waiting: 'waiting for a match',
    asks: 'asks',
    bids: 'bids',
    poolReady: 'Pool: always open',
    curve: 'price curve',
    hold: 'just hold',
    inPool: 'in the pool',
    il: 'Impermanent loss',
    trader: 'Trader',
    in: 'in',
    out: 'out',
    lp: 'Liquidity provider',
    lpToken: 'LP token = share',
    bothTokens: 'both tokens, equal value',
    fee: '0.3% fee stays in the pool',
    sell: 'Sell',
    impact: 'Price impact',
    minOut: 'Min. out',
    ratio: 'r',
    youGet: 'You get',
    price: 'USDC / ETH',
    reserves: 'Pool',
  },
  steps: {
    orderbook: {
      title: 'No order book',
      alt: 'On the left, a board lists sell offers on top and buy offers below with a gap between them; a buyer and a seller stand waiting in front of it. On the right, a trader swaps tokens directly with a pool that holds two tokens.',
      body: {
        beginner: `On a normal exchange, a buyer needs a seller. Each side writes down the price it wants and waits until someone on the other side agrees. That list of waiting offers is the [[order-book]].

[[uniswap]] works differently. There is no list and no waiting. Instead there is a big pot holding two kinds of [[token]], and you trade with the pot.

Think of a vending machine that sets its own prices: put one token in, the other comes out. It is always open, and it adjusts the price by itself after every trade.`,
        intermediate: `A classic exchange matches **bids** (buy offers) with **asks** (sell offers) in an [[order-book]]. It needs many active traders constantly placing and cancelling orders, otherwise the gap between the best bid and the best ask (the spread) gets wide.

On a [[blockchain]] every order placement and cancellation would be a [[transaction]] that costs a [[gas-fee]]. That was far too expensive on Ethereum.

[[uniswap]] is a [[dex]] that replaces the [[order-book]] with an [[amm]] (automated market maker): a [[smart-contract]] that holds two tokens and quotes a price from a formula. Anyone can trade against it at any moment, with one [[transaction]], without a counterparty being online.`,
        expert: `An on-chain central limit [[order-book]] needs a state write per order, per cancel and per match; market makers must also pay to requote on every price move. With block times of seconds and per-write [[gas]] costs, it was not viable on Ethereum L1 when [[uniswap]] launched.

An [[amm]] trades that precision for simplicity: liquidity is passive, the price is a pure function of the pool's balances, and a [[swap]] is one call with O(1) storage writes.

Uniswap v2 (May 2020) has three contracts:

- **Factory**: \`createPair(tokenA, tokenB)\` deploys one Pair per token pair with \`CREATE2\`, so the pair [[address]] can be computed off-chain. \`getPair\` looks it up.
- **Pair**: holds the two [[reserves]], implements \`mint\`, \`burn\`, \`swap\`, \`skim\`, \`sync\`, and is itself an [[erc-20]] (the [[lp-token]]).
- **Router**: a stateless helper that does the safety checks and multi-hop routing users need (\`swapExactTokensForTokens\`, \`addLiquidity\`). The Pair itself trusts nobody and checks only its invariant.

v2 pairs are always [[erc-20]]/[[erc-20]]; [[ether]] is wrapped as WETH by the Router. Tokens are stored sorted by address as \`token0\` < \`token1\`.`,
      },
    },
    pool: {
      title: 'The pool and its liquidity providers',
      alt: 'Two people stand on either side of the pool. Each one throws both a pink token and a blue token into it, and the two levels in the pool rise.',
      body: {
        beginner: `Where do the tokens in the pot come from? From ordinary people, called [[liquidity-provider|liquidity providers]].

Each of them puts **both** tokens into the pot at the same time, for example some ETH and the matching amount of dollars. The pot is called a [[liquidity-pool]].

Why would they? Every trader pays a small fee, and the fees are shared among everyone who filled the pot. The bigger the pot, the larger the trades it can handle without the price jumping.`,
        intermediate: `A [[liquidity-pool]] holds two tokens. The amounts it holds are its [[reserves]]. In this lesson the pool starts with **100 ETH** and **200,000 USDC**.

The price is simply the ratio of the [[reserves]]: 200,000 / 100 = **2,000 USDC per ETH**. Nobody types that price in; it follows from what is in the pool.

A [[liquidity-provider]] must add both tokens in the current ratio, so that the deposit does not move the price: 10 ETH together with 20,000 USDC, for example. Anyone can do it, with any amount, with no permission.

If the pool price drifts away from the price elsewhere, traders buy the cheap side until it matches again. That [[arbitrage]] is what keeps the pool price in line with the market.`,
        expert: `Liquidity is added by transferring both tokens to the Pair and calling \`mint(to)\`. The Pair does not take amounts as arguments: it compares its token balances with the stored [[reserves]] and treats the difference as the deposit. The Router's \`addLiquidity\` computes the matching amounts with \`quote(amountA, reserveA, reserveB) = amountA · reserveB / reserveA\` and sends both in one [[transaction]].

A deposit that is off-ratio is not rejected; the surplus on one side is simply donated to the pool, because shares are minted for the smaller of the two proportions (next steps).

The [[reserves]] are cached in storage as \`uint112 reserve0\`, \`uint112 reserve1\` and \`uint32 blockTimestampLast\`, packed into one slot. They are updated only at the end of \`mint\`, \`burn\`, \`swap\` and \`sync\`, so tokens sent directly to the Pair do not change the price until one of those runs. \`skim\` lets anyone withdraw such excess; \`sync\` forces the reserves to match the balances.

The first depositor chooses the initial ratio, and with it the starting price. If it is wrong, [[arbitrage]] corrects it at that depositor's expense.`,
      },
      code: {
        lang: 'Solidity (UniswapV2Pair, abridged)',
        source: `uint112 private reserve0;           // one storage slot:
uint112 private reserve1;           // 112 + 112 + 32 bits
uint32  private blockTimestampLast;

function getReserves() public view returns (uint112, uint112, uint32) {
    return (reserve0, reserve1, blockTimestampLast);
}

// UniswapV2Library: the amount of B that matches amountA at the pool price
function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
    require(amountA > 0, 'UniswapV2Library: INSUFFICIENT_AMOUNT');
    require(reserveA > 0 && reserveB > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
    amountB = amountA.mul(reserveB) / reserveA;
}`,
      },
    },
    curve: {
      title: 'x · y = k',
      alt: 'A board behind the pool shows a downward-bending curve. A glowing dot marks where the pool is on the curve; dashed lines connect it to the two axes. Moving the slider slides the dot along the curve and changes the two levels in the pool.',
      body: {
        beginner: `The pot follows one rule: **when one token goes up, the other must go down**, along a fixed curve. The board behind the pool shows that curve, and the glowing dot shows where the pool is right now.

Move the slider. As ETH is added to the pool, the dot slides to the right and down: more ETH in the pool, fewer dollars.

Whatever is plentiful in the pool gets cheaper, and whatever is scarce gets more expensive. That is the whole pricing mechanism; there is no person and no price list behind it.`,
        intermediate: `Call the [[reserves]] **x** (ETH) and **y** (USDC). The pool keeps their product constant: **x · y = k**. This is the [[constant-product]] rule.

Here k = 100 × 200,000 = 20,000,000. If a trade raises x to 110, y must fall to about 20,000,000 / 110 ≈ 181,818, so the trader can take out roughly 18,182 USDC (a little less in reality, because of the fee).

The price at any point is y / x, the slope of the curve there. At the start it is 2,000; at x = 110 it is about 1,653.

Two consequences:

- the curve never touches an axis, so the pool can never be completely emptied of either token;
- the further a trade pushes along the curve, the worse the price gets. Large trades are expensive in small pools.`,
        expert: `Ignoring fees, a [[swap]] of \`Δx\` in for \`Δy\` out must satisfy \`(x + Δx)(y − Δy) = x · y\`, so \`Δy = y · Δx / (x + Δx)\`. The marginal (spot) price is \`−dy/dx = y / x\`; the average execution price of a finite trade is \`y / (x + Δx)\`, always worse than spot.

\`k\` is not really constant: it is an invariant that may never **decrease** in a swap. Fees make it grow with every trade, and it changes when liquidity is minted or burned (\`√k\` scales with the [[lp-token]] supply).

The curve provides liquidity at every price from 0 to ∞, which is why v2 works for any pair with no parameters, and also why most of that capital sits at prices that are never reached. Uniswap v3 addresses exactly that with [[concentrated-liquidity]].

On chain everything is integer arithmetic on raw token units. The human price is \`reserve1 / reserve0\` scaled by \`10^(decimals0 − decimals1)\`; a pool of an 18-decimal and a 6-decimal token has a raw ratio twelve orders of magnitude from the displayed price.`,
      },
    },
    swap: {
      title: 'A swap moves the price',
      alt: 'A trader stands in front of the pool. A pink token flies from the trader into the pool and a blue token flies back out. The pink level rises, the blue level falls and the dot on the curve moves. The slider sets the size of the trade.',
      body: {
        beginner: `A trader wants dollars for their ETH. They drop ETH into the pool, and the pool pays out dollars. This is a [[swap]].

Watch the two levels: the ETH side rises, the dollar side falls. Because ETH is now more plentiful in the pool, the next person selling ETH gets a slightly worse price.

Try a small amount, then a large one. A small trade barely moves the price. A large trade moves it a lot, and the trader gets noticeably fewer dollars for each ETH. That difference is called [[price-impact]].`,
        intermediate: `With the slider at **10 ETH** the numbers are:

- the pool takes 10 ETH, of which 0.3% (0.03 ETH) is the fee;
- it pays out about **18,132 USDC**, so the trader receives about 1,813 USDC per ETH, not 2,000;
- the [[reserves]] become 110 ETH and about 181,868 USDC, and the new pool price is about **1,653 USDC per ETH**.

The gap between 2,000 and 1,813 is the [[price-impact]]: about 9.3% here, because 10 ETH is a tenth of the pool. Selling 1 ETH into the same pool costs only about 1.3%.

Right after such a trade, ETH is cheaper in this pool than elsewhere. Someone will buy it here and sell it at the market price until the pool is back near 2,000. That [[arbitrage]] profit is paid by whoever moved the price.`,
        expert: `The Router computes the output with \`getAmountOut\`:

\`amountOut = amountIn · 997 · reserveOut / (reserveIn · 1000 + amountIn · 997)\`

The 0.3% fee is taken from the input before the [[constant-product]] step. For 10 ETH: \`9.97 · 200000 / 109.97 ≈ 18132.22\`. Integer division rounds down, in the pool's favour. The inverse, \`getAmountIn\`, adds 1 wei for the same reason.

The Pair does not use that formula. \`swap(amount0Out, amount1Out, to, data)\` sends the outputs **first**, then reads its balances, infers the inputs and checks the invariant with the fee applied:

\`(balance0 · 1000 − amount0In · 3) · (balance1 · 1000 − amount1In · 3) ≥ reserve0 · reserve1 · 1000²\`

Anyone who calls the Pair directly must have transferred the input beforehand (or repay inside the callback) and must compute the output themselves; asking for too much reverts with \`UniswapV2: K\`, asking for too little is a gift to the pool.

[[price-impact|Price impact]] of a finite trade, including the fee, is \`1 − 0.997 · x / (x + 0.997 · Δx)\`; the spot price afterwards is \`(y − Δy) / (x + Δx)\`. Multi-hop routes (\`path = [A, B, C]\`) chain the same formula pair by pair, paying the fee on each hop.`,
      },
      code: {
        lang: 'Solidity (Uniswap v2, abridged)',
        source: `// UniswapV2Library
function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
    require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
    require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
    uint amountInWithFee = amountIn.mul(997);
    uint numerator = amountInWithFee.mul(reserveOut);
    uint denominator = reserveIn.mul(1000).add(amountInWithFee);
    amountOut = numerator / denominator;
}

// UniswapV2Pair.swap: pay out first, then verify
if (amount0Out > 0) _safeTransfer(token0, to, amount0Out);
if (amount1Out > 0) _safeTransfer(token1, to, amount1Out);
if (data.length > 0) IUniswapV2Callee(to).uniswapV2Call(msg.sender, amount0Out, amount1Out, data);
balance0 = IERC20(token0).balanceOf(address(this));
balance1 = IERC20(token1).balanceOf(address(this));
uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
require(amount0In > 0 || amount1In > 0, 'UniswapV2: INSUFFICIENT_INPUT_AMOUNT');
uint balance0Adjusted = balance0.mul(1000).sub(amount0In.mul(3));
uint balance1Adjusted = balance1.mul(1000).sub(amount1In.mul(3));
require(balance0Adjusted.mul(balance1Adjusted) >= uint(_reserve0).mul(_reserve1).mul(1000**2), 'UniswapV2: K');`,
      },
    },
    fees: {
      title: 'Fees and LP tokens',
      alt: 'The trader keeps swapping. A small orange coin splits off each incoming token and stays in the pool, where several orange coins already float. The two liquidity providers each hold a green token: their share of the pool.',
      body: {
        beginner: `Every trade leaves a small tip in the pot: 0.3% of what the trader puts in. The tips are not paid out one by one. They simply stay in the pot, so the pot slowly grows.

When a [[liquidity-provider]] adds tokens, they receive a receipt called an [[lp-token]]. It says "this person owns this share of the pot".

Later they hand the receipt back and take out their share of whatever is in the pot at that moment, including all the tips collected in the meantime. That is how they earn.`,
        intermediate: `The fee is **0.3% of the input** of every [[swap]]. It is left in the [[reserves]], so each trade makes the pool a little bigger without creating any new shares.

Shares are tracked with the [[lp-token]]. If the pool holds 100 ETH and 200,000 USDC and you add 10 ETH and 20,000 USDC, you receive 10% of the existing [[lp-token]] supply and now own 1/11 (about 9.1%) of the pool.

To leave, you burn your [[lp-token|LP tokens]] and receive the same fraction of **both** [[reserves]] as they are then. You get back your share plus your share of the fees, but usually in a different mix of the two tokens than you put in, because trading has moved the ratio.

An [[lp-token]] is an ordinary [[token]]: it can be sent, sold or used in other dapps.`,
        expert: `The Pair contract is the [[lp-token]] ([[erc-20]], 18 decimals). Minting:

- **First deposit**: \`liquidity = sqrt(amount0 · amount1) − MINIMUM_LIQUIDITY\`, and \`MINIMUM_LIQUIDITY = 1000\` units are minted to \`address(0)\` forever. The geometric mean makes the share value independent of the initial ratio; the burned amount makes it prohibitively expensive to inflate the value of a single share and round later depositors down to nothing.
- **Afterwards**: \`liquidity = min(amount0 · totalSupply / reserve0, amount1 · totalSupply / reserve1)\`.

\`burn\` returns \`liquidity · balance / totalSupply\` of each token. Because fees stay in the [[reserves]], \`√k / totalSupply\` only grows between mints and burns; that growth is the fee income.

The protocol fee switch: if \`factory.feeTo\` is set, \`_mintFee\` mints new LP tokens to it on the next \`mint\` or \`burn\`, equal to 1/6 of the growth in \`√k\` since \`kLast\` (0.05% of volume, leaving 0.25% for LPs). Doing it lazily avoids an extra transfer on every swap.

Caveats: fee-on-transfer and rebasing tokens break the assumption that balances only change through the Pair; \`sync\` and \`skim\` exist for that, and the Router has separate \`…SupportingFeeOnTransferTokens\` functions.`,
      },
      code: {
        lang: 'Solidity (UniswapV2Pair.mint, abridged)',
        source: `uint public constant MINIMUM_LIQUIDITY = 10**3;

function mint(address to) external lock returns (uint liquidity) {
    (uint112 _reserve0, uint112 _reserve1,) = getReserves();
    uint balance0 = IERC20(token0).balanceOf(address(this));
    uint balance1 = IERC20(token1).balanceOf(address(this));
    uint amount0 = balance0.sub(_reserve0);   // what was just sent in
    uint amount1 = balance1.sub(_reserve1);

    bool feeOn = _mintFee(_reserve0, _reserve1);
    uint _totalSupply = totalSupply;
    if (_totalSupply == 0) {
        liquidity = Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
        _mint(address(0), MINIMUM_LIQUIDITY); // locked forever
    } else {
        liquidity = Math.min(amount0.mul(_totalSupply) / _reserve0,
                             amount1.mul(_totalSupply) / _reserve1);
    }
    require(liquidity > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED');
    _mint(to, liquidity);

    _update(balance0, balance1, _reserve0, _reserve1);
    if (feeOn) kLast = uint(reserve0).mul(reserve1);
    emit Mint(msg.sender, amount0, amount1);
}`,
      },
    },
    risks: {
      title: 'Slippage and impermanent loss',
      alt: 'The curve board is back behind the pool. Beside the pool stand two columns: one for the value of simply holding the two tokens, one for the value of the same deposit left in the pool. As the slider moves the price, the pool column falls below the holding column.',
      body: {
        beginner: `Two things can surprise you here.

**For traders:** the price can change between the moment you press the button and the moment your trade actually happens, because other people trade first. You end up with a bit less than the screen showed. This is [[slippage]]. The app lets you set a limit: "if I would get less than this, cancel the trade".

**For liquidity providers:** when the price moves, the pool automatically sells the token that is going up and collects the one that is going down. The two columns show the result: your share of the pool is worth less than if you had just kept the two tokens in your wallet. This gap is called [[impermanent-loss]].

Move the slider and watch the gap open. The fees you earn have to be larger than this gap for providing liquidity to pay off.`,
        intermediate: `[[slippage|Slippage]] is the difference between the quoted and the executed amount, caused by other trades landing before yours. You protect yourself with a tolerance. With 0.5% and a quote of 18,132 USDC, the [[transaction]] carries a minimum of about 18,042 USDC and fails rather than accept less. Too tight a tolerance makes trades fail; too loose a tolerance invites others to trade just before you and take the difference.

[[impermanent-loss|Impermanent loss]] compares two choices for the same starting tokens: hold them, or put them in the pool. If the price of ETH against USDC changes by a factor r, the pool position is worth less than holding by:

- r = 1.25 (25% up): about 0.6%
- r = 2 (price doubles): about 5.7%
- r = 4: 20%

The same numbers apply when the price falls to 1/r. The loss shrinks back to zero if the price returns to where you entered, which is why it is called "impermanent"; it becomes permanent when you withdraw at a different price. The slider here shows it for the price change your trade size produces.`,
        expert: `**Slippage protection** lives in the Router, not the Pair: \`swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline)\` reverts with \`INSUFFICIENT_OUTPUT_AMOUNT\` below \`amountOutMin\`, and \`deadline\` stops a stale [[transaction]] from executing much later. A pending [[swap]] is visible in the [[mempool]], so \`amountOutMin\` is exactly the amount a sandwich (buy before, sell after) can extract; a zero minimum can lose almost everything.

[[impermanent-loss|Impermanent loss]]: an LP share of a [[constant-product]] pool at price P holds \`x = L / √P\` and \`y = L · √P\`, worth \`2L√P\` in units of y. Holding the initial amounts is worth \`L√P₀ · (1 + r)\` with \`r = P / P₀\`. Hence

\`IL(r) = 2 · √r / (1 + r) − 1\`

which is ≤ 0, symmetric in r ↔ 1/r, and ignores fees. The pool is short volatility: the LP earns fees and pays this divergence to arbitrageurs.

[[twap]] oracle: on the first call in each [[block]], \`_update\` adds \`price · timeElapsed\` to \`price0CumulativeLast\` and \`price1CumulativeLast\` (UQ112.112 fixed point, overflow intended). A consumer stores two snapshots and computes \`(cum₂ − cum₁) / (t₂ − t₁)\`, an arithmetic-mean price. Because the price sampled is the one at the **end of the previous block**, moving it requires holding a distorted price across blocks against [[arbitrage]]. Never read \`getReserves()\` as a price inside a transaction: it can be moved and restored atomically.

[[flash-swap|Flash swap]]: because \`swap\` pays out before it checks, a caller can pass non-empty \`data\`, receive the tokens, use them in \`uniswapV2Call\`, and settle before the call returns, either with the other token or by returning the same token plus the fee (\`amount · 1000 / 997\`, about 0.3009%). If the invariant check fails, everything reverts.`,
      },
      code: {
        lang: 'Solidity (UniswapV2Pair._update, abridged)',
        source: `function _update(uint balance0, uint balance1, uint112 _reserve0, uint112 _reserve1) private {
    require(balance0 <= uint112(-1) && balance1 <= uint112(-1), 'UniswapV2: OVERFLOW');
    uint32 blockTimestamp = uint32(block.timestamp % 2**32);
    uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired
    if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
        // * never overflows, and + overflow is desired
        price0CumulativeLast += uint(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) * timeElapsed;
        price1CumulativeLast += uint(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) * timeElapsed;
    }
    reserve0 = uint112(balance0);
    reserve1 = uint112(balance1);
    blockTimestampLast = blockTimestamp;
    emit Sync(reserve0, reserve1);
}

// Oracle consumer: average price of token0 in token1 between two observations
// twap = (price0Cumulative_2 - price0Cumulative_1) / (t_2 - t_1)   // UQ112.112`,
      },
    },
  },
};

export default content;

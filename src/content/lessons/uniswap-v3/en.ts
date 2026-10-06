import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    priceNow: 'price now',
    inRange: 'in range',
    outRange: 'out of range',
    idle: 'idle capital',
    busy: 'used for ±7.5%:',
    v2Spread: 'v2: spread everywhere',
    ruler: 'the price axis is a ruler',
    tickStep: '1 tick = 0.01% price step',
    activeRange: 'active range',
    usdcSide: 'already swapped: USDC',
    ethSide: 'still ETH',
    tickBoundary: 'tick crossed: liquidity changes',
    trader: 'trader buys ETH',
    tierStable: 'stable pairs',
    tierMost: 'most pairs',
    tierExotic: 'exotic pairs',
    nftCaption: 'each position is its own NFT',
    v2Needs: 'v2 needs',
    v3Needs: 'v3 needs',
    noDepth: 'no depth at this price',
    lower: 'Lower',
    upper: 'Upper',
    price: 'Price',
    status: 'Position',
    holds: 'Holds (10,000 USDC in)',
    vsV2: 'Depth vs v2',
    ticks: 'Range in ticks',
  },
  steps: {
    idle: {
      title: 'Most of a v2 pool sits idle',
      alt: 'A long, flat slab of liquidity lies along a price axis from 1,000 to 3,000 USDC. Only a narrow coloured part around the current price of 2,000 is being traded; the grey rest is idle.',
      body: {
        beginner: `Picture a shop that stocks every shelf equally, from the entrance to the dusty back room. Customers only ever visit the two shelves by the door.

A v2 [[liquidity-pool]] works like that. The money that [[liquidity-provider|liquidity providers]] put in is spread over **every possible price**, from almost zero to infinity.

But the price of ETH does not visit every price. Most days it moves a few percent. The grey part of the slab is money waiting for prices that may never come.`,
        intermediate: `In v2 the [[constant-product]] rule \`x · y = k\` holds for every price from 0 to ∞. That is simple and it never runs out, but it wastes capital.

Trades only use the [[reserves]] near the current price. For ETH at 2,000 USDC, moving the price anywhere inside 1,850–2,150 uses less than 4% of the pool's value. The other 96% earns nothing in that range and only matters if ETH leaves it.

For stablecoin pairs it is more extreme. Uniswap's v3 announcement notes that a v2 DAI/USDC pool keeps only about 0.5% of its capital for trades between 0.99 and 1.01, where nearly all its volume happens.`,
        expert: `A v2 position is liquidity on the whole curve \`x · y = L²\`, with \`x = L / √P\` and \`y = L · √P\`. To let the price move from \`P\` to \`P'\` the pool only needs \`Δy = L · (√P' − √P)\`; everything else is collateral for prices outside that interval.

The share of capital that is actually needed for a range \`[Pa, Pb]\` around \`P\` is

\`(2√P − √Pa − P/√Pb) / (2√P)\`

For 1,850–2,150 at 2,000 that is 3.7%; for 0.99–1.01 at 1.00 it is 0.5%. Its inverse is the [[capital-efficiency]] gain that v3 offers: 27× and 200× for those two ranges.

The consequences in v2 are high [[price-impact]] per dollar of TVL and a low fee return on capital. v3 lets each [[liquidity-provider]] choose the interval themselves.`,
      },
    },
    concentrated: {
      title: 'Concentrated liquidity',
      alt: 'The flat slab has been reshaped into tall bins between a lower and an upper price. A faint outline shows the old v2 slab. A marker shows the current price inside the range.',
      body: {
        beginner: `Uniswap v3 lets you say: "use my money **only between these two prices**." That is [[concentrated-liquidity]].

The same money, squeezed into a narrower band, stands much taller. Taller means traders can swap more without moving the price, and you collect a bigger share of the fees.

Drag the sliders. Narrow the band and the bins grow. Now move the price past either edge: your position stops working until the price comes back.`,
        intermediate: `With [[concentrated-liquidity]] a [[liquidity-provider]] picks a [[price-range]]: a lower and an upper price. Inside the range, the position trades exactly like a v2 pool, just a much bigger one.

Use the sliders:

- A 10,000 USDC position in 1,800–2,200 at a price of 2,000 is as deep as about 204,000 USDC in v2: roughly 20×.
- Narrow it to 1,900–2,100 and it becomes about 40×.
- Move the price outside the range and the position is [[out-of-range]]: it earns no fees and holds only one token.

The bins are coloured by what they hold. Below the current price the position has already been converted to USDC; above it, it is still ETH.`,
        expert: `Inside \`[Pa, Pb]\` a position behaves like a [[constant-product]] curve with [[liquidity-l|liquidity]] \`L\`, shifted so that it runs out of one token exactly at each bound. Its real holdings are

- \`x = L · (1/√P − 1/√Pb)\`
- \`y = L · (√P − √Pa)\`

with \`P\` clamped to \`[Pa, Pb]\`. Adding the offsets gives the [[virtual-reserves]]: \`(x + L/√Pb) · (y + L·√Pa) = L²\`.

For a fixed deposit value, \`L\` grows as the range narrows. Relative to full range the factor is \`2√P / (2√P − √Pa − P/√Pb)\`, which simplifies to \`1 / (1 − (Pa/Pb)^¼)\` when \`P\` is the geometric mean of the bounds. The numbers in the panel come from these formulas.

Below \`Pa\` the position is all token0 (\`y = 0\`); above \`Pb\` it is all token1 (\`x = 0\`). The pool's active liquidity is the sum of \`L\` over all positions whose range contains the current price.`,
      },
      code: {
        lang: 'Solidity (simplified from LiquidityAmounts.sol)',
        source: `// sqrt prices are Q64.96 numbers: sqrtP * 2^96
function getAmount0ForLiquidity(uint160 sqrtRatioAX96, uint160 sqrtRatioBX96, uint128 liquidity)
    internal pure returns (uint256 amount0)
{
    // x = L * (1/sqrtA - 1/sqrtB)
    return FullMath.mulDiv(
        uint256(liquidity) << FixedPoint96.RESOLUTION,   // RESOLUTION = 96
        sqrtRatioBX96 - sqrtRatioAX96,
        sqrtRatioBX96
    ) / sqrtRatioAX96;
}

function getAmount1ForLiquidity(uint160 sqrtRatioAX96, uint160 sqrtRatioBX96, uint128 liquidity)
    internal pure returns (uint256 amount1)
{
    // y = L * (sqrtB - sqrtA)
    return FullMath.mulDiv(liquidity, sqrtRatioBX96 - sqrtRatioAX96, FixedPoint96.Q96);   // Q96 = 2^96
}`,
      },
    },
    ticks: {
      title: 'Ticks: the marks on the price ruler',
      alt: 'The price axis now carries small evenly spaced posts like a ruler. Two taller posts mark the lower and upper bound of the position, which stands between them as tall bins.',
      body: {
        beginner: `You cannot pick just any price for the edges of your band. The price line is marked like a ruler, and your edges must sit on a mark. Each mark is called a [[tick]].

The marks are very close together: each one is a price just 0.01% higher than the one before. So in practice you can place your [[price-range]] almost anywhere.

Move the sliders and watch the two taller posts. They are the ticks where your position begins and ends.`,
        intermediate: `A [[tick]] is an integer index for a price: each tick up multiplies the price by 1.0001, a step of 0.01%. A [[price-range]] is stored as two ticks, lower and upper, not as two prices.

Pools do not allow every tick as a boundary. Each pool has a [[tick-spacing]] that depends on its [[fee-tier]]: with spacing 60, only ticks divisible by 60 can be used, which means boundaries about 0.6% apart.

The pool only does extra work at ticks where some position starts or ends. Those are called initialized ticks. Wider spacing means fewer of them to cross during a big [[swap]], so swaps cost less [[gas]].`,
        expert: `Prices are indexed by [[tick]]: \`p(i) = 1.0001^i\`, with \`i\` an \`int24\` in \`[−887272, 887272]\`. The pool does not store the price itself. \`slot0\` holds [[sqrt-price-x96]], which is \`√(token1/token0)\` as an unsigned Q64.96 fixed-point number, plus the current \`tick = ⌊log₁.₀₀₀₁ P⌋\`. Working with \`√P\` makes the swap equations linear: \`Δy = L · Δ√P\` and \`Δx = L · Δ(1/√P)\`.

A position's bounds must be multiples of the pool's [[tick-spacing]]: 1, 10, 60 or 200 for the 0.01%, 0.05%, 0.30% and 1% tiers.

The price is always \`token1/token0\` in raw units, with tokens ordered by address. The ticks shown here are for a human price of 2,000 USDC per ETH (tick 76,012, \`sqrtPriceX96 ≈ 3.54 × 10^30\`). In the real mainnet pool USDC is token0 and has 6 decimals against WETH's 18, so 2,000 USDC per ETH is raw price 5 × 10^8 and a tick near 200,311.

Per-tick state lives in \`ticks[i]\` (\`liquidityGross\`, \`liquidityNet\`, fee growth outside). Finding the next initialized tick uses \`tickBitmap\`: one bit per usable tick, packed into 256-bit words keyed by \`int16(tick / tickSpacing >> 8)\`.`,
      },
      code: {
        lang: 'Solidity (UniswapV3Pool.sol, abridged)',
        source: `struct Slot0 {
    uint160 sqrtPriceX96;  // sqrt(token1/token0) * 2^96
    int24   tick;          // floor(log_1.0001(price))
    uint16  observationIndex;
    uint16  observationCardinality;
    uint16  observationCardinalityNext;
    uint8   feeProtocol;
    bool    unlocked;      // reentrancy lock
}
Slot0 public slot0;

uint128 public liquidity;                     // active L at the current tick
mapping(int24 => Tick.Info) public ticks;     // liquidityNet, feeGrowthOutside...
mapping(int16 => uint256) public tickBitmap;  // which ticks are initialized`,
      },
    },
    crossing: {
      title: 'A swap walks across ticks',
      alt: 'A row of bins of different heights. A trader sends USDC in and takes ETH out; the price marker moves to the right, bin by bin. Bins it has passed turn from the ETH colour to the USDC colour, and the bin under the marker is highlighted.',
      body: {
        beginner: `Many people have chosen different bands, so the pool looks like a skyline: tall where many bands overlap, low where few do.

Watch a trader buy ETH. The price climbs to the right, one bin at a time. The bin under the marker is the only one doing the work at that moment.

In a tall bin the price creeps slowly, because there is a lot to buy at that price. In a low bin it runs. Every bin the price has passed has sold its ETH and now holds USDC.`,
        intermediate: `At any moment only the positions whose [[price-range]] contains the current price are active. Their combined liquidity decides the [[price-impact]] of the next trade.

A [[swap]] proceeds range by range:

- Inside the current range it follows the usual curve, using the active liquidity.
- When it reaches a [[tick]] where a position starts or ends, the pool adds or removes that position's liquidity and carries on.
- The trader pays the fee on the amount swapped in each range; it is shared among the positions active there.

So a large swap can cross several ticks, and its average price depends on how deep each range was. Each crossing costs extra [[gas]].`,
        expert: `The pool keeps one number for the active range: \`liquidity\`, the sum of [[liquidity-l|L]] over in-range positions. \`swap()\` loops until the input is used up or the price limit is hit:

- find the next initialized [[tick]] in the swap direction with \`tickBitmap.nextInitializedTickWithinOneWord\`;
- \`SwapMath.computeSwapStep\` moves [[sqrt-price-x96]] toward that tick's price with the current \`L\`: \`Δ√P = Δy / L\` for token1 in, \`Δ(1/√P) = Δx / L\` for token0 in, with the fee taken from the input;
- if the tick price was reached, cross it: \`ticks.cross()\` flips the tick's \`feeGrowthOutside\` values and returns \`liquidityNet\`, which is added to \`liquidity\` when moving up and subtracted when moving down.

\`liquidityNet\` at a tick is the sum of \`+L\` for positions whose lower bound is that tick and \`−L\` for those whose upper bound it is.

Fees never touch the reserves used for pricing. Each step adds \`feeAmount · 2^128 / liquidity\` to \`feeGrowthGlobal0X128\` or \`feeGrowthGlobal1X128\`. A position's share is read as \`feeGrowthInside = global − below − above\`, computed from the \`feeGrowthOutside\` of its two ticks.`,
      },
      code: {
        lang: 'Solidity (simplified from UniswapV3Pool.swap)',
        source: `while (state.amountSpecifiedRemaining != 0 && state.sqrtPriceX96 != sqrtPriceLimitX96) {
    (step.tickNext, step.initialized) =
        tickBitmap.nextInitializedTickWithinOneWord(state.tick, tickSpacing, zeroForOne);
    step.sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(step.tickNext);

    // trade inside the current range with the active liquidity
    (state.sqrtPriceX96, step.amountIn, step.amountOut, step.feeAmount) =
        SwapMath.computeSwapStep(state.sqrtPriceX96,
                                 sqrtRatioTargetX96,   // the next tick's price, or the price limit
                                 state.liquidity, state.amountSpecifiedRemaining, fee);

    state.feeGrowthGlobalX128 +=
        FullMath.mulDiv(step.feeAmount, FixedPoint128.Q128, state.liquidity);

    if (state.sqrtPriceX96 == step.sqrtPriceNextX96) {       // reached the tick
        if (step.initialized) {
            int128 liquidityNet = ticks.cross(step.tickNext, /* fee growth, oracle */);
            if (zeroForOne) liquidityNet = -liquidityNet;    // moving down
            state.liquidity = LiquidityMath.addDelta(state.liquidity, liquidityNet);
        }
        state.tick = zeroForOne ? step.tickNext - 1 : step.tickNext;
    }
}`,
      },
    },
    'fees-nft': {
      title: 'Fee tiers, and positions as NFTs',
      alt: 'Three separate pools for the same pair stand side by side, labelled 0.05%, 0.30% and 1%, with fine, medium and coarse bins. Cards float above them, each attached to the price range it covers.',
      body: {
        beginner: `In v2 every pool charged the same 0.3% fee. In v3 the same two tokens can have several pools, each with its own fee: a tiny fee for pairs that barely move, a larger one for risky pairs.

There is a second change. In v2 everyone's share of a pool was the same kind of thing, so it could be a simple token. In v3 your band is your own choice, and no two are alike.

So your position is a one-of-a-kind receipt: an NFT. The card records which pool, which band and how much. Whoever holds the card owns the position.`,
        intermediate: `A v3 pool is defined by two tokens **and** a [[fee-tier]]. The tiers are 0.01%, 0.05%, 0.30% and 1%. Each tier is a separate pool with its own price and liquidity; the market decides which one becomes the deep one for a pair.

- 0.01% and 0.05%: stablecoin pairs and the biggest pairs, where LPs take little risk.
- 0.30%: most pairs.
- 1%: volatile or thinly traded tokens.

The tier also fixes the [[tick-spacing]]: 1, 10, 60 and 200.

Because each position has its own range, v2's fungible [[lp-token]] no longer works. A position is an [[nft-position]], an ERC-721 token. Fees are not added back into the position as in v2: they pile up separately and the owner collects them.`,
        expert: `The factory maps \`(token0, token1, fee)\` to one pool and \`feeAmountTickSpacing\` gives 100 → 1, 500 → 10, 3000 → 60, 10000 → 200 (fees in hundredths of a basis point). The 0.01% tier was added later by governance through \`enableFeeAmount\`.

The core pool knows nothing about NFTs. It keys positions by \`keccak256(abi.encodePacked(owner, tickLower, tickUpper))\` and stores \`liquidity\`, \`feeGrowthInside0LastX128\`, \`feeGrowthInside1LastX128\`, \`tokensOwed0\` and \`tokensOwed1\`. For most users the \`owner\` is the periphery contract \`NonfungiblePositionManager\`, which mints an [[nft-position]] (ERC-721) per position and records \`tokenId → (pool, tickLower, tickUpper, liquidity, …)\`.

Fees owed are \`liquidity · (feeGrowthInside − feeGrowthInsideLast) / 2^128\` per token. They are credited to \`tokensOwed0\` / \`tokensOwed1\` when the position is touched and paid out by \`collect()\`. They do not compound; reinvesting means adding liquidity again.

Non-fungible positions cannot be used directly where an [[erc-20]] is expected. That gap is filled by vaults that manage a v3 position and issue fungible shares.`,
      },
      code: {
        lang: 'Solidity (INonfungiblePositionManager.sol)',
        source: `struct MintParams {
    address token0;
    address token1;
    uint24  fee;         // 500 = 0.05%, 3000 = 0.30%
    int24   tickLower;   // must be a multiple of tickSpacing
    int24   tickUpper;
    uint256 amount0Desired;
    uint256 amount1Desired;
    uint256 amount0Min;  // slippage protection
    uint256 amount1Min;
    address recipient;   // receives the NFT
    uint256 deadline;
}

function mint(MintParams calldata params)
    external payable
    returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);`,
      },
    },
    efficiency: {
      title: 'More from your capital, and more risk',
      alt: 'Two rows of liquidity. Behind, a flat full-range v2 slab next to a tall pile of capital. In front, the concentrated v3 position next to a much smaller pile that gives the same depth at the current price.',
      body: {
        beginner: `The two piles on the left show the trade-off. To give traders the same depth at today's price, v2 needs the big pile. Your v3 band needs the small one.

That is the good news: the same money earns far more fees while the price stays in your band.

The bad news is that the band can be left behind. Slide the price out of it. Your position now earns nothing, and all of it has turned into the token that got cheaper. Narrow bands earn more and get left behind more often.`,
        intermediate: `[[capital-efficiency]] is the ratio between the depth your capital gives in a range and the depth it would give in v2. Try the sliders: 1,800–2,200 is about 20×, 1,950–2,050 about 80×.

The cost is risk:

- **[[out-of-range]]**: once the price leaves your range you earn no fees. Above the range you hold only USDC (you sold all your ETH on the way up); below it, only ETH (you bought all the way down).
- **Larger [[impermanent-loss]]**: your position rebalances faster than a v2 position would, so the loss against simply holding is multiplied by about the same factor as the efficiency.
- **Maintenance**: staying in range means moving the position, which costs [[gas]] and locks in the loss.

Narrow ranges suit pairs that hold their price, such as stablecoins. Wide ranges suit volatile pairs.`,
        expert: `For the same capital, [[liquidity-l|L]] is larger by the efficiency factor \`2√P / (2√P − √Pa − P/√Pb)\`. Fee income per unit of volume scales with your share of active \`L\`, so it scales by the same factor while in range.

So does the loss. A position's value in range is \`V(P) = L · (2√P − √Pa − P/√Pb)\`. Against holding the initial amounts, the offset terms cancel and the difference is \`L · (2√P − √P₀ − P/√P₀)\`: exactly the [[impermanent-loss]] of a v2 position with the same \`L\`. With \`L\` larger by a factor of *n*, the loss as a share of capital is *n* times larger until a bound is hit.

Beyond a bound the position is 100% the depreciating asset and stops earning: above \`Pb\` it holds \`L · (√Pb − √Pa)\` of token1, below \`Pa\` it holds \`L · (1/√Pa − 1/√Pb)\` of token0. A one-sided range above or below the price therefore behaves like a resting limit order that earns fees, but it un-fills if the price returns.

LP returns in v3 are fees minus this loss. Fees go to whoever supplies liquidity at the active tick, so passive wide positions compete with actively managed narrow ones, including liquidity that is added just before a large [[swap]] and removed just after it.`,
      },
    },
  },
};

export default content;

import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    priceNow: 'price now',
    inRange: 'in range',
    outRange: 'out of range',
    idle: 'idle capital',
    busy: 'used:',
    toZero: '← on to 0',
    toInf: 'on to ∞ →',
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
    allCapital: 'all the pool’s money',
    tryIdle: 'Try it: how far does the price really move?',
    move: 'Price moves',
    usedRange: 'Prices',
    usedShare: 'Capital used',
    idleShare: 'Idle',
    v3Gain: 'Depth in v3',
    trySwap: 'Try it: change the size and direction of the swap',
    direction: 'Direction',
    buyEth: 'Buy ETH',
    sellEth: 'Sell ETH',
    swapSize: 'Pay',
    youGet: 'Get',
    priceMove: 'Price',
    crossed: 'Ticks crossed',
    activeL: 'Active liquidity',
    avgV3: 'Average price',
    avgV2: 'v2, same capital',
    traderSell: 'trader sells ETH',
    tryTier: 'Try it: pick a fee tier',
    tier: 'Fee tier',
    spacing: 'Tick spacing',
    boundStep: 'Bounds every',
    feeOn: 'Fee on a 10,000 USDC swap',
    yourPool: 'your pool',
    tryDay: 'Try it: one simulated day (illustrative figures)',
    dayKind: 'Kind of day',
    width: 'Range',
    pathCalm: 'Calm',
    pathTrend: 'Trending',
    pathVolatile: 'Volatile',
    timeIn: 'In range',
    feesYou: 'Your fees',
    feesWide: 'A ±30% range',
    lossHold: 'Loss vs holding',
    you: 'you:',
    wide: '±30%:',
    yourRange: 'your range',
    simulated: 'simulated day',
    feeBars: 'fees per half hour',
    crash: 'Crash',
    rally: 'Rally',
    backTo: 'Back to 2,000',
    holdsNow: 'Holds now',
    vsHold: 'v3 vs holding',
    v2Same: 'v2, same move',
    deposit: 'opened at',
    allEth: 'all ETH · earns nothing',
    allUsdc: 'all USDC · earns nothing',
  },
  steps: {
    idle: {
      title: 'Most of a v2 pool sits idle',
      alt: 'A long, flat slab of liquidity lies along a price axis from 1,000 to 3,000 USDC. Only a coloured band around the current price of 2,000 is being traded; the grey rest is idle. A column beside it shows, as its lit part, the share of the pool\'s capital that this band of prices uses.',
      body: {
        beginner: `Picture a shop that stocks every shelf equally, from the entrance to the dusty back room. Customers only ever visit the two shelves by the door.

A v2 [[liquidity-pool]] works like that. The money that [[liquidity-provider|liquidity providers]] put in is spread over **every possible price**, from almost zero to infinity.

But the price of ETH does not visit every price. Most days it moves a few percent. The grey part of the slab is money waiting for prices that may never come.

Drag the slider to choose how far the price really wanders. The coloured band is the part of the slab that gets used. The column on the right is all the money in the pool, and its lit part is the share that band needs. Even for a wild swing, most of the column stays grey.`,
        intermediate: `In v2 the [[constant-product]] rule \`x · y = k\` holds for every price from 0 to ∞. That is simple and it never runs out, but it wastes capital.

Trades only use the [[reserves]] near the current price. For ETH at 2,000 USDC, moving the price anywhere inside 1,850–2,150 uses less than 4% of the pool's value. The other 96% earns nothing in that range and only matters if ETH leaves it.

For stablecoin pairs it is more extreme. Uniswap's v3 announcement notes that a v2 DAI/USDC pool keeps only about 0.5% of its capital for trades between 0.99 and 1.01, where nearly all its volume happens.

Try the slider: a ±1% move uses 0.5% of the capital, ±7.5% uses 3.7%, and even ±50% (1,000–3,000) uses only 24%. The slab drawn here is just the 1,000–3,000 stretch of the curve; the rest of the money covers prices further out on both sides. That is why the column, not the band, shows the share.`,
        expert: `A v2 position is liquidity on the whole curve \`x · y = L²\`, with \`x = L / √P\` and \`y = L · √P\`. To let the price move from \`P\` to \`P'\` the pool only needs \`Δy = L · (√P' − √P)\`; everything else is collateral for prices outside that interval.

The share of capital that is actually needed for a range \`[Pa, Pb]\` around \`P\` is

\`(2√P − √Pa − P/√Pb) / (2√P)\`

For 1,850–2,150 at 2,000 that is 3.7%; for 0.99–1.01 at 1.00 it is 0.5%. Its inverse is the [[capital-efficiency]] gain that v3 offers: 27× and 200× for those two ranges.

The consequences in v2 are high [[price-impact]] per dollar of TVL and a low fee return on capital. v3 lets each [[liquidity-provider]] choose the interval themselves.

The slider sets \`Pa = P · (1 − m)\` and \`Pb = P · (1 + m)\` and the panel evaluates the expression above. For small \`m\` it is close to \`m / 2\`: a price that moves ±m needs about half of m of the pool's capital.`,
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
      alt: 'A row of bins of different heights. A trader sends USDC in and takes ETH out; the price marker stands to the right of a small post that marks where the price started, and an arrow on the ground shows how far the swap pushed it. Bins the price has passed have turned from the ETH colour to the USDC colour, the bin under the marker is highlighted, and the ticks that were crossed are lit.',
      body: {
        beginner: `Many people have chosen different bands, so the pool looks like a skyline: tall where many bands overlap, low where few do.

Drag the slider to make a trader buy more ETH. The price climbs to the right, one bin at a time. The bin under the marker is the only one doing the work at that moment.

In a tall bin the price creeps slowly, because there is a lot to buy at that price. In a low bin it runs. Every bin the price has passed has sold its ETH and now holds USDC.

Switch to **Sell ETH** and the price walks left instead: the bins it passes buy ETH and turn back to the ETH colour. The last two numbers in the panel compare the price the trader got with what a v2 pool holding the same money would have given.`,
        intermediate: `At any moment only the positions whose [[price-range]] contains the current price are active. Their combined liquidity decides the [[price-impact]] of the next trade.

A [[swap]] proceeds range by range:

- Inside the current range it follows the usual curve, using the active liquidity.
- When it reaches a [[tick]] where a position starts or ends, the pool adds or removes that position's liquidity and carries on.
- The trader pays the fee on the amount swapped in each range; it is shared among the positions active there.

So a large swap can cross several ticks, and its average price depends on how deep each range was. Each crossing costs extra [[gas]].

Try it: the panel computes the [[swap]] range by range, with a 0.30% fee. A 3,000,000 USDC buy crosses 2 ticks and pays about 2,049 per ETH on average; a v2 pool holding the same 15 million would charge about 2,804. Push the slider further and watch the active liquidity fall as the price climbs into thinner ranges: each extra dollar now moves the price more.`,
        expert: `The pool keeps one number for the active range: \`liquidity\`, the sum of [[liquidity-l|L]] over in-range positions. \`swap()\` loops until the input is used up or the price limit is hit:

- find the next initialized [[tick]] in the swap direction with \`tickBitmap.nextInitializedTickWithinOneWord\`;
- \`SwapMath.computeSwapStep\` moves [[sqrt-price-x96]] toward that tick's price with the current \`L\`: \`Δ√P = Δy / L\` for token1 in, \`Δ(1/√P) = Δx / L\` for token0 in, with the fee taken from the input;
- if the tick price was reached, cross it: \`ticks.cross()\` flips the tick's \`feeGrowthOutside\` values and returns \`liquidityNet\`, which is added to \`liquidity\` when moving up and subtracted when moving down.

\`liquidityNet\` at a tick is the sum of \`+L\` for positions whose lower bound is that tick and \`−L\` for those whose upper bound it is.

Fees never touch the reserves used for pricing. Each step adds \`feeAmount · 2^128 / liquidity\` to \`feeGrowthGlobal0X128\` or \`feeGrowthGlobal1X128\`. A position's share is read as \`feeGrowthInside = global − below − above\`, computed from the \`feeGrowthOutside\` of its two ticks.

The panel runs this loop in plain floating point over the 17 ranges drawn, with a 0.30% fee. Reaching the next boundary needs \`L · (√P_next − √P)\` of token1, or \`L · (1/√P_next − 1/√P)\` of token0. If the input after the fee covers that, the loop crosses and continues with the next range's \`L\`; otherwise it stops at \`√P + Δy / L\`. The average price is total in over total out, and the v2 figure is the v2 output formula on reserves of equal value.`,
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
      alt: 'Three separate pools for the same pair stand side by side, labelled 0.05%, 0.30% and 1%, with fine, medium and coarse bins. Cards float above them, each attached to the price range it covers. The pool chosen in the panel is raised and lit.',
      body: {
        beginner: `In v2 every pool charged the same 0.3% fee. In v3 the same two tokens can have several pools, each with its own fee: a tiny fee for pairs that barely move, a larger one for risky pairs.

There is a second change. In v2 everyone's share of a pool was the same kind of thing, so it could be a simple token. In v3 your band is your own choice, and no two are alike.

So your position is a one-of-a-kind receipt: an NFT. The card records which pool, which band and how much. Whoever holds the card owns the position.

Pick a fee with the buttons and the pool you would join lifts up. On the next step you will put a position into it for a day.`,
        intermediate: `A v3 pool is defined by two tokens **and** a [[fee-tier]]. The tiers are 0.01%, 0.05%, 0.30% and 1%. Each tier is a separate pool with its own price and liquidity; the market decides which one becomes the deep one for a pair.

- 0.01% and 0.05%: stablecoin pairs and the biggest pairs, where LPs take little risk.
- 0.30%: most pairs.
- 1%: volatile or thinly traded tokens.

The tier also fixes the [[tick-spacing]]: 1, 10, 60 and 200.

Because each position has its own range, v2's fungible [[lp-token]] no longer works. A position is an [[nft-position]], an ERC-721 token. Fees are not added back into the position as in v2: they pile up separately and the owner collects them.

Choose a tier in the panel to see what its [[tick-spacing]] means for you: the bounds of a position can sit every 0.10%, 0.60% or 2.02% of price.`,
        expert: `The factory maps \`(token0, token1, fee)\` to one pool and \`feeAmountTickSpacing\` gives 100 → 1, 500 → 10, 3000 → 60, 10000 → 200 (fees in hundredths of a basis point). The 0.01% tier was added later by governance through \`enableFeeAmount\`.

The core pool knows nothing about NFTs. It keys positions by \`keccak256(abi.encodePacked(owner, tickLower, tickUpper))\` and stores \`liquidity\`, \`feeGrowthInside0LastX128\`, \`feeGrowthInside1LastX128\`, \`tokensOwed0\` and \`tokensOwed1\`. For most users the \`owner\` is the periphery contract \`NonfungiblePositionManager\`, which mints an [[nft-position]] (ERC-721) per position and records \`tokenId → (pool, tickLower, tickUpper, liquidity, …)\`.

Fees owed are \`liquidity · (feeGrowthInside − feeGrowthInsideLast) / 2^128\` per token. They are credited to \`tokensOwed0\` / \`tokensOwed1\` when the position is touched and paid out by \`collect()\`. They do not compound; reinvesting means adding liquidity again.

Non-fungible positions cannot be used directly where an [[erc-20]] is expected. That gap is filled by vaults that manage a v3 position and issue fungible shares.

The panel's "bounds every" figure is \`1.0001^tickSpacing − 1\`. The tier you pick here is the pool used on the next step.`,
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
    'fee-day': {
      title: 'One day in the life of a position',
      alt: 'A chart on a wall: time runs left to right and price goes up. A translucent band across it marks the position\'s price range. The day\'s prices are a row of dots, green inside the band and red outside it. Bars on the ground in front show the fees earned in each half hour, and two piles on the right compare the day\'s fees with those of a wide position.',
      body: {
        beginner: `Now put 10,000 USDC to work for one day. The band on the wall is your range. The dots are the price through the day: green while it is inside your band, red once it has left.

The bars in front are the fees you collect each half hour. A narrow band makes tall bars, because your money does more of the work. But where the dots turn red the bars vanish: outside the band you earn nothing.

Try the three kinds of day and squeeze the band. On a calm day narrow wins easily. On a day that runs away, the narrow band is left behind early, earns for only a few hours, and loses the most against simply keeping your coins.

These numbers are a made-up example to show the trade-off. They are not a forecast.`,
        intermediate: `The fee of a [[swap]] goes to the liquidity that is active at that price. While the price is inside your [[price-range]], your share of each fee is your liquidity divided by all the active liquidity. Once it is outside, your share is zero.

The panel simulates one day for a 10,000 USDC position opened at 2,000:

- The **[[fee-tier]]** sets the fee per trade and the [[tick-spacing]] your bounds snap to. A higher fee does not mean more income, because cheaper pools attract more volume.
- The **range** sets your depth: the narrower it is, the larger your share while the price is inside.
- The **kind of day** is one of three fixed price paths.

Compare "your fees" with the wide ±30% range. On the calm day ±1% earns roughly twenty times more. On the trending day it is in range for about an eighth of the day and then sits as 100% USDC while ETH keeps rising. That is the "loss vs holding" figure, and it is far bigger than the fees.

The pool volumes and depths behind these figures are invented round numbers. Only the mechanism is real.`,
        expert: `The model, for each half-hour interval \`t\` with price \`P_t\`:

\`fee_t = V_t · φ · L / (L + L_pool)\` if \`Pa ≤ P_t < Pb\`, otherwise \`0\`

\`V_t\` is the interval's volume, \`φ\` the [[fee-tier]], \`L\` your [[liquidity-l|liquidity]] from 10,000 USDC at \`P₀ = 2,000\`, and \`L_pool\` the liquidity of everyone else, taken as constant. On chain this is what \`feeGrowthInside\` measures: fees per unit of liquidity, accumulated only while the current [[tick]] is inside your range.

Bounds are snapped outward to the tier's [[tick-spacing]]. In the 1% pool (spacing 200, about 2% per step) a ±1% request becomes roughly 1,958–2,038.

"Loss vs holding" is \`V(P_end) − (x₀ · P_end + y₀)\`, with \`V\` computed from the position's token amounts at the clamped price as on step 2. It is the [[impermanent-loss]] in USDC, before fees; the net result of the day is the sum of the two figures.

Assumptions: volume is spread evenly over the day (scaled 0.6×, 1× and 1.6× for calm, trending and volatile), other LPs do not react, and the volume and depth of each tier are illustrative round numbers, not data.`,
      },
    },
    efficiency: {
      title: 'More from your capital, and more risk',
      alt: 'Two rows of liquidity. Behind, a flat full-range v2 slab next to a tall pile of capital. In front, the concentrated v3 position next to a much smaller pile that gives the same depth at the current price. A small post marks 2,000, where the position was opened; when the price is outside the range the position is dimmed and labelled as holding a single token.',
      body: {
        beginner: `The two piles on the left show the trade-off. To give traders the same depth at today's price, v2 needs the big pile. Your v3 band needs the small one.

That is the good news: the same money earns far more fees while the price stays in your band.

The bad news is that the band can be left behind. Slide the price out of it. Your position now earns nothing, and all of it has turned into the token that got cheaper. Narrow bands earn more and get left behind more often.

Press **Rally** or **Crash** to let the price run away on its own. Watch the bins change colour one by one until the whole position is a single colour. The panel shows how far behind you are compared with simply keeping your coins, next to the same figure for v2.`,
        intermediate: `[[capital-efficiency]] is the ratio between the depth your capital gives in a range and the depth it would give in v2. Try the sliders: 1,800–2,200 is about 20×, 1,950–2,050 about 80×.

The cost is risk:

- **[[out-of-range]]**: once the price leaves your range you earn no fees. Above the range you hold only USDC (you sold all your ETH on the way up); below it, only ETH (you bought all the way down).
- **Larger [[impermanent-loss]]**: your position rebalances faster than a v2 position would, so the loss against simply holding is multiplied by about the same factor as the efficiency.
- **Maintenance**: staying in range means moving the position, which costs [[gas]] and locks in the loss.

Narrow ranges suit pairs that hold their price, such as stablecoins. Wide ranges suit volatile pairs.

Press **Rally** or **Crash** and read the last two numbers. The position was opened at 2,000, the post on the axis. With 1,800–2,200, a rally to 2,400 leaves it 6.6% behind holding; a v2 position making the same move is 0.4% behind.`,
        expert: `For the same capital, [[liquidity-l|L]] is larger by the efficiency factor \`2√P / (2√P − √Pa − P/√Pb)\`. Fee income per unit of volume scales with your share of active \`L\`, so it scales by the same factor while in range.

So does the loss. A position's value in range is \`V(P) = L · (2√P − √Pa − P/√Pb)\`. Against holding the initial amounts, the offset terms cancel and the difference is \`L · (2√P − √P₀ − P/√P₀)\`: exactly the [[impermanent-loss]] of a v2 position with the same \`L\`. With \`L\` larger by a factor of *n*, the loss as a share of capital is *n* times larger until a bound is hit.

Beyond a bound the position is 100% the depreciating asset and stops earning: above \`Pb\` it holds \`L · (√Pb − √Pa)\` of token1, below \`Pa\` it holds \`L · (1/√Pa − 1/√Pb)\` of token0. A one-sided range above or below the price therefore behaves like a resting limit order that earns fees, but it un-fills if the price returns.

LP returns in v3 are fees minus this loss. Fees go to whoever supplies liquidity at the active tick, so passive wide positions compete with actively managed narrow ones, including liquidity that is added just before a large [[swap]] and removed just after it.

The panel fixes \`L\` at the deposit (\`P₀ = 2,000\`, 10,000 USDC) and reports \`V(P) / (x₀ · P + y₀) − 1\`, with \`P\` clamped to the range inside \`V\`, next to v2's \`2√r / (1 + r) − 1\` for \`r = P / P₀\`. If you move the bounds so that 2,000 lies outside them, the deposit is single-sided and the comparison starts from one token.`,
      },
    },
  },
};

export default content;

import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    oldWay: 'v2 / v3: one contract per pool',
    oldWayI: 'v2 / v3: every pool is deployed separately',
    newWay: 'v4: one contract, every pool',
    newWayI: 'all pools',
    you: 'you',
    tab: 'above: owed to you | below: you owe',
    before: 'before the swap',
    theSwap: 'the swap',
    after: 'after the swap',
    hookB: 'hook: plug-in rules',
    hookI: 'hook contract',
    others: 'other hook points: | pool creation, | adding / removing liquidity, | donations',
    wrapOld: 'v2 / v3: wrap ETH first',
    direct: 'v4: ETH goes straight in',
    swing: 'price swings',
    fee: 'fee',
    volatility: 'Volatility',
    lpFee: 'Swap fee',
    cmp2B: 'money spread | over every price',
    cmp2I: 'x · y = k, full range | 0.30% fee | LP token',
    cmp3B: 'you pick | a price band',
    cmp3I: 'price ranges | 0.01–1% fee tiers | NFT position',
    cmp4B: 'one building, | plug-in rules',
    cmp4I: 'singleton + hooks | any or dynamic fee | native ETH',
    tryDeploy: 'Try it: open a new pool both ways',
    deployOld: 'v2 / v3: deploy a pool',
    deployV4: 'v4: add a pool',
    reset: 'Reset',
    contracts: 'contracts',
    pools: 'pools',
    illustrative: 'gas figures are illustrative',
    tryFlash: 'Try it: build a route, then make the calls one by one',
    hops: 'Pools on the route',
    forget: 'Forget to settle',
    nextCall: 'Next call',
    startOver: 'Start over',
    callIdle: 'nothing called yet',
    callUnlock: 'open the tab',
    callSwap: 'swap {n}: {a} → {b}, on the tab',
    callSettle: 'pay in once: {a}',
    callTake: 'take out once: {b}',
    callOk: 'tab is at zero: done',
    callRevert: 'tab not at zero: all undone',
    moves: 'transfers',
    statCall: 'Call',
    statTab: 'Tab',
    tabOpen: 'not zero',
    tabZero: 'zero',
    reverted: 'reverted',
    transfers: 'Transfers, whole route',
    tryHooks: 'Try it: choose what the hook does, then swap',
    hookDoes: 'What the hook does',
    hk_dynamic: 'Dynamic fee',
    hk_limit: 'Limit order',
    hk_twamm: 'TWAMM',
    hk_malicious: 'Malicious',
    swapBtn: 'Swap 10 ETH',
    fired: 'Callbacks fired',
    notYet: 'press Swap',
    cbBefore: 'before',
    cbSwap: 'swap',
    cbAfter: 'after',
    received: 'You receive',
    hookTakes: 'Hook keeps',
    filled: 'Orders filled',
    skipped: 'not called',
    noHook: 'no hook: plain pool',
    actDynamic: 'sets the fee:',
    actTwamm: 'sells its own 5 ETH first',
    actLimit: 'fills a resting order',
    actMalicious: 'keeps 10% of the USDC',
    tryChoose: 'Try it: answer three questions',
    qPassive: 'Passive LP',
    qActive: 'Active LP',
    qStandard: 'Standard pool',
    qCustom: 'Custom logic',
    qVolatile: 'Volatile pair',
    qStable: 'Stable pair',
    suggested: 'Suggested',
    rsCustom: 'only v4 has hooks | for custom pool logic',
    rsPassiveVolatile: 'full range never | goes out of range',
    rsPassiveStable: 'a stable pair rarely | leaves a tight range',
    rsActiveVolatile: 'you move your range | as the price moves',
    rsActiveStable: 'tight range, | most fees per dollar',
  },
  steps: {
    singleton: {
      title: 'From one contract per pool to one contract for all',
      alt: 'On the left, three small buildings, each a separate pool contract. On the right, one large vault with three filled compartments. Small pools hop from the buildings into the compartments. Buttons add a building on the left or a compartment on the right, and a pile of gas coins grows next to each side.',
      body: {
        beginner: `In Uniswap v2 and v3 every pool is its own little building. A trade that goes through three pools has to carry the tokens out of one door and in through the next, three times.

Uniswap v4 puts **all pools in one building**. Each pool is just a compartment inside it.

Opening a new pool no longer means constructing a building; you only label a new compartment. And tokens moving between pools never have to leave.

**Try it.** Press both buttons under the scene. The old way puts up a whole new building and its gas pile jumps. The v4 way lights one more compartment and adds a thin slice. The gas numbers are rough illustrations, not measurements.`,
        intermediate: `In v2 and v3 a factory deploys a new [[smart-contract]] for every pool. Each one holds its own tokens, so a route through several pools transfers tokens from contract to contract at every hop.

v4 uses a [[singleton]]: one contract, the [[pool-manager]], holds the state and the tokens of every pool.

What changes:

- **Creating a pool** is a state update instead of a contract deployment, so it costs far less [[gas]].
- **A [[multi-hop]] swap** stays inside one contract; nothing has to be transferred between pools.
- The pricing is still v3's [[concentrated-liquidity]]: [[tick|ticks]], ranges and the same swap math.

**Try it.** Open a pool each way with the buttons. The v2 / v3 side gains a contract and about 4.5 million [[gas]] per pool, a round illustrative figure for deploying a v3 pool contract. The v4 side stays at one contract. Uniswap's v4 announcement says pool creation costs 99% less gas, and the panel applies that ratio.`,
        expert: `\`PoolManager\` stores every pool in \`mapping(PoolId => Pool.State) _pools\`. A pool is identified by its [[pool-key]]: \`currency0\`, \`currency1\`, \`fee\`, \`tickSpacing\` and \`hooks\`, with \`PoolId = keccak256(abi.encode(key))\`. \`initialize(key, sqrtPriceX96)\` writes \`slot0\` for that id; no bytecode is deployed.

\`Pool.State\` is the v3 pool state as a library struct: \`slot0\` ([[sqrt-price-x96]], tick, protocol fee, LP fee), \`feeGrowthGlobal0X128\` / \`1X128\`, \`liquidity\`, \`ticks\`, \`tickBitmap\` and \`positions\`. The built-in price oracle of v3 is gone from the core; an oracle is something a [[hook]] can provide.

Because \`fee\`, \`tickSpacing\` and \`hooks\` are all part of the key, they are free parameters rather than a governance-approved list. The same pair can exist in any number of pools.

The [[singleton]] holds the tokens of all pools in one balance per currency. Which pool owns what is pure accounting, and that is what makes the next step possible.

The buttons under the scene contrast the two paths. \`factory.createPool()\` deploys a complete pool contract with \`CREATE2\`, and storing its bytecode alone costs 200 gas per byte. \`initialize\` only writes \`slot0\` under a new \`PoolId\` in \`_pools\`. The gas totals in the panel are illustrative round numbers: about 4.5M per v3 pool, and 1% of that for v4, following the 99% reduction Uniswap states. They are not measurements.`,
      },
      code: {
        lang: 'Solidity (v4-core, abridged)',
        source: `struct PoolKey {
    Currency currency0;    // the lower address; address(0) is native ETH
    Currency currency1;
    uint24   fee;          // LP fee in hundredths of a bip; 0x800000 = dynamic
    int24    tickSpacing;
    IHooks   hooks;        // hook contract, or address(0) for none
}

// PoolId = keccak256(abi.encode(poolKey))
mapping(PoolId id => Pool.State) internal _pools;

function initialize(PoolKey memory key, uint160 sqrtPriceX96)
    external returns (int24 tick);`,
      },
    },
    flash: {
      title: 'Flash accounting: run a tab, pay once',
      alt: 'The vault stands in the centre with a board behind it showing one bar per token of the route around a zero line. Each call the learner makes changes the bars: swaps change them without any token moving, then one coin travels from the user into the vault and one travels back, and all bars return to zero. Two piles count the token transfers in v3 and in v4.',
      body: {
        beginner: `Think of a café where you order several things and pay once when you leave, instead of paying at the counter after every item.

v4 works the same way. While your transaction runs, the building only writes down what you owe and what you are owed. Swapping ETH for USDC and then USDC for DAI is just two lines on the tab, and the USDC cancels out.

At the end you pay in the ETH, take out the DAI, and the tab must be exactly zero. If it is not, the whole thing is undone as if it never happened.

**Try it.** Choose how many pools your trade passes through, then press **Next call** to walk through the transaction one step at a time. Watch the two piles on the left: the old way moves tokens twice for every pool, v4 only twice in total.

Then tick **Forget to settle** and run it again. The tab is not at zero at the end, so everything is undone.`,
        intermediate: `[[flash-accounting]] means the [[pool-manager]] tracks balance changes during a transaction and only moves tokens for the **net** result.

Follow the scene for an ETH → USDC → DAI [[multi-hop]] swap:

- Swap 1 records "owes 1 ETH, is owed 2,000 USDC".
- Swap 2 records "owes 2,000 USDC, is owed 1,999 DAI". The USDC entries cancel.
- Only two transfers happen: 1 ETH in, 1,999 DAI out.

In v3 the same route moves USDC out of the first pool and into the second. Here the middle token never moves at all, and the saving grows with every extra hop.

The same mechanism covers adding liquidity, removing it and swapping in one go, as long as everything nets to zero at the end.

**Try it.** Pick 1, 2 or 3 pools (the third hop goes on from DAI to WBTC) and step through the calls with **Next call**. After each swap, read the tab: every middle token is back at zero. The piles count token transfers. A v3 router doing the same exact-input route makes two per hop, so 2, 4 or 6; v4 always makes two.

With **Forget to settle** ticked, the ETH debt is still on the tab when the callback returns, and the whole transaction reverts.`,
        expert: `All state-changing calls happen inside a lock. The caller calls \`PoolManager.unlock(data)\`, which calls back \`unlockCallback(data)\` on \`msg.sender\`. Inside the callback, \`swap\`, \`modifyLiquidity\` and \`donate\` do not transfer anything; they add to a per-caller, per-currency \`int256\` delta. Negative means the caller owes the manager, positive means the manager owes the caller.

Debts are cleared with \`settle()\` (for an [[erc-20]]: \`sync(currency)\`, transfer, then \`settle()\`; for ETH: \`settle{value: …}()\`) and credits with \`take(currency, to, amount)\`. When the callback returns, \`unlock\` checks that the count of non-zero deltas is zero and otherwise reverts with \`CurrencyNotSettled\`.

The deltas, the non-zero counter and the lock flag live in [[transient-storage]] (EIP-1153 \`TSTORE\` / \`TLOAD\`), which is cleared at the end of the transaction and costs 100 gas per access instead of a storage write.

Two consequences. \`take\` before \`settle\` is a free flash loan of anything the manager holds, bounded only by the zero-delta check. And instead of withdrawing, a caller can \`mint\` [[erc-6909]] claim tokens for a credit and \`burn\` them later to pay a debt, which skips ERC-20 transfers entirely for frequent users.

The route builder under the scene makes the calls of \`unlockCallback\` one at a time. Each \`swap\` adds two entries; the board shows the sum per currency, and the panel's tab is the count of non-zero currencies. With \`settle\` skipped, \`take\` still succeeds, but \`unlock\` finds one non-zero delta (ETH) when the callback returns and reverts with \`CurrencyNotSettled\`, which undoes the \`take\` as well.

The comparison counts ERC-20 transfers. v3's \`SwapRouter.exactInput\` has each pool send its output to the router, which then pays the next pool: two transfers per hop. The amounts are illustrative fixed rates, not pool math.`,
      },
      code: {
        lang: 'Solidity (sketch of a two-hop swap)',
        source: `function swapEthToDai() external payable {
    poolManager.unlock(abi.encode(msg.sender));
}

function unlockCallback(bytes calldata data) external returns (bytes memory) {
    require(msg.sender == address(poolManager));
    address user = abi.decode(data, (address));

    // exact input is a negative amountSpecified; nothing is transferred yet
    BalanceDelta d1 = poolManager.swap(ethUsdcKey, firstHop, "");   // ETH -1, USDC +x
    BalanceDelta d2 = poolManager.swap(daiUsdcKey, secondHop, "");  // USDC -x, DAI +y

    poolManager.settle{value: 1 ether}();                  // pay the ETH we owe
    poolManager.take(DAI, user, uint128(d2.amount0()));    // collect the DAI we are owed
    return "";
}   // unlock() reverts with CurrencyNotSettled if any delta is left`,
      },
    },
    hooks: {
      title: 'Hooks: plug-in code around every action',
      alt: 'A swap travels along a lane across the PoolManager, past a gate before the pool and a gate after it. A separate hook contract carries one module for each behaviour the learner switched on. A gate lights up, and a signal runs along a cable to the hook and back, only where the hook asked to be called.',
      body: {
        beginner: `Until now every Uniswap pool followed exactly the same rules. v4 lets the person who creates a pool attach a small program to it, called a [[hook]].

The pool calls the hook at fixed moments: just **before** a swap and just **after** it, for example. The hook can then do something extra: change the fee, record a price, or carry out an order someone left earlier.

Watch the coin cross the pool. At each lit gate the pool pauses, asks the hook, and carries on.

**Try it.** Switch the hook's abilities on and off with the buttons, then press **Swap 10 ETH**. A gate only lights up if the hook asked to be called there. Notice what each ability does to your trade, and what the **Malicious** one does: a hook is someone else's code standing in the path of your money.`,
        intermediate: `A [[hook]] is a separate [[smart-contract]] chosen when a pool is created. It cannot be changed afterwards. The [[pool-manager]] calls it at defined points:

- before and after a pool is **initialized**;
- before and after liquidity is **added** or **removed**;
- before and after a **[[swap]]**;
- before and after a **donation** to the pool's liquidity providers.

A hook only implements the points it needs. Examples that have been built:

- a [[dynamic-fee]] that rises when the market is volatile;
- a [[limit-order]] that sells at a chosen price;
- [[twamm|TWAMM]], which spreads one very large order over hours;
- a price oracle, which v3 had built in and v4 leaves to hooks.

A hook is code that touches your trade or your liquidity. Whoever uses a pool has to trust its hook as well as Uniswap.

**Try it.** A pool has exactly one hook contract; the buttons choose what that contract does. The pool holds 1,000 ETH and 2,000,000 USDC. Press **Swap 10 ETH** and read the panel:

- **Dynamic fee** answers before the swap with a fee of 0.62% instead of the pool's fixed 0.30% (its toy rule sees 6% volatility).
- **TWAMM** uses the before-swap call to sell 5 ETH of its long-running order first, so your swap starts from a worse price.
- **Limit order** uses the after-swap call: your trade pushed the price past a resting order and the hook fills it. Your own result does not change.
- **Malicious** keeps 10% of your USDC after the swap.

With every button off the pool has no hook: no gate lights up and nothing is called.`,
        expert: `Which callbacks a [[hook]] receives is encoded in its **address**. The lowest 14 bits are permission flags, from \`BEFORE_INITIALIZE_FLAG = 1 << 13\` down to \`AFTER_REMOVE_LIQUIDITY_RETURNS_DELTA_FLAG = 1 << 0\`; \`BEFORE_SWAP_FLAG\` is \`1 << 7\` and \`AFTER_SWAP_FLAG\` is \`1 << 6\`. The [[pool-manager]] tests \`uint160(address(key.hooks)) & flag\` and skips the call when the bit is clear, so no storage read is needed. Deployers mine a \`CREATE2\` salt until the address has the right bits. The manager does not check that the contract really implements the flagged callbacks: hooks normally verify their own address in the constructor (\`Hooks.validateHookPermissions\`), and \`initialize\` only rejects inconsistent flag combinations with \`HookAddressNotValid\`.

Each callback must return its own selector. \`beforeSwap\` additionally returns a \`BeforeSwapDelta\` and a \`uint24\` fee override. With the \`*_RETURNS_DELTA\` flags a hook may take or supply part of the swap itself, which is how custom curves and hook-owned liquidity are built on top of the standard pool.

Hooks run inside the caller's \`unlock\`, so they take part in [[flash-accounting]]: a hook can call \`take\`, \`settle\` or \`modifyLiquidity\`, and its own deltas must also net to zero.

The risks are real. A hook can be upgradeable, can charge its own fees, and one with the remove-liquidity callbacks can make withdrawals revert. Every distinct \`hooks\` address is also a distinct pool, so liquidity for a pair is split across more pools than in v3.

In the panel, \`key.hooks\` shows the low bits that the chosen behaviours need. The model only sets swap bits: the dynamic fee and TWAMM need \`BEFORE_SWAP_FLAG\` (bit 7), the limit order needs \`AFTER_SWAP_FLAG\` (bit 6), and the malicious hook needs bit 6 plus \`AFTER_SWAP_RETURNS_DELTA_FLAG\` (\`1 << 2\`), so that the \`int128\` it returns from \`afterSwap\` is taken out of the swapper's delta. Dynamic fee plus limit order gives \`0x…00C0\`; add the malicious behaviour and it becomes \`0x…00C4\`. Real hooks of these kinds may set bits outside the swap as well, such as the initialize callbacks.

The numbers are a toy: a constant-product pool of 1,000 ETH and 2,000,000 USDC stands in for the concentrated-liquidity math, and the hook's cut is a flat 10%.`,
      },
      code: {
        lang: 'Solidity (v4-core: IHooks.sol, Hooks.sol, abridged)',
        source: `function beforeSwap(
    address sender,
    PoolKey calldata key,
    SwapParams calldata params,
    bytes calldata hookData
) external returns (bytes4, BeforeSwapDelta, uint24);   // selector, hook's delta, LP fee override

function afterSwap(
    address sender,
    PoolKey calldata key,
    SwapParams calldata params,
    BalanceDelta delta,
    bytes calldata hookData
) external returns (bytes4, int128);   // selector, hook's delta

// permissions live in the low bits of the hook's address
uint160 internal constant BEFORE_SWAP_FLAG = 1 << 7;
uint160 internal constant AFTER_SWAP_FLAG = 1 << 6;
// an address ending in ...00C0 gets exactly these two callbacks`,
      },
    },
    'native-dynamic': {
      title: 'Native ETH and fees that move',
      alt: 'On the left, two lanes: in the back lane an ETH coin goes through a wrapping machine before reaching an old pool; in the front lane an ETH coin goes straight into the v4 pool. On the right, a hook contract watches a bobbing price ball and drives a fee gauge that rises as the ball swings more.',
      body: {
        beginner: `Two smaller changes make v4 cheaper and more flexible.

**Real ETH.** In v2 and v3 a pool could not hold ETH itself. You first had to swap it for a stand-in token, like buying a voucher before you can pay. v4 pools accept ETH directly.

**Fees that adjust.** In older versions a pool's fee was fixed forever. In v4 a [[hook]] can change it, like a taxi that charges more in a storm. Drag the slider: when the price swings wildly, the gauge rises and liquidity providers are paid more for the risk they take.`,
        intermediate: `**[[native-eth]].** v2 and v3 pools only hold [[erc-20]] tokens, so ETH has to be wrapped into WETH first and unwrapped afterwards. In v4, ETH can be one of the pool's two currencies. That removes the wrap and unwrap steps, and sending ETH costs less [[gas]] than an ERC-20 transfer.

**[[dynamic-fee]].** v3 offers four fixed fee tiers. In v4 a pool can use any fixed fee, or declare its fee dynamic and let its [[hook]] set it.

The slider drives a simple example: a fee of 0.05% in a calm market rising to 1% when recent volatility reaches 10%. The reasoning is that volatile markets cause more [[impermanent-loss]], so liquidity providers should earn more exactly then; and in calm markets a low fee attracts volume.

The rule is whatever the hook's author wrote. It could equally depend on the time of day, the size of the trade or who is trading.`,
        expert: `**Currencies.** \`Currency\` wraps an address, and \`address(0)\` means [[native-eth]]. Since \`currency0 < currency1\`, ETH is always \`currency0\` of its pools. ETH debts are paid with \`settle{value: amount}()\` and credits are paid out by \`take\` as a plain call with value. WETH pools can still exist; they are simply different [[pool-key|PoolKeys]].

**Static fees.** \`key.fee\` is a \`uint24\` in hundredths of a basis point, up to \`1_000_000\` (100%), and \`tickSpacing\` can be 1 to 32767. Neither is tied to the other as in v3.

**Dynamic fees.** A pool is dynamic when \`key.fee == LPFeeLibrary.DYNAMIC_FEE_FLAG\` (\`0x800000\`). Its LP fee starts at 0 and can be changed in two ways, both only by the pool's own hook:

- \`poolManager.updateDynamicLPFee(key, newFee)\` stores a new fee in \`slot0\`, typically from \`afterInitialize\` or \`beforeSwap\`;
- \`beforeSwap\` returns \`fee | LPFeeLibrary.OVERRIDE_FEE_FLAG\` (\`0x400000\`) to apply a fee to this swap only, without a storage write.

The scene's curve is a toy: linear from 5 bps to 100 bps over 0–10% volatility. A real hook has to get volatility from somewhere it can trust, for example its own record of tick movement, and must assume traders will try to move that input just before a large swap.`,
      },
      code: {
        lang: 'Solidity (sketch of a dynamic-fee hook)',
        source: `// the pool must be created with key.fee = LPFeeLibrary.DYNAMIC_FEE_FLAG

function beforeSwap(address, PoolKey calldata, SwapParams calldata, bytes calldata)
    external view onlyPoolManager
    returns (bytes4, BeforeSwapDelta, uint24)
{
    // fee in hundredths of a bip: 500 = 0.05%, 10000 = 1%
    uint24 fee = feeForVolatility(recentVolatility());

    return (
        IHooks.beforeSwap.selector,
        BeforeSwapDeltaLibrary.ZERO_DELTA,
        fee | LPFeeLibrary.OVERRIDE_FEE_FLAG   // applies to this swap only
    );
}`,
      },
    },
    compare: {
      title: 'v2, v3 and v4 side by side',
      alt: 'Three small models stand in a row. v2: one basin with two reserves. v3: a row of bins, tall around a moving price marker. v4: one slab holding four pools, with a hook gate attached and a swap hopping between the pools.',
      body: {
        beginner: `Here are the three versions next to each other.

- **v2 (2020)**: one pool per pair of tokens. Your money is spread over every price. Simple, and you can leave it alone.
- **v3 (2021)**: you choose a price band. Your money works much harder inside it and not at all outside it.
- **v4 (2025)**: the same bands, but all pools live in one building, and each pool can have plug-in rules.

Each version is still running. A newer one did not switch off the older ones.`,
        intermediate: `**v2**

- Liquidity: full range, \`x · y = k\`
- Fee: 0.30%, added to the pool automatically
- Your share: a fungible [[lp-token]]
- Contracts: one per pair

**v3**

- Liquidity: [[concentrated-liquidity]] in a [[price-range]]
- Fee: a [[fee-tier]] of 0.01%, 0.05%, 0.30% or 1%, collected separately
- Your share: an [[nft-position]]
- Contracts: one per pair and fee tier

**v4**

- Liquidity: concentrated, same math as v3
- Fee: any value, or a [[dynamic-fee]] set by a [[hook]]
- Your share: a position in the [[pool-manager]], usually held as an NFT
- Contracts: one [[singleton]] for all pools, [[flash-accounting]], [[native-eth]]`,
        expert: `**Pricing state.** v2: \`reserve0\`, \`reserve1\` (\`uint112\`), invariant checked after the fee. v3: [[sqrt-price-x96]], \`tick\`, active \`liquidity\`, per-tick \`liquidityNet\`, \`tickBitmap\`. v4: the same structure, kept per \`PoolId\` inside \`PoolManager\`.

**Positions.** v2: ERC-20 shares minted by the pair, fees compound into reserves. v3: keyed by \`(owner, tickLower, tickUpper)\`, wrapped as ERC-721 by \`NonfungiblePositionManager\`, fees tracked by \`feeGrowthInside\`. v4: keyed by \`(owner, tickLower, tickUpper, salt)\`, wrapped as ERC-721 by the periphery \`PositionManager\`.

**Settlement.** v2 and v3: every pool transfers tokens in and out, with [[flash-swap|flash swaps]] and callbacks per pool. v4: deltas under \`unlock\`, \`settle\` / \`take\` on the net, [[transient-storage]], [[erc-6909]] claims.

**Oracle.** v2: cumulative prices for an arithmetic-mean [[twap]]. v3: an observation ring buffer of tick cumulatives for a geometric-mean TWAP. v4: none in core; a [[hook]] can add one.

**Extensibility.** v2 and v3: none inside the pool. v4: hooks on initialize, add and remove liquidity, swap and donate, plus a free \`fee\` and \`tickSpacing\`.

**Cost of that flexibility.** v4 has more to audit per pool (the hook), more pools per pair, and all funds in one contract.`,
      },
    },
    choose: {
      title: 'Which one, and when',
      alt: 'The three models stand at the back. A lit base marks the version that fits the learner\'s answers, a person stands in front of it, and a caption gives the reason.',
      body: {
        beginner: `There is no "best" version. It depends on what you want to do.

- You want to deposit two tokens and not think about it: **v2** is the simple choice.
- You are willing to watch the price and adjust your band, in exchange for more fees: **v3**.
- You need a pool that behaves differently, or you make trades that pass through many pools: **v4**.

If you only want to swap, you rarely choose at all. The app looks through the pools of all versions and sends your trade wherever the price is best.

**Try it.** Answer the three questions under the scene. The lit model is the version that fits your answers, with the reason next to it. Change one answer at a time and see which ones change the result.`,
        intermediate: `**As a liquidity provider**

- **v2**: fully passive, never [[out-of-range]], and the [[lp-token]] is accepted by many other apps. Low return on capital. Common for new and small tokens.
- **v3**: much higher [[capital-efficiency]], but ranges need managing and [[impermanent-loss]] is amplified. Best for stable pairs and large, liquid pairs.
- **v4**: the same range mechanics, plus whatever the pool's [[hook]] adds. Read what the hook does before depositing.

**As a trader** you normally use a router that splits your order across v2, v3 and v4 pools. v4 routes tend to cost less [[gas]], especially with several hops or with ETH.

**As a developer** v4 is the version to build on if you need behaviour the standard pool does not have: custom fees, on-chain [[limit-order|limit orders]], [[twamm|TWAMM]], or your own curve.

**Try it.** The picker under the scene applies these rules. Custom logic always means v4, because only v4 has a [[hook]]. Without it, an active LP is sent to v3. A passive LP gets v2 for a volatile pair and v3 for a stable one, where the price rarely leaves a tight range. It is a rule of thumb, not advice.`,
        expert: `**v2** remains the right tool when you need a fungible, full-range position: collateral that other protocols accept, long-tail tokens with no natural price range, or a simple [[twap]] source. Its cost is \`L\` per dollar.

**v3** has years of deep liquidity on major pairs and a built-in oracle. Returns depend on range selection and rebalancing against informed flow; passive wide ranges are diluted by just-in-time liquidity around large swaps. Many LPs reach it through managers that issue fungible shares.

**v4** wins on mechanics: cheaper pool creation, cheaper [[multi-hop]] routes through [[flash-accounting]], [[native-eth]], arbitrary \`fee\` and \`tickSpacing\`. Hooks let designs that previously needed a fork live on shared infrastructure: [[dynamic-fee|dynamic fees]], [[limit-order|limit orders]] filled in \`afterSwap\`, [[twamm|TWAMM]], custom curves through return deltas, oracles.

What you take on with v4:

- **Hook risk**: an extra contract in the path of every swap and liquidity change, possibly upgradeable, possibly able to block removal. Audit it as you would the pool.
- **Fragmentation**: \`(fee, tickSpacing, hooks)\` are free, so a pair's liquidity is spread over many pools and routing gets harder.
- **Concentration**: one contract holds the funds of every pool.

For plain pools with \`hooks = address(0)\`, v4 behaves like v3 at lower gas cost.

The picker under the scene is a three-input rule of thumb. It ignores things that matter in practice: where the pair's liquidity already sits, whether your position has to be fungible, and gas. Wherever it answers v3, a v4 pool with \`hooks = address(0)\` holds the same position at lower gas cost, provided that pool has the volume.`,
      },
    },
  },
};

export default content;

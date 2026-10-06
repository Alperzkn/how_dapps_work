import type { LessonContent } from '../../../types';

// Numbers quoted in the text come from the simulator's defaults (src/scenes/mev/state.ts):
// a 1,000 ETH / 2,000,000 USDC pool, a 40,000 USDC buy, 1% tolerance, 10 USDC of attacker gas.

const content: LessonContent = {
  labels: {
    nameYou: 'You',
    nameB: 'Trader B',
    nameC: 'Trader C',
    pending: 'your swap, waiting',
    mempool: 'public mempool',
    hidden: 'nothing to see',
    bot: 'searcher bot',
    tunnel: 'private route to builders',
    nextBlock: 'next block',
    block: 'the block',
    first: 'runs first',
    last: 'runs last',
    bigSwap: 'big swap',
    back: 'back-run',
    front: 'front-run',
    yourSwap: 'your swap',
    noAttack: 'not worth attacking',
    poolPrice: 'pool price',
    magnified: 'level changes drawn 8× larger',
    market: 'outside market',
    minLine: 'the least you accept',
    quote: 'quoted',
    searchers: 'searchers',
    users: 'users',
    builders: 'builder bids',
    relay: 'relay',
    localBuild: 'builds its own block',
    proposer: 'proposer',
    inBand: 'inside the fee band',
    yes: 'yes',
    no: 'no',
    tMempool: 'Try it: change the size and see what a bot reads',
    cTrade: 'You pay',
    cReads: 'Anyone can read',
    cMinOut: 'Minimum out',
    cImpact: 'Price impact',
    cWorth: 'Worth attacking?',
    tOrder: 'Try it: move your swap, then let tips decide',
    cEarlier: 'move earlier',
    cLater: 'move later',
    cByTip: 'Order by tip',
    cTip: 'Your tip',
    cYouGet: 'You get',
    cVsFirst: 'vs. going first',
    cYourSlot: 'Your place',
    tArb: 'Try it: move the market, then back-run',
    cMarket: 'Outside price',
    cBackrun: 'Back-run',
    cReset: 'Reset pool',
    cPoolPrice: 'Pool price',
    cGap: 'Pool vs. market',
    cArbTrade: 'Best trade',
    cProfitOpen: 'Profit on offer',
    cProfitTaken: 'Profit taken',
    tSandwich: 'Try it: shrink the trade or deepen the pool',
    cDepth: 'Pool',
    cStage: 'Show the pool after',
    cStageYou: 'your swap',
    cStage0: 'Start',
    cAlone: 'Alone you get',
    cYouLose: 'You lose',
    cAttacker: 'Attacker',
    sImpossible: 'no room',
    sAttacked: 'sandwiched',
    sUnprofitable: 'not worth it',
    sPrivate: 'hidden',
    tSlip: 'Try it: close the gap, or raise the gas',
    cTol: 'Tolerance',
    cGas: 'Attacker gas',
    cFront: 'Front-run size',
    cStatus: 'Result',
    tDef: 'Try it: hide the swap, or cut it into parts',
    cPrivate: 'Send privately',
    cParts: 'Parts',
    tPbs: 'Toy model: who keeps the value of a block?',
    cBoost: 'Outside builders',
    cValue: 'Block is worth',
    cBuilders: 'Builders',
    cProposerGets: 'Proposer gets',
    cBuilderKeeps: 'Winning builder keeps',
    cShare: "Proposer's share",
  },
  steps: {
    mempool: {
      title: 'Your swap is public before it happens',
      alt: 'A person on the left has sent a swap. It sits as a glowing parcel in an open tray labelled public mempool. Behind the tray a small robot, the searcher bot, looks straight at the parcel. To the right are an empty block with three slots and the pool the swap will trade against.',
      body: {
        beginner: `When you press "swap", nothing happens yet. Your order is first sent out to wait its turn, in a waiting room called the [[mempool]]. Every computer on the network can look inside.

Imagine shouting across a busy market: "I am about to buy a lot of apples, and I will pay up to this much!" Anyone who hears it can act before you do.

That is the situation on a public blockchain. Programs called bots read every waiting order, all day. Move the slider: a bigger order is more interesting to them.`,
        intermediate: `A [[swap]] is a [[transaction]]. After you sign it, your [[wallet]] hands it to a [[node]], and nodes [[gossip]] it to each other. Until a [[block]] includes it, it waits in the [[mempool]], readable by anyone running a node. On Ethereum a new block comes every 12 seconds, so there is time to react.

What a watcher can read is everything: which [[liquidity-pool]], which direction, how much, and the smallest amount you are willing to accept.

In the example you pay 40,000 USDC for ETH in a pool holding 1,000 ETH and 2,000,000 USDC. Your own trade will move the price by about 2.2% ([[price-impact]]), and you allow 1% of [[slippage]] on top. The panel shows the result: a [[searcher]] could take roughly 335 USDC from this swap. Drag the size down to 5,000 USDC and it stops being worth the effort.`,
        expert: `There is no single mempool. Each node keeps its own pool of pending transactions and forwards them to peers; a [[searcher]] subscribes to pending transactions from well-connected nodes (\`eth_subscribe("newPendingTransactions")\`) and simulates every one against the latest state.

A router swap carries its whole intent in [[calldata]]: \`amountIn\`, \`amountOutMin\`, \`path\`, \`to\` and \`deadline\`. From \`amountIn\` and the pool's [[reserves]] the searcher knows the post-trade price; from \`amountOutMin\` it knows exactly how much worse a price you will still accept.

The term comes from *Flash Boys 2.0* (Daian et al., 2019), which measured bots competing for ordering on [[dex|DEXes]] and named the phenomenon miner extractable value. Since Ethereum moved to [[proof-of-stake]] the M is read as "maximal": [[mev]] is the value that can be extracted from block production beyond the standard block reward and [[gas-fee|gas fees]], by including, excluding and reordering transactions.`,
      },
    },
    ordering: {
      title: 'Whoever orders the block decides who goes first',
      alt: 'A block with three slots holds three parcels: yours, glowing, and two grey ones from other traders. Each parcel is labelled with what its owner receives. Beside the block, the pool shows its levels after all three swaps.',
      body: {
        beginner: `Three people want to trade with the same pool. The pool changes its price after every trade, so **the order matters**. If someone buys just before you, you pay more.

Use the arrows to move your swap up and down the block. Watch "You get" change, even though your order is exactly the same.

Who decides the order? Whoever puts the block together. And they can be paid: turn on "Order by tip" and raise your tip until you are first. The extra money that can be made from choosing the order has a name: [[mev]].`,
        intermediate: `The rules of the chain say which transactions are valid. They do not say in which order a [[block]] must list them. That choice belongs to whoever builds the block, and it is worth money.

Here Trader B buys ETH with 60,000 USDC and Trader C sells 30 ETH. For your 40,000 USDC:

- first in the block: 19.55 ETH;
- right after B's buy: 18.44 ETH, about 5.7% less;
- right after C's sale: 20.73 ETH, about 6% more.

[[mev]] is the value available from this power to include, exclude and reorder. Three roles share it. A [[searcher]] finds the opportunity. A [[block-builder]] assembles the most valuable block it can. The [[proposer]], the [[validator]] chosen for that slot, picks a block and signs it.

With "Order by tip" on, the slot goes to the highest priority fee. That is how people bid for position: under [[eip-1559]] the base fee is burned, and the tip is what the block producer keeps.`,
        expert: `The protocol validates a block's transactions in sequence but leaves the sequence itself to the producer. Any state-dependent payoff, here \`getAmountOut\` against shifting [[reserves]], is therefore a function of position.

Bidding for position first happened in the open. *Flash Boys 2.0* documented priority gas auctions: bots repeatedly replacing their own pending transaction with a higher gas price to get ahead of each other, an open, continuous, all-pay auction in which the losers still land on-chain and pay for a revert.

Most of that bidding has since moved off the public network. A searcher sends a *bundle*, an ordered list of transactions to be included together or not at all, straight to [[block-builder|builders]] and pays through the priority fee or a direct transfer to the builder's fee recipient. Losing bundles are simply not included, so the auction is sealed-bid and failures cost nothing. Builders usually place bundles at the top of the block and fill the rest from the [[mempool]] by priority fee.

The simulator applies the three swaps in order with the 0.3% fee: \`out = 0.997·dx·y / (x + 0.997·dx)\`, updating \`x\` and \`y\` after each.`,
      },
    },
    backrun: {
      title: 'Back-running: arbitrage keeps the pool honest',
      alt: 'A block holds one big swap; a green back-run parcel appears in the slot right behind it when the button is pressed. On the right, the pool and, behind it, a screen showing the outside market price. The pool price label turns from red to neutral once the pool is realigned.',
      body: {
        beginner: `A pool does not know what ETH costs anywhere else. It only knows what is inside it. After a big trade, or when the market moves, the pool's price is simply wrong.

Someone can profit by fixing it: buy where it is cheap, sell where it is dear. That is [[arbitrage]]. Doing it immediately after the trade that caused the gap is called [[back-running]].

Move the outside price away from the pool's, then press "Back-run". The pool snaps back toward the market and the bot keeps the difference. Nobody's swap was made worse by this. It is how pool prices stay close to real ones.`,
        intermediate: `An [[amm]] has no price feed. Its price is the ratio of its [[reserves]], and it only moves when someone trades. So whenever the pool and the wider market disagree, there is free money for whoever trades the pool back into line.

[[back-running]] means placing your transaction directly **after** a specific one, to capture the opportunity it creates. Unlike [[front-running]], it does not change what the earlier trader received.

Try it with the pool at 2,000 and the outside market at 2,080:

- the best trade is to buy about 17.9 ETH with 36,656 USDC;
- that leaves the pool at about 2,074, not 2,080;
- the profit is about 670 USDC before gas.

It stops at 2,074 because of the 0.3% fee: inside a band of ±0.3% around the market price, no trade pays. Set the outside price to 2,000 or 2,005 and the button is disabled.

The profit is not free for everyone. It comes out of the pool, which means out of the [[liquidity-provider|liquidity providers]].`,
        expert: `For a pool \`(x, y)\` with fee factor \`γ = 0.997\` and outside price \`P\` (y per x), the arbitrageur selling x into the pool solves \`max_Δx  γ·Δx·y/(x + γ·Δx) − P·Δx\`. The first-order condition \`γ·x·y / (x + γ·Δx)² = P\` gives

\`Δx = (√(γ·x·y / P) − x) / γ\`

and symmetrically \`Δy = (√(γ·x·y·P) − y) / γ\` when buying. Either is positive only when the pool price lies outside \`[γ·P, P/γ]\`; that is the no-arbitrage band, and the trade ends at its edge.

In practice back-runs are sent as bundles of \`[target tx, my tx]\` so the searcher's transaction lands immediately behind its target or not at all. Order-flow auctions use the same shape: the user's transaction is revealed partially, searchers bid for the right to back-run it, and most of the bid is refunded to the user.

For LPs this is the main cost of providing liquidity. Milionis, Moallemi, Roughgarden and Zhang call it loss-versus-rebalancing (LVR): the pool always trades at a stale price against better-informed arbitrageurs. For a fee-less constant-product pool it accrues at a rate of \`σ²/8\` of pool value per unit time, where \`σ\` is the volatility. It is distinct from [[impermanent-loss]], which depends only on where the price ends up.`,
      },
    },
    sandwich: {
      title: 'The sandwich: one trade in front of you, one behind',
      alt: 'The block now holds three parcels in order: a red front-run, your orange swap, a red back-run. The searcher bot behind the mempool has a red eye and a dashed line to your pending swap. The pool on the right shows its levels at the selected point of the block.',
      body: {
        beginner: `Now the harmful version. The bot sees your order to buy ETH and does two things in the same block:

- **just before you**, it buys ETH, which pushes the price up;
- **you** then buy at that higher price, pushing it up further;
- **just after you**, it sells what it bought, at the price you created.

Your swap is the filling; the bot's two trades are the bread. That is a [[sandwich-attack]]. You get less ETH, and the difference is the bot's profit.

Press 1, 2 and 3 to walk through the block and watch the pool. Then make your trade small, or the pool big: the bot stops bothering.`,
        intermediate: `[[front-running]] means getting a transaction in ahead of a known pending one to profit from it. A [[sandwich-attack]] is a front-run plus a matching back-run around a single [[swap]].

With the defaults (you pay 40,000 USDC, pool 1,000 ETH and 2,000,000 USDC, 1% tolerance):

- alone you would receive 19.55 ETH;
- the bot first buys with about 10,190 USDC;
- you then receive 19.35 ETH: about 0.2 ETH less, worth roughly 390 USDC;
- the bot sells its ETH back for a profit of about 335 USDC after 10 USDC of gas.

Not all of what you lose reaches the bot: both of its trades pay the pool's 0.3% fee, which goes to the [[liquidity-provider|liquidity providers]].

Two things make a sandwich worth less. A **smaller trade** moves the price less, so there is less to capture: at 5,000 USDC in this pool the price moves less than the fees cost. A **deeper pool** has the same effect. Try both sliders.`,
        expert: `Let the victim sell \`v\` into reserves \`(x, y)\` with minimum output \`m\`. The attacker chooses a front-run \`a\`:

- front-run: \`b = out(a; x, y)\`, reserves become \`(x + a, y − b)\`;
- victim: \`o(a) = out(v; x + a, y − b)\`, required \`o(a) ≥ m\`;
- back-run: sell \`b\` into the reversed reserves, receiving \`a'\`.

Profit is \`a' − a − gas\`. \`o(a)\` falls monotonically in \`a\`, so the constraint gives an upper bound \`a_max\`, found here by bisection. The profit rises with \`a\` until the 0.6% the attacker pays in round-trip fees outweighs the extra price it extracts, which happens far beyond any realistic tolerance; so in practice the optimum is \`a = a_max\` and the victim receives exactly \`amountOutMin\`.

A sandwich is profitable at all only if the victim's own [[price-impact]] exceeds the round-trip fee: roughly \`(1 + impact)·γ² > 1\`. That is why small trades in deep pools are left alone regardless of tolerance.

Sent as two loose transactions the attack is not atomic: the front-run may land without the victim. Searchers therefore send \`[front-run, victim tx, back-run]\` as one bundle, which the [[block-builder]] includes whole or not at all.`,
      },
      code: {
        lang: 'TypeScript (this lesson\'s simulator, abridged)',
        source: `// out(dx; x, y) = 0.997·dx·y / (x + 0.997·dx)          (Uniswap v2 getAmountOut)
function trySandwich(x, y, victimIn, a) {
  const s1 = swapV2(x, y, a);                 // front-run: attacker buys
  const s2 = swapV2(s1.x, s1.y, victimIn);    // victim, at a worse price
  const s3 = swapV2(s2.y, s2.x, s1.out);      // back-run: attacker sells it all
  return { victimOut: s2.out, gross: s3.out - a };
}

// 1. largest front-run that keeps the victim above amountOutMin
let lo = 0, hi = aUpperBound;
for (let i = 0; i < 60; i++) {
  const mid = (lo + hi) / 2;
  if (trySandwich(x, y, victimIn, mid).victimOut >= minOut) lo = mid; else hi = mid;
}
// 2. most profitable size in [0, lo]; attack only if gross - gas > 0`,
      },
    },
    slippage: {
      title: 'Slippage tolerance is the gap you leave open',
      alt: 'Same block and pool as before. On the right stands a tall column: its top is the amount you were quoted, a dark plate lower down marks the least you accept, and a red slice at the top shows how much the attacker takes. The slice reaches exactly down to the plate.',
      body: {
        beginner: `When you swap, you also say how much worse a result you would still accept. That allowance is the [[slippage-tolerance]]. It exists for a good reason: prices move while you wait, and without it many swaps would fail.

But look at the column on the right. The top is what you were promised. The dark plate is the least you said you would accept. Everything between them is a gap you left open, and the red slice is the bot filling it, right down to the plate.

Lower the tolerance: the plate rises and the red slice shrinks. At some point the bot's profit no longer covers its costs and it leaves you alone. Set it too tight, though, and an ordinary price wobble will make your swap fail.`,
        intermediate: `[[slippage]] is the change in price between quoting and execution. Your [[slippage-tolerance]] turns into a number inside the [[transaction]]: the minimum output. If the pool would pay less, the swap reverts and you lose only the [[gas-fee]].

For the attacker that minimum is a target. The best [[sandwich-attack]] pushes the price until you receive exactly your minimum. With the defaults:

- 1% tolerance: you lose about 0.196 ETH, the bot nets about 335 USDC;
- 0.5%: you lose about 0.098 ETH, the bot nets about 160 USDC;
- 0.1%: you lose about 0.020 ETH, the bot nets about 25 USDC after 10 USDC of gas;
- raise the attacker's gas to 40 USDC at 0.1% and the attack no longer pays.

So tolerance is a trade-off, not a setting to minimise blindly. Too loose and you offer a large prize. Too tight and normal movement from other people's trades makes your swap fail, which costs gas and time. Tolerance does not include your own [[price-impact]]: that is already in the quote.`,
        expert: `On the v2 router the tolerance becomes \`amountOutMin = quote · (1 − tolerance)\`, checked against the output computed from current [[reserves]] at execution: \`require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT')\`. v3's router has the same check as \`amountOutMinimum\`, plus \`sqrtPriceLimitX96\` for a hard price bound.

Because the optimal front-run drives the victim to the bound, the victim's loss is \`tolerance × quote\` whenever an attack is profitable, independent of pool depth. Depth and trade size decide only *whether* it is profitable and how much of the loss the attacker keeps after fees and gas.

\`deadline\` covers a different risk. A signed swap stays valid until it is included; without a deadline, a transaction left pending for hours can be included later, when the market has moved and executing it at its old \`amountOutMin\` has become profitable for someone else. \`ensure(deadline)\` reverts once \`block.timestamp\` passes it.

Setting \`amountOutMin = 0\`, common in hastily written contracts and bots, removes the bound entirely: the attacker's only limit is then its own fees.`,
      },
      code: {
        lang: 'Solidity (UniswapV2Router02.sol)',
        source: `modifier ensure(uint deadline) {
    require(deadline >= block.timestamp, 'UniswapV2Router: EXPIRED');
    _;
}

function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,          // quote * (1 - slippage tolerance)
    address[] calldata path,
    address to,
    uint deadline
) external virtual override ensure(deadline) returns (uint[] memory amounts) {
    amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
    require(amounts[amounts.length - 1] >= amountOutMin,
            'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
    TransferHelper.safeTransferFrom(
        path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
    );
    _swap(amounts, path, to);
}`,
      },
    },
    defences: {
      title: 'Defences: leave less to take, or stay out of sight',
      alt: 'With "send privately" on, a thick green line carries your swap from you around the mempool straight to the block; the mempool tray shows nothing to see and the bot\'s eye is off. The block holds only your swap. With the option off and the trade split, a smaller parcel sits in the block, with or without red parcels around it.',
      body: {
        beginner: `There are two families of defence.

**Leave less to take.** A tighter tolerance, a smaller trade, or one large trade cut into several small ones. Move "Parts" up: each piece is a smaller prize, and at some point none of them is worth the bot's costs.

**Stay out of sight.** Tick "Send privately". Your swap skips the public waiting room and goes straight to the people who build blocks. The bot cannot attack what it cannot see.

Neither is perfect. Sending privately means trusting whoever you sent it to. And cutting a trade into parts costs more in fees and takes longer. These defences shrink the problem; they do not make it vanish.`,
        intermediate: `What the simulator shows:

- **Tighter [[slippage-tolerance]]**: a smaller gap, as in the previous step.
- **Splitting**: with the defaults, 5 parts are still each sandwiched, but the bot's total drops from about 335 to about 48 USDC; with 10 parts no part is worth attacking. You pay gas for every part, and the simulator assumes [[arbitrage]] resets the pool between them.
- **A [[private-mempool]]**: the swap goes to [[block-builder|builders]] through a private [[rpc]] endpoint instead of being gossiped. No public bot sees it before it is in a [[block]]. You are trusting the endpoint and the builders not to exploit or leak it, and inclusion can take longer, because only those builders can include it.

Other approaches, at a high level:

- **Order-flow auctions** let searchers bid to [[back-running|back-run]] your swap and return most of the bid to you.
- **Batch auctions** collect orders for a short time and settle them together at one price per pair, so position inside the batch means nothing. Competing "solvers" look for the best settlement.
- **A [[limit-order]] or [[twamm]]** fixes your price, or spreads a large order over many blocks.

All of these reduce [[mev]]. None removes it: value moves to whoever now sees the order first.`,
        expert: `**Private order flow.** Services such as Flashbots Protect accept transactions over RPC and forward them to builders rather than the public mempool; a transaction is included only if it does not revert, so failed attempts cost nothing. The trust assumption is explicit: the operator and every builder it shares with see the transaction in clear. Anyone who can see it and order the block can still sandwich it; the protection is reputational and contractual, not cryptographic.

**Order-flow auctions.** MEV-Share reveals selected hints about a pending transaction, searchers submit partial bundles that back-run it, and the user is refunded a configurable share of the resulting payment (90% by default, per the Flashbots documentation). It currently accepts back-runs only.

**Batch auctions and intents.** In CoW Protocol users sign an intent with a limit price rather than a transaction. Solvers compete to settle a batch; orders in the same direction on the same pair in one auction clear at a uniform price, which makes ordering within the batch irrelevant, and opposite orders can be matched against each other without touching an [[amm]]. The user's limit price is still the bound: the guarantee is the outcome of solver competition, not an on-chain ordering rule.

**What a v4 [[hook]] can and cannot do.** A hook runs inside the swap, so it can change the price of being first: a [[dynamic-fee]] that rises with volatility or with the transaction's priority fee, or logic that returns part of the arbitrage to LPs. It cannot hide a pending transaction, and it has no say over where in the block a transaction lands. Hooks reshape who earns the [[mev]] in their pool; ordering stays with the builder.`,
      },
    },
    pbs: {
      title: 'How blocks are built today',
      alt: 'A supply chain from left to right: users and a searcher bot send orders to a column of builders, each with a bar showing its bid. The winning builder\'s block passes through a round relay to the proposer, a pillar topped with coins. With outside builders switched off, a dashed line goes from the users straight to the proposer.',
      body: {
        beginner: `Who is "whoever puts the block together"? Today it is usually two different parties.

Building a profitable block is specialist work: you need fast computers, clever software and deals with searchers. Most [[validator|validators]] are not set up for that. So specialists called builders assemble complete blocks and **bid** for the right to have theirs used. The validator whose turn it is, the [[proposer]], takes the highest bid and signs.

Play with the model. With one builder, the builder keeps most of the value. Add competitors and the bids climb: the value flows to the proposer instead. This split between building and proposing is how most of the [[mev]] in a block ends up as income for validators.`,
        intermediate: `The split is called proposer-builder separation (PBS). On Ethereum today it is not part of the protocol. It is done with [[mev-boost]], optional open-source software a [[validator]] runs next to its node.

The chain of hands:

- **Users and [[searcher|searchers]]** send transactions and bundles to builders.
- A **[[block-builder]]** assembles the most valuable block it can and attaches a bid to the [[proposer]].
- A **relay** sits between them. It checks each builder's block and shows the proposer only the header and the bid.
- The **proposer** signs the header with the highest bid without seeing the contents; then the relay releases the full block.

The proposer signs blind so that it cannot copy the builder's transactions and keep the profit itself.

The cost is concentration and trust. A handful of builders and relays handle a large share of blocks, and both sides have to trust the relay: the proposer that the block is valid and will actually be released, the builder that the relay will not steal its contents. A validator can always skip all this and build its own block from the [[mempool]].`,
        expert: `[[mev-boost]] is a sidecar for the consensus client implementing the builder API. The validator registers its fee recipient and gas limit with relays (\`registerValidator\`). In its [[slot]], \`getHeader\` returns each relay's best \`ExecutionPayloadHeader\` and bid; the proposer signs a blinded beacon block over the chosen header and submits it; only then does the relay release the payload so the block can be broadcast. Signing a second, different block for the same slot is a slashable equivocation, which is what stops a proposer from seeing the payload and then rebuilding it for itself.

Relay trust runs both ways. Proposers rely on the relay for block validity, the accuracy of the bid and data availability: if the payload is never released after signing, the slot is missed. Builders rely on it not to front-run or leak their blocks. Relays can also filter what they pass on, which makes them a censorship choke point.

Two protocol changes aim at these assumptions. Enshrined PBS (EIP-7732) makes builders staked in-protocol actors whose bids are committed on the beacon chain, with a payload timeliness committee attesting that the payload was revealed, removing the trusted relay. It has been selected for the Glamsterdam upgrade; treat it as planned and check whether it has activated. Fork-choice enforced inclusion lists (FOCIL, EIP-7805, a draft) let a committee of validators list transactions that the next block must contain, with [[attestation|attesters]] voting only for blocks that comply.

The panel is a toy second-price model: each builder can realise a fraction of the block's value, and the best one wins by just outbidding the runner-up, or the proposer's own local block when it is alone. Real builder margins depend on exclusive order flow, latency and bidding strategy.`,
      },
      code: {
        lang: 'HTTP (Ethereum builder API, as used by MEV-Boost)',
        source: `# regularly: tell relays where to pay and which gas limit to target
POST /eth/v1/builder/validators            # SignedValidatorRegistrationV1[]

# in the proposer's slot: ask every relay for its best bid
GET  /eth/v1/builder/header/{slot}/{parent_hash}/{pubkey}
#    -> SignedBuilderBid { header: ExecutionPayloadHeader, value, pubkey }

# sign a block containing only that header; only then is the body revealed
POST /eth/v1/builder/blinded_blocks        # SignedBlindedBeaconBlock
#    -> the relay releases the full ExecutionPayload and the block is broadcast`,
      },
    },
  },
};

export default content;

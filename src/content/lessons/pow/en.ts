import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    nextBlock: 'Who adds this one?',
    emptySlot: 'next block',
    chain: 'the chain so far',
    miner: 'Miner',
    you: 'You',
    yourBlock: 'your block',
    pressMine: 'press Mine',
    attempt: 'try',
    gaugeTop: 'fingerprint',
    hashValue: 'hash value',
    winZone: 'win',
    belowTarget: 'below target',
    reward: 'reward',
    rewardAmount: '3.125 BTC + fees',
    startOver: 'start over',
    newBlock: 'new block',
    verifyOnce: 'one hash to verify',
    fewMiners: 'a few miners',
    moreMiners: 'more miners join',
    steady: 'steady pace',
    tooFast: 'too fast',
    difficulty: 'difficulty',
    harder: 'harder puzzle',
    honestChain: 'Everyone else',
    attackerChain: 'Secret chain',
    publicChain: 'Public chain',
    cost: 'electricity bill',
    zeros: 'Leading zeros',
    average: 'avg. tries',
    mine: 'Mine',
    mineAgain: 'Again',
    resume: 'Continue',
    stop: 'Stop',
    reset: 'Reset',
    attempts: 'Tries',
    time: 'Time',
    nonce: 'Nonce',
    winningNonce: 'Winning nonce',
    lastHash: 'Last hash',
    winningHash: 'Winning hash',
    limit: 'gave up',
    ready: 'ready',
    searching: 'searching…',
    paused: 'paused',
    found: 'found a valid block',
    capped: 'no luck: stopped at the try limit',
    seconds: 's',
    lateTag: 'already had your block',
    rivalTag: 'finds one {n} s later',
    staleTag: 'stale: work wasted',
    sameHeight: 'same height',
    builtOn: 'next block',
    tooSlow: 'too slow',
    pace: '≈ {n} min per block',
    minersLeave: 'miners leave',
    hashrateWord: 'hashrate',
    easier: 'easier puzzle',
    clampTag: '(4× limit)',
    honestPct: 'everyone else · {n}',
    attackerPct: 'attacker · {n}',
    caught: 'caught up: history rewritten',
    gaveUp: 'falls behind: gives up',
    tryOdds: 'Try it: set your share, then mine more blocks',
    yourShare: 'Your share of the hashrate',
    runBlocks: 'Mine {n} blocks',
    blocksMined: 'Blocks',
    youWon: 'You won',
    expected: 'Expected',
    tryCast: 'Try it: slow the network down',
    delayLabel: 'Propagation delay',
    rivalFinds: 'Miner C finds one too (+{n} s)',
    nextBlockBtn: 'Find the next block',
    startOverBtn: 'Start over',
    staleStat: 'Chance of a rival block',
    outcome: 'Result',
    outNone: '—',
    outLate: 'no fork',
    outFork: 'fork: two blocks',
    outYou: 'C\'s block is stale',
    outRival: 'your block is stale',
    tryRetarget: 'Try it: change the hashrate, then mine a period',
    hashrateSlider: 'Hashrate',
    minePeriod: 'Mine the next 2016 blocks',
    blockTimeStat: 'Block time',
    min: 'min',
    periodTakes: '2016 blocks take',
    days: 'days',
    diffNext: 'Difficulty now → next',
    tryAttack: 'Try it: set the attacker and the wait',
    attackerSlider: 'Attacker share',
    confSlider: 'Confirmations',
    raceBtn: 'Race once',
    successStat: 'Success',
    atRisk: 'Rewards given up',
    noRisk: 'none: it wins',
    attemptsWon: 'Won',
  },
  steps: {
    who: {
      title: 'Who gets to add the next block?',
      alt: 'A chain of three blocks ends in an empty slot. Three mining machines stand in front of it, each holding its own unfinished candidate block.',
      body: {
        beginner: `Everyone keeps a copy of the chain, and many people would like to write its next page. If anyone could add a [[block]] whenever they liked, there would be thousands of different versions within a minute.

So the network needs a fair way to pick **one** writer at a time, with no boss doing the picking and no list of members to pick from.

[[proof-of-work]] solves this with a lottery. Anyone can join, but each ticket costs real electricity. The machines that buy tickets are called [[miner|miners]].`,
        intermediate: `An open network cannot hold a vote: creating a thousand fake identities costs nothing, so "one computer, one vote" is trivial to cheat. This is known as a Sybil attack.

[[proof-of-work]] ties influence to something that cannot be faked: computation. Each [[miner]] collects [[transaction|transactions]] from the [[mempool]] into a candidate [[block]] and then competes for the right to publish it.

The chance of winning is proportional to the share of the network's [[hashrate]] that a miner controls. Ten percent of the machines win about ten percent of the blocks.`,
        expert: `Nakamoto [[consensus]] replaces identity-based voting with a resource-based leader election. There is no membership set: a participant's weight is the fraction of total [[hashrate]] it contributes, which makes the protocol Sybil-resistant and permissionless at once.

Each [[miner]] builds a block template: the previous block's hash, a [[merkle-root]] over its chosen transactions, a [[timestamp]] and the current \`nBits\`. The first transaction is the *coinbase*, which has no inputs and pays the [[block-reward]] plus fees to the miner. Because each miner's coinbase is different, every miner is searching a different puzzle.

Block discovery is a Poisson process. With the target interval at 600 s, the time to the next block is exponentially distributed and memoryless: having mined for nine minutes without success does not bring the next block any closer.`,
      },
    },
    puzzle: {
      title: 'The puzzle',
      alt: 'One mining machine and its candidate block. A counter above the block spins through numbers, and a gauge beside it shows each try landing above a small green winning zone.',
      body: {
        beginner: `A lottery ticket here is a guess. The [[miner]] adds a number to its [[block]] and takes the block's [[hash]], its fingerprint. The fingerprint comes out looking completely random.

The rule: the fingerprint must start with enough zeros. There is no trick for getting one. The only way is to change the number, called the [[nonce]], and try again, and again.

Use the slider and press **Mine**. Your device really performs this search. Each extra zero makes it about 16 times harder.`,
        intermediate: `The puzzle: find a [[nonce]] so that the [[hash]] of the [[block-header]] is below a number called the [[target]]. A smaller target means more leading zeros and a harder puzzle; [[difficulty]] is simply how small the target is.

A hash function gives no hint about which input will work, so the only strategy is brute force: try nonce 0, 1, 2, … and hash each time. Finding a solution takes a huge number of tries on average. **Checking** one takes a single hash, so everybody can verify the work instantly.

In the demo each hex zero multiplies the average number of tries by 16: 3 zeros need about 4,096, 5 zeros about a million. Bitcoin's real target requires at least 19 leading hex zeros as of 2026.`,
        expert: `Bitcoin's validity condition is \`SHA256d(header) ≤ target\`, where \`SHA256d(x) = SHA-256(SHA-256(x))\` over the 80-byte [[block-header]] and the digest is read as a 256-bit little-endian integer.

The [[target]] is stored in the header in compact form: \`nBits = 0xEEMMMMMM\` means \`target = mantissa × 256^(exponent − 3)\`. The largest allowed target is \`0x1d00ffff\`, and [[difficulty]] is defined as \`max_target / target\`. The expected work per block is about \`difficulty × 2^32\` hashes.

The header [[nonce]] is only 32 bits, and a modern ASIC exhausts it in well under a second. Miners then change the \`extraNonce\` inside the coinbase transaction (which changes the [[merkle-root]]), or adjust \`nTime\`, to get a fresh search space.

The demo below uses single [[sha-256]] over a text header and counts leading hex zeros, which is the same idea with a coarser target: \`k\` zeros corresponds to \`target = 2^(256 − 4k)\`.`,
      },
      code: {
        lang: 'pseudocode',
        source: `// what every miner does, billions of times per second
header = { version, prevBlockHash, merkleRoot, time, bits, nonce: 0 }
target = decodeCompact(header.bits)

loop:
  h = sha256(sha256(serialize(header)))   // 80 bytes in, 32 bytes out
  if uint256_le(h) <= target: broadcast(block)
  header.nonce += 1
  if header.nonce overflows 2^32:
    coinbase.extraNonce += 1              // new merkle root, new search space
    header.merkleRoot = merkle(txs)`,
      },
    },
    race: {
      title: 'The race',
      alt: 'Three mining machines with spinning fans work at the same time. A counter spins above each one\'s candidate block while the slot at the end of the chain is still empty.',
      body: {
        beginner: `Every [[miner]] in the world is guessing at the same time, each on its own version of the next [[block]]. Fans spin, electricity burns, counters race.

A miner with more machines makes more guesses per second, so it wins more often. But it is still luck: a small miner can find the next block before a giant one.

Press **Mine** to join the race with your own device.`,
        intermediate: `The total guessing speed of all miners is the network's [[hashrate]]. Bitcoin's is around a thousand exahashes per second as of 2026; one exahash is 10^18 [[hash|hashes]].

A [[miner]] with share *p* of the hashrate finds, on average, a fraction *p* of all blocks. Because a lone small miner might wait years for a win, most join **pools** that combine their work and split the rewards in proportion to it.

Sometimes two miners find a block within seconds of each other and the chain briefly splits into a [[fork]]. Miners keep working on whichever block they saw first, and the tie is broken by whoever finds the next one.`,
        expert: `Mining is progress-free: each hash is an independent Bernoulli trial with success probability \`target / 2^256\`. A miner with [[hashrate]] share *p* wins a given block with probability *p* regardless of how long it has been searching, which is what makes reward proportional to work and removes any advantage from "being ahead".

Pools hand out *shares*: headers that meet a much easier target. Shares prove work statistically and let the pool divide rewards (PPS, FPPS, PPLNS schemes) without trusting members' claims. The pool operator, not the hasher, normally chooses the transactions, which concentrates block-template control.

When two valid blocks at the same height propagate concurrently, nodes keep the first one seen and store the other as a competing tip. The [[fork-choice]] rule is the chain with the most **cumulative work** (sum of \`2^256 / (target + 1)\` over its blocks), not the one with the most blocks. The losing block becomes *stale*, and its transactions return to the [[mempool]].`,
      },
    },
    odds: {
      title: 'Luck and your share',
      alt: 'Three mining machines stand side by side, each with a pile of the blocks it has won in front of it. The piles are about as tall as each miner\'s share of the hashrate, but not exactly.',
      body: {
        beginner: `Having more machines does not make you win. It makes you win **more often**. Every [[block]] is a new draw, and each [[miner]] holds as many tickets as it has guessing power.

Over a handful of blocks, luck decides: a small miner can win twice in a row, and a big one can go without. Over hundreds of blocks luck evens out, and each miner's pile of blocks grows to match its share of the machines.

**Try it:** set your share with the slider and press **Mine 100 blocks** a few times. Compare the blocks you won with the number you could expect.`,
        intermediate: `A [[miner]] with share *p* of the [[hashrate]] wins each [[block]] with probability *p*, independently of every block before it. Over *n* blocks it can expect *n × p* wins.

What it actually gets varies around that number. With 10% of the hashrate you expect 10 of the next 100 blocks, but 6 or 14 would be nothing unusual. Bitcoin produces about 144 blocks a day, so a miner with 0.1% of the hashrate finds one block a week on average, and about one time in twenty it waits three weeks or more. This uneven income is the reason pools exist.

**Try it:** move the slider and press **Mine 100 blocks** repeatedly. The more blocks have been mined, the closer the percentage you won gets to your share.`,
        expert: `The number of blocks a [[miner]] wins out of *n* is binomial: \`X ~ B(n, p)\`, with mean \`n·p\` and standard deviation \`√(n·p·(1 − p))\`. The relative spread, \`σ / (n·p) = √((1 − p) / (n·p))\`, shrinks only with the square root of the number of blocks, so a small miner's income stays noisy for a long time.

For *p* = 0.001 and one day's 144 blocks, the chance of finding no block at all is \`(1 − p)^144 ≈ 87%\`. A pool does not change the expected value; it reduces the variance by averaging over many members, for a fee.

The other two miners in the demo split the remaining [[hashrate]] 5 : 6. Each round draws one winner with probability equal to its share, which is exactly the model above; it leaves out stale blocks and the propagation advantage of large miners.

**Try it:** the panel shows the expected count ± one standard deviation. Run several batches and watch how often the result lands inside that band (about two times in three).`,
      },
    },
    broadcast: {
      title: 'The winner broadcasts',
      alt: 'The winning candidate block has turned green and joined the end of the chain. Copies of it fly to the other two miners, and a stack of coins appears on the winner\'s machine. When a second miner finds a block before the first one arrives, two blocks sit side by side at the end of the chain until the next block leaves one of them grey.',
      body: {
        beginner: `One [[miner]] finds a winning number. It immediately sends its [[block]] to everybody.

Checking it is easy: each computer takes the fingerprint once and sees the zeros. If the block follows the rules, they add it to their chain. The other miners throw away their unfinished attempts and start on the block after it.

The winner earns the [[block-reward]]: brand-new coins plus the fees paid by the transactions inside. That reward is why anyone pays the electricity bill.

**Try it:** a block needs a moment to reach everyone. Make that moment longer with the slider, then let Miner C find a block of its own 5 seconds after yours. If your block has not reached C yet, there are suddenly two blocks for one place, and one of them will be thrown away.`,
        intermediate: `The winner announces the block over the [[p2p]] network. Every [[node]] checks it independently: is the [[hash]] below the [[target]], is every [[transaction]] valid, is the reward amount correct? One wrong detail and the block is rejected, and the electricity spent on it is lost.

The [[block-reward]] has two parts: the **subsidy**, new coins created by the block, and the **fees** of its transactions. Bitcoin's subsidy started at 50 BTC and is cut in half every 210,000 blocks, roughly every four years. Since the [[halving]] of April 2024 it is 3.125 BTC.

That schedule is why there will never be more than 21 million bitcoin. As the subsidy shrinks, fees have to carry more of the security budget.

**Try it:** set the propagation delay, the time your block takes to reach the other miners, then press the button so that Miner C finds a block 5 seconds after you. If yours is still on its way, both blocks are valid and the chain has a [[fork]]; press again to find the next block and see which of the two is left behind as a *stale* block. The panel shows how likely a rival block is, for every block, at this delay.`,
        expert: `Propagation uses \`inv\`/\`headers\` announcements followed by block download; compact block relay (BIP 152) sends short transaction ids so peers rebuild the block from their own [[mempool]]. Fast propagation matters: every second of delay raises the stale rate and favours large, well-connected miners.

Validation is asymmetric by design: one \`SHA256d\` checks the work, then full script and UTXO validation checks the contents. The header's [[timestamp]] must be greater than the median of the previous 11 blocks and no more than two hours ahead of the checking node's own clock.

The coinbase output may claim at most \`subsidy + fees\`, where \`subsidy = 50 BTC >> (height / 210000)\`, computed in [[satoshi|satoshis]] with integer shifts. Total supply converges to just under 21 million BTC, and the subsidy reaches zero around the year 2140. Coinbase outputs cannot be spent for 100 blocks, so a [[reorg]] cannot leave descendants of an erased reward in circulation.

**Try it:** in the demo's model, if the rest of the [[hashrate]] hears of a block *D* seconds late, the chance that somebody finds a competing block in that window is \`1 − e^(−D/600)\`: about 0.3% at 2 s and 3.3% at 20 s. When the fork is resolved, the next block lands on your block with the combined share of the miners working on it (you and Miner A, 70%) and on Miner C's otherwise. A stale block earns nothing, so slow propagation costs the miner money and the network security: work spent on stale blocks protects nothing.`,
      },
    },
    retarget: {
      title: 'Difficulty adjusts itself',
      alt: 'A row of mining machines above a row of blocks. With more machines the blocks bunch together, with fewer they spread apart; after a retarget a difficulty column grows or shrinks and the spacing returns to normal.',
      body: {
        beginner: `What happens when thousands of new machines join? More guesses per second means winners appear faster, and blocks would start arriving every few minutes instead of at a steady pace.

So the puzzle retunes itself. If blocks came too fast, the required number of zeros goes up. If machines leave and blocks come too slowly, the puzzle gets easier.

Nobody decides this. Every computer calculates the same new [[difficulty]] from the chain's own history.

**Try it:** raise or lower the hashrate with the slider and watch the blocks bunch up or spread out. Then press **Mine the next 2016 blocks**: the difficulty column changes and the blocks return to their steady pace.`,
        intermediate: `Bitcoin aims for one [[block]] every 10 minutes. Every 2,016 blocks, which is two weeks at that pace, each [[node]] looks at how long those blocks actually took.

- Took one week instead of two? The [[hashrate]] doubled, so the [[difficulty]] doubles.
- Took four weeks? The difficulty halves.

A single adjustment is limited to a factor of 4 in either direction. The result: however much hardware joins or leaves, the pace returns to about 10 minutes, and coins are issued on a predictable schedule.

**Try it:** with the hashrate at ×2, look at the block time: 5 minutes. Mine the next 2,016 blocks and the [[difficulty]] doubles, which brings the block time back to 10 minutes. Now drop the hashrate to ×0.25 and see how long the next period takes before the difficulty can react.`,
        expert: `At every height divisible by 2016, the new [[target]] is

\`new_target = old_target × actual_timespan / 1,209,600 s\`

with \`actual_timespan\` clamped to \`[302,400 s, 4,838,400 s]\` (a quarter and four times two weeks) and the result capped at \`powLimit\`. Between retargets \`nBits\` must stay exactly the same.

Two well-known quirks. The timespan is measured from the first to the last block of the period, so it covers 2,015 intervals, not 2,016 (an off-by-one that biases blocks slightly slow). And because the inputs are miner-supplied [[timestamp|timestamps]], bounded only by median-time-past and the two-hour future limit, a majority miner can skew them: the basis of the *time-warp* attack.

Adjustment lags reality by up to one period. After a sudden [[hashrate]] drop, blocks stay slow until the 2,016th block is found; chains with little hashrate have suffered from this and adopted per-block algorithms instead.

**Try it:** the demo applies the rule as written, including the 2,015-interval timespan: at a constant [[hashrate]] the [[difficulty]] creeps up by a factor of 2016/2015 per period. Push the hashrate to ×4 from a difficulty of ×1 and the measured timespan falls just below 302,400 s, so the factor-4 limit applies. Then drop to ×0.25: the block time is 160 minutes, the period lasts about 224 days, and one retarget can only divide the difficulty by 4. Difficulty in the demo is relative to its starting value, so \`powLimit\` plays no part.`,
      },
      code: {
        lang: 'C++ (Bitcoin Core, simplified)',
        source: `// called once every 2016 blocks
unsigned int CalculateNextWorkRequired(const CBlockIndex* last, int64_t firstBlockTime) {
  const int64_t targetTimespan = 14 * 24 * 60 * 60;         // two weeks
  int64_t actual = last->GetBlockTime() - firstBlockTime;

  // limit the step to 4x in either direction
  if (actual < targetTimespan / 4) actual = targetTimespan / 4;
  if (actual > targetTimespan * 4) actual = targetTimespan * 4;

  arith_uint256 next;
  next.SetCompact(last->nBits);                             // old target
  next *= actual;
  next /= targetTimespan;
  if (next > powLimit) next = powLimit;                     // never easier than difficulty 1
  return next.GetCompact();                                 // new nBits
}`,
      },
    },
    attack: {
      title: 'What an attack costs',
      alt: 'Two chains split from a common block. The upper one, backed by three machines, is the public chain. The lower, secret chain is built by one red machine while coins drain away beside it; its length against the public chain shows whether the attacker is catching up or falling behind.',
      body: {
        beginner: `To rewrite an old page, a cheater would have to win the lottery again for that page **and** for every page after it, faster than the whole rest of the world keeps adding new ones.

With fewer machines than everyone else combined, the cheater falls further behind with every block. All the electricity they burned is wasted.

That is the real meaning of [[proof-of-work]]: the chain is protected by a bill nobody wants to pay. The deeper a payment is buried, the safer it is.

**Try it:** give the cheater more or fewer machines and decide how many blocks the shop waits before it hands over the goods. Press **Race once** several times: with a small share the secret chain almost never catches up, and every extra block of waiting makes it rarer still.`,
        intermediate: `An attacker's trick is the double spend: pay someone, then secretly build a longer chain in which that payment never happened, and release it. Nodes follow the chain with the most work, so the secret chain would replace the public one in a [[reorg]].

With less than half the [[hashrate]], the secret chain grows more slowly than the honest one and the chance of catching up shrinks rapidly with every [[confirmation]]. That is why merchants wait: 6 confirmations is the traditional rule of thumb on Bitcoin.

With more than half, the attacker eventually wins every race. This is a [[51-attack]]. It allows double spends and censorship, but not stealing coins from other people's addresses or creating coins from nothing, because every [[node]] still checks the rules.

**Try it:** set the attacker's share and the number of [[confirmation|confirmations]], and read the chance of success. At 10% and 6 confirmations it is about 0.02%; at 30% it is 13%; from 50% it is certain. **Race once** plays a single attempt. The panel also estimates the block rewards the attacker gives up while mining in secret, which are lost if the attempt fails.`,
        expert: `Model the race as a random walk. With attacker share *q* and honest share *p = 1 − q*, the probability of ever catching up from *z* blocks behind is \`(q/p)^z\` when *q < p*, and 1 otherwise. Nakamoto's paper combines this with a Poisson estimate of the attacker's progress while the merchant waits: at *q* = 10%, six [[confirmation|confirmations]] leave under 0.1% success. [[finality|Finality]] under [[proof-of-work]] is therefore only probabilistic.

A [[51-attack]] has two costs: acquiring a majority of [[hashrate]] (ASICs with no other use, or rented hashpower on small chains) and the forgone [[block-reward|block rewards]] if the attack destroys the coin's value. Small chains that share a hash algorithm with a larger one have been reorganized repeatedly with rented hashpower.

A majority is not needed to misbehave profitably. In **selfish mining** (Eyal and Sirer, 2013) a miner withholds blocks and releases them strategically to waste honest work. It earns more than its fair share above 1/3 of the hashrate, or above 1/4 if it wins half of the propagation races, so the honest-majority assumption is weaker than "50%".

**Try it:** the panel evaluates the paper's formula, \`P = 1 − Σ_{k=0..z} (λ^k e^(−λ) / k!) · (1 − (q/p)^(z−k))\` with \`λ = z·q/p\`. *λ* is also the number of blocks the attacker is expected to mine in secret while the honest chain adds *z*; at 3.125 BTC each, plus fees, that is the revenue thrown away by a failed attempt. A single simulated race draws the head start block by block and then lets the attacker catch up with probability \`(q/p)^deficit\`, so over many attempts the share of wins comes very close to the formula (whose Poisson head start is itself an approximation).`,
      },
    },
  },
};

export default content;

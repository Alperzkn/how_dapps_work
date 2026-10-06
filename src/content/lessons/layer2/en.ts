import type { LessonContent } from '../../../types';

// Time-dependent figures are approximate and dated "as of 2026".
// Dollar amounts in the controls use an illustrative 1 ETH = $2,000 and 100 bytes per transfer.

const content: LessonContent = {
  labels: {
    l1: 'Ethereum (L1)',
    l2: 'Rollup (L2)',
    dayShort: 'd',
    hourShort: 'h',
    dayWord: 'day',
    stepWord: 'step',
    reset: 'Reset',
    plusDay: '+1 day',
    plusHour: '+1 hour',
    window: 'Challenge window',

    // step 1
    blockFull: 'block full',
    blockUsed: 'block:',
    ofTarget: 'of the gas target',
    leftOut: 'do not fit',
    transferCosts: 'one transfer:',
    baseFee: 'Base fee',
    demand: 'Demand for block space',
    nextBlock: 'Produce next block',
    tenBlocks: '×10',
    blocksMade: 'Blocks',
    oneTransfer: 'One transfer',
    leftOutStat: 'Left out',
    nobody: 'nobody',

    // step 2
    txsOnL2: 'transactions on L2',
    batch: 'batch',
    onL1B: 'data + result,\nstored on Ethereum',
    onL1: 'batch data +\nstate root',
    sameOnL1: 'Same transfer on L1',
    eachPays: 'each user:',
    batchSize: 'Batch size',
    gasPrice: 'L1 gas price',
    batchOnL1: 'L1 cost of the batch',
    feePerUser: 'L1 fee per user',
    cheaper: 'Cheaper than L1',
    notCheaper: 'no',

    // step 3
    sequencer: 'sequencer',
    sequencerOff: 'sequencer offline',
    l2Chain: 'L2 blocks',
    l1Inbox: 'L1 inbox contract',
    seq_idle: 'ready to send',
    seq_stuck: 'no answer: stuck',
    seq_soft: 'soft-confirmed by the sequencer',
    seq_batched: 'batch posted to L1',
    seq_final: 'final on L1',
    seq_queued: 'waiting in the L1 inbox',
    seq_included: 'sequencer had to include it',
    seq_forced: 'forced in without the sequencer',
    waited: 'waited',
    dataOnL1: 'data is on L1',
    dataNotOnL1: 'not on L1 yet',
    seqOffline: 'Sequencer offline',
    sendViaSeq: 'Send via sequencer',
    sendViaL1: 'Force via L1',
    again: 'Start again',
    wait4h: 'Wait 4 hours',
    nextStep: 'Next step',
    txStatus: 'Transaction',
    dataWhere: 'Its data',
    inboxWait: 'Inbox wait',
    stOnline: 'online',
    stOffline: 'offline',

    // step 4
    rollupContract: 'rollup contract',
    opt_none: 'no proposal yet',
    opt_pending: 'state root proposed',
    opt_disputed: 'challenged',
    opt_rejected: 'bad root rejected',
    opt_defended: 'challenge failed: root stands',
    opt_finalized: 'final',
    opt_badFinal: 'bad root is final: funds at risk',
    trace: 'the execution behind the root',
    l1Ran: 'L1 ran step',
    wasWrong: 'proposer lied',
    wasRight: 'proposer was right',
    oneStepLeft: 'one step left:',
    inDispute: 'in dispute: steps',
    proposer: 'proposer + bond',
    challenger: 'challenger',
    proposeHonest: 'Submit a correct root',
    proposeBad: 'Submit a bad root',
    challenge: 'Challenge',
    bisect: 'Bisect',
    runStep: 'Run the step on L1',
    rootStatus: 'Root',
    disputed: 'Dispute',
    bisections: 'Bisections',

    // step 5
    zkBatch: 'batch',
    prover: 'prover',
    proofMade: 'proof generated',
    noProof: 'no valid proof exists',
    verifier: 'verifier contract',
    dataPosted: 'batch data',
    dataAltered: 'data altered',
    rootClaimed: 'new state root',
    rootWrong: 'wrong state root',
    rootAccepted: 'accepted',
    rootRejected: 'rejected',
    zkHonest: 'Honest batch',
    zkBadRoot: 'Wrong state root',
    zkBadData: 'Altered data',
    zkWhat: 'What the operator submits',
    proveVerify: 'Prove and verify',
    proofStat: 'Proof',
    l1Says: 'L1 verifier',
    verifyGas: 'Verify gas per tx ({n} txs)',

    // step 6
    calldataIn: 'calldata: in the block for good',
    commitmentIn: 'commitment stays in the block',
    targetMax: 'target 14 · max 21 (as of 2026)',
    blobPruned: 'blobs pruned after ≈ 18 days',
    full: 'full',
    canDownload: 'new node:\ndata available',
    cantDownload: 'new node: must get the\ndata from an archive',
    perTx: 'per user:',
    modeBlob: 'Blobs',
    modeCalldata: 'Calldata',
    postAs: 'Post the data as',
    blobPrice: 'Blob price',
    daysLater: 'Day',
    blobsUsed: 'Blobs · fill',
    blobPaid: 'Blob gas price',
    dataStatus: 'Data on L1',
    stPruned: 'pruned',
    stForever: 'kept for good',
    stAvailable: 'available',

    batchShort: 'Batch',
    blobShort: 'Blob',

    // step 7
    zkRollup: 'zk rollup',
    optRollup: 'optimistic rollup',
    arrived: 'claimable on L1',
    left: 'left:',
    you: 'you',
    bridgeContract: 'bridge contract:\nholds the real coins',
    upgradeKeys: 'upgrade keys:\nwho can change the rules?',
    startWithdraw: 'Start a withdrawal on both',
    restart: 'Start over',
    elapsed: 'Elapsed',
  },
  steps: {
    scarce: {
      title: 'Why Ethereum gets expensive when it is busy',
      alt: 'A strip of ground labelled Ethereum carries a chain of blocks. The next block is a glass case that fills up as demand rises, with a line at half height marking the target. A queue of parcels waits beside it; the ones that cannot fit are red. In front, a person stands next to a stack of coins that grows as the fee rises.',
      body: {
        beginner: `Every [[block]] on [[ethereum]] has a fixed amount of room. Thousands of computers around the world re-run every [[transaction]] in it, so the room is kept small on purpose: that is what lets ordinary people check the chain for themselves.

When more people want in than there is room, the price of a place goes up, like a toll road at rush hour. Nobody sets that price by hand. It rises automatically while blocks are more than half full and falls when they are emptier.

**Try it.** Raise the demand slider and press **Produce next block** a few times. Watch the glass block fill, the red parcels that are left outside, and the coin stack next to the person: that is what one simple payment costs right now. Then lower demand below 100% and watch the price come back down.

A [[layer-2]] exists to get around this: do the work somewhere roomier, and use the crowded chain only for what really needs it.`,
        intermediate: `Ethereum produces a [[block]] every 12 seconds, and each block has a [[gas]] limit. The limit exists because every [[full-node]] must download and re-execute every block, and must keep the growing state on disk. Raise the limit a lot and fewer people can run a node.

The price of block space is set by [[eip-1559]]. Each block has a gas **target** of half the limit. If a block uses more than the target, the base fee of the next block rises, by at most 12.5%; if it uses less, the fee falls, by at most 12.5%. Ten full blocks in a row, two minutes, roughly triple the fee.

A simple transfer uses 21,000 gas; a token swap several times more. So the [[gas-fee]] for the same action can differ by orders of magnitude between a quiet hour and a busy one.

**Try it.** Set demand above 200% and produce blocks: the block is full, part of the demand does not fit, and the base fee climbs 12.5% each time. At exactly 100% it holds still. In reality the rising fee itself pushes users away until blocks are half full again; here the demand stays where you put it so you can see the mechanism. Dollar figures use an illustrative price of $2,000 per ETH.`,
        expert: `The base fee update rule is \`base_fee' = base_fee · (1 + (gas_used − gas_target) / gas_target / 8)\`, with \`gas_target = gas_limit / 2\` (elasticity multiplier 2, change denominator 8). It is an exponential controller: sustained excess demand compounds at 12.5% per block until marginal users are priced out. The priority fee on top is a separate auction for ordering.

What bounds the limit is not one resource but several: block propagation inside a 12-second [[slot]], worst-case execution time on modest hardware, state growth, and history growth. Each of them is paid by every [[full-node]], which is why the limit is raised only in small, tested steps.

So L1 execution is a deliberately scarce good. The scaling strategy Ethereum chose is to keep the base layer verifiable and sell it as two things other systems can build on: **settlement** (a contract on L1 that decides which off-chain state is canonical) and **[[data-availability]]** (a guarantee that the data needed to check that state was published). A [[rollup]] buys both; the rest of this lesson is about what exactly it buys and what it still has to be trusted for.

**Try it.** The panel applies the real update rule to whatever fill level your demand produces. Demand above 200% of target cannot raise the fee faster than a full block does; it only lengthens the queue.`,
      },
    },
    rollup: {
      title: 'The rollup idea: compute elsewhere, publish here',
      alt: 'Two strips of ground: Ethereum behind and the rollup in front. On the rollup a grid of parcels is squeezed into one crate, and an arrow carries it up to a block on Ethereum that holds a small data box and a state root on top. To the right two columns compare the cost of one transfer on Ethereum with one user’s share of the batch.',
      body: {
        beginner: `A [[rollup]] is a separate, faster chain that keeps its receipts on Ethereum.

Think of a group dinner. Instead of each person paying the waiter separately, one person collects everybody's order, pays one bill, and the table splits it. The restaurant handles one payment instead of twenty.

A rollup does the same with transactions. It runs hundreds of them on its own chain, the [[layer-2]], squeezes them into one bundle called a batch, and writes that bundle to Ethereum together with a short fingerprint of the result. Ethereum does not redo the work. It only stores the bundle, so that anyone can check it later.

**Try it.** Move the **Batch size** slider. The cost of writing to Ethereum is nearly the same whether the batch holds one transaction or a thousand, so each user's share shrinks as the batch grows. Compare the green column with the blue one: the same payment sent directly on Ethereum.`,
        intermediate: `A [[rollup]] moves **execution** off [[layer-1]] and leaves two things on it:

- the **transaction data** of every batch, compressed, so anyone can recompute the rollup's state without asking the operator;
- a **commitment** to the resulting state, a state root (the same kind of [[merkle-root]] an Ethereum block header carries), so a contract on L1 knows what the rollup claims.

Because the data is on Ethereum, the rollup's history is as hard to rewrite as Ethereum's. Because the commitment is on Ethereum, a contract there can hold deposits and release them only against a state the rollup can justify. How it is justified is the difference between the two families in the next steps: [[optimistic-rollup|optimistic rollups]] and [[zk-rollup|zk rollups]]. Well-known examples, as of 2026, are OP Mainnet, Base and Arbitrum One on the optimistic side and ZKsync Era, Starknet, Scroll and Linea on the zk side.

A user's fee has two parts: a small fee for execution on the rollup, and a share of what the batch costs on L1. The L1 part has a fixed piece (the batch transaction itself, and any proof) that is split across everyone in the batch.

**Try it.** Raise **Batch size** from 1 to 1,000 and read **L1 fee per user**. With one transaction a rollup is more expensive than L1; with a thousand it is hundreds of times cheaper. Then raise the **L1 gas price**: both columns grow, but the user's share stays tiny. The figures assume about 100 bytes per transfer and $2,000 per ETH, both illustrative.`,
        expert: `The defining property: the L2 state is a deterministic function of data on L1. A rollup node runs \`derive(L1 chain) → L2 chain\`: it reads batches (and L1-originated deposits) in L1 order, decompresses them, and executes them with the rollup's state transition function. No message from the operator is needed to reconstruct or verify the state. If the transaction data is published anywhere else, the system is a validium or optimium, not a rollup, and has a different trust model.

What is committed on L1 is a **state root** or a wrapper around it. In the OP Stack the proposed value is an **output root**, \`keccak256(version ‖ state_root ‖ withdrawal_storage_root ‖ latest_block_hash)\`: the state root for proofs about accounts, the storage root of the L2-to-L1 message contract so withdrawals can be proven cheaply, and the block hash to pin the block. zk rollups commit a state root per proven batch together with a commitment to the batch data that the proof takes as public input.

Cost model per batch: \`21,000\` gas for the batch transaction, data priced either as [[calldata]] (execution gas) or as [[blob|blobs]] (blob gas, a separate market, step 6), plus verification gas for zk proofs or, for optimistic systems, the amortised cost of proposals. Per user: \`(fixed + data) / N\` plus the L2 execution fee, which the [[sequencer]] sets and keeps.

**Try it.** The panel prices a batch of \`N\` transfers at 100 bytes each. Blobs are bought whole (131,072 bytes), so the per-user fee falls as \`1 / N\` until the blob is full at about 1,310 transfers and a second one is needed: step from 1,000 to 2,000 and the batch cost jumps.`,
      },
    },
    sequencer: {
      title: 'The sequencer, and the way around it',
      alt: 'On the rollup strip a user stands on the left, a machine labelled sequencer in the middle and a short chain of L2 blocks on the right. On the Ethereum strip there is an inbox contract and a block. Solid arrows show the normal route through the sequencer; a second pair of arrows runs from the user through the inbox contract on Ethereum and back into the L2 chain. A parcel sits wherever the transaction currently is.',
      body: {
        beginner: `Somebody has to collect the transactions on a [[rollup]], put them in order and send the bundles to Ethereum. That somebody is the [[sequencer]].

It works like a very fast cashier. You hand over your transaction and get an answer within a second or two: "done". That answer is a promise. It becomes a fact once the bundle containing your transaction has been written to Ethereum.

Today most rollups have one cashier, run by one company. What if it breaks down, or refuses to serve you? There is a back door: you can hand your transaction directly to a contract on Ethereum. The rollup's rules say that everything in that inbox **must** be included, with or without the cashier.

**Try it.** Send a transaction and step through the normal route. Then tick **Sequencer offline** and send again: nothing happens. Now press **Force via L1** and wait: after the deadline the transaction is part of the rollup anyway.`,
        intermediate: `The [[sequencer]] receives transactions, orders them, executes them and produces L2 blocks, typically every second or two or even faster. It gives you a **soft confirmation** immediately. Every few minutes its batches are posted to Ethereum; from then on the order is fixed by L1, and once that L1 block is [[finality|final]] (about 13 minutes) so is your transaction.

As of 2026, most large rollups run a **single sequencer** operated by the team or foundation behind the rollup. That concentrates three powers: it can go offline, it can delay or ignore your transaction, and it chooses the order of transactions. What it cannot do, if the proof system works, is forge a transaction, steal funds or rewrite what is already on L1.

The defence against the first two is **forced inclusion**. You send your transaction to a contract on L1. On OP Stack chains it must then be included within a 12-hour window; on Arbitrum One anyone can force it in after 24 hours. It costs L1 gas and it is slow, but it means the sequencer is a convenience, not a gatekeeper.

**Try it.** With the sequencer online, send and step: soft-confirmed, posted to L1, final. Note the **Its data** figure: a soft confirmation is not on L1. Then tick **Sequencer offline**, send (stuck), press **Force via L1** and **Wait 4 hours** three times. Untick the box mid-wait to see a sequencer that returns include the transaction early, as it must.`,
        expert: `In the OP Stack the batcher compresses L2 blocks into channels, cuts them into frames and posts them as [[calldata]] or [[blob|blobs]] to a batch inbox address; no contract logic runs. The derivation pipeline in every rollup node reads those frames and the \`TransactionDeposited\` events of \`OptimismPortal\` in L1 order. Each L2 block belongs to an L1 origin (its epoch) and must include that origin's deposits; a batch for an epoch is only valid if it lands within the **sequencing window** (3,600 L1 blocks, 12 hours). If none does, nodes derive blocks containing only the deposits. That rule is forced inclusion: no party can prevent it. Heads are tracked as *unsafe* (from sequencer gossip), *safe* (derived from L1 data) and *finalized* (derived from finalized L1).

Arbitrum splits the same idea differently: the sequencer posts to \`SequencerInbox\`; anyone can enqueue a message in the delayed \`Inbox\`, and after the delay (24 hours on Arbitrum One) anyone can call \`forceInclusion\`. Both designs give censorship resistance with a delay, not liveness of the fast path: applications that depend on timely transactions (liquidations, oracle updates) are exposed during an outage.

Ordering power is the remaining issue, and replacing the single sequencer is open design space. **Shared sequencing** has several rollups use one external sequencer set, which gives cross-rollup atomic ordering at the cost of a new trusted component. **Based sequencing** gives ordering to L1 block proposers themselves (Taiko is an example), inheriting L1 liveness and neutrality but also its 12-second cadence unless preconfirmations are added. Rotating or staked sequencer sets with their own consensus are a third route.

**Try it.** The state machine in the panel: \`send\` needs the sequencer; \`force\` writes to L1 and starts a 12-hour clock; when it expires, the transaction is derived into the chain regardless.`,
      },
    },
    optimistic: {
      title: 'Optimistic rollups: accepted unless someone proves fraud',
      alt: 'On the Ethereum strip a contract stands next to a block representing the proposed state root, followed by seven slabs that light up one per day of the challenge window. On the rollup strip sixteen small boxes in a row represent the steps of the execution; during a dispute the range in question is orange and shrinks by half each round. A proposer with a stack of coins stands at one end and a challenger at the other.',
      body: {
        beginner: `How does Ethereum know the rollup's fingerprint of the result is honest? An [[optimistic-rollup]] takes the trusting approach, with a catch.

Whoever submits a result also puts down a deposit. Then a clock starts, usually about a week. During that time anyone may say: "that result is wrong, and I can show it." If they are right, the result is thrown out and the liar loses the deposit. If nobody objects before the clock runs out, the result counts.

It is like a notice pinned to a town hall board: it takes effect in seven days unless someone files an objection. One honest person watching is enough.

**Try it.** Press **Submit a bad root**, then **Challenge**, and keep pressing: the two sides narrow the argument down by halves until a single step is left, and Ethereum checks just that one. The bad result is rejected. Then submit another bad root and press **+1 day** seven times without challenging: nobody watched, so the wrong result becomes final.`,
        intermediate: `In an [[optimistic-rollup]], a proposer posts a state root to a contract on L1 and stakes a bond. The root is **assumed valid** and enters a challenge window: 7 days on OP Stack chains, about 6.4 days on Arbitrum One (as of 2026).

During the window anyone who has re-executed the batch and got a different result can open a dispute. The dispute is settled by a [[fraud-proof]], and it is cheap for L1 because of **bisection**: the two parties repeatedly split the disputed execution in half and say where they still disagree. After a logarithmic number of rounds a single step remains. L1 executes that one step itself and sees who was wrong. The loser's bond goes to the winner.

The security assumption is unusual and strong: **one honest, online verifier is enough**. It does not matter how many validators collude; a single party running the software and willing to challenge keeps the system honest. The price is time: nothing that depends on the root, above all withdrawals to L1, can complete until the window has closed.

Both large optimistic stacks have fraud proofs that anyone may use on mainnet (OP Stack chains since 2024, Arbitrum One with its BoLD protocol since 2025).

**Try it.** Submit a bad root and challenge it: 16 steps need 4 bisections and one step run on L1. Submit a correct root and challenge that: the challenger loses instead. Then let a bad root sit for 7 days unchallenged and read the status.`,
        expert: `A [[fraud-proof]] game needs a deterministic VM that both parties and L1 agree on. The claim "this output root follows from that one" is expanded into an execution trace of that VM; the parties commit to trace states and bisect, \`⌈log₂ n⌉\` rounds for \`n\` steps, to an agreed pre-state and a disputed post-state one instruction apart. L1 then runs that instruction on a Merkle-proven fragment of memory and state.

In the OP Stack the fault dispute game first bisects over L2 block numbers between two output roots, then over the trace of a MIPS-based VM (Cannon) running the derivation and execution program; the single step is executed by a MIPS interpreter contract on L1, with data supplied through a preimage oracle. Moves carry bonds, and each side has a chess clock of 3.5 days, which bounds a game at about 7 days. Arbitrum compiles its node to a WebAssembly-derived instruction set (WAVM) and proves one step in its \`OneStepProver\` contracts; its BoLD protocol runs all rival assertions in one tournament, so a well-funded attacker can no longer delay confirmation indefinitely by opening disputes one after another, which the earlier one-against-one design allowed.

Edge cases that matter: the proof is only as good as the VM and the L1 implementation of its single step (a bug there is a consensus bug); data must be available for anyone to build the trace (step 6); challengers need capital for bonds and L1 gas, and must be able to get transactions included on L1 within the window, so censorship of L1 for a week breaks the model; and most deployments keep a Security Council able to intervene, which is exactly what the stages in the last step measure.

**Try it.** The panel hashes a 16-step trace with SHA-256 and gives the dishonest side a trace that diverges at one step and continues consistently from the wrong state, as a real cheater's would. Bisection compares the two traces' states at the midpoint.`,
      },
      code: {
        lang: 'Python (bisection, simplified)',
        source: `def dispute(proposer, challenger, n_steps, run_one_step):
    lo, hi = 0, n_steps          # agree on state[lo], disagree on state[hi]
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if proposer.state(mid) == challenger.state(mid):
            lo = mid             # the disagreement is in the upper half
        else:
            hi = mid             # ...or in the lower half
    # One instruction left. L1 executes it itself.
    correct = run_one_step(proposer.state(lo), step=hi)
    return "proposer" if correct == proposer.state(hi) else "challenger"

# 2**40 steps need only 40 rounds, and L1 never executes more than one.`,
      },
    },
    zk: {
      title: 'ZK rollups: prove it before it counts',
      alt: 'On the rollup strip a small group of parcels feeds a machine labelled prover. A small glowing ball, the proof, travels up to a verifier contract on the Ethereum strip, which stands between a box of posted batch data and a block representing the new state root. The block turns green when the proof is accepted and tips over in red when it is rejected.',
      body: {
        beginner: `A [[zk-rollup]] does not ask anyone to watch. It sends Ethereum a **proof**.

Imagine handing in a huge sum together with a stamp that can only be produced if the sum is right. The teacher does not redo the sum; checking the stamp takes a moment, however long the sum was. If the sum were wrong, the stamp simply could not be made.

That stamp is a [[validity-proof]]. The rollup runs the transactions, a powerful computer produces the proof, and a small program on Ethereum checks it. Only then does Ethereum accept the new result. There is no week of waiting, because there is nothing left to object to.

**Try it.** Press **Prove and verify** with an honest batch: accepted. Then choose **Wrong state root** (the operator tries to pay itself) and run again: no valid proof can be produced, and Ethereum rejects the attempt. Choose **Altered data**: the proof is real, but it does not match the data that was published, so it fails as well.`,
        intermediate: `A [[zk-rollup]] posts three things to L1 for each batch: the batch data, the new state root, and a [[validity-proof]]: a short cryptographic proof of the statement "executing this data on the old state gives the new state". A verifier [[smart-contract]] checks the proof, and only if it passes does the rollup's contract update its state root.

Two properties make this work. The proof is **succinct**: it is small and cheap to verify (on the order of a few hundred thousand gas; ethereum.org cites about 500,000) no matter how many transactions it covers. And it is **sound**: without breaking the cryptography, nobody can produce a proof for a false statement.

So the trust assumption changes. An optimistic rollup needs one honest watcher and a week; a zk rollup needs the mathematics and the verifier code to be right, and is final on L1 as soon as the proof is verified. Withdrawals do not wait for a challenge window.

The cost moves to the prover. Generating a proof takes far more computation than running the transactions, typically on clusters of machines with GPUs, and adds a delay of minutes to hours between a batch and its proof (as of 2026; it keeps falling).

**Try it.** Run all three cases and read the two status figures separately: whether a proof *could be made*, and what the L1 verifier *says*. The last figure divides the fixed verification gas by your batch size from step 2. The demo uses a hash as a stand-in for the proof, because a real prover is far too heavy to run in a browser; the rule it enforces is the real one.`,
        expert: `The statement proven is \`STF(pre_state_root, batch) = post_state_root\`, with the roots and a commitment to the batch data as public inputs. Binding the proof to the *published* data matters: when data goes in [[blob|blobs]], the circuit commits to the batch, and the contract ties that to the blob's versioned hash, typically by a KZG opening checked with the point-evaluation precompile.

Two proof families, at a high level:

- **SNARKs** (Groth16, PLONK-family with KZG commitments): proofs of a few hundred bytes, verification by a handful of pairings, cheap on L1. Most need a trusted setup (per circuit or universal) and rely on elliptic-curve assumptions that are not post-quantum.
- **STARKs** (FRI-based): transparent, hash-based and plausibly post-quantum, with fast provers over small fields; but proofs are tens to hundreds of kilobytes and costlier to verify on L1.

Production systems mix them: prove execution with a STARK-style system, aggregate recursively, and wrap the result in a SNARK for cheap L1 verification; or verify STARKs directly, as Starknet does. Designs also differ in what they prove: a circuit for the [[evm]] itself (a zkEVM, at varying degrees of equivalence), a different VM with a compiler, or a general-purpose zkVM running a normal client.

Costs: prover work is orders of magnitude above native execution, parallelisable but expensive; latency from batch to verified proof ranges from minutes to hours as of 2026. Operators therefore aggregate many batches under one proof and amortise the fixed L1 verification cost. Soundness bugs are the catastrophic failure mode, with no challenge window to catch them, which is why some teams run several independent provers and why upgrade keys remain (last step). Prover liveness is a separate concern: if no proof arrives, the chain cannot finalize, which escape hatches address.

**Try it.** The demo's "proof" is \`SHA-256\` over the public inputs, issued only if re-execution matches the claimed root; \`verify\` recomputes it. That imitates soundness and binding to public inputs, not succinctness or zero knowledge.`,
      },
    },
    blobs: {
      title: 'Data availability and blobs',
      alt: 'On the Ethereum strip a block stands next to a row of twenty-one slots; a line after the fourteenth marks the target. Blob boxes fill the first slots, as many as the batch needs. In calldata mode the slots are empty and the data sits as a glowing box on top of the block instead. After more than eighteen days the blobs turn faint while a small commitment tag stays on the block. On the rollup strip a grid of parcels is the batch, and a person represents a new node trying to download the data.',
      body: {
        beginner: `Checking the rollup's work needs the raw transactions, not just the result. If the operator kept them secret, nobody could tell whether the result was honest, and nobody could prove what they own. Making sure the data is published where everyone can get it is called [[data-availability]].

Rollups publish it on Ethereum. At first they wrote it into ordinary transactions, which is expensive because Ethereum keeps that data forever. Since 2024 there is a cheaper kind of space made for exactly this purpose: the [[blob]].

A blob is like a parcel locker next to the block. The parcel stays for about 18 days, long enough for anyone to collect and check it, and is then cleared out. A short fingerprint of it stays in the block permanently.

**Try it.** Switch between **Blobs** and **Calldata** and compare the fee per user. Move the **Day** slider past 18: the blobs fade, the fingerprint stays. Raise the **Blob** price slider to see that blob space has its own price, separate from ordinary gas.`,
        intermediate: `[[data-availability]] is the guarantee that the data behind a state root was actually published. Without it an [[optimistic-rollup]] cannot be challenged (nobody can recompute the state) and users of any rollup cannot prove their balances to exit. That is why a [[rollup]] puts its data on L1.

Until March 2024 that meant [[calldata]]: bytes inside a normal transaction, paid for in ordinary [[gas]] and stored by every node forever. EIP-4844 added [[blob|blobs]]:

- a blob is 4,096 field elements of 32 bytes, about 128 kB;
- blobs travel alongside the block; the [[evm]] cannot read them, only a hash of a commitment to each one;
- nodes must keep them for about 18 days, then may delete them;
- they are priced in **blob gas**, a separate fee market with its own base fee, which rises when blocks carry more blobs than the target and falls when they carry fewer.

The target and maximum per block started at 3 and 6, became 6 and 9 in 2025, and are 14 and 21 since January 2026 (as of 2026; the values can now be raised by small dedicated forks).

Why is deleting acceptable? The data only needs to be public long enough for anyone to download it, check it and raise a challenge. After that, rollup nodes and archives hold it, and the commitment on L1 lets anyone verify a copy.

**Try it.** In **Blobs** mode, set **Batch** to 1,000: the transfers fill one blob to 76%; 2,000 need two. Slide the **Blob** price over its whole range (1 wei to 100 gwei): when blobs are in low demand the data is almost free, and at the top end a small batch in a mostly empty blob costs more than calldata would. Since late 2025 the blob price also stops falling once it is below one sixteenth of the ordinary base fee, which you can see in **Blob gas price**.`,
        expert: `A blob is a polynomial of degree < 4096 over the BLS12-381 scalar field, committed with KZG. The transaction (type \`0x03\`) carries \`blob_versioned_hashes\`, each \`0x01 ‖ sha256(commitment)[1:]\`; the blobs, commitments and proofs travel in a sidecar on the consensus layer. Contracts get the hash through the \`BLOBHASH\` opcode and can check an evaluation \`p(z) = y\` against it with the point-evaluation precompile at \`0x0A\` (50,000 gas). That is how a zk rollup proves its circuit consumed this blob's contents, and how an optimistic rollup's fault proof loads blob data through its preimage oracle.

Pricing: each blob consumes \`GAS_PER_BLOB = 2¹⁷\` blob gas. The header tracks \`excess_blob_gas\`, the running sum of usage above target, and \`base_fee_per_blob_gas = MIN · e^(excess_blob_gas / UPDATE_FRACTION)\`, an exponential controller like [[eip-1559]] with a floor of 1 wei. The target, maximum and update fraction are per-fork parameters. EIP-7918 (Fusaka, late 2025) adds a reserve price: while \`BLOB_BASE_COST · base_fee_per_gas > GAS_PER_BLOB · base_fee_per_blob_gas\` (\`BLOB_BASE_COST = 2¹³\`), the excess no longer decreases, so the blob fee tracks at least 1/16 of the execution base fee. Calldata, meanwhile, has become dearer for data-heavy transactions: EIP-7623 (2025) sets a floor of 10 gas per calldata token, i.e. 40 gas per non-zero byte where the standard rate is 16.

Retention is \`MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS = 4096\` epochs: 4096 × 32 × 12 s ≈ 18.2 days. Capacity is limited by what nodes can download; since Fusaka, PeerDAS (EIP-7594) lets nodes hold and sample a fraction of an erasure-coded extension of the blobs instead of all of them, which is what made the higher blob counts possible.

Rollups that post data elsewhere (a committee, or a separate data availability network) are validiums or optimiums: cheaper, but if that layer withholds data, funds can be frozen even though no invalid state can be finalized by a zk system.

**Try it.** The panel charges \`blobs × 2¹⁷ × max(blob price, gas price / 16)\` plus 21,000 gas, or \`21,000 + 40 × bytes\` gas in calldata mode.`,
      },
      code: {
        lang: 'Python (blob base fee, from EIP-4844)',
        source: `GAS_PER_BLOB = 2**17                # 131,072 blob gas per blob
MIN_BASE_FEE_PER_BLOB_GAS = 1       # wei

def fake_exponential(factor, numerator, denominator):
    # integer approximation of factor * e**(numerator / denominator)
    i, output = 1, 0
    acc = factor * denominator
    while acc > 0:
        output += acc
        acc = (acc * numerator) // (denominator * i)
        i += 1
    return output // denominator

def blob_base_fee(excess_blob_gas, update_fraction):
    return fake_exponential(MIN_BASE_FEE_PER_BLOB_GAS,
                            excess_blob_gas, update_fraction)

# excess_blob_gas grows by (blob gas used - target) every block and
# never goes below zero, so a run of blocks above target raises the
# fee exponentially and a run below target lowers it again.`,
      },
    },
    bridge: {
      title: 'Bridges, withdrawals and what you are trusting',
      alt: 'A user stands on the rollup strip in front of two parallel tracks leading toward a bridge contract on the Ethereum strip, which holds a stack of coins. One track is the zk rollup, with three marks; the other is the optimistic rollup, with seven. A coin travels along each as time passes; the zk coin arrives after a few hours and the optimistic one after seven days. On the Ethereum strip a small box with a key block on top stands for the upgrade keys.',
      body: {
        beginner: `To use a rollup you move coins onto it through a [[bridge]]. The real coins are locked in a contract on Ethereum, and the same amount appears for you on the rollup. Going in takes a few minutes.

Coming back out is the real test. The rollup tells Ethereum "this person is owed 10 coins", and Ethereum releases them only when it is sure that claim is right. With a zk rollup that means waiting for the proof, usually a few hours. With an optimistic rollup it means waiting out the whole objection period: about seven days.

**Try it.** Press **Start a withdrawal on both**, then **+1 hour** a few times and **+1 day** a few times, and watch which coin reaches Ethereum first.

A rollup borrows most of its safety from Ethereum, but not all of it. Worth asking of any rollup: Is the data published on Ethereum? Do the proofs really work, and can anyone use them? Who holds the keys that can change the rules, and how much warning would I get? Can I get out if the operator disappears?`,
        intermediate: `A rollup's canonical [[bridge]] is a contract on L1 that holds deposits. A **deposit** is an L1 transaction: the contract locks your tokens and the rollup credits you after a short delay. A **withdrawal** runs the other way and is slower by design:

- you start it with a transaction on L2;
- you wait until a state root that includes it is accepted on L1: when the [[validity-proof]] is verified on a [[zk-rollup]] (typically hours, as of 2026), or when the challenge window closes on an [[optimistic-rollup]] (about 7 days);
- you prove to the L1 contract that your withdrawal is in that state, and it pays out.

Fast-withdrawal services shorten the wait by paying you on L1 from their own funds and collecting your withdrawal later, for a fee. That is a trade with a third party, not a property of the rollup.

Where does the security come from, and where does it stop? Data and settlement come from L1. What remains is specific to each rollup: whether its proof system is live and open to anyone; who can **upgrade the contracts** and with how much notice (an instant upgrade can change any rule, including who owns the bridge); whether users can force transactions and exit without the operator.

The L2BEAT **stages** summarise this: Stage 0 (the operator and its keys are fully trusted in practice), Stage 1 (a working proof system; a Security Council can override it only with a high threshold; users get at least 7 days to exit before most upgrades) and Stage 2 (proofs open to all, at least 30 days' notice, council limited to provable bugs). As of 2026 the largest rollups are at Stage 1 and very few projects have reached Stage 2.

**Try it.** Start the withdrawals and advance time. The zk track uses an illustrative 3 hours.`,
        expert: `Withdrawals are L2-to-L1 messages. In the OP Stack a withdrawal writes to the \`L2ToL1MessagePasser\` contract's storage; the user later proves that storage slot against the \`withdrawal_storage_root\` inside an output root (via the account's storage proof), waits for the dispute game for that root to resolve and for a further safety delay, then finalizes on \`OptimismPortal\`. Arbitrum accumulates outgoing messages in a Merkle tree (\`ArbSys.sendTxToL1\`), whose root is confirmed with the assertion and then executed through the \`Outbox\`. In zk rollups the message root is part of the proven state, so it is usable once the batch is verified and executed on L1; some systems add an execution delay as a guard against soundness bugs.

What you rely on, layer by layer:

- **[[data-availability]]**: batch data on L1 (calldata or blobs). Otherwise: a committee or external network.
- **State validity**: a [[fraud-proof]] system with at least one honest, funded, uncensored challenger, or a sound [[validity-proof]] system. A proof system that only allow-listed parties can use, or that a small multisig can overrule at will, is weaker than its design suggests.
- **Upgradeability**: proxy admin keys and their delay. With an instant upgrade, the key holders are the real security model. An *exit window* (upgrade delay minus the time needed to withdraw, including forced-inclusion delay) is what lets users leave before a change they reject takes effect.
- **Sequencer liveness and censorship**: forced inclusion (step 3). For exits when the operator is gone entirely, an **escape hatch**: users, or anyone, can post state roots or prove balances directly on L1; some systems freeze and allow withdrawals against the last proven state.
- **Proposer liveness**: if only an allow-listed proposer may submit roots and it stops, withdrawals stall; permissionless proposing or a fallback removes that.

L2BEAT's stages encode thresholds over these: Stage 1 requires that, bugs aside, blocking or altering withdrawals needs at least 75% of a Security Council, and gives users at least 7 days to exit ahead of upgrades by anyone else; Stage 2 requires permissionless proofs, at least 30 days, and a council that can act only on bugs provable on-chain.

Third-party bridges between chains are a different object: each has its own validator set, light client or liquidity network, and its failure does not involve the rollup's proof system at all.

**Try it.** The two tracks use 7 days and an illustrative 3 hours. Neither includes the L1 transactions you would still send to prove and claim.`,
      },
    },
  },
};

export default content;

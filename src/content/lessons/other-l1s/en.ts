import type { LessonContent } from '../../../types';

// Every performance figure in this lesson is approximate and dated "as of 2026".

const content: LessonContent = {
  labels: {
    security: 'Security',
    securityI: 'cost to attack',
    securityE: 'fault threshold · attack cost',
    decentral: 'Decentralization',
    decentralI: 'who can run a node',
    decentralE: 'node cost · node count',
    scalable: 'Scalability',
    scalableI: 'transactions per second',
    scalableE: 'TPS ≈ size / interval',
    weakSec: 'cheaper to attack',
    weakDec: 'fewer, bigger nodes',
    weakSca: 'slower',
    design: 'a design',
    poh: 'PoH clock',
    slot: 'slot ≈ 400 ms',
    leader: 'leader',
    parallel: 'different accounts:\nat the same time',
    parallelE: 'disjoint write sets\n→ parallel',
    serial: 'same account:\none after another',
    serialE: 'write lock on same\naccount → serial',
    accepted: 'accepted',
    sampleB: 'ask a few random nodes,\nfollow the majority, repeat',
    sampleI: 'sample k nodes per round\n(real networks: k = 20)',
    sampleE: 'query k peers · flip if ≥ α agree\ndecide after β rounds in a row',
    primary: 'Primary Network',
    subnet: 'own chain',
    subnetOwn: 'L1 (subnet):\nown validators',
    propose: 'propose',
    prevote: 'prevote',
    precommit: 'precommit',
    commit: 'commit · final',
    chainA: 'exchange chain',
    chainB: 'token chain',
    chainC: 'contract chain',
    lightClient: 'light client of A',
    relayer: 'relayer',
    solB: 'one very fast chain\nneeds powerful machines',
    solI: 'blocks ≈ 0.4 s\nfinal ≈ 13 s',
    solE: 'PoH + Tower BFT\nSealevel: parallel',
    avaB: 'agreement by quick polls\nmany custom chains',
    avaI: 'blocks ≈ 1–2 s\nfinal ≈ 1–2 s',
    avaE: 'Snowman (Snow family)\nEVM on the C-Chain',
    cosB: 'one chain per app\nlinked by IBC',
    cosI: 'blocks ≈ 1–6 s\nfinal in one block',
    cosE: 'CometBFT · ABCI app\nIBC light clients',
    approx: 'approximate figures, as of 2026',
  },
  steps: {
    trilemma: {
      title: 'Pick two? The scalability trilemma',
      alt: 'A triangle on the ground with a tower at one corner for security, a group of small computers at another for decentralization, and lanes of moving parcels at the third for scalability. A glowing marker moves around inside; whichever corner it moves away from shrinks.',
      body: {
        beginner: `Bitcoin and Ethereum are slow on purpose. They keep blocks small and unhurried so that ordinary people can run the software and check everything themselves.

Newer chains want to be faster and cheaper. But there is a catch, known as the [[scalability-trilemma]]. A blockchain wants three things:

- **Security**: attacking it should be extremely expensive.
- **Decentralization**: many independent people run it, not a handful of companies.
- **Scalability**: it handles lots of transactions quickly and cheaply.

Getting all three at once is very hard. Push hard on two and the third tends to give way. Watch the marker in the scene: every design is a point somewhere in that triangle.`,
        intermediate: `A [[layer-1]] is a base chain that orders and settles its own transactions with its own [[consensus]]. Its raw capacity is measured in [[tps]], transactions per second. Bitcoin manages roughly 7 and Ethereum's base chain a few tens (approximate, as of 2026). A card network handles thousands.

Why not just make blocks bigger or faster?

- Bigger, faster blocks need more bandwidth, storage and computing power. Fewer people can afford to run a [[full-node]], so **decentralization** drops.
- A smaller group of [[validator|validators]] agrees faster, but is easier to bribe, pressure or knock offline, so **security** drops.
- Keeping thousands of cheap nodes and a high attack cost limits how much data each block can carry, so **scalability** drops.

The [[scalability-trilemma]] is a rule of thumb, not a law of nature. Each chain in this lesson answers it differently, and it helps to ask of each one: who can run a node, how many must agree, and what does it cost?`,
        expert: `Throughput is bounded by \`block capacity / block interval\`. Raising capacity or lowering the interval increases propagation and execution time relative to the interval. In longest-chain protocols that raises the stale-block rate and lowers the effective honest majority; in [[bft]] protocols it forces timeouts up or hardware requirements up.

Separate resources bind separately:

- **Bandwidth and propagation**: a block must reach most validators well inside one interval.
- **Execution**: single-threaded state access is the limit for sequential VMs; [[parallel-execution]] moves the limit to memory and disk I/O.
- **State growth**: more transactions per second means faster growth of the state every full node must hold, which eventually dominates sync time and hardware cost.
- **Consensus messages**: classical BFT needs every validator to hear from more than two thirds of the others, O(n²) messages unless signatures are aggregated, which caps practical validator counts.

The designs below choose differently: raise hardware requirements and parallelise (Solana), replace all-to-all voting with random sampling ([[avalanche]]), or split applications across many small-committee chains joined by a messaging protocol ([[cosmos]]). Ethereum's own answer is to keep the base layer modest and move execution to rollups that post data to it. The [[scalability-trilemma]] is a heuristic, coined by Vitalik Buterin, not a theorem; techniques such as data availability sampling and validity proofs aim to loosen it.`,
      },
    },
    solana: {
      title: 'Solana: one very fast lane',
      alt: 'A long island with four lanes of parcels racing from a leader on the left to account boxes on the right. Two lanes end at their own box; the other two share one box and take turns. Behind the lanes a clock ticks next to a row of linked beads that light up one after another.',
      body: {
        beginner: `[[solana]] tries to make a single chain as fast as possible.

It does two unusual things. First, it has a built-in **clock**. Before agreeing on anything else, everyone can already see in what order things happened, so less time is spent talking it over. This clock is called [[proof-of-history]].

Second, it does many things **at the same time**. If one payment is between Alice and Bob and another between Carol and Dave, they have nothing to do with each other and can run side by side, like cars in separate lanes. Two payments that touch the same account still have to wait for each other.

The price of this speed is that the computers running Solana have to be powerful and well connected, far more than a home laptop.`,
        intermediate: `[[solana]] produces a block roughly every 400 milliseconds. Time is cut into [[slot|slots]], and a schedule published in advance says which [[validator]] is the leader for each one.

**The clock.** [[proof-of-history]] is the leader's clock. It runs a [[hash]] function over and over, each output feeding the next, and mixes incoming transactions into that sequence. Because the chain of hashes can only be produced one step after another, it proves that time passed and fixes the order of transactions inside the block.

**The lanes.** [[parallel-execution]] works because every Solana transaction lists up front which accounts it will read and which it will write. The runtime uses this list to run transactions that do not touch the same accounts on different CPU cores.

Rough figures, as of 2026: on the order of a thousand user transactions per second in practice, with a much higher theoretical ceiling; on the order of a thousand validators; fees usually a small fraction of a cent. Validators need server-grade hardware: many CPU cores, hundreds of gigabytes of RAM and a very fast connection. The network has also stopped completely several times in its history, most recently in February 2024, and was restarted by its validators.`,
        expert: `[[proof-of-history]] is a sequential SHA-256 chain, \`hₙ = SHA-256(hₙ₋₁)\`, with transaction hashes mixed in at the points where they arrive. Generating it is inherently sequential, but verifying it is not: a verifier splits the sequence into segments and checks them on many cores. It is a verifiable clock that lets validators agree on ordering and on elapsed time without exchanging messages first. It is not the consensus mechanism and provides no Sybil resistance; that comes from [[proof-of-stake]].

Consensus is **Tower BFT**, a PBFT-derived protocol that uses PoH as its clock. Each vote on a fork carries a lockout that doubles with every consecutive vote on top of it; once a block has 32 confirmations on a validator's vote tower it is rooted. Optimistic confirmation, when more than two thirds of stake has voted, typically arrives within a second or so; full [[finality]] takes roughly 13 seconds. Validators approved a redesign called Alpenglow in 2025, which replaces Tower BFT and PoH-based voting with a faster finality protocol; check its deployment status for the date you read this.

The runtime, **Sealevel**, executes transactions in parallel by taking read and write locks on the accounts each transaction declares. Programs hold no state of their own; all state lives in accounts passed in by the caller. Contended accounts form local fee markets: priority fees are bid per compute unit and matter only to those competing for the same write lock.

Supporting pieces: leaders hold 4 consecutive slots; there is no global [[mempool]], transactions are forwarded to upcoming leaders; blocks are streamed as erasure-coded fragments through a stake-weighted tree. Costs: high validator hardware and bandwidth requirements, a ledger that grows very quickly (a full archive is on the order of hundreds of terabytes), and tight coupling between components, which has contributed to past halts.`,
      },
      code: {
        lang: 'Python (Proof of History, simplified)',
        source: `from hashlib import sha256

def poh_stream(seed, transactions, ticks):
    h = seed
    for n in range(ticks):
        tx = transactions.get(n)       # a tx that arrived at this point
        if tx:
            h = sha256(h + sha256(tx).digest()).digest()   # mix it in
        else:
            h = sha256(h).digest()     # just let time pass
        yield n, h                     # entry n proves "after n-1"

# Producing 1,000,000 entries takes 1,000,000 sequential hashes.
# Checking them can be split across cores: each segment only needs
# its starting hash, so 8 cores verify about 8 times faster.`,
      },
    },
    avalanche: {
      title: 'Avalanche: ask a few, repeat, and many chains',
      alt: 'A round island with eight small computers in a ring, some blue and some orange. One at a time, a computer draws dashed lines to three others and takes their majority colour, until all are blue and the block in the middle turns green. Three smaller islands are attached around the main one, each with its own block and two validators.',
      body: {
        beginner: `[[avalanche]] reaches agreement in a way that looks like gossip spreading through a crowd.

A node does not wait to hear from everybody. It asks a **few randomly chosen** others what they think. If most of them say the same thing, it adopts that answer, then asks a fresh random handful, again and again. Within a second or two the whole crowd has tipped the same way, like an avalanche that starts with a few stones.

Avalanche also lets a project start **its own chain** with its own rules, next to the main one. These used to be called [[subnet|subnets]] and are now called Avalanche L1s. A game can have one chain and a bank another, without competing for space.`,
        intermediate: `In classic [[bft]] protocols every [[validator]] has to hear from more than two thirds of all the others, so the amount of talking grows quickly with the number of validators. [[avalanche]] replaces that with **repeated random sampling**.

Each round, a validator asks a small random sample of others (weighted by [[stake]]) which block they prefer. If a large enough majority of the sample agrees, the validator adopts that preference. After enough consecutive rounds with the same result, it treats the block as final. The work per validator stays about the same however large the network is.

Rough figures, as of 2026: [[finality]] in about 1 to 2 seconds, and on the order of a thousand validators on the main network, each staking at least 2,000 AVAX.

The main network runs three chains with different jobs; the C-Chain runs the [[evm]], so Ethereum contracts and wallets work on it. Beyond that, anyone can launch a separate chain, a [[subnet]] (since late 2024 called an Avalanche L1), with its own validators, its own fee token and its own rules. Capacity is added by adding chains rather than by making one chain bigger.`,
        expert: `The Snow family (Slush, Snowflake, Snowball, and the chain-ordering variant **Snowman** used in production) is a leaderless, probabilistic consensus. Per round a node samples \`k\` validators by stake; if at least \`α\` of them prefer the same value, that is a successful poll and the node's confidence in that value grows, switching preference if needed. After \`β\` consecutive successful polls the node decides. Mainnet has used values around \`k = 20\`, \`α = 15\`, \`β = 20\` (approximate; they have been tuned in upgrades).

The network is metastable: any imbalance in preferences is amplified by sampling until everyone converges. Safety is probabilistic, with parameters chosen so the chance of two honest nodes deciding differently is negligible, provided the adversary's stake stays below a parameter-dependent bound. Message cost per node per decision is O(k·β), independent of network size, which is what permits large validator sets. There is no leader for voting; a soft proposer schedule limits competing block proposals. There is no slashing: validators that are offline too much simply lose their staking reward.

The Primary Network has three chains: the P-Chain (validators, staking, L1 registry), the C-Chain ([[evm]]) and the X-Chain (asset transfers with a [[utxo]] model). All three now use Snowman.

A [[subnet]] is a validator set that runs one or more chains with its own VM. Since the Etna upgrade (December 2024) these are "Avalanche L1s": their validators no longer have to validate the Primary Network or stake 2,000 AVAX; they pay a continuous fee on the P-Chain instead. L1s exchange messages through signatures aggregated from the source chain's validator set (BLS multi-signatures), verified against the validator set recorded on the P-Chain. The trade-off: each L1 is only as secure as its own, usually much smaller, validator set.`,
      },
      code: {
        lang: 'Python (Snowflake loop, simplified)',
        source: `def snowflake(node, peers, k=20, alpha=15, beta=20):
    preference = node.initial_choice
    streak = 0                         # consecutive successful polls
    while streak < beta:
        sample = stake_weighted_sample(peers, k)
        votes = count(p.preference for p in sample)
        choice, n = votes.most_common(1)[0]
        if n >= alpha:                 # strong majority in the sample
            if choice == preference:
                streak += 1
            else:
                preference, streak = choice, 1
        else:
            streak = 0                 # inconclusive poll: start over
    return preference                  # decided`,
      },
    },
    cosmos: {
      title: 'Cosmos: one chain per app, joined by IBC',
      alt: 'Three six-sided islands, each a separate chain with its own row of four validators. On the first island three of the four validators light up in turn for propose, prevote and precommit, then a block turns green; the fourth stays dark. Walkways join the islands and parcels travel along them, with a relayer standing beside one.',
      body: {
        beginner: `The [[cosmos]] approach starts from a different idea: instead of one big chain for everybody, give **each application its own chain**. An exchange gets a chain, a game gets another, and each can pick the rules that suit it.

Each of these chains is run by its own group of validators. They agree on every block by **voting**: someone proposes a block, the others vote twice, and once more than two thirds have said yes the block is final, there and then. This voting method is called [[tendermint]].

Separate chains would be islands, so they are joined by a kind of postal service called [[ibc]]. It lets one chain send coins and messages to another, and lets the receiving chain check for itself that the message is genuine.`,
        intermediate: `In the [[cosmos]] ecosystem, teams build **app chains**: each one a sovereign [[layer-1]] with its own [[validator]] set, its own token and its own governance, usually built with the same toolkit (the Cosmos SDK).

Consensus is [[tendermint]], now maintained under the name CometBFT. Each block goes through rounds:

- **propose**: one validator, chosen in rotation, proposes a block;
- **prevote** and **precommit**: validators vote in two stages;
- **commit**: when validators holding more than two thirds of the [[stake]] have precommitted, the block is final.

There are no competing forks and no waiting for more confirmations: [[finality]] is immediate, typically a few seconds after the transaction is sent. The system keeps working as long as fewer than one third of the stake is faulty. If more than a third goes offline the chain stops rather than risk two versions of history. Because everyone votes on every block, validator sets are kept small, typically 100 to 200 (approximate, as of 2026).

[[ibc]] connects the chains. Each chain runs a [[light-node|light client]] of the other, so it can verify proofs about the other chain's state. Independent programs called relayers carry the packets, but they cannot forge them.`,
        expert: `[[tendermint]] (CometBFT) is a partially synchronous [[bft]] protocol in the PBFT family. For height \`h\`, round \`r\`, the proposer (weighted round-robin by voting power) broadcasts a block; validators prevote; on seeing prevotes from more than ⅔ of voting power (a "polka") they lock on that block and precommit; more than ⅔ precommits commit the block. If a round times out, \`r\` increases with a new proposer, and the locking rules prevent two different blocks committing at one height. Safety holds while Byzantine voting power is below ⅓; liveness additionally needs more than ⅔ online, so the chain halts rather than forks. Equivocation is provable and punished by [[slashing]].

Consensus talks to the application through ABCI: the engine orders bytes, the application (any language, commonly the Cosmos SDK) defines what they mean. Each block header carries the application's state root (\`AppHash\`) and the hash of the next validator set, which is what makes cheap light clients possible.

[[ibc]] is layered: on-chain light clients track the counterparty's consensus state; connections and channels are opened by handshakes; a packet is committed in the sender's state, and the receiver accepts it only with a Merkle proof against a header its light client has verified. Packets carry timeouts and are acknowledged, so a transfer either completes or is refunded. Relayers are permissionless and untrusted. For tokens (ICS-20) the source escrows the coins and the destination mints a voucher whose denomination encodes the path it travelled.

Trade-offs: the trust assumption for a transfer is the validator sets of the two chains involved, not a third-party bridge. But every app chain must recruit and pay for its own security, liquidity is spread across chains, and a cross-chain call is asynchronous, unlike a call between two contracts on one chain.`,
      },
    },
    tradeoffs: {
      title: 'Same problem, different answers',
      alt: 'The three models from the previous steps, shrunk and arranged in a zigzag: Solana’s single fast island, Avalanche’s round island with satellites, and the three linked Cosmos islands. Next to each one a card lists its main characteristics.',
      body: {
        beginner: `Three chains, three bets:

- [[solana]]: one chain, made as fast as possible. Simple to use, because everything is in one place. Needs powerful machines to run.
- [[avalanche]]: very quick agreement by asking around, plus the option of extra chains for projects that want their own.
- [[cosmos]]: many independent chains, one per app, connected by [[ibc]]. Flexible, but each chain has to look after its own safety.

None of them escaped the triangle from the first step. Each one decided which corner to lean away from, and by how much. When you hear that a chain is "faster" or "cheaper", the useful question is: **what did it give up to get there?**`,
        intermediate: `Approximate figures, as of 2026:

- [[solana]]: blocks about every 0.4 s; full [[finality]] roughly 13 s (a quicker confirmation usually arrives within about a second); on the order of a thousand validators; server-grade hardware.
- [[avalanche]]: finality in about 1 to 2 s; on the order of a thousand validators on the main network; modest hardware; extra capacity through separate L1s, each with its own validators.
- [[cosmos]] chains: blocks every 1 to 6 s, final immediately; typically 100 to 200 validators per chain; modest hardware; chains linked by [[ibc]].
- For comparison, Ethereum: 12 s [[slot|slots]], finality after about 13 minutes, hundreds of thousands of validator keys, consumer hardware.

Raw [[tps]] numbers are the least reliable way to compare chains: they depend on what counts as a transaction and on test conditions. Finality time, validator count, hardware cost and what happens during an outage say more about a design.`,
        expert: `- **Consensus family.** Solana: stake-weighted leader schedule, PoH clock, Tower BFT with exponential lockouts. Avalanche: leaderless Snowman by repeated subsampling, probabilistic safety. Cosmos: [[tendermint]]-style [[bft]] with deterministic single-block [[finality]]. Ethereum for reference: LMD-GHOST plus Casper FFG.
- **Failure mode.** Tendermint chains halt when more than ⅓ of voting power is offline (safety over liveness). Solana has halted when the pipeline was overloaded or hit a bug and required a coordinated restart. Longest-chain designs keep producing blocks and lose finality instead.
- **Execution model.** Solana: accounts declared up front, [[parallel-execution]] (Sealevel). Avalanche C-Chain: the [[evm]], sequential; other VMs per L1. Cosmos: application-defined state machine behind ABCI, often with a WebAssembly contract module.
- **Scaling direction.** Vertical (one chain, bigger machines) for Solana; horizontal (many chains) for Avalanche L1s and Cosmos; layered (rollups on a conservative base) for Ethereum.
- **State growth.** High throughput on one chain concentrates state and history on every validator; many chains spread it but fragment liquidity and security.
- **Cross-chain trust.** Within one chain, calls are atomic. Across chains: [[ibc]] relies on the two validator sets through light clients; Avalanche messaging relies on aggregated signatures from the source L1's validators.

All figures in this lesson are approximate and as of 2026; these networks change parameters and even consensus protocols through upgrades.`,
      },
    },
  },
};

export default content;

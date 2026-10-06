import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    btcGoal: 'scarce digital money',
    ethGoal: 'a shared computer',
    btcSince: 'since 2009\nproof of work',
    ethSince: 'since 2015\nproof of stake (2022 →)',
    alice: 'Alice',
    bob: 'Bob',
    change: 'change',
    fee: 'fee',
    utxoIn: 'whole coins go in',
    utxoOut: 'new coins come out',
    inPlace: 'balances change in place',
    locked: 'locked',
    unlocked: 'unlocked',
    stack: 'checks, one by one',
    btcProg: 'small spending rules',
    contract: 'contract',
    storage: 'contract storage',
    gas: 'gas',
    ethProg: 'any program, metered',
    nextBlock: 'next block',
    blockFull: 'block full',
    waiting: 'waits',
    btcFee: 'highest fee rate first',
    burned: 'burned',
    baseBurn: 'base fee: burned',
    tip: 'tip',
    tipTo: 'priority fee\n→ validator',
    ethFee: 'part burned, part tipped',
    btcPace: 'slow, steady blocks',
    btcTime: '≈ 10 min per block',
    ethPace: 'quick blocks',
    ethTime: '12 s per slot',
    halves: 'new coins halve\nabout every 4 years',
    halvesNum: '50 → 25 → 12.5\n→ 6.25 → 3.125 BTC',
    btcCap: 'never more than 21 million',
    issuance: '+ issuance',
    burn: '− burn',
    ethCap: 'no fixed cap',
    btc0b: 'coins,\nlike cash',
    btc0i: 'UTXO model',
    btc0e: 'UTXO set\n(txid, vout)',
    btc1b: 'simple\nspending rules',
    btc1i: 'Script:\nlock conditions',
    btc1e: 'stack-based,\nno loops',
    btc2b: 'fixed supply:\n21 million',
    btc2i: '21M cap\n≈ 10 min blocks',
    btc2e: '50 >> (h/210000)\n4M weight units',
    eth0b: 'balances, like\na bank app',
    eth0i: 'account model',
    eth0e: 'state trie\n(Merkle Patricia)',
    eth1b: 'runs any\nprogram',
    eth1i: 'EVM +\nsmart contracts',
    eth1e: '256-bit stack VM\ngas-metered',
    eth2b: 'no cap,\nfees burned',
    eth2i: 'issuance − burn\n12 s slots',
    eth2e: 'EIP-1559 burn\nPoS issuance',
  },
  steps: {
    goals: {
      title: 'Two chains, two goals',
      alt: 'A platform split in two. On the Bitcoin side a vault holds coins and one coin hops from person to person. On the Ethereum side app screens send requests into a running machine.',
      body: {
        beginner: `[[bitcoin]] and [[ethereum]] are both blockchains, but they were built to do different jobs.

Bitcoin wants to be **money that nobody controls**: a limited number of coins that you can hold yourself and send to anyone. People often compare it to digital gold. It does that one job and deliberately changes very slowly.

Ethereum wants to be **a computer that nobody controls**. It also has a coin, [[ether]], but the coin mainly pays for running programs. Those programs are called [[smart-contract|smart contracts]], and the rest of this course is about what people build with them.`,
        intermediate: `[[bitcoin]] started in 2009. Its design goal is a payment system and store of value with a fixed supply. It is secured by [[proof-of-work]], and its rules change rarely and conservatively.

[[ethereum]] started in 2015. Its goal is a general platform: anyone can deploy a [[smart-contract]], a program that lives on the chain and holds funds, and anyone can call it. Since 2022 Ethereum is secured by [[proof-of-stake]].

The difference in goal explains every difference that follows:

- how the [[ledger]] records who owns what;
- how much logic a [[transaction]] may carry;
- how fees are priced;
- how new coins are created.`,
        expert: `Both systems are replicated state machines, but the state and the transition function differ.

In [[bitcoin]] the state is the [[utxo]] set: every unspent transaction output. A transaction is valid if each input references an existing output and satisfies its [[bitcoin-script]] locking script. Validation is stateless apart from that set, and the block header commits to transactions only (a [[merkle-root]]), not to state.

In [[ethereum]] the state is a mapping from [[address]] to account (\`nonce\`, \`balance\`, \`storageRoot\`, \`codeHash\`), committed in every header as \`stateRoot\` through the [[state-trie]]. The transition function is execution in the [[evm]].

Consensus also differs: Nakamoto-style longest-chain [[proof-of-work]] with probabilistic [[finality]], versus Gasper ([[casper-ffg]] plus [[lmd-ghost]]) with economic finality after two [[epoch|epochs]]. Bitcoin favours a minimal, auditable base layer; Ethereum favours expressiveness at the base layer.`,
      },
    },
    ledger: {
      title: 'Coins or balances: UTXO vs accounts',
      alt: 'On the Bitcoin side two coin chips slide onto a plate, vanish, and three new chips come out: one for Bob, one back to Alice as change, a tiny one as the fee. On the Ethereum side two account columns stay where they are: Alice’s shrinks and Bob’s grows.',
      body: {
        beginner: `Bitcoin works like **cash**. You do not have "a balance"; you have separate coins of different sizes, like banknotes in a wallet. To pay, you hand over whole coins and get change back. The coins you used are gone, and brand-new ones are created for the receiver and for your change. Each of those coins is called a [[utxo]].

Ethereum works like a **bank app**. Every user has one account with one number in it. Paying someone just lowers your number and raises theirs. This is called the [[account-model]].

Both end with the same result: Bob has more and Alice has less. They only keep the books differently.`,
        intermediate: `In Bitcoin a [[transaction]] has **inputs** and **outputs**. Each input spends an earlier output completely; each output creates a new [[utxo]] with an amount and a lock. Here Alice spends two coins (0.5 and 0.3 BTC), creates 0.6 for Bob and 0.19 back to herself. The missing 0.01 is not written anywhere: whatever inputs minus outputs leaves over is the [[miner]]'s fee.

Your Bitcoin "balance" is simply the sum of all UTXOs your [[wallet]] can unlock.

In Ethereum's [[account-model]] each [[address]] has a balance stored in the chain's state. A transfer subtracts from the sender and adds to the receiver. To stop the same transaction being replayed, every account has an [[account-nonce]] that goes up by one with each transaction it sends.

Trade-offs: UTXOs are easy to verify in parallel and make coins harder to link if you use fresh addresses. Accounts are simpler for programs, because a contract can just read and update a balance.`,
        expert: `A Bitcoin input is an outpoint \`(txid, vout)\` plus unlocking data (\`scriptSig\` and/or witness). An output is \`(value, scriptPubKey)\`, with \`value\` in [[satoshi|satoshis]]. Validity requires \`Σ inputs ≥ Σ outputs\`; the difference is the fee. Each outpoint may be spent once, so double-spend detection is a set lookup followed by deletion. Full nodes keep the [[utxo]] set in a local database (roughly on the order of a hundred million entries or more, as of 2026); it is **not** committed in the block header.

Consequences: transactions touching different outputs are independent and can be validated in parallel; there is no account nonce, replay is impossible because an outpoint only exists once; fee-bumping works by re-spending the same inputs (RBF) or spending a child output (CPFP).

Ethereum state is a map \`address → (nonce, balance, storageRoot, codeHash)\` stored in the [[state-trie]], a Merkle Patricia trie keyed by \`keccak256(address)\`. Each contract has its own storage trie. The root is in every header, so a [[light-node]] can verify one account with a Merkle proof (\`eth_getProof\`).

Consequences: transactions from one sender are totally ordered by [[account-nonce]]; two transactions that touch the same contract storage conflict, so execution is sequential by default; state grows without a natural pruning rule, which motivates proposals for state expiry and statelessness.`,
      },
    },
    programs: {
      title: 'Small locks or full programs: Script vs EVM',
      alt: 'On the Bitcoin side a locked coin sits next to a small stack of slabs that grows and shrinks until one green slab is left, then the padlock opens. On the Ethereum side a call enters a contract machine, one storage slot changes, and a gas gauge drains with each operation.',
      body: {
        beginner: `Every Bitcoin coin carries a small **lock**. The usual lock says: "only the owner of this key may spend me". Other locks say "two of these three people must agree" or "not before next year". That is about as far as it goes, on purpose. The tiny language for these locks is called [[bitcoin-script]].

Ethereum lets you put a **whole program** on the chain: a [[smart-contract]]. It can hold money, remember things, and follow any rules its author wrote, such as an exchange, a loan or a game. The part of Ethereum that runs these programs is the [[evm]].

Running programs costs effort for every computer in the network, so each step has a price, paid in [[gas]]. When the gas runs out, the program stops.`,
        intermediate: `[[bitcoin-script]] is a list of simple instructions, each called an [[opcode]], that work on a stack of values. To spend a coin you supply data (typically a [[digital-signature]] and a [[public-key]]); the node runs the script and the spend is valid only if the result is true.

Script has **no loops** and cannot store data between transactions. This is a deliberate limit: every script finishes quickly, costs a predictable amount to check, and offers little room for bugs. It is enough for payments, multi-signature wallets, time locks and payment channels.

The [[evm]] is a full virtual machine. A [[smart-contract]] is code stored at an [[address]], with its own permanent storage. A transaction can call it, it can call other contracts, and it can loop. Such a language is called [[turing-complete]].

Because a program could run forever, every opcode costs [[gas]]. The sender sets a gas limit; if execution exceeds it, all changes are reverted but the fee is still paid.`,
        expert: `[[bitcoin-script]] is a stack-based, Forth-like language evaluated once per input. Pay-to-public-key-hash runs \`<sig> <pubKey>\` then \`OP_DUP OP_HASH160 <pkh> OP_EQUALVERIFY OP_CHECKSIG\`. It is intentionally not [[turing-complete]]: no backward jumps, bounded script size and operation count, and no access to global state beyond the transaction being validated and its lock-time fields. Cost is therefore bounded statically (signature-operation and weight limits). Taproot (2021) added Schnorr signatures and Merkle trees of alternative scripts, revealing only the branch that is used.

The [[evm]] is a stack machine with 256-bit words, a stack limit of 1024 items, byte-addressed volatile memory, and persistent per-contract storage mapping 256-bit keys to 256-bit values. Code is immutable bytecode addressed by \`codeHash\`.

Every [[opcode]] has a [[gas]] cost. In the scene: 21,000 intrinsic gas for the transaction, 2,100 for a cold \`SLOAD\`, 3 for \`ADD\`, 2,900 for an \`SSTORE\` that changes an already-loaded non-zero slot (EIP-2929/2200 pricing; calldata and the other opcodes are left out for clarity). When gas reaches zero the frame halts with out-of-gas and its state changes revert. The EVM is Turing-complete in its instruction set, but every execution is bounded by the block gas limit.

Calls between contracts (\`CALL\`, \`DELEGATECALL\`, \`STATICCALL\`) are synchronous and atomic within one transaction, which is what makes composability, and reentrancy bugs, possible.`,
      },
      code: {
        lang: 'Bitcoin Script / Solidity',
        source: `# Bitcoin: lock a coin to a public key hash (P2PKH)
scriptPubKey: OP_DUP OP_HASH160 <pubKeyHash>
              OP_EQUALVERIFY OP_CHECKSIG
scriptSig:    <signature> <pubKey>

// Ethereum: a program with its own storage
contract Counter {
    uint256 public count;        // storage slot 0

    function add(uint256 n) external {
        count = count + n;       // SLOAD, ADD, SSTORE
    }
}`,
      },
    },
    fees: {
      title: 'Paying for space, paying for work',
      alt: 'On the Bitcoin side five waiting transactions carry coin stacks of different heights; the three with the tallest stacks move into the next block and the others wait. On the Ethereum side a transaction enters a block, then its fee splits: most of it falls into a burning pit and one coin goes to the validator.',
      body: {
        beginner: `Space in a block is limited, so users pay a fee to get in.

In Bitcoin it works like an **auction for space**. Each transaction offers a fee. The [[miner]] building the next block picks the ones that pay the most for the room they take. If the network is busy and your offer is low, you wait.

In Ethereum you pay for **work**: the more computing your transaction needs, the more [[gas]] it uses. The price per unit of gas has two parts. The main part is set by the network and is **destroyed**, so nobody receives it. A small tip on top goes to the [[validator]] who includes your transaction.`,
        intermediate: `A Bitcoin fee is the difference between inputs and outputs. What matters to a [[miner]] is the **fee rate**: fee divided by the transaction's size, quoted in [[satoshi|satoshis]] per virtual byte (sat/vB). Miners fill the block from the top of the [[mempool]] by fee rate. A simple payment is around 140 to 220 vB, so at 10 sat/vB it costs a couple of thousand satoshis.

An Ethereum [[gas-fee]] is \`gas used × price per gas\`. A plain transfer uses 21,000 gas; a token swap uses several times more. Since the [[eip-1559]] upgrade (2021) the price has two parts:

- a **base fee**, the same for everyone in a block, which rises when blocks are more than half full and falls when they are emptier. It is burned;
- a **priority fee** (tip) that goes to the block's [[proposer]].

So Bitcoin prices bytes, Ethereum prices computation and storage. In both, fees rise when demand for block space rises.`,
        expert: `Bitcoin blocks are limited to 4,000,000 weight units; \`vsize = weight / 4\`, with witness data discounted. Miners maximise fees by ancestor fee rate, which is what makes child-pays-for-parent work, and nodes relay replacements that pay more (RBF). The fee market is first-price: you pay what you bid. Miners receive \`subsidy + Σ fees\` through the coinbase transaction, so fees matter more to security with each [[halving]].

Under [[eip-1559]] a transaction sets \`maxFeePerGas\` and \`maxPriorityFeePerGas\`. It pays \`gasUsed × (baseFee + tip)\` where \`tip = min(maxPriorityFeePerGas, maxFeePerGas − baseFee)\`. The protocol updates the base fee each block:

\`baseFee' = baseFee × (1 + (gasUsed − gasTarget) / gasTarget / 8)\`

so it moves by at most 12.5% per block, with the target at half the gas limit. \`baseFee × gasUsed\` is burned; only the tip reaches the proposer, which removes the incentive for proposers to stuff their own blocks. Unused gas is refunded at the full price.

Blob data used by rollups has a separate fee market with its own base fee (EIP-4844). Outside the protocol, ordering within a block is also sold through block-builder auctions (MEV), which neither chain's base fee captures.`,
      },
      code: {
        lang: 'Python (EIP-1559 base fee)',
        source: `def next_base_fee(base_fee, gas_used, gas_limit):
    target = gas_limit // 2          # blocks aim to be half full
    if gas_used == target:
        return base_fee
    delta = base_fee * abs(gas_used - target) // target // 8
    if gas_used > target:
        return base_fee + max(delta, 1)   # at most +12.5%
    return base_fee - delta               # at most -12.5%

def fee_paid(gas_used, base_fee, max_fee, max_priority):
    tip = min(max_priority, max_fee - base_fee)
    burned = gas_used * base_fee          # destroyed
    to_proposer = gas_used * tip
    return burned + to_proposer`,
      },
    },
    supply: {
      title: 'Block rhythm and new coins',
      alt: 'Along the back of each side blocks roll off a belt: slowly for Bitcoin, quickly for Ethereum. In front, Bitcoin shows a staircase of bars, each half the height of the one before. Ethereum shows a tank with coins dropping in from above and others leaving into a burning pit.',
      body: {
        beginner: `Bitcoin adds a block about every **10 minutes**. Ethereum adds one every **12 seconds**. Faster blocks mean you see your payment sooner; slower blocks give the whole world more time to stay in step.

New bitcoins are created with every block, but the amount is cut in half about every four years. This is the [[halving]]. Because of it there will never be more than **21 million** bitcoins.

Ethereum has no such ceiling. New [[ether]] is paid out to the validators who secure the network, and at the same time part of every fee is destroyed. How the total changes depends on which of the two is larger.`,
        intermediate: `**Block time.** Bitcoin's [[difficulty]] adjusts every 2,016 blocks to keep the average near 10 minutes. Ethereum divides time into fixed 12-second [[slot|slots]], each with one chosen [[proposer]].

**Supply.** Bitcoin's [[block-reward]] began at 50 BTC and halves every 210,000 blocks: 25, 12.5, 6.25 and, since April 2024, 3.125 BTC. Adding all of those up gives just under 21 million, reached around the year 2140. After that, miners are paid by fees alone.

Ethereum issues new [[ether]] to validators as a [[staking]] reward. The amount depends on how much is staked, and is well under 1% of the supply per year (roughly, as of 2026). On the other side, [[eip-1559]] burns the base fee of every transaction. When the network is busy the burn can exceed issuance and the supply shrinks; when it is quiet the supply grows slowly.

One policy is fixed in advance and independent of use. The other responds to how many people stake and how much the chain is used.`,
        expert: `Bitcoin's subsidy at height \`h\` is \`50 BTC >> ⌊h / 210,000⌋\`, in integer [[satoshi|satoshis]] (1 BTC = 10^8), so the total converges to 20,999,999.9769 BTC and the subsidy reaches zero after 33 halvings. Block intervals are exponentially distributed around the 10-minute target; the [[target]] is retuned every 2,016 blocks, limited to a factor of 4 per adjustment. Settlement is probabilistic: the chance of a [[reorg]] falls geometrically with depth, hence the convention of 6 [[confirmation|confirmations]].

Ethereum's 12-second [[slot]] is a schedule, not an average: a missed slot simply has no block. [[finality]] comes from [[casper-ffg]] once two consecutive [[epoch|epochs]] are justified, about 12.8 minutes in normal operation.

Issuance scales with the square root of total stake: the base reward per validator is proportional to \`1 / √(total staked)\`, so total issuance grows as \`√(total staked)\`. With roughly a quarter to a third of all ether staked (as of 2026) this is on the order of a million ETH per year or less. Net change is

\`Δsupply = issuance − Σ (baseFee × gasUsed) − blob fee burn\`

There is no protocol-level cap; the policy has been changed by hard forks before (the block reward under proof of work went 5 → 3 → 2 ETH) and could be again. Bitcoin's schedule could also be changed only by a consensus rule change, which its community treats as off the table.`,
      },
    },
    summary: {
      title: 'Side by side',
      alt: 'Each side shows three small models, back to front. Bitcoin: a few loose coin chips, a short stack with a padlock, a halving staircase. Ethereum: an account column, a contract machine, a supply tank next to a burning pit.',
      body: {
        beginner: `Three differences to remember:

- **How ownership is recorded.** Bitcoin: separate coins, like cash. Ethereum: one balance per account, like a bank app.
- **What you can program.** Bitcoin: simple rules about who may spend a coin. Ethereum: any program, paid for step by step with [[gas]].
- **How many coins there are.** Bitcoin: never more than 21 million. Ethereum: no fixed limit, new coins are issued and fees are burned.

Neither is "better". [[bitcoin]] keeps its job small so it is easy to trust. [[ethereum]] accepts more complexity so that apps can be built on it. The next lessons look at other chains, and then at those apps.`,
        intermediate: `- **Ledger:** [[utxo]] model vs [[account-model]]. Coins that are consumed and re-created vs balances updated in place.
- **Programs:** [[bitcoin-script]], a small language without loops, vs the [[evm]], which runs any [[smart-contract]].
- **Fees:** fee rate per byte, all to the [[miner]], vs [[gas]] with a burned base fee and a tip.
- **Blocks:** about 10 minutes vs 12-second [[slot|slots]].
- **Consensus:** [[proof-of-work]] vs [[proof-of-stake]].
- **Supply:** capped at 21 million with a [[halving]] every 210,000 blocks vs issuance to stakers minus burn.

Each choice follows from the goal. A chain meant to be sound money keeps the rules minimal and predictable. A chain meant to host applications needs rich state and a way to charge for computation.`,
        expert: `- **State:** [[utxo]] set, kept locally and not committed in the header, vs account [[state-trie]] with \`stateRoot\` in every header.
- **Validation:** per-input script evaluation, naturally parallel, vs sequential [[evm]] execution over shared state.
- **Language:** [[bitcoin-script]], non-[[turing-complete]] with statically bounded cost, vs 256-bit stack VM bounded at run time by [[gas]].
- **Fee market:** first-price by fee rate under a 4M weight-unit limit vs [[eip-1559]] base fee (burned) plus priority fee under a gas limit.
- **Finality:** probabilistic, by accumulated work, vs economic, by two-thirds of stake through [[casper-ffg]].
- **Monetary policy:** \`50 >> ⌊h / 210,000⌋\` vs \`issuance(√stake) − burn\`.

The lines are not absolute. Bitcoin gains programmability through layers built on top of it (payment channels, sidechains, proof systems verified off-chain), and Ethereum moves much of its execution to rollups that settle on the base chain. Both trends keep the base layer conservative and push activity upward.`,
      },
    },
  },
};

export default content;

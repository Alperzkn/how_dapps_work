import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    sameCopy: 'Every node holds the same ledger',
    noBoss: 'no central server',
    fullNode: 'full node',
    lightNode: 'light node',
    fullDetail: 'checks every block',
    lightDetail: 'headers + proofs',
    newTx: 'new transaction',
    peers: 'each node tells its peers',
    everyone: 'everyone has it',
    hops: 'a few hops reach everyone',
    newBlock: 'new block',
    check1: 'signatures',
    check2: 'balances',
    check3: 'link to parent',
    accepted: 'valid: pass it on',
    cheater: 'dishonest node',
    rejected: 'rejected',
    notForwarded: 'not passed on',
    unaware: 'never receives it',
    tie: 'two blocks at the same time',
    heavier: 'heavier branch wins',
    stale: 'stale block',
    reorg: 'reorg: switches to A',
    finalized: 'finalized',
  },
  steps: {
    copies: {
      title: 'Many copies, no centre',
      alt: 'Nine node towers stand scattered on a map, joined by dashed lines. The same small chain of blocks floats above each of them; two smaller towers carry a thinner version.',
      body: {
        beginner: `A bank keeps its [[ledger]] on its own computers. If they go down, or the bank decides to change a number, there is nothing you can do about it.

A [[blockchain]] has no such centre. Thousands of computers around the world, called [[node|nodes]], each keep the whole ledger. They belong to different people in different countries, and none of them is the boss.

Switch any one of them off and the others carry on. This spreading of control is called [[decentralization]]. Anyone may add a node of their own: all it takes is a computer, the free software and an internet connection.`,
        intermediate: `A [[node]] is a computer running the chain's software. Nodes come in different weights:

- A [[full-node]] downloads every [[block]] and checks every [[transaction]] itself. It takes nobody's word for anything.
- A [[light-node]] keeps only the small [[block-header|block headers]] and asks full nodes for proof of the few things it cares about. This is what fits on a phone.

Running a full node is kept affordable on purpose: an ordinary computer, a fast disk of a terabyte or two and a decent connection. Bitcoin and Ethereum each have thousands of them reachable on the public internet.

A node that only verifies is not the same thing as a [[miner]] or [[validator]], which also proposes new blocks. But every block producer needs a node, and every node checks the producers' work.`,
        expert: `The network is a permissionless [[p2p]] overlay: no fixed servers, no accounts, and every peer is assumed to be possibly hostile.

Node types, by what they keep and check:

- [[full-node]]: validates every block from the [[genesis-block]], or from a recent trusted checkpoint, and keeps the current state. It may prune old block bodies.
- Archive node: a full node that also keeps every historical state, needed for queries such as a balance at an old block.
- [[light-node]]: verifies headers and proofs only. A Bitcoin SPV client checks the [[proof-of-work]] of each 80-byte [[block-header]] and uses a Merkle branch against the [[merkle-root]] to prove that a transaction is included. An Ethereum light client follows a sync committee of 512 [[validator|validators]], rotated about every 27 hours, whose signatures vouch for recent headers.

A light client's security is weaker in one specific way: it can verify that something *is* in a block the majority built, but not that the block obeys every rule. Only full validation gives that.

Peers are found without a directory. Bitcoin nodes bootstrap from DNS seeds and then exchange \`addr\` messages; Ethereum uses a Kademlia-style DHT (discv4 and discv5). Bitcoin Core opens 8 full-relay and 2 block-only outbound connections by default and accepts inbound ones up to a total of 125.`,
      },
    },
    gossip: {
      title: 'Gossip: how news spreads',
      alt: 'A wallet hands a transaction to the nearest node. Parcels then hop along the links from node to node, and each tower turns orange as it receives the message, until all of them have it.',
      body: {
        beginner: `There is no loudspeaker that reaches every [[node]] at once. News travels the way a rumour does.

A node that hears something new tells the few nodes it is connected to. Each of them tells its own neighbours, and so on. This is called [[gossip]].

It sounds slow, but the number of nodes in the know multiplies at every step. A new [[transaction]] or [[block]] reaches nearly the whole world in a few seconds, and there is no central point anyone could switch off to stop it.`,
        intermediate: `Each [[node]] stays connected to a number of others, its *peers*: typically from eight to a few dozen. Together they form a [[p2p]] network with no hub.

[[gossip]] works in rounds. A node receives a [[transaction]] or a [[block]], checks it and forwards it to its peers, which do the same. Because every round multiplies the audience, even ten thousand nodes are covered in a handful of hops.

A node often hears the same news from several peers. That is intended: the duplicates cost a little bandwidth, and in return no single broken or dishonest peer can keep a node in the dark.

Speed matters. A Bitcoin block reaches most of the network within a few seconds. On Ethereum a block has about 4 seconds to arrive before validators vote on it.`,
        expert: `Sending everything to everyone would waste bandwidth, so real protocols announce first and send on request.

- **Bitcoin**: a node announces new transactions with \`inv\`; a peer that lacks one answers \`getdata\` and receives the \`tx\`. Blocks use compact block relay (BIP 152): a \`cmpctblock\` message carries the header and short transaction ids, and the receiver rebuilds the block from its own [[mempool]], fetching only what is missing.
- **Ethereum, execution layer**: transactions travel over devp2p (\`eth/68\`), in full to a few peers and as hash announcements to the rest.
- **Ethereum, consensus layer**: blocks and [[attestation|attestations]] travel over libp2p gossipsub. Each topic keeps a mesh of about 8 peers (\`D = 8\`) for full messages and gossips message ids to others, which can pull what they missed.

Messages are checked before they are forwarded. One that fails is dropped and counts against the peer that sent it, so garbage does not travel far.

The topology is an attack surface. In an eclipse attack an adversary occupies all of a victim's connections and feeds it a private view of the chain; picking peers at random from many different address ranges exists to make that expensive.

Propagation delay also limits performance: the longer a block takes to spread compared with the block interval, the more often competing blocks appear.`,
      },
    },
    verify: {
      title: 'Every node checks the rules',
      alt: 'A new block travels to the node in the middle of the map. A checklist above that node lights up green one line at a time, the node turns green, and copies of the block continue to the next nodes.',
      body: {
        beginner: `A [[node]] does not believe what it is told. Before it accepts a new [[block]], it checks the block from top to bottom, by itself.

Is every payment signed by the real owner? Did anyone spend money they do not have, or spend the same coin twice? Does this block attach properly to the one before it?

Only if everything is right does the node add the block to its copy and pass it on. Every node does this for every block. You do not have to trust whoever sent it, because you check.`,
        intermediate: `Each [[full-node]] validates every [[block]] independently. The main checks:

- the block points to a known parent through its [[hash]];
- the block was produced legitimately: enough [[proof-of-work]], or the signature of the right [[validator]];
- every [[transaction]] carries a valid [[digital-signature]];
- nobody spends more than they have, and nothing is spent twice;
- the block stays within the size or [[gas]] limit and creates no more new coins than allowed.

The rules are fixed in the software and every node applies the same ones. That is how thousands of strangers end up with identical [[ledger|ledgers]] without discussing anything: the same input, checked by the same rules, gives the same result.

Choosing **which** valid block comes next is a separate job. That is [[consensus]].`,
        expert: `Validation is a deterministic function of the block and the parent state: \`valid(block, state_parent) → state' | ⊥\`. Two honest nodes running the same rules cannot disagree about it.

Bitcoin checks, among other things: the header hash is below the [[target]]; the timestamp is above the median of the previous 11 blocks and no more than 2 hours ahead; block weight ≤ 4,000,000; every input spends an unspent output and satisfies its script; inputs ≥ outputs; and the coinbase claims at most the subsidy plus fees.

Ethereum checks the header against its parent (\`parentHash\`, the bounds on \`gasLimit\`, the [[eip-1559]] \`baseFeePerGas\`), the proposer's signature and [[slot]], then re-executes every transaction in the [[evm]] and compares \`stateRoot\`, \`receiptsRoot\` and \`gasUsed\` with the header. A single differing bit makes the block invalid.

Forwarding does not wait for all of this. Nodes relay after the cheap checks (proof of work on the header, or the proposer's signature) so that blocks spread quickly; the full check decides whether the node will build on the block.

Block producers cannot change the rules. A majority of [[miner|miners]] or [[validator|validators]] can choose *which* valid blocks to build on, and so can censor or reorder, but it cannot make full nodes accept a forged signature or coins created from nothing.`,
      },
      code: {
        lang: 'Python (simplified block validation)',
        source: `def validate(block, parent, state):
    assert block.parent_hash == hash(parent.header)
    assert block.gas_used <= block.gas_limit
    assert block.base_fee == next_base_fee(parent)
    for tx in block.transactions:
        sender = recover_signer(tx)            # ECDSA
        assert tx.nonce == state.nonce(sender)
        assert state.balance(sender) >= tx.gas_limit * tx.max_fee + tx.value
        state = execute(state, tx)             # EVM
    assert state.root() == block.state_root    # same result as the producer
    return state`,
      },
    },
    reject: {
      title: 'A bad block goes nowhere',
      alt: 'One node, marked red, sends out a red block. At the middle node the second line of the checklist turns red. The block is rejected by each neighbour and travels no further; the nodes beyond never receive it.',
      body: {
        beginner: `Suppose a dishonest [[node]] makes a [[block]] that pays itself money out of thin air, and sends it out.

Its neighbours run their usual checks, and one of them fails. They throw the block away and do **not** pass it on. The lie stops at the first honest nodes it meets, and the rest of the network never even hears of it.

It makes no difference how powerful the cheater is or how official the block looks. Everyone checks the rules, so breaking them only gets you ignored.`,
        intermediate: `An invalid [[block]] is treated the same way no matter who made it:

- the receiving [[full-node]] runs its checks and one fails;
- the block is dropped: not stored, not built on, not passed on;
- the peer that sent it may be disconnected.

So an invalid block costs its maker the effort that went into it and earns nothing. On Bitcoin the [[miner]] has spent electricity on a block nobody accepts.

This is also the limit of what a powerful attacker can do. Even with most of the mining power, an attacker cannot forge a [[digital-signature]] or invent coins, because every full node would reject the block. What a majority *can* do is choose between valid histories; the next step shows how.

A [[light-node]] does not run all of these checks, which is why it has to be more careful about whom it listens to.`,
        expert: `Rejection is local and immediate; nobody votes on it. In Bitcoin Core a block that fails the consensus checks is marked invalid, none of its descendants will be accepted, and the peer that relayed it is disconnected and discouraged. In gossipsub a message that fails validation gets the result \`REJECT\`: it is not forwarded, and the sender's peer score drops until it is pruned from the mesh.

To limit denial of service, cheap checks come first. A Bitcoin node checks the [[proof-of-work]] of the header before it downloads the body, so making a node do expensive work costs the attacker real hashing. Ethereum nodes check the proposer's signature and [[slot]] before forwarding and before executing.

What a majority of block producers can and cannot do:

- **cannot**: spend without a valid signature, create coins beyond the issuance rule, or break any other rule that full nodes enforce;
- **can**: leave transactions out, and build a heavier alternative branch that reverts recent history (a [[51-attack]]).

Disagreement about the rules between honest nodes is a different problem. If one client has a bug and judges a valid block invalid, the network splits along client lines. This is the argument for client diversity on Ethereum.

Light clients remain exposed to an invalid chain that a majority supports; fraud proofs and validity proofs are the lines of work that address this.`,
      },
    },
    forks: {
      title: 'Forks and the heaviest chain',
      alt: 'In front of the map a chain splits into two branches, A and B, and each node shows the colour of the branch it follows. Branch A then gains a second block; the nodes on B switch over, and block B is left grey as a stale block.',
      body: {
        beginner: `Sometimes two honest producers create a valid [[block]] at almost the same moment. Some [[node|nodes]] hear of one first, the rest hear of the other. For a moment the [[ledger]] has two versions of its last page. This is a [[fork]].

Nobody calls a meeting to settle it. Each node keeps building on the block it saw first, and waits. Soon one branch gets the next block and pulls ahead.

Then everyone follows one simple rule: **the branch with the most work behind it wins**. Nodes on the other branch switch over and the block they leave behind is dropped. The payments in it go back to the waiting room and get into a later block. This is why the most recent pages count as not quite settled.`,
        intermediate: `A [[fork]] of this kind happens whenever two valid [[block|blocks]] share the same parent. Both follow the rules, so validation cannot choose between them. A [[fork-choice]] rule does:

- **Bitcoin**: follow the chain with the most accumulated [[proof-of-work]], which is usually but not always the longest one;
- **Ethereum**: follow the branch that the most [[validator]] votes currently support.

When a node switches branches it performs a [[reorg]]: it rolls back the blocks of its old branch and applies the new ones. Transactions that were only in the abandoned block return to the [[mempool]]. Reorgs of one block are ordinary; deep ones are rare and alarming.

[[finality]] is the point after which a block will not be reorged. On Bitcoin it is a matter of confidence that grows with every [[confirmation]]. Ethereum finalizes blocks explicitly, about a quarter of an hour after they appear.

The word "fork" is also used for a change to the rules themselves, after which upgraded and non-upgraded nodes may part ways. That is a different thing from this short-lived tie.`,
        expert: `The [[fork-choice]] rule maps a node's view of the block tree to a single head.

- **Nakamoto consensus**: the head is the tip of the valid chain with the greatest cumulative work, the sum of \`2^256 / (target + 1)\` over its blocks. Ties go to the block seen first. [[finality]] is probabilistic: the chance of a [[reorg]] deeper than \`z\` blocks falls exponentially in \`z\` as long as the attacker has less than half the [[hashrate]].
- **Ethereum (Gasper)**: [[lmd-ghost]] starts at the latest justified checkpoint and at each fork descends into the child whose subtree carries the most stake, counting only the latest [[attestation]] of each [[validator]]. [[casper-ffg]] runs on top and finalizes a checkpoint when two thirds of the stake link it to its direct successor. Fork choice never goes behind a finalized checkpoint, so reverting a finalized block requires at least one third of the stake to commit a slashable offence.

GHOST-style rules count votes or blocks that are *off* the main chain as support for their ancestors, which preserves security at short block intervals, where stale blocks are common.

[[consensus]] promises two things: **safety** (honest nodes do not finalize conflicting blocks) and **liveness** (the chain keeps growing). During a network partition a protocol has to give one of them up. Bitcoin keeps liveness: both sides grow and one is reorged later. Ethereum's finality gadget stops finalizing when less than two thirds of the stake is online, while LMD-GHOST keeps producing blocks.

A reorg re-applies state: undo the old branch back to the common ancestor, apply the new one, and return the orphaned transactions to the pool if they are still valid.`,
      },
      code: {
        lang: 'Python (fork choice, simplified)',
        source: `# Bitcoin: the tip with the most cumulative work
def best_tip(tips):
    return max(tips, key=lambda b: b.chain_work)  # sum of 2**256 // (target + 1)

# Ethereum: LMD-GHOST, starting from the justified checkpoint
def head(store):
    block = store.justified_root
    while children(block):
        # weight = stake of validators whose latest vote is in c's subtree
        block = max(children(block), key=lambda c: weight(store, c))
    return block`,
      },
    },
  },
};

export default content;

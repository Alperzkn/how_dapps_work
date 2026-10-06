import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    validator: 'validator',
    deposit: 'deposit',
    depositAmount: '32 ETH deposit',
    noMining: 'no mining',
    choosing: 'choosing…',
    chosen: 'your turn',
    slotProposer: 'slot 37 · proposer',
    newBlock: 'new block',
    proposer: 'proposer',
    committee: 'committee',
    votes: 'votes for the block',
    attestations: 'attestations',
    epoch: 'epoch',
    finalized: 'finalized',
    justified: 'justified',
    voting: 'voting',
    twoThirds: '2/3 of stake',
    ofStake: 'of stake',
    twoBlocks: 'two blocks, one turn',
    sameSlot: 'same slot, two blocks',
    slashed: 'slashed',
    slashedEjected: 'slashed · ejected',
    burned: 'burned',
    powCost: 'cost: electricity',
    powCostDetail: 'electricity · spent for good',
    powExpert: 'cost outside the chain · probabilistic finality',
    posCost: 'cost: locked coins',
    posCostDetail: 'locked ETH · lost only by cheating',
    posExpert: 'cost inside the chain · economic finality',
  },
  steps: {
    stake: {
      title: 'A deposit instead of electricity',
      alt: 'Seven pillars stand in a row, each carrying a stack of coins. People in front of them toss coins up onto the pillars. To one side, a mining machine is switched off and crossed out.',
      body: {
        beginner: `[[proof-of-work]] picks block makers by how much electricity they burn. [[proof-of-stake]] asks a different question: **how much are you willing to lose?**

To take part, you lock up coins as a deposit. This is your [[stake]]. Follow the rules and you get it back with a small reward on top. Cheat, and the network destroys part of it.

Someone who has locked a deposit and runs the software is called a [[validator]]. No racing machines, no enormous power bill.`,
        intermediate: `In [[proof-of-stake]] the scarce resource is capital rather than computation. On [[ethereum]], anyone who deposits 32 ETH and runs the client software becomes a [[validator]]. The deposit stays locked while they are active.

Validators take turns proposing blocks and vote on each other's blocks. Honest work earns rewards of a few percent per year; being offline costs small penalties; provable cheating triggers [[slashing]].

There is no puzzle to solve, so an ordinary computer is enough. When Ethereum switched from mining to [[staking]] in September 2022 (the Merge), its electricity use fell by more than 99.9%.`,
        expert: `Ethereum's consensus protocol is **Gasper**: the [[lmd-ghost]] [[fork-choice]] rule, which picks the head block slot by slot, combined with [[casper-ffg]], a finality gadget that makes whole stretches of the chain irreversible.

A [[validator]] is created by sending 32 ETH and a BLS12-381 public key to the deposit contract on the execution layer. After passing through an activation queue (a churn limit bounds how fast the set may change) it becomes active. Its voting weight is its \`effective_balance\`, which moves in 1 ETH steps with hysteresis. Since the Pectra upgrade (EIP-7251) one validator can hold an effective balance of up to 2,048 ETH; 32 ETH remains the minimum to activate.

The security argument changes character. In [[proof-of-work]] an attacker pays outside the system, for hardware and energy. Here the collateral lives **inside** the system, where the protocol can identify the guilty keys and destroy their [[stake]].`,
      },
    },
    proposer: {
      title: 'Choosing who proposes',
      alt: 'A spotlight jumps along the row of pillars and comes to rest on one of them. That pillar lights up and a new block appears in front of it.',
      body: {
        beginner: `Time is cut into short turns. For each turn the network draws one [[validator]] by lot, and that one gets to write the next [[block]].

The draw is weighted by deposit: twice the coins, twice the chance. But nobody can know far ahead who will be picked, and nobody can buy their way to the front of the line.

If the chosen one is asleep, the turn simply passes with no block, and the next turn belongs to someone else.`,
        intermediate: `[[ethereum]] divides time into [[slot|slots]] of 12 seconds, and 32 slots make an [[epoch]] of 6.4 minutes. Each slot has exactly one [[proposer]], chosen pseudo-randomly with probability proportional to [[stake]].

The proposer gathers [[transaction|transactions]], builds a [[block]] and broadcasts it at the start of its slot. For this it earns the transaction tips and a protocol reward.

If the proposer is offline, the slot stays empty. That is the only cost: the chain continues with the next slot. Compare this with [[mining]], where every participant works on every block and all but one of those efforts are thrown away.`,
        expert: `Randomness comes from **RANDAO**. Each [[proposer]] includes a \`randao_reveal\`, a BLS signature over the current [[epoch]] number, and its hash is XORed into the beacon state's mix. Because a BLS signature is unique for a given key and message, a proposer cannot choose its contribution; it can only withhold the block, giving the last proposers of an epoch about one bit of influence each at the price of a missed reward.

The seed for an epoch is taken from the mix as it stood before the previous epoch began, so duties are known a short time ahead. Committees are assigned with a swap-or-not shuffle over the active set; the proposer for a [[slot]] is found by sampling candidates from that shuffle and accepting each with probability \`effective_balance / MAX_EFFECTIVE_BALANCE\`.

A [[validator]] that proposes two different blocks for the same slot commits a slashable offence. In practice most proposers do not build blocks themselves: they sign a header supplied by a specialised builder through MEV-Boost, which centralises block construction while proposing stays distributed.`,
      },
    },
    attest: {
      title: 'Everyone else votes',
      alt: 'The new block has joined the chain. Green vote tokens fly from the other pillars and land on it.',
      body: {
        beginner: `One [[validator]] wrote the block. Now the others check it and vote: "yes, I saw this block and it follows the rules."

Such a vote is called an [[attestation]]. Each vote weighs as much as the deposit behind it.

A block with many votes on it is the one everybody builds on next. Voters who do their job on time earn a little; those who are missing lose a little.`,
        intermediate: `In every [[epoch]] each [[validator]] votes exactly once. The validators are shuffled into committees, one group per [[slot]], and the committee of a slot issues an [[attestation]] for the block it sees at the head of the chain.

An attestation says two things at once: "this is the newest block I consider correct" and "this is the checkpoint I want to make final". Thousands of signatures are compressed into one, so blocks stay small.

When two blocks compete, nodes follow the branch with the most stake voting for it. Attesting correctly and on time is where most of a validator's income comes from; missing votes costs roughly what they would have earned.`,
        expert: `An \`AttestationData\` carries two votes. \`beacon_block_root\` is the [[lmd-ghost]] vote for the head of the chain. \`source\` and \`target\` are checkpoints forming the [[casper-ffg]] vote. Validators sign it with BLS, and since BLS signatures over the same message add up, a committee's votes are aggregated into one signature plus a bitfield.

[[lmd-ghost]] (Latest Message Driven, Greedy Heaviest Observed SubTree) starts from the latest justified checkpoint and, at each [[fork]], descends into the child whose subtree holds the largest [[stake]], counting only each validator's most recent [[attestation]]. A block that arrives on time gets a temporary *proposer boost* worth 40% of one slot's committee weight, which blunts balancing and short-reorg attacks.

Timing is part of the protocol: the block is due at the start of the [[slot]], attestations after 4 seconds, aggregates after 8. Rewards are split by flags for a correct and timely source, target and head, and a missed or wrong source or target vote is penalised by about the amount it would have earned, while a missed head vote simply earns nothing.`,
      },
      code: {
        lang: 'Python (consensus spec)',
        source: `class Checkpoint(Container):
    epoch: Epoch
    root: Root                 # block at the start of that epoch

class AttestationData(Container):
    slot: Slot
    index: CommitteeIndex
    beacon_block_root: Root    # LMD-GHOST vote: the head I see
    source: Checkpoint         # FFG vote: latest justified checkpoint
    target: Checkpoint         # FFG vote: checkpoint of the current epoch`,
      },
    },
    finality: {
      title: 'Finality',
      alt: 'Six blocks in a row are grouped into three epochs. The first epoch is green and locked, the second is blue, the third is grey. Votes flow to the third while a column beside it fills past a two-thirds mark.',
      body: {
        beginner: `In mining chains a payment only gets "more and more probably" permanent. Here there is a clear moment when it becomes final.

Blocks are grouped into rounds. When [[validator|validators]] holding at least **two thirds** of all deposits vote for a round, it is approved. When the next round is approved on top of it, the earlier one is locked.

A locked block has [[finality]]: undoing it would require a huge group of validators to break the rules in plain sight and lose their deposits.`,
        intermediate: `The first block of each [[epoch]] serves as a **checkpoint**. Every [[attestation]] also votes for a link from one checkpoint to the next.

- When votes from at least 2/3 of the total [[stake]] support a checkpoint, it is **justified**.
- When the checkpoint right after a justified one is justified too, the earlier one is **finalized**.

With everything working this takes two epochs, about 13 minutes. A finalized block is never reorganized by honest nodes. To finalize a conflicting block, validators holding at least 1/3 of all stake would have to sign contradictory votes, and those signatures are proof enough to destroy their deposits.`,
        expert: `[[casper-ffg]] works on checkpoints \`(epoch, root)\`. An [[attestation]] contains a link \`source → target\`. A target becomes *justified* when links from an already justified source are signed by validators with at least 2/3 of the total active effective balance. A justified checkpoint becomes *finalized* when its direct child checkpoint is justified by a link from it (the protocol also accepts some two-epoch variants of this rule).

Two properties follow. **Accountable safety**: two conflicting finalized checkpoints imply that validators with at least 1/3 of the [[stake]] signed a double vote or a surround vote, and can be slashed. **Plausible liveness**: as long as 2/3 follow the protocol, a new checkpoint can always be finalized.

If more than 1/3 go offline, finalization stops, but [[lmd-ghost]] keeps producing blocks. After four epochs without [[finality]] the *inactivity leak* begins: non-participating validators lose balance at a rate that keeps rising, so the total loss grows quadratically with time, until the participating ones again hold 2/3. The chain prefers staying live and repairs finality later.`,
      },
    },
    slashing: {
      title: 'Slashing',
      alt: 'One pillar has turned red and stepped out of the row. Dotted lines connect it to two conflicting red blocks. Its coins fly off into a dark pit.',
      body: {
        beginner: `What stops a [[validator]] from signing two different versions of history, one for each group of people it wants to fool?

Every vote is signed. If someone signs two contradicting things, the two signatures together are undeniable evidence. Anyone can show them to the network.

The punishment is [[slashing]]: part of the deposit is destroyed and the validator is thrown out. Merely being offline is not a crime; it only costs small fees.`,
        intermediate: `Three actions are punished by [[slashing]]:

- proposing two different blocks in the same [[slot]];
- signing two different [[attestation|attestations]] for the same target [[epoch]];
- signing an attestation that "surrounds" an earlier one of your own, which amounts to rewriting your previous vote.

The proof is simply the two signed messages, included in a block by any [[proposer]]. The slashed [[validator]] loses a slice of its [[stake]] immediately, is removed from the set, and waits about 36 days before the rest can be withdrawn.

During that wait a second penalty is applied, and it grows with the number of validators slashed around the same time. A lone accident costs little. A coordinated attack by a third of the stake costs the attackers everything.`,
        expert: `Slashing is the answer to the [[nothing-at-stake]] problem. Signing is free, so in a naive stake-weighted protocol a rational [[validator]] would vote on every branch of a [[fork]] and consensus would never converge. Gasper makes equivocation attributable and expensive.

For attestations \`a\` and \`b\` from the same validator the slashable conditions are:

- **double vote**: \`a ≠ b\` and \`a.target.epoch == b.target.epoch\`;
- **surround vote**: \`a.source.epoch < b.source.epoch\` and \`b.target.epoch < a.target.epoch\`.

Proposer slashing covers two distinct signed headers for one [[slot]]. A slashed validator pays an initial penalty, is exited, and becomes withdrawable after 8,192 epochs (about 36 days). Halfway through, the correlation penalty is applied: \`effective_balance × min(3 × S, T) / T\`, where \`S\` is the stake slashed in the surrounding 8,192-epoch window and \`T\` the total active stake. If a third of the stake is slashed together, each offender loses its whole balance.

Most slashings so far have been operator mistakes, typically the same key running on two machines, which is why clients keep a local slashing-protection database.`,
      },
      code: {
        lang: 'Python (consensus spec)',
        source: `def is_slashable_attestation_data(data_1: AttestationData,
                                  data_2: AttestationData) -> bool:
    return (
        # double vote: two different votes for the same target epoch
        (data_1 != data_2 and data_1.target.epoch == data_2.target.epoch) or
        # surround vote: vote 1 spans over vote 2
        (data_1.source.epoch < data_2.source.epoch and
         data_2.target.epoch < data_1.target.epoch)
    )`,
      },
    },
    compare: {
      title: 'Proof of Work and Proof of Stake side by side',
      alt: 'Two platforms. On the left a mining machine with a spinning fan and a nonce counter over its block, with coins leaving. On the right a pillar with coins sends a vote to a block that carries a padlock.',
      body: {
        beginner: `Both systems answer the same question: who may add the next [[block]], and why should we believe them?

- [[proof-of-work]]: whoever spends the most electricity. The money is gone whether you were honest or not.
- [[proof-of-stake]]: whoever locks up coins. The money comes back if you were honest and is destroyed if you were not.

Work is simple and has secured Bitcoin since 2009. Stake uses far less energy and can declare blocks final, but it has more moving parts.`,
        intermediate: `**Cost of security.** A [[miner]] pays continuously for hardware and power, so the chain must keep issuing coins to cover the bill. A [[validator]] only gives up the use of its capital, so [[ethereum]] issues far fewer new coins than it did before the Merge.

**Finality.** Under [[proof-of-work]] a [[transaction]] becomes steadily harder to reverse with each [[confirmation]], but never absolutely. Under [[proof-of-stake]] a block is finalized after about 13 minutes, and reverting it would destroy at least a third of all [[stake]].

**After an attack.** A majority miner keeps its machines and can attack again tomorrow. An attacking validator's stake can be slashed, so the same coins cannot attack twice.

**Concerns.** Mining concentrates where electricity and chips are cheap; staking concentrates in large pools and exchanges. Neither is perfectly decentralized.`,
        expert: `**Thresholds.** Nakamoto consensus needs an honest majority of [[hashrate]], less under selfish mining, and offers only probabilistic settlement. Gasper has two thresholds: validators with 1/3 of the [[stake]] can stall [[finality]], and conflicting finalized checkpoints require at least 1/3 to be slashable. With 2/3 an attacker can finalize what it likes, and the remaining defence is social: the community forks the attacker's stake away.

**Long-range attacks.** [[proof-of-work]] is objective: a new node can pick the heaviest chain from the [[genesis-block]] alone, because old work cannot be forged cheaply. In [[proof-of-stake]], validators that exited long ago can sign an alternative history from the distant past at no cost, since their stake is already withdrawn and cannot be slashed. The defence is *weak subjectivity*: a node joining or returning after a long absence must start from a recent trusted checkpoint, and exits are rate-limited so the validator set cannot turn over within the weak subjectivity period.

**Complexity and trust surface.** PoW's rule fits in a line: most cumulative work wins. Gasper couples two protocols, and their interaction has produced a series of published attacks (balancing, ex-ante reorgs) and patches such as proposer boost. In exchange it gets explicit finality, accountable faults, and security that does not depend on a continuing energy spend.`,
      },
    },
  },
};

export default content;

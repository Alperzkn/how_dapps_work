import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    sharedLedger: 'Shared ledger',
    copy: 'own copy',
    block: 'Block',
    genesis: 'Block 1 · genesis',
    prev: 'prev',
    hash: 'hash',
    edited: 'edited',
    broken: 'link broken',
    redone: 'redone',
    honest: 'Honest chain',
    attacker: "Attacker's copy",
    pickBlock: 'Edit block',
    editPrompt: 'Change the data in block {n}',
    hashOf: 'Block {n} hash',
    reset: 'Reset',
    redoBlock: 'Redo block {n}',
    nothingToRedo: 'Nothing to redo',
    toRedo: 'blocks still to redo',
    toRedoOne: 'block still to redo',
    repaired: 'consistent again, but every hash is new',
    tipWas: 'last hash was',
    tipNow: 'last hash now',
    sampleText: 'Hello',
    typePrompt: 'Type anything',
    fingerprint: 'fingerprint',
    fullHash: 'SHA-256 of your text',
    changed: 'Characters changed',
    changedShort: 'changed',
    shareLabel: "Attacker's power",
    depthLabel: 'Blocks on top',
    catchUp: 'Chance to catch up',
    fromBehind: 'From z behind: (q/p)^z',
    blockOnTop: 'block on top',
    blocksOnTop: 'blocks on top',
    blocksMade: 'blocks',
    usePrompt: 'What else can one chain record?',
    use_payments: 'Payments',
    use_ownership: 'Ownership',
    use_identity: 'Identity',
    use_supply: 'Supply chain',
    use_votes: 'Votes',
    use_games: 'Game items',
    ex_payments: 'Ayşe → Ben: 5 coins',
    ex_ownership: 'ticket #42 → owner: Cem',
    ex_identity: 'diploma hash: 3fa1…',
    ex_supply: 'crate 17: farm → port',
    ex_votes: 'proposal 12 · Ben: yes',
    ex_games: 'sword #7 → player: Ayşe',
    why_payments: 'Who paid whom. The first use, and the one this course follows.',
    why_ownership: 'Who owns a unique item, recorded as a token (an NFT).',
    why_identity: 'A fingerprint of a diploma or licence, so anyone can check it is genuine.',
    why_supply: 'Every handover of a shipment, signed by whoever made it.',
    why_votes: 'Signed votes that anyone can count again.',
    why_games: "Items held by the player's own key, not by the game's server.",
    oneChain: 'one chain',
    coursePath: 'this course goes this way',
  },
  steps: {
    ledger: {
      title: 'A notebook everyone shares',
      alt: 'A ledger page lies on a table. Three people stand around it, each holding their own copy of the same page.',
      body: {
        beginner: `Imagine a notebook that records who paid whom. Instead of one bank keeping it, **everyone** keeps an identical copy.

When a new line is written, every copy gets the same line. Nobody can secretly change their copy, because it would no longer match the others.

That shared notebook is a [[ledger]]. A [[blockchain]] is a special way of building one.`,
        intermediate: `A [[blockchain]] is a [[ledger]] that many computers, called [[node|nodes]], each store in full. There is no central copy that is "the real one".

Every entry is a [[transaction]]: a signed instruction such as "send 5 coins from A to B". Nodes pass new transactions to each other and all end up recording the same ones, in the same order.

The hard part is agreeing on that order without a boss. That is what the rest of this course builds up to.`,
        expert: `A [[blockchain]] is a replicated state machine: every [[full-node|full node]] holds the complete [[ledger]] and applies the same ordered list of [[transaction|transactions]] to reach the same state.

Three properties make it useful:

- **Replication**: thousands of independent copies, so no single operator can withhold or alter data.
- **Deterministic validation**: each node re-executes everything and rejects whatever breaks the protocol rules.
- **Total ordering under adversarial conditions**: a [[consensus]] mechanism picks one history even when some participants lie.

The data structure itself, a hash-linked list of blocks, only gives tamper **evidence**. Tamper **resistance** comes from consensus, covered later.`,
      },
    },
    blocks: {
      title: 'Pages become blocks',
      alt: 'Four cube-shaped blocks stand in a row, each holding a few small transaction parcels on top.',
      body: {
        beginner: `Writing one line at a time to thousands of notebooks would be chaos. So lines are collected into pages.

Each full page is called a [[block]]. A block holds a batch of payments that happened around the same time.

Blocks are numbered and placed one after another, like pages in a book. The very first one is the [[genesis-block]].`,
        intermediate: `[[transaction|Transactions]] are grouped into a [[block]]. A block has two parts:

- a **body**: the list of transactions;
- a [[block-header]]: a small summary with the block's number, a [[timestamp]], and a reference to the previous block.

Bitcoin produces a block about every 10 minutes; Ethereum every 12 seconds. The first block of any chain, the [[genesis-block]], is fixed in the software itself.`,
        expert: `A [[block]] is a [[block-header]] plus an ordered transaction list. The header commits to the body through a [[merkle-root]], so the header alone (80 bytes in Bitcoin) is enough to verify that a given transaction belongs to the block, using a logarithmic-size proof.

Bitcoin's header fields: \`version\`, \`prevBlockHash\`, \`merkleRoot\`, \`timestamp\`, \`bits\` (encoded target) and \`nonce\`. Ethereum's header carries more commitments: \`stateRoot\`, \`transactionsRoot\`, \`receiptsRoot\`, \`baseFeePerGas\` and others.

The [[genesis-block]] has no parent and is hard-coded into every client.`,
      },
      code: {
        lang: 'C++ (Bitcoin block header)',
        source: `struct BlockHeader {
  int32_t  nVersion;
  uint256  hashPrevBlock;   // link to the parent
  uint256  hashMerkleRoot;  // commits to every tx
  uint32_t nTime;
  uint32_t nBits;           // compact target
  uint32_t nNonce;
};                          // 80 bytes serialized`,
      },
    },
    fingerprint: {
      title: "Each block carries the previous block's fingerprint",
      alt: 'The four blocks are now joined by chain links. Each block shows its own hash and the hash of the block before it. Behind them a bench holds a typed text and its hash, drawn as a row of 32 bars.',
      body: {
        beginner: `Every block gets a fingerprint: a short code calculated from everything written inside it. Change a single letter and the fingerprint comes out completely different. This fingerprint is called a [[hash]].

Here is the trick: each new block **writes down the fingerprint of the block before it**.

That is the "chain" in blockchain. The blocks are linked by fingerprints, each one pointing back to the one before.

**Try it:** type anything into the box under the scene. The row of bars behind the chain is the fingerprint of your text. Add or delete a single letter and almost every bar jumps; the panel counts how many of the 64 characters changed.`,
        intermediate: `A [[hash]] function turns any data into a fixed-length code. Bitcoin uses [[sha-256]], which always outputs 256 bits (64 hex characters).

Useful properties:

- the same input always gives the same hash;
- a tiny change gives a totally different hash;
- you cannot work backwards from the hash to the data.

Each [[block-header]] contains the hash of the previous header. So a block's own hash depends on its content **and** on its parent, and through the parent on every block before it.

**Try it:** the box under the scene runs real [[sha-256]] on your text at every keystroke and highlights the characters that changed. Each hex character has 16 possible values, so even the smallest edit changes about 60 of the 64.`,
        expert: `Blocks form a hash-linked list: \`header.prevHash = H(parentHeader)\`. Bitcoin uses double [[sha-256]] over the 80-byte header; Ethereum uses Keccak-256 over the RLP-encoded header.

Security rests on the hash function being collision resistant and second-preimage resistant: finding a different block with the same hash should cost about 2^256 work for a second preimage, 2^128 for a collision.

Because each header commits to its parent, the tip hash commits to the **entire** history. A light client that trusts one recent block hash can verify any earlier block by following the links.

The box under the scene hashes your text with [[sha-256]] on every keystroke; the 32 bars are the 32 output bytes. A good hash function shows the avalanche effect: flipping one input bit flips each output bit with probability one half, so expect about 128 of the 256 bits, and 60 of the 64 hex characters, to differ after any edit.`,
      },
      code: {
        lang: 'Python',
        source: `import hashlib

def block_hash(index, prev_hash, data):
    payload = f"{index}|{prev_hash}|{data}".encode()
    return hashlib.sha256(payload).hexdigest()

prev = "0" * 64
for i, data in enumerate(["Genesis", "A->B: 5", "B->C: 2"]):
    prev = block_hash(i, prev, data)   # next block stores this`,
      },
    },
    tamper: {
      title: 'Change one thing and the chain breaks',
      alt: 'One block (block 2 unless another one is picked) has been edited and glows. The link after it is snapped, and the later blocks have turned red because their stored fingerprint no longer matches. Blocks that were redone turn green.',
      body: {
        beginner: `Try it: type something different into block 2 using the box under the scene.

The moment you change it, block 2 gets a new fingerprint. But block 3 still has the **old** fingerprint written inside. They no longer match, so the link snaps, and every block after it is now suspect.

Anyone comparing copies sees immediately that something was altered.

**Now try to cover it up:** press **Redo block 3**. Its link is repaired, but that gave block 3 a new fingerprint, so the link to block 4 snaps instead. You have to redo every block up to the end. Pick a different block with the 1–4 buttons and count how many you must redo.`,
        intermediate: `Edit block 2's data below and watch its [[hash]] change.

Block 3 stores the previous hash of block 2. After your edit that stored value points at a block that no longer exists, so block 3 is invalid. Block 4 points at block 3, so it is invalid too.

To hide the edit you would have to recompute block 3 with the new hash, which changes block 3's hash, which forces you to recompute block 4, and so on to the tip of the chain. This property is called [[immutability]].

**Do it by hand:** each press of **Redo** fixes the first bad link and breaks the next one. When the last block is done the chain is consistent again, yet its last hash differs from the one every other [[node]] holds. Use the 1–4 buttons to edit an earlier or a later block and compare how much has to be redone.`,
        expert: `The hashes in this scene are real [[sha-256]] digests computed in your browser on every keystroke.

Editing block *i* changes \`H(block_i)\`. Block *i+1* still commits to the old digest, so validation fails at height *i+1*: \`block[i+1].prevHash != H(block[i])\`. Repairing it means rewriting \`prevHash\` in every descendant, changing each of their hashes in turn.

On its own this is cheap: SHA-256 runs at millions of hashes per second on a laptop. The linked list makes edits **evident**, not **expensive**. Expense is added by [[proof-of-work]] or [[proof-of-stake]], which make each block costly to produce.

The **Redo** button performs one repair: it sets \`prevHash\` of the first invalid block to its parent's new digest and rehashes it. Editing block *i* of *n* therefore costs *n − i* rehashes, and the repaired tip hash is not the original one, so any peer comparing tips still sees a different chain.`,
      },
    },
    history: {
      title: 'Why history is hard to rewrite',
      alt: "Two rows of blocks run side by side. On the left, the honest chain has buried the block that holds the payment under several new blocks. On the right, the attacker's copy starts with an edited block and has far fewer blocks built on it.",
      body: {
        beginner: `Suppose a cheater edits an old block in their own copy. To make it look valid, they must redo every block after it.

Meanwhile, everyone else keeps adding new blocks to the real chain. The cheater is always behind, like trying to rewrite a book while thousands of people keep adding pages to the original.

The network simply ignores the shorter, altered copy. That is why records on a blockchain are considered permanent.

**Try it:** the first slider gives the cheater a bigger share of the network's computing power; the second buries the payment under more blocks. Watch how far the cheater's row gets in the same time, and how the chance of ever catching up shrinks with every extra block.`,
        intermediate: `An attacker who edits block 2 must rebuild blocks 3, 4, 5… and still catch up with the honest chain, which keeps growing.

[[node|Nodes]] follow a simple rule: accept the valid chain that has the most work or stake behind it. An altered copy that lags behind is just ignored.

So the deeper a block is buried, the safer it is. This is why people wait for several [[confirmation|confirmations]] before treating a payment as final.

**Try it** for a [[proof-of-work]] chain. With 10% of the mining power and 6 blocks on top, the attacker's chance of ever catching up is about 0.02%. Slide the share towards 49%, or the depth down to 1, and it climbs quickly.`,
        expert: `With [[proof-of-work]], every block needs a costly [[nonce]] search. Rewriting from depth *z* means out-producing the honest network for *z* blocks. For an attacker with hashrate share *q* < 0.5, the success probability falls roughly as \`(q/p)^z\` where \`p = 1 − q\` (Nakamoto, section 11). With *q* = 0.1 and *z* = 6 that is below 0.1%.

With [[proof-of-stake]], reverting a finalized block requires at least one third of the total stake to sign conflicting messages, which the protocol detects and destroys through [[slashing]].

In both designs the hash links turn "change one block" into "redo all the work since", and [[consensus]] makes that work prohibitively expensive.

The sliders use Nakamoto's full calculation. While the honest network finds *z* blocks, the attacker's own progress is Poisson-distributed with mean \`λ = z·q/p\`. Having found *k*, the attacker still has to make up *z − k*, which succeeds with probability \`(q/p)^(z−k)\`. Summing over *k* gives \`P = 1 − Σ (λ^k e^−λ / k!)·(1 − (q/p)^(z−k))\`: 0.024% for *q* = 0.1 and *z* = 6. To push *P* below 0.1% takes *z* = 5 at *q* = 0.1 but *z* = 24 at *q* = 0.3.`,
      },
      code: {
        lang: 'C (Bitcoin whitepaper, section 11)',
        source: `double AttackerSuccessProbability(double q, int z)
{
    double p = 1.0 - q;
    double lambda = z * (q / p);
    double sum = 1.0;
    int i, k;
    for (k = 0; k <= z; k++)
    {
        double poisson = exp(-lambda);
        for (i = 1; i <= k; i++)
            poisson *= lambda / i;
        sum -= poisson * (1 - pow(q / p, z - k));
    }
    return sum;
}`,
      },
    },
    uses: {
      title: 'Not only money',
      alt: 'The chain of four blocks sits in front. Behind it stand six small models: coins, a framed picture, an identity card, crates on a pallet, a ballot box, and a sword with a shield. The selected one glows and sends a parcel into the chain.',
      body: {
        beginner: `A [[blockchain]] is a shared notebook, and a notebook does not care what you write in it. The first one, [[bitcoin]], recorded payments. The same idea works for any record that many people need to agree on and nobody should be able to change quietly.

Tap the buttons under the scene to look at a few:

- **Ownership**: who owns a concert ticket or a piece of digital art.
- **Identity**: proof that a diploma or a licence is genuine.
- **Supply chain**: every hand a shipment passed through.
- **Votes**: a count that anyone can check again.
- **Game items**: a sword that belongs to the player, not to the game company.

All of them use the same blocks and the same fingerprints you just saw.

This course follows the **money** path from here on. Money was the first use, and the tools built for it (coins, exchanges, lending, together called DeFi) are what the remaining lessons explain. The ideas carry over to every other use.`,
        intermediate: `What a chain really stores is an ordered list of signed [[transaction|transactions]]. Whether one of them means "pay 5 coins" or "this ticket now belongs to Cem" is decided by the rules that read it.

On [[ethereum]] and similar chains those rules are programs called [[smart-contract|smart contracts]]:

- a [[token]] contract keeps a table of balances: money, points, shares;
- an NFT contract keeps a table from item number to owner: art, tickets, game items;
- a registry contract stores the [[hash]] of a document, so anyone can check later that a diploma or a shipping record was not altered;
- a voting contract counts the signed votes of eligible accounts.

Two limits apply to all of them. Everything written to a public chain is visible to everyone, so personal data stays off it and only a hash goes on. And the chain proves **who wrote what, and when**. It cannot prove that the crate really holds what the record says.

Select each use under the scene. From the next lesson on, this course follows the financial one: money, exchanges and DeFi.`,
        expert: `Seen abstractly, a [[blockchain]] is a replicated state machine with a public, ordered, signed input log. An application is a state-transition function over that log. Payments are one such function; nothing in the [[consensus]] layer is specific to money.

Common application standards on [[ethereum]]:

- [[erc-20]]: fungible balances, \`balanceOf(address) → uint256\`.
- ERC-721: unique items (NFTs), \`ownerOf(tokenId) → address\`.
- ERC-1155: many fungible and non-fungible token types in one contract, widely used for game items.
- Credentials: schemes that use a chain typically keep the signed document off-chain and anchor only issuer identifiers, hashes or revocation status.
- Governance: voting contracts such as OpenZeppelin's Governor count token-weighted votes and execute the result on-chain.

What the chain adds is ordering, availability and a [[digital-signature]] on every entry. What it cannot add is truth about the outside world: a record saying "crate 17 holds 200 kg of coffee" is only as good as whoever signed it. This is known as the oracle problem. Storage is also public and costly: writing a new 32-byte slot on Ethereum costs 20,000 [[gas]] or more, so applications commit to a [[hash]] or a [[merkle-root]] and keep the data elsewhere.

The rest of this course takes the financial branch: [[transaction|transactions]] and fees, [[consensus]], then [[token|tokens]], [[dex|exchanges]] and DeFi.`,
      },
      code: {
        lang: 'Solidity (illustrative)',
        source: `// One chain, four kinds of record.
mapping(address => uint256) public balanceOf;  // money (ERC-20)
mapping(uint256 => address) public ownerOf;    // one item, one owner (ERC-721)
mapping(bytes32 => uint64)  public anchoredAt; // document hash -> when it was recorded
mapping(uint256 => mapping(address => bool)) public hasVoted; // proposal -> voter`,
      },
    },
  },
};

export default content;

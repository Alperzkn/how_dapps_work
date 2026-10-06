import type { LessonContent } from '../../../types';

const content: LessonContent = {
  title: 'What is a blockchain?',
  summary: 'A shared record that everyone can check and nobody can quietly rewrite.',
  labels: {
    sharedLedger: 'Shared ledger',
    copy: 'own copy',
    block: 'Block',
    genesis: 'Block 1 · genesis',
    prev: 'prev',
    hash: 'hash',
    edited: 'edited',
    broken: 'link broken',
    newBlock: 'new block',
    honest: 'Honest chain',
    attacker: "Attacker's copy",
    redo: 'must redo',
    editPrompt: 'Change the data in block 2',
    hashOf: 'Block 2 hash',
    reset: 'Reset',
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
      alt: 'The four blocks are now joined by chain links. Each block shows its own hash and the hash of the block before it.',
      body: {
        beginner: `Every block gets a fingerprint: a short code calculated from everything written inside it. Change a single letter and the fingerprint comes out completely different. This fingerprint is called a [[hash]].

Here is the trick: each new block **writes down the fingerprint of the block before it**.

That is the "chain" in blockchain. The blocks are linked by fingerprints, each one pointing back to the one before.`,
        intermediate: `A [[hash]] function turns any data into a fixed-length code. Bitcoin uses [[sha-256]], which always outputs 256 bits (64 hex characters).

Useful properties:

- the same input always gives the same hash;
- a tiny change gives a totally different hash;
- you cannot work backwards from the hash to the data.

Each [[block-header]] contains the hash of the previous header. So a block's own hash depends on its content **and** on its parent, and through the parent on every block before it.`,
        expert: `Blocks form a hash-linked list: \`header.prevHash = H(parentHeader)\`. Bitcoin uses double [[sha-256]] over the 80-byte header; Ethereum uses Keccak-256 over the RLP-encoded header.

Security rests on the hash function being collision resistant and second-preimage resistant: finding a different block with the same hash should cost about 2^256 work for a second preimage, 2^128 for a collision.

Because each header commits to its parent, the tip hash commits to the **entire** history. A light client that trusts one recent block hash can verify any earlier block by following the links.`,
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
      alt: 'Block 2 has been edited and glows. The link after it is snapped, and blocks 3 and 4 have turned red because their stored fingerprint no longer matches.',
      body: {
        beginner: `Try it: type something different into block 2 using the box under the scene.

The moment you change it, block 2 gets a new fingerprint. But block 3 still has the **old** fingerprint written inside. They no longer match, so the link snaps, and every block after it is now suspect.

Anyone comparing copies sees immediately that something was altered.`,
        intermediate: `Edit block 2's data below and watch its [[hash]] change.

Block 3 stores the previous hash of block 2. After your edit that stored value points at a block that no longer exists, so block 3 is invalid. Block 4 points at block 3, so it is invalid too.

To hide the edit you would have to recompute block 3 with the new hash, which changes block 3's hash, which forces you to recompute block 4, and so on to the tip of the chain. This property is called [[immutability]].`,
        expert: `The hashes in this scene are real [[sha-256]] digests computed in your browser on every keystroke.

Editing block *i* changes \`H(block_i)\`. Block *i+1* still commits to the old digest, so validation fails at height *i+1*: \`block[i+1].prevHash != H(block[i])\`. Repairing it means rewriting \`prevHash\` in every descendant, changing each of their hashes in turn.

On its own this is cheap: SHA-256 runs at millions of hashes per second on a laptop. The linked list makes edits **evident**, not **expensive**. Expense is added by [[proof-of-work]] or [[proof-of-stake]], which make each block costly to produce.`,
      },
    },
    history: {
      title: 'Why history is hard to rewrite',
      alt: 'The honest chain along the back keeps receiving new blocks. In front, an attacker has a copy with one edited block and is stuck redoing the blocks after it.',
      body: {
        beginner: `Suppose a cheater edits an old block in their own copy. To make it look valid, they must redo every block after it.

Meanwhile, everyone else keeps adding new blocks to the real chain. The cheater is always behind, like trying to rewrite a book while thousands of people keep adding pages to the original.

The network simply ignores the shorter, altered copy. That is why records on a blockchain are considered permanent.`,
        intermediate: `An attacker who edits block 2 must rebuild blocks 3, 4, 5… and still catch up with the honest chain, which keeps growing.

[[node|Nodes]] follow a simple rule: accept the valid chain that has the most work or stake behind it. An altered copy that lags behind is just ignored.

So the deeper a block is buried, the safer it is. This is why people wait for several [[confirmation|confirmations]] before treating a payment as final.`,
        expert: `With [[proof-of-work]], every block needs a costly [[nonce]] search. Rewriting from depth *z* means out-producing the honest network for *z* blocks. For an attacker with hashrate share *q* < 0.5, the success probability falls roughly as \`(q/p)^z\` where \`p = 1 − q\` (Nakamoto, section 11). With *q* = 0.1 and *z* = 6 that is below 0.1%.

With [[proof-of-stake]], reverting a finalized block requires at least one third of the total stake to sign conflicting messages, which the protocol detects and destroys through [[slashing]].

In both designs the hash links turn "change one block" into "redo all the work since", and [[consensus]] makes that work prohibitively expensive.`,
      },
    },
  },
};

export default content;

import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    alice: "Alice's wallet",
    keyStays: 'the key stays here',
    privateKey: 'private key',
    privateKeyNote: '256-bit secret',
    publicKey: 'public key',
    verify: 'signature is valid',
    address: 'address',
    transaction: 'transaction',
    txSummary: 'to Bob · 1 ETH',
    signature: 'signature',
    signedTx: 'signed transaction',
    firstNode: 'first node (RPC)',
    relay: 'nodes pass it on',
    mempool: 'mempool',
    yourTx: "Alice's tx",
    highFee: 'pays most, goes first',
    lowFee: 'pays least, waits',
    tip: 'tip',
    newBlock: 'new block',
    producer: 'block producer',
    burned: 'base fee: burned',
    tipTo: 'tip → producer',
    confirmation: 'confirmation',
    confirmations: 'confirmations',
    bob: 'Bob',
  },
  steps: {
    keys: {
      title: 'A wallet is a pair of keys',
      alt: "Alice's wallet stands behind a glowing key. An arrow leads from the key to a padlock and another from the padlock to a name plate: private key, public key, address.",
      body: {
        beginner: `A [[wallet]] does not hold coins. The coins are lines in the shared [[ledger]]. What the wallet holds is a secret that proves those lines are yours.

That secret is the [[private-key]]: think of it as the only key to your mailbox. From it the wallet works out a [[public-key]], which is like the lock, and from that an [[address]], which is like the mailbox number you give to people so they can pay you.

The arrows only go one way. Anyone may see your address; nobody can work backwards from it to your key. Lose the private key and the coins are stuck forever. Leak it and they are someone else's.`,
        intermediate: `A [[wallet]] is software or a device that stores keys and signs with them. Balances live on the chain, under an [[address]].

- The [[private-key]] is a random 256-bit number.
- The [[public-key]] is computed from it. Going the other way is not feasible.
- The [[address]] is a short form of the public key: 20 bytes on Ethereum, written as \`0x\` followed by 40 hex characters.

Most wallets do not make you back up each key. They generate one [[seed-phrase]] of 12 or 24 words and derive every key from it, so those words are the real secret. There is no "forgot my password" link, because nobody else has a copy.`,
        expert: `Bitcoin and Ethereum both use the elliptic curve secp256k1 (\`y² = x³ + 7\` over a 256-bit prime field) with a base point \`G\` of prime order \`n\`.

- [[private-key]]: an integer \`d\` with \`1 ≤ d < n\`.
- [[public-key]]: the curve point \`Q = d·G\`, 64 bytes as \`X ‖ Y\` or 33 bytes compressed. Recovering \`d\` from \`Q\` is the elliptic-curve discrete logarithm problem; the best known attacks cost about 2^128 operations.
- Ethereum [[address]]: the last 20 bytes of \`keccak256(X ‖ Y)\`. Bitcoin's P2PKH and P2WPKH addresses hash the public key with SHA-256 and then RIPEMD-160, and encode the result as Base58Check or Bech32.

A [[seed-phrase]] follows BIP-39: 128 to 256 bits of entropy plus a checksum, mapped to words from a list of 2048, then stretched with PBKDF2-HMAC-SHA512 (2048 rounds) into a 512-bit seed. BIP-32 derives a tree of keys from that seed; the usual first Ethereum account is at path \`m/44'/60'/0'/0/0\`.

All of this describes an externally owned account. A [[smart-contract]] account has an address but no private key.`,
      },
      code: {
        lang: 'JavaScript (ethers v6)',
        source: `import { Wallet, keccak256, dataSlice, getAddress } from "ethers";

const wallet = Wallet.createRandom();      // BIP-39 phrase -> BIP-32 key
wallet.mnemonic.phrase;                    // the 12 words
wallet.privateKey;                         // d, 32 bytes

const Q = wallet.signingKey.publicKey;     // 0x04 ‖ X ‖ Y, 65 bytes
const hash = keccak256(dataSlice(Q, 1));   // drop the 0x04 prefix
getAddress(dataSlice(hash, 12));           // last 20 bytes == wallet.address`,
      },
    },
    sign: {
      title: 'Signing a transaction',
      alt: 'A transaction form lies in front of the wallet. The key presses a seal onto it, and the padlock beside it shows a green light: the signature checks out.',
      body: {
        beginner: `To pay Bob, Alice's wallet fills in a short form: who gets the money and how much. That form is a [[transaction]].

Then the wallet stamps it with her [[private-key]]. The stamp is a [[digital-signature]]. It works like a wax seal pressed with a ring only Alice owns, with one improvement: the seal is made for *this exact form*. Change one digit and the seal no longer fits, and it cannot be lifted off and stuck onto another form.

Anyone can check the seal using Alice's [[public-key]]. Nobody can make one without her private key. The key never leaves the wallet; only the sealed form does.`,
        intermediate: `A [[transaction]] is a small signed message. On Ethereum it says:

- **to**: the receiving [[address]];
- **value**: how much to send;
- **nonce**: a counter, explained below;
- **fee limits**: the most the sender is willing to pay.

The wallet hashes these fields and signs the [[hash]] with the [[private-key]]. The [[digital-signature]] proves two things: the holder of that key approved the message, and nothing in it was changed afterwards.

The [[account-nonce]] is the number of transactions this account has already sent. Each new one must use the next number: 0, 1, 2 and so on. That fixes their order and stops anyone from copying a signed payment and submitting it a second time.`,
        expert: `An [[eip-1559]] transaction (type \`0x02\`) carries \`chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList\` and the signature \`yParity, r, s\`. The signed digest is \`h = keccak256(0x02 ‖ rlp([chainId, …, accessList]))\`.

[[ecdsa]] signing with private key \`d\`: pick a secret number \`k\`, compute \`R = k·G\`, then \`r = R.x mod n\` and \`s = k⁻¹(h + r·d) mod n\`. Verification computes \`R' = (h·s⁻¹)·G + (r·s⁻¹)·Q\` and accepts if \`R'.x ≡ r (mod n)\`.

Details that matter:

- \`k\` must stay secret and never repeat. Two signatures made with the same \`k\` reveal \`d\`. Wallets derive \`k\` deterministically (RFC 6979).
- The transaction has no sender field. Nodes recover \`Q\` from \`(h, r, s, yParity)\` and derive the [[address]] from it.
- \`(r, n − s)\` is a valid signature too, so Ethereum accepts only \`s ≤ n/2\` (EIP-2). Otherwise a third party could alter the transaction hash.
- \`chainId\` is part of the digest (EIP-155), so a signature cannot be replayed on another chain.

The [[account-nonce]] must equal the sender's nonce in state at the moment the transaction executes. A lower one is rejected; a higher one has to wait.`,
      },
      code: {
        lang: 'EIP-1559 transaction (type 0x02)',
        source: `0x02 ‖ rlp([
  chainId,               // 1 = Ethereum mainnet
  nonce,                 // 7: the sender's 8th transaction
  maxPriorityFeePerGas,  // 2 gwei tip
  maxFeePerGas,          // 30 gwei ceiling
  gasLimit,              // 21000 for a plain transfer
  to,                    // 20-byte address
  value,                 // in wei: 1 ETH = 10^18 wei
  data,                  // empty for a plain transfer
  accessList,
  yParity, r, s          // the signature
])`,
      },
    },
    broadcast: {
      title: 'Broadcasting to the network',
      alt: "The signed transaction leaves Alice's wallet as a small parcel, hops to a first node, and that node passes copies on to the nodes next to it. The key stays behind in the wallet.",
      body: {
        beginner: `The sealed form now has to reach the people who keep the [[ledger]]. The wallet hands it to one computer on the network, a [[node]].

That node checks the seal. If it is good, it tells the nodes it is connected to; they check and tell theirs. Within a second or two, computers all over the world have heard about Alice's payment.

Notice what travelled: the signed [[transaction]] and nothing else. The [[private-key]] stayed in the wallet. That is why you can send a payment through computers you do not trust.`,
        intermediate: `A [[wallet]] is usually not a [[node]] itself. It sends the signed [[transaction]] to a node through an interface called [[rpc]]; which node that is depends on the wallet's network settings.

That first node runs basic checks before accepting anything:

- is the [[digital-signature]] valid?
- is the [[account-nonce]] still unused?
- can the account pay the amount plus the maximum fee?

If so, it stores the transaction and announces it to its peers, which repeat the same checks and pass it on. This way of spreading news is called [[gossip]].

Nothing has changed on the [[ledger]] yet. The network knows about the transaction, but it is not in a [[block]].`,
        expert: `The wallet submits the raw signed bytes with the [[json-rpc]] method \`eth_sendRawTransaction\`, which returns the transaction hash: \`keccak256\` of the full signed encoding. The hash is known before inclusion; a receipt exists only afterwards.

On Ethereum's execution layer, transactions spread over devp2p (the \`eth\` protocol, version 68). A node sends the full transaction to a small subset of its peers and announces only the hash to the rest with \`NewPooledTransactionHashes\`; a peer that lacks it asks with \`GetPooledTransactions\`. Bitcoin does the same with \`inv\`, \`getdata\` and \`tx\` messages.

Checks before a node admits and relays a transaction: the encoding is well formed, the signature recovers, \`nonce ≥\` the account nonce, \`balance ≥ gasLimit × maxFeePerGas + value\`, \`gasLimit ≥\` the intrinsic [[gas]] (21000 for a plain transfer), and the fee meets the node's own minimum.

A transaction in the public pool is visible to everyone before it executes. That is what makes front-running and sandwich attacks possible, and why some users send to a private relay or straight to block builders instead.`,
      },
      code: {
        lang: 'JSON-RPC',
        source: `// request: the signed type-2 transaction bytes
{ "jsonrpc": "2.0", "id": 1,
  "method": "eth_sendRawTransaction",
  "params": ["0x02f8…"] }

// response: the transaction hash
{ "jsonrpc": "2.0", "id": 1, "result": "0x9fc7…" }`,
      },
    },
    mempool: {
      title: 'Waiting in the mempool',
      alt: "An open tray holds six waiting transactions in a row, each on a stand whose height is the tip it offers. Alice's transaction glows in third place.",
      body: {
        beginner: `Alice's payment is not in the [[ledger]] yet. It sits in a waiting room together with everyone else's. That waiting room is the [[mempool]].

Each new [[block]] has limited space, so not everybody gets in at once. Every [[transaction]] offers a small fee, and the ones offering more are picked first, like a queue where a bigger tip moves you forward.

When the network is quiet, a small fee gets you in right away. When it is busy, you pay more or wait longer.`,
        intermediate: `Each [[node]] keeps its own [[mempool]]: the valid [[transaction|transactions]] it has heard of that are not in a [[block]] yet. There is no single official list, and two nodes may hold slightly different sets.

Work on Ethereum is measured in [[gas]]. A plain transfer uses 21,000 gas. The [[gas-fee]] is the gas used times a price per unit, quoted in gwei (a billionth of an ETH). Since [[eip-1559]] that price has two parts:

- a **base fee** set by the protocol, which rises when blocks are full and falls when they are not;
- a **tip** that goes to whoever builds the block.

Block builders sort by tip, so a higher tip means a shorter wait. A transaction stuck with too low a fee can be replaced: sign a new one with the **same** [[account-nonce]] and a higher fee, and only one of the two can ever be included.`,
        expert: `A [[mempool]] is local policy, not [[consensus]]. Each node decides what to keep, how much, and what to evict; Bitcoin Core defaults to 300 MB and a 14-day expiry.

[[eip-1559]] pricing, per unit of [[gas]]:

- \`baseFeePerGas\` is fixed for each block by the protocol. With a gas target of half the gas limit, \`baseFee' = baseFee × (1 + (gasUsed − target) / target / 8)\`, so it moves by at most 12.5% per block.
- The proposer receives \`min(maxPriorityFeePerGas, maxFeePerGas − baseFee)\` per gas.
- A transaction with \`maxFeePerGas < baseFee\` cannot be included until the base fee falls.

Nonce rules shape the pool. Geth keeps *pending* transactions (executable now) apart from *queued* ones (there is a gap in the [[account-nonce]] sequence); a queued transaction cannot run until the gap is filled. A replacement with the same nonce must raise both fee fields by at least 10% under Geth's default settings.

Ordering is the builder's choice. Sorting by effective tip is the simple strategy; in practice most Ethereum blocks come from specialised builders that order transactions to capture MEV and bid for the proposer's slot.`,
      },
      code: {
        lang: 'Python (EIP-1559 base fee)',
        source: `ELASTICITY = 2
MAX_CHANGE_DENOMINATOR = 8

def next_base_fee(base_fee, gas_used, gas_limit):
    target = gas_limit // ELASTICITY
    if gas_used == target:
        return base_fee
    delta = base_fee * abs(gas_used - target) // target // MAX_CHANGE_DENOMINATOR
    if gas_used > target:
        return base_fee + max(delta, 1)   # full block: up to +12.5%
    return base_fee - delta               # empty block: down to -12.5%`,
      },
    },
    included: {
      title: 'Into a block',
      alt: "The three transactions with the highest tips, Alice's among them, have moved from the tray onto a new block at the end of the chain. A block producer stands next to it; the other transactions stay in the tray for the next block.",
      body: {
        beginner: `Every so often, one participant gets to write the next page of the [[ledger]]. They pick [[transaction|transactions]] from the waiting room, best fees first, and pack them into a new [[block]].

Alice's payment made it in. The block is sent to everyone, each [[node]] checks it, and each one updates its copy: Alice's balance goes down, Bob's goes up.

The fee Alice paid is the price of that space in the block. The payments that did not fit stay in the waiting room and try again next time.`,
        intermediate: `A block producer (a [[miner]] on Bitcoin, a [[validator]] on Ethereum) selects [[transaction|transactions]] from its [[mempool]], runs them in order and publishes the resulting [[block]]. Ethereum produces one every 12 seconds, Bitcoin about every 10 minutes.

Running Alice's transaction does three things at once:

- moves 1 ETH from her account to Bob's;
- raises her [[account-nonce]] from 7 to 8;
- charges the [[gas-fee]]: 21,000 gas × (base fee + tip).

With a base fee of 20 gwei and a tip of 2 gwei that is 21,000 × 22 = 462,000 gwei, or 0.000462 ETH. The base fee part is destroyed ("burned"); only the tip goes to the producer.

Every other [[node]] re-runs the block and must arrive at the same balances, or it rejects the block.`,
        expert: `When a transaction executes, the client checks \`tx.nonce == account.nonce\`, \`maxFeePerGas ≥ baseFeePerGas\` and \`balance ≥ gasLimit × maxFeePerGas + value\`. It then charges \`gasLimit × effectiveGasPrice\` up front, where \`effectiveGasPrice = baseFeePerGas + min(maxPriorityFeePerGas, maxFeePerGas − baseFeePerGas)\`.

After execution the unused [[gas]] is refunded, so the final [[gas-fee]] is \`gasUsed × effectiveGasPrice\`. Of that, \`gasUsed × baseFeePerGas\` is burned and the rest is credited to the block's \`feeRecipient\`.

The nonce is incremented and the fee is paid even if execution reverts. A revert undoes the state changes of the call, not the fact that the transaction was included.

The receipt returned over RPC includes \`status\`, \`gasUsed\`, \`cumulativeGasUsed\`, \`effectiveGasPrice\` and \`logs\`. The [[block-header]] commits to the outcome through \`stateRoot\`, \`transactionsRoot\` and \`receiptsRoot\`, so a [[full-node]] that re-executes the block and gets a different root rejects it. \`eth_getTransactionReceipt\` returns \`null\` until the transaction is in a block.`,
      },
      code: {
        lang: 'Worked example',
        source: `gasUsed              = 21000
baseFeePerGas        = 20 gwei
maxPriorityFeePerGas =  2 gwei
maxFeePerGas         = 30 gwei

priorityFee = min(2, 30 - 20)   =      2 gwei
fee         = 21000 × (20 + 2)  = 462000 gwei   // 0.000462 ETH
burned      = 21000 × 20        = 420000 gwei
to proposer = 21000 × 2         =  42000 gwei`,
      },
    },
    confirmations: {
      title: 'Confirmations',
      alt: "New blocks are added one by one after the block that holds Alice's transaction, each numbered as one more confirmation. Bob's wallet glows and has coins beside it.",
      body: {
        beginner: `Bob can see the payment as soon as the [[block]] arrives. But the newest page of the [[ledger]] is also the easiest one to undo, so for anything valuable he waits a little.

Every block added after Alice's block is one more [[confirmation]]. Each one buries her payment deeper: to undo it, someone would have to redo all the blocks on top as well.

For a cup of coffee, one confirmation is plenty. For a house, you wait for more.`,
        intermediate: `A [[transaction]] in the newest [[block]] has 1 [[confirmation]]. Each block built on top adds one.

Why wait? Now and then two blocks appear at the same height and the network keeps only one of them. A transaction in the dropped block goes back to the [[mempool]] and normally gets into a later block, but for a moment it looked confirmed and then was not.

How long people wait depends on the chain:

- **Bitcoin**: the common rule is 6 confirmations, about an hour.
- **Ethereum**: a block becomes *finalized* about a quarter of an hour after it appears. From then on it cannot be reverted unless the attackers give up an enormous deposit.

Exchanges set their own thresholds and raise them for small or less secure chains.`,
        expert: `Under [[proof-of-work]], [[finality]] is probabilistic. An attacker with a share \`q\` of the [[hashrate]] who is \`z\` blocks behind catches up with probability of about \`(q/p)^z\`, where \`p = 1 − q\`. For \`q = 0.1\` and \`z = 6\` that is below 0.1%. It never reaches zero, and for \`q ≥ 0.5\` it is 1.

Ethereum's [[proof-of-stake]] adds explicit [[finality]]. Time is divided into [[slot|slots]] of 12 seconds and [[epoch|epochs]] of 32 slots (6.4 minutes). [[casper-ffg]] justifies an epoch's checkpoint once [[validator|validators]] holding two thirds of the [[stake]] vote for it, and finalizes a checkpoint when the next one is justified directly on top of it. A block is therefore finalized two to three epochs after it appears, roughly 13 to 19 minutes. Reverting it would require at least one third of the stake to sign conflicting votes and lose that stake to [[slashing]].

Applications pick their own risk level through the block tags of the RPC interface: \`latest\` (may still be reorged), \`safe\` (justified) and \`finalized\`.

If a [[reorg]] removes the block, the transaction is not lost. It returns to the [[mempool]] and remains valid as long as its [[account-nonce]] is still unused.`,
      },
      code: {
        lang: 'JavaScript (ethers v6)',
        source: `const tx = await wallet.sendTransaction({ to: bob, value: parseEther("1") });

const receipt = await tx.wait(1);   // 1 confirmation: it is in a block
await tx.wait(6);                   // 6 blocks deep

const final = await provider.getBlock("finalized");
if (receipt.blockNumber <= final.number) {
  // behind the finalized checkpoint: only slashing-level faults can revert it
}`,
      },
    },
  },
};

export default content;

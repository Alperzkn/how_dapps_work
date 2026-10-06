import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    normalApp: 'Normal app',
    companyServer: 'Company server',
    privateApi: 'HTTPS · private API',
    dapp: 'Dapp',
    website: 'Website',
    uiUpdates: 'Page shows',
    wallet: 'Wallet',
    rpcNode: 'RPC node',
    contract: 'Smart contract',
    network: 'network nodes',
    everyNode: 'every node runs it',
    publicRpc: 'JSON-RPC · public state',
    staticHost: 'Static host',
    keyStays: 'key stays inside',
    request: 'Request',
    signed: 'signed',
    read: 'read · free',
    write: 'write · costs gas',
    balances: 'balances',
    indexer: 'Indexer',
    event: 'events',
    tryCompare: 'Try it: switch the servers off',
    shutDown: 'The company switches its servers off',
    openOther: 'Open another frontend',
    closeOther: 'Close it',
    works: 'works',
    offline: 'offline',
    noSite: 'website gone, contract still running',
    viaOther: 'works through another frontend',
    serverOff: 'Server: off',
    siteOff: 'Official site: offline',
    stillRunning: 'still running',
    otherFrontend: 'Another frontend',
    down: 'down',
    reqA: 'Request A',
    reqB: 'Request B',
    confirm: 'Confirm',
    reject: 'Reject',
    askAgain: 'Ask again',
    reqTo: 'To',
    reqFn: 'Function',
    recipient: 'Recipient',
    spender: 'Spender',
    account: 'Account',
    amount: 'Amount',
    unlimited: 'unlimited',
    tokenContract: 'Token',
    unknown: 'unknown',
    status: 'Status',
    waiting: 'waiting for you',
    signedOk: 'signed and sent',
    signedBad: 'signed: that address can now take all your tokens',
    rejectedMsg: 'rejected: nothing was signed',
    signature: 'Signature',
    askTransfer: 'send 10 tokens to Ben',
    askApprove: 'let a stranger spend your tokens',
    rejectedTag: 'rejected',
    modeRead: 'Read',
    modeWrite: 'Write',
    providerDown: 'Provider is down',
    switchProvider: 'Switch provider',
    switchBack: 'Switch back',
    method: 'Method',
    gasStat: 'Gas',
    free: 'free',
    paysGas: 'costs a fee',
    required: 'required',
    notNeeded: 'not needed',
    answer: 'Answer',
    instant: 'at once, from one node',
    nextBlock: 'after the next block (~12 s)',
    noAnswer: 'no answer',
    otherProvider: 'Another provider',
    nextBlockTag: 'next block',
    tryContract: 'Try it: send more than Ayşe has',
    sendCall: 'Send the call',
    resultStat: 'Result',
    notRun: 'not sent yet',
    resTransferred: 'done: balances changed',
    resApproved: 'done: allowance set',
    resRead: 'returns',
    resReverted: 'reverted: balance too low',
    capFn: 'function',
    capTo: 'to',
    capAmount: 'amount',
    tryEvents: 'Try it: send a transfer, then filter the logs',
    filter: 'Filter',
    filter_all: 'All',
    filter_from: 'From',
    filter_to: 'To',
    address: 'Address',
    sendAgain: 'Send a transfer',
    returned: 'Logs returned',
    lastCall: 'Sends',
  },
  steps: {
    compare: {
      title: 'A normal app and a dapp',
      alt: 'Two lanes. At the back, a screen talks to a single company server. At the front, a screen is connected through a wallet and an RPC node to a contract machine standing on a blockchain platform, with other nodes around it. When the servers are switched off, the back lane and the front screen go dark while the contract machine keeps turning; a second screen can then appear and reach the contract through the same wallet.',
      body: {
        beginner: `When you use a normal app, your phone talks to a computer owned by one company. That computer keeps your data and decides the rules. The company can change the rules, freeze your account or shut the whole thing down.

A [[dapp]] (decentralized app) looks the same on your screen, but the part that keeps the data and enforces the rules is not a company computer. It is a program stored on a [[blockchain]].

Nobody can quietly edit that program or the records it keeps. The app has no owner-run server deciding what happens; the same rules apply to everyone, including the people who wrote it.

**Try it:** tick the box to let the company switch its servers off. The normal app goes dark, and that is the end of it. The dapp's own website goes dark too, but the program on the [[blockchain]] keeps running. Press *Open another frontend*: a different website reaches the same program, and everything works again.`,
        intermediate: `A normal web app has a [[frontend]] (what runs in your browser) and a backend (servers and a database the company controls).

A [[dapp]] keeps the [[frontend]] but replaces the backend with a [[smart-contract]]: code deployed on a chain such as Ethereum. Its data lives in the chain's state and is copied by every [[full-node]].

Two more parts connect them:

- a [[wallet]], which holds your keys and signs what you approve;
- an [[rpc]] node, which is the door into the network.

The rest of this lesson follows one click through these four layers and back.

**Try it.** Switch the servers off. In the normal app the server *is* the app, so nothing is left. In the [[dapp]] only the [[frontend]] is gone: the [[smart-contract]] and its data are still on every [[full-node]]. Open another [[frontend]]. Anyone can build one from the contract's [[address]] and [[abi]], and the same [[wallet]] signs the same kind of [[transaction]] as before.`,
        expert: `The trust model is the real difference. In a web2 stack the operator has write access to the database and can change the API at will. In a [[dapp]] every state transition is a signed [[transaction]] executed deterministically by the [[evm]] on every [[full-node]]; the operator of the [[frontend]] has no more authority over contract state than any other [[address]].

The layers and their interfaces:

- **Frontend ↔ wallet**: an EIP-1193 provider object (\`window.ethereum\`), exposing \`request({ method, params })\`.
- **Wallet / frontend ↔ node**: [[json-rpc]] over HTTPS or WebSocket.
- **Node ↔ contract**: [[calldata]] encoded with the contract's [[abi]], executed by the [[evm]].

"Decentralized" is a property of each layer separately. A contract with an admin key or an upgradeable proxy, a [[frontend]] served from one domain, or a single hosted [[rpc]] endpoint are all centralization points; a serious review checks every one of them.

The toggle models an operator outage. What survives is what [[consensus]] covers: contract code and state. What does not is everything served from the operator's own infrastructure: the official [[frontend]], and often a hosted [[rpc]] endpoint or an [[indexer]] that the page depends on. A second [[frontend]] needs nothing from the first; a user can also call the contract from a script or from a block explorer's contract page.`,
      },
    },
    frontend: {
      title: 'The frontend is just a website',
      alt: 'A static host sends files to the browser screen. Next to the screen stands a card listing the contract functions: the ABI. The wallet waits to the right.',
      body: {
        beginner: `The part of a [[dapp]] you see is an ordinary website: buttons, numbers, forms. It is called the [[frontend]].

The website holds no money and decides nothing. It is like the screen of a cash machine: it shows what is in the vault and lets you type a request, but the vault is somewhere else.

That is why the same [[dapp]] can have several different websites, and why it keeps working if one of them disappears. The real thing is the program on the [[blockchain]].`,
        intermediate: `The [[frontend]] is HTML, CSS and JavaScript, usually served as static files. It needs two things to talk to a [[smart-contract]]:

- the contract's [[address]] on the chain;
- its [[abi]]: a list of the contract's functions and events with their argument types, so the site knows how to build a call and how to read the answer.

The site itself cannot sign anything. It has to ask your [[wallet]], which browser wallets such as MetaMask make available to the page.

Because the [[frontend]] is replaceable, it is also the easiest part to attack: a fake or hacked site can ask your [[wallet]] to sign something harmful. The contract cannot tell the difference.`,
        expert: `The [[frontend]] typically bundles a library such as viem or ethers.js, the contract [[address|addresses]] per chain id, and the [[abi]] as JSON emitted by the [[solidity]] compiler.

Wallet access goes through the EIP-1193 provider: \`provider.request({ method: 'eth_requestAccounts' })\` asks the user to connect and returns the selected [[address|addresses]]. Injected wallets expose it as \`window.ethereum\`; EIP-6963 lets a page discover several installed wallets instead of fighting over that one global.

Reads do not need the wallet at all: the page can call any [[json-rpc]] endpoint directly. Only signing needs the user's key.

The [[frontend]] is outside the consensus-critical path, so its integrity rests on ordinary web security: DNS, TLS, the build pipeline and its dependencies. Pinning a build to a content hash (for example on IPFS) makes a deployment verifiable, but users still have to check what the wallet asks them to sign.`,
      },
      code: {
        lang: 'JSON (ABI fragment)',
        source: `[
  {
    "type": "function",
    "name": "transfer",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }]
  },
  {
    "type": "event",
    "name": "Transfer",
    "anonymous": false,
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "value", "type": "uint256", "indexed": false }
    ]
  }
]`,
      },
    },
    wallet: {
      title: 'The wallet signs',
      alt: 'A request parcel travels from the screen to the wallet and waits there; a key floats above the wallet. The panel shows what the request asks for, with Confirm and Reject buttons. After Confirm the parcel leaves the wallet with a green seal on it: it is now signed. After Reject the parcel lies red on the ground and nothing leaves.',
      body: {
        beginner: `You press "Send". The website cannot move your money, so it hands a request to your [[wallet]]: "this person wants to send 10 tokens to Ben".

The [[wallet]] shows you the request and waits. If you confirm, it stamps the request with your secret key. That stamp is a [[digital-signature]]: proof that **you** approved exactly this request.

The key never leaves the [[wallet]]. The website only gets the stamped request back, never the key. Always read what the [[wallet]] shows before you confirm; once signed and sent, there is no undo button.

**Try it:** the panel under the scene is the wallet's question. Read where the request goes and what it does, then press *Confirm* or *Reject*. Reject, and nothing leaves the [[wallet]]. Now switch to *Request B*. It asks to let an address you do not know spend an unlimited amount of your tokens. On a website both requests can hide behind the same friendly button; the wallet's screen is the only place where you can tell them apart.`,
        intermediate: `The [[frontend]] builds a [[transaction]]: which contract to call, which function, with which arguments, and how much [[ether]] to attach. It passes this to the [[wallet]].

The [[wallet]] fills in the rest (your [[account-nonce]], a [[gas]] limit and fee), shows a confirmation screen, and signs with your [[private-key]]. Anyone can check the [[digital-signature]] against your [[address]], but nobody can forge it.

One request you will see often is a [[token-approval]]. A contract cannot take your tokens by itself; you first sign an approval that lets that contract spend up to a chosen amount of one [[token]]. Many sites ask for an unlimited amount. That is convenient, but it stays valid until you revoke it, so only approve contracts you trust.

**Try it.** The panel shows what a wallet prompt shows: the contract being called, the function and its arguments. Request A calls \`transfer\` on the token contract: 10 tokens to Ben. Request B calls \`approve\` with a spender you have never seen and the largest possible amount. Confirm one and the [[wallet]] produces a real [[digital-signature]] over the request; the panel shows the start of it. Reject it and no signature exists, so there is nothing a [[node]] would accept.`,
        expert: `The page calls \`eth_sendTransaction\` on the provider with \`{ from, to, data, value }\`. The wallet estimates [[gas]] with \`eth_estimateGas\`, reads the [[account-nonce]] with \`eth_getTransactionCount(address, "pending")\`, sets the [[eip-1559]] fee fields and often simulates the call to show its effect.

A type-2 transaction is \`0x02 ‖ rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList])\`. The wallet signs the keccak256 hash of that payload with [[ecdsa]] over secp256k1 and appends \`yParity, r, s\`. The sender is not a field: nodes recover it from the signature. \`chainId\` inside the signed payload prevents replay on another chain.

Wallets also sign off-chain messages: \`personal_sign\` and EIP-712 typed data (\`eth_signTypedData_v4\`). EIP-2612 \`permit\` uses a typed signature to set an [[erc-20]] allowance without a separate [[token-approval]] transaction. Signed messages cost no [[gas]] but can authorize real transfers, so they deserve the same care.

In the demo the wallet signs the text \`to:… value:0 data:…\` with a well-known public test key, using [[ecdsa]] over secp256k1 on its keccak256 hash, and shows \`r\`; a real wallet signs the RLP payload described above. Request B's calldata is \`0x095ea7b3\`, then the spender, then \`2²⁵⁶ − 1\` as 32 bytes of \`ff\`: the usual "unlimited" approval. An approval moves nothing by itself, which is why it looks harmless. It lets the spender call \`transferFrom\` for any amount, at any later time, until the allowance is set back to 0.`,
      },
      code: {
        lang: 'TypeScript (EIP-1193)',
        source: `const [from] = await window.ethereum.request({
  method: 'eth_requestAccounts',
});

// The wallet shows a confirmation, signs, and submits.
const txHash = await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from,
    to: TOKEN_ADDRESS,   // the contract, not the recipient
    data: calldata,      // transfer(to, amount), ABI-encoded
    value: '0x0',
  }],
});`,
      },
    },
    rpc: {
      title: 'RPC carries the call',
      alt: 'In read mode a small parcel travels along a dashed path from the screen straight to the RPC node and back; no other node is involved. In write mode the signed transaction travels from the wallet to the RPC node, which passes copies to the other nodes and to the chain, and a block appears. When the provider is marked as down, the node goes dark and parcels stop at it; after switching, a second node carries the same traffic.',
      body: {
        beginner: `Your browser is not part of the [[blockchain]] network. To reach it, the app talks to a computer that is: a [[node]]. The way it talks to that [[node]] is called [[rpc]].

Think of the [[node]] as a post office counter. There are two kinds of visits:

- **asking a question** ("what is my balance?"): the clerk looks it up and answers at once, for free;
- **sending a letter** (your signed request): the clerk passes it to the whole network, and it takes effect once it is included in a [[block]].

The clerk cannot change your letter. It is sealed with your signature, so a changed copy would simply be rejected.

**Try it:** switch between *Read* and *Write* and watch who gets involved. A question goes to one [[node]] and comes straight back. A signed request is passed on to all the others and then has to wait for the next [[block]]. Then tick *Provider is down*: the counter you were using is closed. Press *Switch provider* and the app simply asks at another one. The [[blockchain]] itself never stopped.`,
        intermediate: `An [[rpc]] node is a [[node]] that answers requests from apps. Most dapps and wallets use a hosted provider; you can also run your own.

There are two very different kinds of request:

- A **read call** runs a contract function on the node's current copy of the state and returns the result. Nothing is recorded, no [[gas-fee]] is paid, no signature is needed.
- A **transaction** changes state. The signed [[transaction]] goes to the node, into the [[mempool]], and is gossiped to other nodes until a [[validator]] puts it in a [[block]]. It costs a [[gas-fee]] and takes seconds, not milliseconds.

So a typical page reads balances and prices constantly through read calls, and only sends a [[transaction]] when you press a button and confirm in the [[wallet]].

**Try it.** *Read* sends an \`eth_call\`: one [[node]] answers from its own copy of the state, at once, with no [[gas-fee]] and no signature. *Write* sends the signed [[transaction]] with \`eth_sendRawTransaction\`: it is passed on to the other nodes and takes effect only when a [[validator]] includes it in a [[block]], which on Ethereum happens about every 12 seconds.

Now mark the provider as down. Nothing gets through, but the contract is not down. Switch to another provider and the same call works: an [[rpc]] provider is a door into the network, and there is more than one door.`,
        expert: `[[json-rpc]] 2.0 is the wire format: \`{ jsonrpc, id, method, params }\` over HTTPS or WebSocket. The methods a dapp uses most:

- \`eth_call\`: execute a message call against the state of a given block (usually \`"latest"\`) without creating a [[transaction]]. Used for \`view\` functions and for simulating state-changing ones.
- \`eth_estimateGas\`: search for a [[gas]] limit that lets the call succeed.
- \`eth_sendRawTransaction\`: submit the signed, serialized transaction; returns its hash immediately, long before inclusion.
- \`eth_getTransactionReceipt\`: \`null\` until mined, then \`status\`, \`gasUsed\`, \`logs\`.
- \`eth_getLogs\`, \`eth_subscribe\`: read [[event-log|event logs]].

A provider is a trusted party for reads: it can return stale or false data, observe your [[address|addresses]] and IP, or decline to forward a [[transaction]]. It cannot forge one. Because an \`eth_call\` result is only as honest as the node, anything that matters must be enforced inside the contract (for example a minimum output amount), not assumed from a read.

A hash returned by \`eth_sendRawTransaction\` is not a confirmation. The transaction may sit in the [[mempool]], be replaced by one with the same [[account-nonce]] and a higher fee, or land in a [[block]] that is later dropped in a [[reorg]].

The control contrasts the two paths. An \`eth_call\` never leaves the [[node]] that received it: no [[mempool]], no [[gossip]], no state change, and the answer depends on which block that node considers \`latest\`. \`eth_sendRawTransaction\` hands over bytes that every node can validate from the signature alone. That is why switching provider needs no new signature: the same raw transaction can be submitted to several endpoints, and the [[account-nonce]] guarantees that it executes at most once. A provider outage is an availability problem, not a safety problem.`,
      },
      code: {
        lang: 'JSON-RPC',
        source: `// Read: balanceOf(0x1111…1111). Free, no signature.
{ "jsonrpc": "2.0", "id": 1, "method": "eth_call",
  "params": [{
    "to": "0xTOKEN…",
    "data": "0x70a082310000000000000000000000001111111111111111111111111111111111111111"
  }, "latest"] }

// Write: the signed transaction bytes. Costs gas.
{ "jsonrpc": "2.0", "id": 2, "method": "eth_sendRawTransaction",
  "params": ["0x02f8b2…"] }`,
      },
    },
    contract: {
      title: 'The contract executes',
      alt: 'Above the contract machine floats a strip with one short segment and one or two long ones: the calldata, labelled with the bytes built from the inputs in the panel. Beside the machine stand three balance columns, for Ayşe, Ben and Cem. When the call is sent, a parcel drops into the machine and the columns change; if the amount is larger than the balance, the machine turns red and nothing changes.',
      body: {
        beginner: `The request reaches the program on the [[blockchain]]: the [[smart-contract]]. It works like a vending machine: you put in a request, it follows its fixed rules, and the result comes out. Nobody stands behind it deciding case by case.

Here the request says "move 10 tokens from Ayşe to Ben". The contract checks that Ayşe really has 10, takes them off her balance and adds them to Ben's.

Every computer in the network runs the same program with the same request and must get the same result. If the check fails, nothing changes at all. That is what makes the result trustworthy without a referee.

**Try it:** choose who receives the tokens and how many, then press *Send the call*. The balance columns next to the machine change. Now try to send more than Ayşe has: the machine refuses, and every balance stays exactly as it was.`,
        intermediate: `The [[transaction]] carries [[calldata]]: bytes that say which function to run and with which arguments. The contract's [[abi]] defines how those bytes are laid out.

A [[token]] is a good example. An [[erc-20]] token is simply a contract that stores a table of balances. "Sending tokens" means calling its \`transfer\` function, which lowers one row and raises another. No coin moves anywhere; a number changes in the contract's storage.

Each step of the code costs [[gas]]. If the code hits a failed check or runs out of [[gas]], the whole call **reverts**: every change is undone, but the [[gas-fee]] for the work already done is still paid.

When a dapp needs to take your tokens (a swap, a deposit), it uses the [[token-approval]] you gave earlier: it calls \`transferFrom\`, and the token contract checks the allowance before moving anything.

**Try it.** The strip above the machine is the real [[calldata]] for your inputs. Change the amount and only the last word changes; change the recipient and only the middle one does. Switch the function to \`approve\` or \`balanceOf\` and the first four bytes, the selector, change: \`0xa9059cbb\`, \`0x095ea7b3\`, \`0x70a08231\`. \`balanceOf\` takes one argument, so the strip gets shorter, and it only reads, so nothing changes. Then send 101 tokens while Ayşe has 100: the call reverts.`,
        expert: `[[calldata|Calldata]] for a function call is the 4-byte selector followed by the ABI-encoded arguments. The selector is the first 4 bytes of \`keccak256\` of the canonical signature: \`keccak256("transfer(address,uint256)")\` starts with \`0xa9059cbb\`. Static arguments are each padded to a 32-byte word (left-padded for \`address\` and integers); dynamic types (\`bytes\`, \`string\`, arrays) put an offset in the head and their length and data in the tail.

The [[solidity]] compiler emits a dispatcher that compares the selector and jumps to the function body; an unknown selector falls through to \`fallback\` or reverts. Storage is a 256-bit key → value map per contract; a mapping entry \`balanceOf[a]\` lives at slot \`keccak256(abi.encode(a, p))\` where \`p\` is the mapping's declared slot.

The [[erc-20]] allowance flow that most dapps rely on:

- the user calls \`approve(spender, amount)\` on the token, setting \`allowance[user][spender]\`;
- the dapp contract calls \`token.transferFrom(user, to, amount)\`, which checks and decreases the allowance, then moves the balance.

Edge cases worth knowing: some tokens return no \`bool\` (use a safe-transfer wrapper), some take a fee on transfer so the received amount is lower than \`amount\`, and changing a non-zero allowance directly can be front-run. A revert rolls back state and logs for the failing call frame, but the sender still pays for the [[gas]] consumed.

The selector and the 32-byte words in the scene are computed from your inputs: \`selector ‖ word(address) ‖ word(amount)\`, with the amount in the token's smallest unit (10 tokens at 18 decimals is \`10 · 10¹⁸ = 0x8ac7230489e80000\`). The in-scene token follows the snippet below: \`transfer\` reverts on underflow, a transfer of 0 succeeds and still emits \`Transfer\`, \`approve\` writes \`allowance[msg.sender][spender]\` and emits \`Approval\`, and \`balanceOf\` is the getter the compiler generates for the public mapping. \`msg.sender\` is always Ayşe here: the account whose key signed.`,
      },
      code: {
        lang: 'Solidity (simplified ERC-20)',
        source: `// calldata for transfer(0x2222…2222, 10 * 10**18):
// 0xa9059cbb                                                        selector
// 0000000000000000000000002222222222222222222222222222222222222222  to
// 0000000000000000000000000000000000000000000000008ac7230489e80000  amount

mapping(address => uint256) public balanceOf;
mapping(address => mapping(address => uint256)) public allowance;

function transfer(address to, uint256 amount) external returns (bool) {
    balanceOf[msg.sender] -= amount;          // reverts on underflow (>= 0.8)
    balanceOf[to] += amount;
    emit Transfer(msg.sender, to, amount);
    return true;
}

function transferFrom(address from, address to, uint256 amount) external returns (bool) {
    allowance[from][msg.sender] -= amount;    // spender must be approved
    balanceOf[from] -= amount;
    balanceOf[to] += amount;
    emit Transfer(from, to, amount);
    return true;
}`,
      },
    },
    events: {
      title: 'Events come back to the UI',
      alt: 'Behind the contract stands a stack of slabs, one per event log, newest on top. The logs that match the filter in the panel glow green and are labelled with sender, recipient and amount; the rest stay grey. Green parcels travel from the contract through the RPC node, and through an indexer with a database, to the screen, which turns green and shows how many logs it received.',
      body: {
        beginner: `The contract has done its work. How does the website find out?

When something important happens, the contract leaves a note in the [[block]]: "10 tokens moved from Ayşe to Ben". Such a note is called an event.

The website watches for these notes and refreshes what you see: your new balance, a green tick, a new line in your history. The page did not make the change; it only reports what the [[blockchain]] now says.

Close the tab at any point and nothing is lost. Open the site again, or a different site, and it reads the same notes and shows the same result.

**Try it:** the stack behind the contract holds its notes, newest on top. Press *Send a transfer* and a new note appears. Then use the filter: *From* keeps only the notes where the chosen person sent tokens, *To* only those where they received some. The page shows exactly the notes that match, nothing more.`,
        intermediate: `A contract can **emit** an [[event-log]] while it runs: a small record stored with the [[transaction]]'s receipt in the [[block]]. An [[erc-20]] transfer emits \`Transfer(from, to, value)\`.

The [[frontend]] waits for the [[transaction]] to be included, checks that it succeeded, and then updates the page. It finds out by asking the [[rpc]] node for the receipt or by subscribing to the contract's events.

Reading state gives you only the present. For history ("all my past swaps"), you would have to scan every [[block]] for matching events. That is slow, so most dapps use an [[indexer]]: a service that follows the chain, stores decoded events in a database and answers queries quickly.

Wait for a few more blocks before treating a result as final; a very recent [[block]] can still be replaced.

**Try it.** Every successful \`transfer\` you send adds one \`Transfer\` [[event-log]] to the stack; a reverted call adds none. The filter is the question a [[frontend]] or an [[indexer]] asks the [[node]]: all transfers of this [[token]], only those sent by one [[address]], or only those received by it. "My history" on a real page is this query, run with your own [[address]]. If you sent an \`approve\` in the previous step, its log is in the stack too, but it is an \`Approval\`, so a query for transfers never returns it.`,
        expert: `A log entry is \`{ address, topics[0..3], data }\`, created by the \`LOG0\`–\`LOG4\` opcodes. For a non-anonymous event, \`topics[0]\` is \`keccak256\` of the event signature; for \`Transfer(address,address,uint256)\` it is \`0xddf252ad…f523b3ef\`. Up to three \`indexed\` parameters follow as topics; the rest are ABI-encoded in \`data\`. Indexed dynamic values are stored as their hash, not their content.

Logs live in the transaction receipt, are committed by the block's \`receiptsRoot\`, and are summarized in a 2048-bit \`logsBloom\`. They are **not** readable by contracts: there is no opcode to load a log. They cost 375 [[gas]] plus 375 per topic plus 8 per data byte, far cheaper than storage.

Reading them:

- \`eth_getLogs({ fromBlock, toBlock, address, topics })\`: topic filters are positional, \`null\` is a wildcard, an inner array means OR. Providers cap the block range or result size.
- \`eth_subscribe("logs", filter)\` over WebSocket for a live feed.

An [[indexer]] replays logs into a query-friendly database. It must handle a [[reorg]]: logs from a dropped [[block]] are re-delivered with \`removed: true\`, and derived rows have to be rolled back. A UI should treat a receipt as provisional until enough [[confirmation|confirmations]] or [[finality]], and should treat an [[indexer]] as a cache of the chain, not a source of truth.

The filter builds the \`topics\` array of \`eth_getLogs\`: \`[topic0]\` for all transfers, \`[topic0, from]\` for a sender, \`[topic0, null, to]\` for a recipient. Here \`topic0 = keccak256("Transfer(address,address,uint256)")\`, and an address topic is the address left-padded to 32 bytes. Matching is positional and exact, which is why a [[node]] can filter only on \`indexed\` parameters; filtering on \`value\` means fetching the logs and decoding \`data\` yourself. \`Approval(address,address,uint256)\` hashes to a different \`topic0\` (\`0x8c5be1e5…\`), so it falls outside every query here.`,
      },
      code: {
        lang: 'JSON-RPC',
        source: `// All Transfer events of one token sent TO 0x2222…2222
{ "jsonrpc": "2.0", "id": 3, "method": "eth_getLogs",
  "params": [{
    "address": "0xTOKEN…",
    "fromBlock": "0x1312D00",
    "toBlock": "latest",
    "topics": [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      null,                                  // from: anyone
      "0x0000000000000000000000002222222222222222222222222222222222222222"
    ]
  }] }

// One result
{ "address": "0xTOKEN…", "blockNumber": "0x1312D2A",
  "topics": [ "0xddf252ad…", "0x000…1111", "0x000…2222" ],
  "data": "0x0000000000000000000000000000000000000000000000008ac7230489e80000",
  "logIndex": "0x4", "removed": false }`,
      },
    },
  },
};

export default content;

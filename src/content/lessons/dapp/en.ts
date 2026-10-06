import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    normalApp: 'Normal app',
    companyServer: 'Company server',
    privateApi: 'HTTPS · private API',
    dapp: 'Dapp',
    website: 'Website',
    uiUpdates: 'Page updates',
    wallet: 'Wallet',
    rpcNode: 'RPC node',
    contract: 'Smart contract',
    network: 'network nodes',
    everyNode: 'every node runs it',
    publicRpc: 'JSON-RPC · public state',
    staticHost: 'Static host',
    keyStays: 'key stays inside',
    request: 'request',
    signed: 'signed',
    read: 'read · free',
    write: 'write · costs gas',
    calldata: 'function + arguments',
    balances: 'balances',
    balancesNum: 'Ayşe 100 → 90 · Ben 20 → 30',
    indexer: 'Indexer',
    event: 'event',
    eventName: 'Transfer(Ayşe, Ben, 10)',
  },
  steps: {
    compare: {
      title: 'A normal app and a dapp',
      alt: 'Two lanes. At the back, a screen talks to a single company server. At the front, a screen is connected through a wallet and an RPC node to a contract machine standing on a blockchain platform, with other nodes around it.',
      body: {
        beginner: `When you use a normal app, your phone talks to a computer owned by one company. That computer keeps your data and decides the rules. The company can change the rules, freeze your account or shut the whole thing down.

A [[dapp]] (decentralized app) looks the same on your screen, but the part that keeps the data and enforces the rules is not a company computer. It is a program stored on a [[blockchain]].

Nobody can quietly edit that program or the records it keeps. The app has no owner-run server deciding what happens; the same rules apply to everyone, including the people who wrote it.`,
        intermediate: `A normal web app has a [[frontend]] (what runs in your browser) and a backend (servers and a database the company controls).

A [[dapp]] keeps the [[frontend]] but replaces the backend with a [[smart-contract]]: code deployed on a chain such as Ethereum. Its data lives in the chain's state and is copied by every [[full-node]].

Two more parts connect them:

- a [[wallet]], which holds your keys and signs what you approve;
- an [[rpc]] node, which is the door into the network.

The rest of this lesson follows one click through these four layers and back.`,
        expert: `The trust model is the real difference. In a web2 stack the operator has write access to the database and can change the API at will. In a [[dapp]] every state transition is a signed [[transaction]] executed deterministically by the [[evm]] on every [[full-node]]; the operator of the [[frontend]] has no more authority over contract state than any other [[address]].

The layers and their interfaces:

- **Frontend ↔ wallet**: an EIP-1193 provider object (\`window.ethereum\`), exposing \`request({ method, params })\`.
- **Wallet / frontend ↔ node**: [[json-rpc]] over HTTPS or WebSocket.
- **Node ↔ contract**: [[calldata]] encoded with the contract's [[abi]], executed by the [[evm]].

"Decentralized" is a property of each layer separately. A contract with an admin key or an upgradeable proxy, a [[frontend]] served from one domain, or a single hosted [[rpc]] endpoint are all centralization points; a serious review checks every one of them.`,
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
      alt: 'A request parcel travels from the screen to the wallet. A key floats above the wallet. The parcel leaves the wallet with a green seal on it: it is now signed.',
      body: {
        beginner: `You press "Send". The website cannot move your money, so it hands a request to your [[wallet]]: "this person wants to send 10 tokens to Ben".

The [[wallet]] shows you the request and waits. If you confirm, it stamps the request with your secret key. That stamp is a [[digital-signature]]: proof that **you** approved exactly this request.

The key never leaves the [[wallet]]. The website only gets the stamped request back, never the key. Always read what the [[wallet]] shows before you confirm; once signed and sent, there is no undo button.`,
        intermediate: `The [[frontend]] builds a [[transaction]]: which contract to call, which function, with which arguments, and how much [[ether]] to attach. It passes this to the [[wallet]].

The [[wallet]] fills in the rest (your [[account-nonce]], a [[gas]] limit and fee), shows a confirmation screen, and signs with your [[private-key]]. Anyone can check the [[digital-signature]] against your [[address]], but nobody can forge it.

One request you will see often is a [[token-approval]]. A contract cannot take your tokens by itself; you first sign an approval that lets that contract spend up to a chosen amount of one [[token]]. Many sites ask for an unlimited amount. That is convenient, but it stays valid until you revoke it, so only approve contracts you trust.`,
        expert: `The page calls \`eth_sendTransaction\` on the provider with \`{ from, to, data, value }\`. The wallet estimates [[gas]] with \`eth_estimateGas\`, reads the [[account-nonce]] with \`eth_getTransactionCount(address, "pending")\`, sets the [[eip-1559]] fee fields and often simulates the call to show its effect.

A type-2 transaction is \`0x02 ‖ rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList])\`. The wallet signs the keccak256 hash of that payload with [[ecdsa]] over secp256k1 and appends \`yParity, r, s\`. The sender is not a field: nodes recover it from the signature. \`chainId\` inside the signed payload prevents replay on another chain.

Wallets also sign off-chain messages: \`personal_sign\` and EIP-712 typed data (\`eth_signTypedData_v4\`). EIP-2612 \`permit\` uses a typed signature to set an [[erc-20]] allowance without a separate [[token-approval]] transaction. Signed messages cost no [[gas]] but can authorize real transfers, so they deserve the same care.`,
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
      alt: 'The signed transaction travels from the wallet to an RPC node, which passes copies to the other nodes and to the chain. A second, dashed path goes from the screen straight to the RPC node and back: a read.',
      body: {
        beginner: `Your browser is not part of the [[blockchain]] network. To reach it, the app talks to a computer that is: a [[node]]. The way it talks to that [[node]] is called [[rpc]].

Think of the [[node]] as a post office counter. There are two kinds of visits:

- **asking a question** ("what is my balance?"): the clerk looks it up and answers at once, for free;
- **sending a letter** (your signed request): the clerk passes it to the whole network, and it takes effect once it is included in a [[block]].

The clerk cannot change your letter. It is sealed with your signature, so a changed copy would simply be rejected.`,
        intermediate: `An [[rpc]] node is a [[node]] that answers requests from apps. Most dapps and wallets use a hosted provider; you can also run your own.

There are two very different kinds of request:

- A **read call** runs a contract function on the node's current copy of the state and returns the result. Nothing is recorded, no [[gas-fee]] is paid, no signature is needed.
- A **transaction** changes state. The signed [[transaction]] goes to the node, into the [[mempool]], and is gossiped to other nodes until a [[validator]] puts it in a [[block]]. It costs a [[gas-fee]] and takes seconds, not milliseconds.

So a typical page reads balances and prices constantly through read calls, and only sends a [[transaction]] when you press a button and confirm in the [[wallet]].`,
        expert: `[[json-rpc]] 2.0 is the wire format: \`{ jsonrpc, id, method, params }\` over HTTPS or WebSocket. The methods a dapp uses most:

- \`eth_call\`: execute a message call against the state of a given block (\`"latest"\` by default) without creating a [[transaction]]. Used for \`view\` functions and for simulating state-changing ones.
- \`eth_estimateGas\`: search for a [[gas]] limit that lets the call succeed.
- \`eth_sendRawTransaction\`: submit the signed, serialized transaction; returns its hash immediately, long before inclusion.
- \`eth_getTransactionReceipt\`: \`null\` until mined, then \`status\`, \`gasUsed\`, \`logs\`.
- \`eth_getLogs\`, \`eth_subscribe\`: read [[event-log|event logs]].

A provider is a trusted party for reads: it can return stale or false data, observe your [[address|addresses]] and IP, or decline to forward a [[transaction]]. It cannot forge one. Because an \`eth_call\` result is only as honest as the node, anything that matters must be enforced inside the contract (for example a minimum output amount), not assumed from a read.

A hash returned by \`eth_sendRawTransaction\` is not a confirmation. The transaction may sit in the [[mempool]], be replaced by one with the same [[account-nonce]] and a higher fee, or land in a [[block]] that is later dropped in a [[reorg]].`,
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
      alt: 'The signed transaction drops into the contract machine. Above it floats a strip with one short segment and two long ones: the calldata. Beside the machine, one balance column shrinks while the other grows.',
      body: {
        beginner: `The request reaches the program on the [[blockchain]]: the [[smart-contract]]. It works like a vending machine: you put in a request, it follows its fixed rules, and the result comes out. Nobody stands behind it deciding case by case.

Here the request says "move 10 tokens from Ayşe to Ben". The contract checks that Ayşe really has 10, takes them off her balance and adds them to Ben's.

Every computer in the network runs the same program with the same request and must get the same result. If the check fails, nothing changes at all. That is what makes the result trustworthy without a referee.`,
        intermediate: `The [[transaction]] carries [[calldata]]: bytes that say which function to run and with which arguments. The contract's [[abi]] defines how those bytes are laid out.

A [[token]] is a good example. An [[erc-20]] token is simply a contract that stores a table of balances. "Sending tokens" means calling its \`transfer\` function, which lowers one row and raises another. No coin moves anywhere; a number changes in the contract's storage.

Each step of the code costs [[gas]]. If the code hits a failed check or runs out of [[gas]], the whole call **reverts**: every change is undone, but the [[gas-fee]] for the work already done is still paid.

When a dapp needs to take your tokens (a swap, a deposit), it uses the [[token-approval]] you gave earlier: it calls \`transferFrom\`, and the token contract checks the allowance before moving anything.`,
        expert: `[[calldata|Calldata]] for a function call is the 4-byte selector followed by the ABI-encoded arguments. The selector is the first 4 bytes of \`keccak256\` of the canonical signature: \`keccak256("transfer(address,uint256)")\` starts with \`0xa9059cbb\`. Static arguments are each padded to a 32-byte word (left-padded for \`address\` and integers); dynamic types (\`bytes\`, \`string\`, arrays) put an offset in the head and their length and data in the tail.

The [[solidity]] compiler emits a dispatcher that compares the selector and jumps to the function body; an unknown selector falls through to \`fallback\` or reverts. Storage is a 256-bit key → value map per contract; a mapping entry \`balanceOf[a]\` lives at slot \`keccak256(abi.encode(a, p))\` where \`p\` is the mapping's declared slot.

The [[erc-20]] allowance flow that most dapps rely on:

- the user calls \`approve(spender, amount)\` on the token, setting \`allowance[user][spender]\`;
- the dapp contract calls \`token.transferFrom(user, to, amount)\`, which checks and decreases the allowance, then moves the balance.

Edge cases worth knowing: some tokens return no \`bool\` (use a safe-transfer wrapper), some take a fee on transfer so the received amount is lower than \`amount\`, and changing a non-zero allowance directly can be front-run. A revert rolls back state and logs for the failing call frame, but the sender still pays for the [[gas]] consumed.`,
      },
      code: {
        lang: 'Solidity',
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
      alt: 'Green event parcels leave the contract. Some go back through the RPC node to the screen; others go to an indexer with a database, which then feeds the screen. The screen has turned green: the page shows the new state.',
      body: {
        beginner: `The contract has done its work. How does the website find out?

When something important happens, the contract leaves a note in the [[block]]: "10 tokens moved from Ayşe to Ben". Such a note is called an event.

The website watches for these notes and refreshes what you see: your new balance, a green tick, a new line in your history. The page did not make the change; it only reports what the [[blockchain]] now says.

Close the tab at any point and nothing is lost. Open the site again, or a different site, and it reads the same notes and shows the same result.`,
        intermediate: `A contract can **emit** an [[event-log]] while it runs: a small record stored with the [[transaction]]'s receipt in the [[block]]. An [[erc-20]] transfer emits \`Transfer(from, to, value)\`.

The [[frontend]] waits for the [[transaction]] to be included, checks that it succeeded, and then updates the page. It finds out by asking the [[rpc]] node for the receipt or by subscribing to the contract's events.

Reading state gives you only the present. For history ("all my past swaps"), you would have to scan every [[block]] for matching events. That is slow, so most dapps use an [[indexer]]: a service that follows the chain, stores decoded events in a database and answers queries quickly.

Wait for a few more blocks before treating a result as final; a very recent [[block]] can still be replaced.`,
        expert: `A log entry is \`{ address, topics[0..3], data }\`, created by the \`LOG0\`–\`LOG4\` opcodes. For a non-anonymous event, \`topics[0]\` is \`keccak256\` of the event signature; for \`Transfer(address,address,uint256)\` it is \`0xddf252ad…f523b3ef\`. Up to three \`indexed\` parameters follow as topics; the rest are ABI-encoded in \`data\`. Indexed dynamic values are stored as their hash, not their content.

Logs live in the transaction receipt, are committed by the block's \`receiptsRoot\`, and are summarized in a 2048-bit \`logsBloom\`. They are **not** readable by contracts: there is no opcode to load a log. They cost 375 [[gas]] plus 375 per topic plus 8 per data byte, far cheaper than storage.

Reading them:

- \`eth_getLogs({ fromBlock, toBlock, address, topics })\`: topic filters are positional, \`null\` is a wildcard, an inner array means OR. Providers cap the block range or result size.
- \`eth_subscribe("logs", filter)\` over WebSocket for a live feed.

An [[indexer]] replays logs into a query-friendly database. It must handle a [[reorg]]: logs from a dropped [[block]] are re-delivered with \`removed: true\`, and derived rows have to be rolled back. A UI should treat a receipt as provisional until enough [[confirmation|confirmations]] or [[finality]], and should treat an [[indexer]] as a cache of the chain, not a source of truth.`,
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

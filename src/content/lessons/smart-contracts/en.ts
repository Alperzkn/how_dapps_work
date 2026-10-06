import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    eoa: 'Alice: EOA',
    eoaCaption: 'controlled by a key',
    contractAccount: 'Contract account',
    contractCaption: 'controlled by its code',
    contractShort: 'Counter (contract)',
    privateKey: 'private key',
    code: 'code',
    storage: 'storage',
    tryInspect: 'Try it: inspect each account',
    alice: 'Alice',
    bob: 'Bob',
    carol: 'Carol',
    balance: 'balance',
    empty: 'empty',
    none: 'none',
    bytes: 'bytes',
    slot: 'slot',
    controlledBy: 'controlled by',
    senderNonce: 'Sender nonce',
    sender: 'sender',
    contractAddress: 'contract address',
    source: 'source code',
    bytecode: 'bytecode',
    compile: 'compile',
    creationTx: 'creation transaction',
    newAddress: 'new address',
    contractHolds: 'contract holds',
    everyNode: 'every node runs the same code',
    reset: 'Reset',
    result: 'result',
    noCallYet: 'no call yet',
    success: 'success',
    errFunds: 'not enough ETH',
    errBalance: 'balance too low',
    mappingKey: 'key',
    depositAs: 'deposit() 1 ETH as this key',
    value: 'value',
    notStored: 'not stored',
    hashSpace: 'slot = hash of the key',
    stepBtn: 'Step',
    runBtn: 'Run to end',
    lastStep: 'last step',
    gasLeft: 'gas left',
    gasUsed: 'gas used',
    stack: 'stack',
    finished: 'finished',
    outOfGas: 'out of gas',
    gasLimit: 'Gas limit',
    slotNonZero: 'count is already 1',
    outOfGasRevert: 'out of gas, reverted',
    refunded: 'unused, returned',
    fee: 'fee',
    limitShort: 'limit',
    intrinsic: 'base cost',
    needs: 'needs',
    rolledBack: 'rolled back',
    vault: 'Vault',
    attacker: 'Attacker',
    depth: 'call depth',
    othersDeposit: 'Others deposited',
    effectsFirst: 'update balance before sending',
    nextCall: 'Next step',
    runAttack: 'Run attack',
    recorded: 'recorded for attacker',
    ready: 'ready',
    attackReverted: 'attack reverted',
    stolen: 'stolen:',
    nothingStolen: 'nothing to steal',
  },
  steps: {
    account: {
      title: 'A program with its own address',
      alt: 'On the left a person stands under a floating key, with a few coins beside her: an account controlled by a key. On the right a machine stands on its own platform with a few coins, a row of code blocks floating above it and a storage drawer next to it: an account controlled by code. The buttons highlight one or the other.',
      body: {
        beginner: `A [[smart-contract]] is a program that lives on the [[blockchain]]. Think of a vending machine standing in the street: it holds money, it follows fixed rules, and nobody has to be inside it for it to work.

Ethereum has two kinds of account. One belongs to a person, who controls it with a secret key. The other **is** a program: it has an [[address]] of its own and can hold [[ether]], but there is no key for it. Only its own code decides what happens to that money.

Use the two buttons to look at each account. Notice what the person has that the machine does not (a key), and what the machine has that the person does not (code and stored data).`,
        intermediate: `Both kinds of account have an [[address]], a balance in [[ether]] and a counter called the [[account-nonce]].

- An [[eoa]] (externally owned account) is controlled by a [[private-key]]. It has no code and no data of its own. Every [[transaction]] starts from one, because only a key can sign.
- A [[contract-account]] is controlled by its code. It has no key, so nobody can sign for it. It only acts when someone calls it, and then it does exactly what the code says.

A contract also keeps permanent data, its [[contract-state]]: counters, balances, owners, whatever the author declared. In the panel, compare the two accounts: the contract has code and one stored value, the [[eoa]] has neither.

Because a contract can hold [[ether]] and nobody holds a key to it, the code is the only way that money can ever move. That is why reading the code matters more than trusting the author.`,
        expert: `In the world state every account is four fields, stored in the [[state-trie]] under \`keccak256(address)\`:

- \`nonce\`: transactions sent (for an [[eoa]]) or contracts created (for a [[contract-account]]). A new contract starts at 1, not 0 (EIP-161).
- \`balance\`: wei.
- \`storageRoot\`: root of the account's own storage trie. Empty storage gives the empty-trie root \`0x56e81f17…b421\` = \`keccak256(rlp(""))\`.
- \`codeHash\`: \`keccak256(code)\`. No code gives \`0xc5d24601…a470\` = \`keccak256("")\`.

At this level the panel shows both hashes for each account. The [[eoa]] has exactly those two empty constants. The contract shows the hash of its 8 bytes of code and the root of a storage trie with one entry (slot 0 = 1): \`0x821e2556…e5f0\`.

Only an [[eoa]] can originate a [[transaction]]; a contract runs only inside one, so \`tx.origin\` is always an EOA. Since the Pectra upgrade (May 2025) the line is less sharp: with EIP-7702 an [[eoa]] can set its code to a delegation indicator \`0xef0100 ‖ address\`, and calls to it then execute the code at that address in the EOA's own context.`,
      },
      code: {
        lang: 'Account state',
        source: `# account = (nonce, balance, storageRoot, codeHash)

# Alice, an EOA: no storage, no code
nonce        7
balance      2500000000000000000            # 2.5 ETH in wei
storageRoot  0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
codeHash     0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470

# Counter, a contract: storage { slot 0: 1 }, code 0x5f546001015f5500
nonce        1
balance      3000000000000000000            # 3 ETH
storageRoot  0x821e2556a290c86405f8160a2d662042a431ba456b9db265c79bb837c04be5f0
codeHash     keccak256(0x5f546001015f5500)`,
      },
    },
    deploy: {
      title: 'Deployment: from source code to an address',
      alt: 'A row from left to right: Alice with a small stack that counts her earlier transactions, a sheet of source code, an arrow to a row of bytecode cubes, and a parcel flying to a platform where the contract machine stands with its new address written below it. Moving the slider changes Alice\'s stack and the address.',
      body: {
        beginner: `Putting a program on the chain is called [[deployment]]. You write the program, a translator turns it into the machine language the network understands, and you send that to the network in a special [[transaction]] that has no recipient.

The network stores the program and gives it a brand-new [[address]]. From then on anyone can use it, and the author has no more control over it than anyone else.

The new address is not random. It is worked out from **who sent it** and **how many transactions that sender has made before**. Move the slider: each count gives a completely different address.`,
        intermediate: `Contracts are usually written in [[solidity]]. The compiler turns the source into [[bytecode]]: a string of bytes that the [[evm]] can execute. It also produces the [[abi]], which the outside world uses to talk to the contract.

A [[deployment]] is a [[transaction]] with an empty \`to\` field and the code in its \`data\` field. The [[evm]] runs that code once (this is where the constructor runs); whatever it returns is stored as the contract's permanent code.

The contract's [[address]] is computed from the sender's address and the sender's [[account-nonce]]. So it is known before the transaction is even sent, and the same sender can never produce the same address twice.

Storing code is not free: a creation costs 32,000 [[gas]] on top of the usual 21,000, plus 200 gas for every byte of code that ends up on chain.`,
        expert: `For a creation transaction (and the \`CREATE\` opcode) the address is

\`keccak256(rlp([sender, nonce]))[12:]\`

For nonce 0 the RLP is \`0xd6 0x94 <20-byte sender> 0x80\`. With Hardhat's first test account as the sender, the slider at 0 gives \`0x5fbdb2315678afecb367f032d93f642f64180aa3\`, the address every local Hardhat project sees first.

\`CREATE2\` (EIP-1014) drops the nonce: \`keccak256(0xff ‖ deployer ‖ salt ‖ keccak256(initCode))[12:]\`. The address then depends only on the deployer, a chosen salt and the code, so it can be computed, and funded, before anything is deployed. Uniswap v2 pairs are created this way.

The \`data\` of the creation is **init code**: constructor logic followed by the runtime code, with ABI-encoded constructor arguments appended. It returns the runtime [[bytecode]]; \`immutable\` values are written into that code at this point. Limits and costs:

- runtime code at most 24,576 bytes (EIP-170), init code at most 49,152 bytes (EIP-3860);
- 32,000 gas for the creation, 2 gas per 32-byte word of init code, 200 gas per byte of deployed code;
- code may not start with \`0xEF\` (EIP-3541).

If the init code reverts or runs out of [[gas]], no contract exists at the address, but the sender's nonce has still gone up.`,
      },
      code: {
        lang: 'Solidity',
        source: `// The address a CREATE from \`sender\` with nonce 0 will get.
// rlp([sender, 0]) = 0xd6 0x94 <sender> 0x80
function createAddress(address sender) pure returns (address) {
    return address(uint160(uint256(keccak256(
        abi.encodePacked(bytes1(0xd6), bytes1(0x94), sender, bytes1(0x80))
    ))));
}

// CREATE2: no nonce, so the address is known in advance.
function create2Address(address deployer, bytes32 salt, bytes32 initCodeHash)
    pure returns (address)
{
    return address(uint160(uint256(keccak256(
        abi.encodePacked(bytes1(0xff), deployer, salt, initCodeHash)
    ))));
}`,
      },
    },
    call: {
      title: 'Calling a function',
      alt: 'Alice stands on the left with her coins. A parcel flies from her to the contract machine in the middle. Next to the machine is its own stack of coins, and on the right two storage drawers: the counter and Alice\'s recorded balance. Three node towers stand at the back, all running the same code. The buttons send calls; the coins and drawers change, and a failed call turns the machine red.',
      body: {
        beginner: `This contract is a small piggy bank with a counter. You use it by sending it a message that says which of its functions to run. That message is a [[transaction]], and it can carry [[ether]] with it.

Press **deposit**: one ETH leaves Alice, lands in the contract, and the contract writes down that Alice is owed 1. Press **increment**: the counter goes up. Press **withdraw** until Alice's recorded balance is zero, then once more.

That last call fails. The contract checks its rule ("you cannot take out more than you put in"), refuses, and nothing changes at all. This is called a [[revert]]. Every computer in the network runs the same call and reaches the same result.`,
        intermediate: `To call a contract you send a [[transaction]] to its [[address]]. Two fields do the work:

- \`data\` holds the [[calldata]]: 4 bytes that name the function, followed by its arguments, each padded to 32 bytes. The panel shows the real bytes for each button.
- \`value\` is the amount of [[ether]] sent along. Only functions marked \`payable\` accept it.

Inside the contract, \`msg.sender\` is whoever called and \`msg.value\` is the ether that came with the call. \`deposit()\` adds \`msg.value\` to the caller's entry; \`withdraw\` checks the entry first and reverts if it is too small.

Every [[full-node]] executes the call with the same code and the same starting state, so they all end with the same [[contract-state]]. Nothing in the [[evm]] is random or depends on the machine it runs on. Reading a value needs no transaction at all: a node can simply run the function locally and return the answer.`,
        expert: `The first 4 bytes of [[calldata]] are the selector: \`keccak256("withdraw(uint256)")[0:4] = 0x2e1a7d4d\`. The compiled [[bytecode]] starts with a dispatcher that compares the selector with each external function and jumps. No match runs \`fallback()\` if there is one; empty calldata runs \`receive()\`; otherwise the call reverts.

A contract can call other contracts in the same [[transaction]]. The three call opcodes differ in context:

- \`CALL\`: runs the callee's code with the callee's storage. \`msg.sender\` becomes the calling contract. May send value.
- \`DELEGATECALL\`: runs the callee's code with the **caller's** storage, balance, \`msg.sender\` and \`msg.value\`. This is how libraries and proxies work.
- \`STATICCALL\` (EIP-214): like \`CALL\` without value, and any state change inside it (\`SSTORE\`, \`LOG\`, \`CREATE\`, sending ether) fails. \`view\` functions are called this way.

A call forwards at most 63/64 of the remaining [[gas]] (EIP-150), and nesting is capped at 1024 frames. A failing sub-call does not undo the caller: the opcode pushes 0, and it is the caller's choice to [[revert]] too. Solidity's high-level calls do so automatically; a low-level \`addr.call(...)\` returns \`(bool ok, bytes memory data)\` that must be checked.

Revert data is ABI-encoded like a call: \`require(cond, "msg")\` returns \`Error(string)\` with selector \`0x08c379a0\`, a failed \`assert\` or arithmetic overflow returns \`Panic(uint256)\` (\`0x4e487b71\`), and custom errors use their own 4-byte selector.`,
      },
      code: {
        lang: 'Solidity',
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PiggyBank {
    uint256 public count;                          // slot 0
    mapping(address => uint256) public balances;   // slot 1

    function increment() external {                // 0xd09de08a
        count += 1;
    }

    function deposit() external payable {          // 0xd0e30db0
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {   // 0x2e1a7d4d
        require(balances[msg.sender] >= amount, "balance too low");
        balances[msg.sender] -= amount;                     // effect first
        (bool ok, ) = msg.sender.call{value: amount}("");   // then the transfer
        require(ok, "send failed");
    }
}`,
      },
    },
    storage: {
      title: 'Storage: numbered slots',
      alt: 'On the left two numbered drawers: slot 0 holds the counter, slot 1 is the empty marker of the balances table. To the right runs a long rail with three more drawers at scattered positions, one for each person. The selected person\'s drawer is raised and glows, and shows its long slot number and its value. Empty drawers are faint.',
      body: {
        beginner: `A contract remembers things in its own wall of numbered drawers. Each drawer holds one number. Only the contract's own code can change them, and what is in them stays there until the code changes it again.

Simple values get the first drawers: the counter is in drawer 0. A table like "who is owed how much" works differently. The drawer for each person is found by scrambling their name into a huge number, so everyone gets their own drawer somewhere in an almost endless wall.

Pick a person, then deposit as that person. Notice that each one lands in a completely different place, and that a drawer nobody has written to is simply empty.`,
        intermediate: `Every contract has 2²⁵⁶ storage positions, each called a [[storage-slot]] and each holding 32 bytes. All of them read as zero until something is written.

Variables get slots in the order they are declared: here \`count\` is slot 0 and \`balances\` is slot 1. A mapping cannot sit in one slot, so its slot stays empty and each entry lives at

\`keccak256(key, slot of the mapping)\`

The panel shows the real [[hash]] for each key. The three entries are nowhere near each other, and there is no list of keys anywhere: a contract cannot loop over a mapping, and a zero entry takes no space at all.

Two consequences worth remembering. Storage is **public**: anyone can read any slot of any contract from a [[node]], whatever the source code calls \`private\`. And storage is the most expensive thing a contract does, because every [[full-node]] must keep it forever: writing a new slot costs 20,000 [[gas]].`,
        expert: `Solidity's layout rules (state variables in declaration order, base contracts first in C3-linearised order):

- value types smaller than 32 bytes are packed into one [[storage-slot]] when contiguous, lower-order aligned; a value that does not fit starts the next slot;
- structs and arrays always start a new slot, and so does whatever follows them;
- a mapping at slot \`p\` stores the value for key \`k\` at \`keccak256(h(k) . p)\`, where \`h\` pads value types to 32 bytes; nested mappings apply this repeatedly;
- a dynamic array at slot \`p\` stores its length in \`p\` and its elements from \`keccak256(p)\`;
- \`bytes\` and \`string\` of up to 31 bytes are stored in the slot itself with \`length * 2\` in the lowest byte; longer ones store \`length * 2 + 1\` in the slot and the data from \`keccak256(p)\`.

At the protocol level a contract's storage is its own Merkle-Patricia trie, keyed by \`keccak256(slot)\`, whose root is the account's \`storageRoot\`. A slot set to zero is deleted from the trie.

Access is priced by EIP-2929: the first touch of a slot in a [[transaction]] is **cold** (2,100 [[gas]] for \`SLOAD\`), later touches are **warm** (100). EIP-1153 adds [[transient-storage]] (\`TSTORE\` / \`TLOAD\`, 100 gas each), which is cleared at the end of the transaction and never reaches the trie.

Layout is part of a contract's interface once a proxy is involved: an upgrade that reorders or inserts variables silently reinterprets existing slots.`,
      },
      code: {
        lang: 'Solidity',
        source: `contract Layout {
    uint256 count;                        // slot 0
    mapping(address => uint256) balances; // slot 1 (the slot itself stays empty)
    uint128 a;                            // slot 2, low 16 bytes
    uint128 b;                            // slot 2, high 16 bytes (packed)
    uint256[] list;                       // slot 3 holds the length

    // Where balances[who] lives
    function balanceSlot(address who) external pure returns (bytes32) {
        return keccak256(abi.encode(who, uint256(1)));
    }

    // Where list[i] lives
    function listSlot(uint256 i) external pure returns (uint256) {
        return uint256(keccak256(abi.encode(uint256(3)))) + i;
    }
}

// Anyone can read any slot, "private" or not:
//   eth_getStorageAt(contract, slot, "latest")`,
      },
    },
    evm: {
      title: 'The EVM runs one opcode at a time',
      alt: 'A row of seven instruction blocks with a pointer over the current one. To the right a small stack of plates holds the values being worked on, and a storage drawer holds the counter. A long green bar below shows the gas that is left. Each press of Step moves the pointer, changes the stack and shortens the bar.',
      body: {
        beginner: `Inside every [[node]] is the same small calculator, the [[evm]]. It reads a contract's program one tiny instruction at a time. It has a pile of numbers to work with, like a stack of plates: it can put a plate on top or take the top one off.

This program adds 1 to the counter. Press **Step** and follow it: fetch the counter from its drawer, put a 1 on the pile, add the two, put the result back in the drawer.

Watch the green bar. Every instruction uses up some [[gas]], and two of them use far more than the rest: the ones that touch the drawer.`,
        intermediate: `The [[evm]] is a stack machine. Each instruction is one byte, an [[opcode]], and each takes its inputs from the top of the stack and pushes its result back. Values are 256 bits wide.

The seven steps of \`count = count + 1\`:

- \`PUSH0\` puts 0 on the stack: the slot number. 2 gas.
- \`SLOAD\` replaces it with the value in that [[storage-slot]]. 2,100 gas.
- \`PUSH1 1\` puts 1 on the stack. 3 gas.
- \`ADD\` replaces the top two values with their sum. 3 gas.
- \`PUSH0\` puts the slot number on again. 2 gas.
- \`SSTORE\` writes the sum into the slot. 20,000 gas.
- \`STOP\` ends the call. 0 gas.

The total is 22,110 [[gas]], and 22,100 of it is storage. Arithmetic is almost free; state that every [[full-node]] must keep is what costs.`,
        expert: `The program is the 8 bytes \`0x5f546001015f5500\`. The interpreter here is real: stack of 256-bit words (limit 1024), per-opcode [[gas]], and storage pricing as on mainnet.

- \`PUSH0\` (\`0x5f\`, EIP-3855, Shanghai) costs 2; \`PUSH1\` and \`ADD\` cost 3.
- \`SLOAD\` costs 2,100 here because slot 0 is **cold**. It is then in the transaction's access set, so the \`SSTORE\` pays no cold surcharge (EIP-2929).
- \`SSTORE\` is priced on three values: original (at the start of the transaction), current and new. Zero → non-zero is 20,000. Non-zero → a different non-zero is 2,900. Writing the current value again, or a slot already dirtied in this transaction, is 100. \`SSTORE\` also fails outright if 2,300 gas or less remains (EIP-2200).
- Clearing a slot refunds 4,800, with total refunds capped at one fifth of the gas used (EIP-3529).

Besides the stack there is byte-addressed **memory** (cleared after each call, priced quadratically as it grows), the read-only [[calldata]], and the return data of the last sub-call.

Real compiled [[solidity]] does more than this hand-written program: a dispatcher on the selector, a check that no ether was sent to a non-payable function, an overflow check on the addition (a failed one reverts with \`Panic(0x11)\`), and setup of the free-memory pointer. The storage costs still dominate.`,
      },
      code: {
        lang: 'EVM assembly',
        source: `pc  bytes   opcode     stack after        gas
00  5f      PUSH0      [0]                    2
01  54      SLOAD      [count]            2,100   // cold read of slot 0
02  60 01   PUSH1 1    [count, 1]             3
04  01      ADD        [count + 1]            3
05  5f      PUSH0      [count + 1, 0]         2
06  55      SSTORE     []                20,000   // 0 -> non-zero (2,900 if already non-zero)
07  00      STOP                              0
                                         ------
                                         22,110`,
      },
    },
    gas: {
      title: 'Gas: out of gas means revert, and you still pay',
      alt: 'The same row of instruction blocks. Below it a bar shows the gas limit: a grey part for the base cost, an orange part for the gas the code used and a green part for what is returned. A dark post marks how much the call needs. When the limit is below the post, the block where execution stopped turns red, the bar turns red, the storage drawer stays empty and a stack of fee coins is still paid.',
      body: {
        beginner: `Before a call runs, the sender decides the most [[gas]] they are willing to pay for, like putting a fixed amount on a prepaid meter.

If the program finishes with gas to spare, the rest is returned. If the meter hits zero halfway through, the program stops and **everything it did is undone**, as if the call had never happened. That is a [[revert]].

But the computers did real work up to that point, so the fee is still charged. Drag the slider down until the call fails: the counter stays where it was, and the pile of fee coins is still there.`,
        intermediate: `Every [[transaction]] has a **gas limit**. The [[gas-fee]] is the gas actually used times the price per unit of gas, shown here at 20 gwei.

This call needs 43,110 gas: 21,000 that every transaction pays, plus the 22,110 the code uses. The dark post on the bar marks it.

- Limit at or above 43,110: the call succeeds, uses exactly 43,110, and the rest of the limit is never charged.
- Limit below it: execution stops at the instruction it cannot afford. The counter is not changed, the whole limit is consumed, and the fee is paid on all of it.

Tick the box to start with the counter already at 1. Changing a non-zero value costs 2,900 instead of 20,000, so the same call now needs only 26,010. This is why the same function can cost different amounts on different days, and why wallets simulate a call first to choose the limit.`,
        expert: `Intrinsic gas is charged before any code runs: 21,000, plus 4 per zero byte and 16 per non-zero byte of [[calldata]] (EIP-2028), plus 32,000 for a creation, plus access-list entries. Since Pectra, EIP-7623 adds a floor of 10 gas per calldata token for data-heavy transactions. The call here has empty calldata, so its intrinsic cost is exactly 21,000. A limit below the intrinsic cost makes the transaction invalid: it is never included and costs nothing.

Two ways a frame can fail, with different gas outcomes:

- an **exceptional halt** (out of gas, invalid opcode \`0xfe\`, stack underflow, a state change inside \`STATICCALL\`) consumes all gas given to that frame;
- the \`REVERT\` opcode (\`0xfd\`, EIP-140) undoes the frame's state changes but returns the unused gas and a data payload. \`require\`, \`revert\` and, since Solidity 0.8, \`assert\` compile to it.

In both cases the state changes of that frame and its sub-calls are rolled back, and logs emitted inside are discarded. If the top-level frame fails, the [[transaction]] is still included in the [[block]] with \`status = 0\`, the sender's nonce increases and the fee \`gasUsed × (baseFee + tip)\` is paid under [[eip-1559]].

Other limits: a transaction may use at most 16,777,216 gas (EIP-7825, since Fusaka), and since a call passes on at most 63/64 of its gas, a caller always keeps enough to handle a callee that runs out.`,
      },
      code: {
        lang: 'Solidity',
        source: `contract GasExamples {
    uint256 public count;

    function increment() external {
        count += 1;
    }

    // REVERT (0xfd): state undone, unused gas returned, reason returned.
    function mustBePositive(uint256 x) external pure {
        require(x > 0, "x is zero");
    }

    // Catching a failing sub-call: only the callee's changes are undone.
    function tryIncrement(GasExamples other) external returns (bool ok) {
        // Forward only 10,000 gas: not enough for the SSTORE inside.
        (ok, ) = address(other).call{gas: 10_000}(
            abi.encodeCall(GasExamples.increment, ())
        );
        // ok == false, and this function carries on with its own gas.
    }
}`,
      },
    },
    reentrancy: {
      title: 'Code is permanent, and so are its bugs',
      alt: 'A vault contract on the left with a stack of coins and an attacker contract on the right. Between them a pile of slabs grows, one for every nested call that has not finished. A red arrow shows the attacker calling the vault and a dashed line shows ETH flowing back. Stepping through the attack moves the coins one by one to the attacker; with the fix switched on, the pile turns red and every coin stays in the vault.',
      body: {
        beginner: `Once a contract is deployed, its code cannot be edited. That is the point: nobody can change the rules afterwards. It also means a mistake stays there for good.

The most famous mistake looks like a careless bank teller. A customer asks to withdraw. The teller hands over the cash **first** and only then reaches for the ledger to cross out the balance. A quick customer asks again before the pen touches the paper, and again, and again.

Press **Next step** to watch the attacker empty the vault, including money that belonged to other people. Then tick **update balance before sending** and try again. With the ledger updated first, the second request is refused and the whole attack is undone.`,
        intermediate: `The vault's \`withdraw\` does three things in the wrong order: check the caller's balance, send the [[ether]], then set the balance to zero.

Sending ether to a [[contract-account]] runs that contract's code. The attacker's code immediately calls \`withdraw\` again. The vault has not reached its third line yet, so its record still says the attacker is owed 1 ETH, and it pays again. With 9 ETH from other users and 1 ETH from the attacker, ten nested calls empty the vault. This is [[reentrancy]].

The fix is an ordering rule called **checks-effects-interactions**: update your own records before you call anyone else. Then the nested call fails its check, the failure travels back up, and the whole [[transaction]] reverts.

In 2016 this exact bug drained over 3.6 million ETH from a contract called The DAO. Because code is immutable, the only remedy was a change to the chain itself, which split it into Ethereum and Ethereum Classic.

Some projects make contracts changeable on purpose with a **proxy**: users call a small contract that holds the data and forwards every call to a replaceable logic contract. Bugs can then be fixed, but someone holds the power to change the rules, which is exactly what immutability was meant to rule out.`,
        expert: `Defences against [[reentrancy]], in order of preference:

- **Checks-effects-interactions**: finish every state write before any external call. It costs nothing.
- **A reentrancy lock** (OpenZeppelin \`ReentrancyGuard\`'s \`nonReentrant\`): a storage flag set on entry and cleared on exit. A variant keeps the flag in [[transient-storage]].
- Do not rely on the 2,300-gas stipend of \`transfer\` / \`send\`: opcode prices change, and it breaks receivers that need more gas.

The single-function case shown here is the simplest. **Cross-function** reentrancy enters a different function that reads the same stale state; **read-only** reentrancy calls a \`view\` function on a contract that is mid-update and feeds the stale answer to a third protocol. Any external call is a possible entry point, including token hooks such as \`onERC721Received\`.

Proxies: the proxy holds the storage and \`DELEGATECALL\`s into an implementation whose address sits in a fixed [[storage-slot]], chosen by EIP-1967 so it cannot collide with normal layout: \`bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1)\` = \`0x360894a1…382bbc\`. Constructors do not run in the proxy's context, so implementations use initializer functions that must be protected against being called twice. Upgrades must only append to the storage layout. Who may upgrade (a key, a multisig, a timelock, governance) is the real trust assumption of the system.

Code can no longer be removed either: since Cancun (EIP-6780), \`SELFDESTRUCT\` only sends the balance to the target and deletes nothing, unless it runs in the same [[transaction]] that created the contract.`,
      },
      code: {
        lang: 'Solidity',
        source: `contract Vault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // Vulnerable: pays out before updating its own record.
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");
        (bool ok, ) = msg.sender.call{value: amount}("");   // interaction
        require(ok, "send failed");
        balances[msg.sender] = 0;                           // effect, too late
    }

    // Fixed: checks, effects, interactions.
    function withdrawSafe() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");
        balances[msg.sender] = 0;                           // effect first
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "send failed");
    }
}

contract Attacker {
    Vault immutable vault;
    constructor(Vault v) { vault = v; }

    function attack() external payable {
        vault.deposit{value: msg.value}();
        vault.withdraw();
    }

    // Runs every time the vault sends ether here.
    receive() external payable {
        if (address(vault).balance >= msg.value) vault.withdraw();
    }
}`,
      },
    },
  },
};

export default content;

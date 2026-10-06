import type { LessonContent } from '../../../types';

const content: LessonContent = {
  labels: {
    alice: 'Alice',
    bob: 'Bob',
    dex: 'DEX contract',
    tokenContract: 'Token contract',
    aliceWallet: "Alice's wallet",
    bobWallet: "Bob's wallet",
    walletCaption: 'wallets hold keys, not tokens',
    anyToken: 'any ERC-20 token',
    oneWallet: 'one wallet, the same calls',
    stored: 'stored',
    shown: 'shown',
    supply: 'total supply',
    burnPit: 'burned',
    allowance: 'allowance',
    unlimitedShort: 'unlimited',
    wethContract: 'WETH contract',
    ethInside: 'ETH inside',
    wethSupply: 'WETH issued',
    offChain: 'the picture is stored elsewhere',
    errAllowance: 'allowance too low',
    errBalance: 'balance too low',
    errNotOwner: 'caller is not the owner',
    event: 'event',
    result: 'result',
    noCallYet: 'no call yet',
    amount: 'Amount',
    badAmount: 'not a valid amount',
    to: 'recipient',
    reset: 'Reset',
    rawInteger: 'Stored integer',
    approveAmount: 'Approve',
    unlimited: 'unlimited',
    revoke: 'revoke',
    dexTakes: 'DEX takes',
    dexTakesAll: 'DEX takes all',
    wrapped: 'Wrapped',
    lastCall: 'call',
    backing: 'backing',
    caller: 'caller',
    asWho: 'called by',
    bytes: 'bytes',
  },
  steps: {
    ledger: {
      title: 'A token is a number in a table',
      alt: 'A board in the middle lists three rows, Alice, Bob and DEX, each with a bar as long as its balance. Next to the board stands the token contract that owns it. Two wallets sit in front, one for Alice and one for Bob. When a transfer is sent, a parcel flies from Alice\'s wallet to the contract, one bar shrinks and another grows, and the event appears below the board. If the amount is too large the contract turns red and nothing moves.',
      body: {
        beginner: `When your wallet says you own 100 of some [[token]], there are no 100 coins sitting inside the wallet. There is a [[smart-contract]] somewhere that keeps a table: this address has 100, that address has 20. Your wallet only reads your row and shows it to you.

Sending tokens to Bob means asking that contract to take some off your row and add it to Bob's. Nothing travels anywhere. Two numbers change.

Type an amount and press **transfer**. Watch the two bars, and the note the contract publishes about what it did. Then try to send more than Alice has: the contract refuses and no number changes.`,
        intermediate: `[[ether]] is built into Ethereum: every account has an ETH balance as part of the account itself. A [[token]] is different. It is created by a [[smart-contract]], and "your balance" is one entry in that contract's storage, under your [[address]].

So a token transfer is a [[transaction]] sent **to the token contract**, not to the recipient. It carries no ETH. Its [[calldata]] says "run \`transfer\` with this recipient and this amount". The contract then:

- checks that the sender's entry is at least the amount, and does a [[revert]] if it is not;
- subtracts the amount from the sender's entry and adds it to the recipient's;
- emits a \`Transfer\` [[event-log]], which is how wallets and explorers notice that something moved.

The recipient does nothing and does not need to be online. This is also why tokens can simply appear in your [[wallet]], and why a wallet sometimes needs to be told a token's contract address before it shows it.`,
        expert: `The whole ledger is one mapping, \`mapping(address account => uint256) _balances\`. In OpenZeppelin's v5 implementation every balance change goes through \`_update(from, to, value)\`, which reverts with the custom error \`ERC20InsufficientBalance(sender, balance, needed)\` (ERC-6093) when the sender is short.

The panel shows the real [[calldata]]: selector \`0xa9059cbb\` = \`keccak256("transfer(address,uint256)")[0:4]\`, then the recipient left-padded to 32 bytes, then the amount as a \`uint256\` in base units (the amount typed × 10¹⁸ here).

The [[event-log]] has three topics and one data word: \`topic0 = keccak256("Transfer(address,address,uint256)") = 0xddf252ad…523b3ef\`, the indexed \`from\` and \`to\`, and \`value\` in the data. Balances are not enumerable on chain, so holder lists are rebuilt off chain from these logs.

Things the standard requires that surprise people: a transfer of 0 is a normal transfer and must emit the event; and nothing stops a transfer to an address that cannot move the tokens again, such as a contract with no function for it. Such tokens are stuck. ERC-20 has no receive hook; OpenZeppelin only blocks \`address(0)\`.`,
      },
      code: {
        lang: 'Solidity',
        source: `// The core of an ERC-20 token, reduced to what transfer needs.
contract Token {
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 value);

    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "balance too low");
        balanceOf[msg.sender] -= value;   // two numbers change,
        balanceOf[to] += value;           // nothing moves anywhere
        emit Transfer(msg.sender, to, value);
        return true;
    }
}`,
      },
    },
    erc20: {
      title: 'ERC-20: one interface for every token',
      alt: 'On the left three small token contracts, each with a different coloured coin above it, are all connected to one wallet by the same kind of line. On the right a strip of digit tiles shows the stored integer, with a glowing marker where the decimal point goes. Changing the decimals setting slides the marker along the strip and changes the number shown below it.',
      body: {
        beginner: `Thousands of different tokens exist, written by different people. Your wallet can still show all of them, and an exchange can trade all of them, because they agreed on the same set of buttons: "what is this address's balance?", "send this much to that address", and a few more. That agreement is called [[erc-20]].

It works like power sockets. Once every appliance has the same plug, anything fits anywhere.

One of the shared buttons is [[decimals]]. A contract can only store whole numbers, so a token says how many digits from the right the decimal point belongs. The strip on the right shows a stored number. Switch between 6 and 18 and watch the same digits become a very different amount.`,
        intermediate: `[[erc-20]] is a list of functions and events that a token contract promises to have. The core ones:

- \`balanceOf(owner)\`: the table entry for an address;
- \`transfer(to, value)\`: move your own tokens;
- \`totalSupply()\`: how many exist in total;
- \`approve\`, \`allowance\`, \`transferFrom\`: let someone else move your tokens (two steps ahead);
- the optional \`name()\`, \`symbol()\` and \`decimals()\`.

Because the function names and argument types are fixed, a [[wallet]], an explorer or a [[dex]] written years ago works with a token deployed today, with no changes.

The [[evm]] has no fractions, so balances are whole numbers of the token's smallest unit, and [[decimals]] only tells apps where to draw the point. Most tokens use 18, like ETH and its wei. USDC uses 6: the stored number 2,500,000 means 2.5 USDC. Read that same number with 18 decimals and it is 0.0000000000025. An app that assumes the wrong value is off by a factor of a trillion.`,
        expert: `The full interface of EIP-20, with the selectors (first 4 bytes of the Keccak-256 hash of the signature):

- \`totalSupply()\` \`0x18160ddd\`, \`balanceOf(address)\` \`0x70a08231\`, \`allowance(address,address)\` \`0xdd62ed3e\`
- \`transfer(address,uint256)\` \`0xa9059cbb\`, \`approve(address,uint256)\` \`0x095ea7b3\`, \`transferFrom(address,address,uint256)\` \`0x23b872dd\`, each returning \`bool\`
- optional: \`name()\` \`0x06fdde03\`, \`symbol()\` \`0x95d89b41\`, \`decimals()\` \`0x313ce567\` returning \`uint8\`
- events \`Transfer(address indexed, address indexed, uint256)\` and \`Approval(address indexed, address indexed, uint256)\`

The standard is short, and real tokens deviate from it. Integration hazards worth knowing by heart:

- **No return value.** Some older tokens, USDT on mainnet among them, return nothing from \`transfer\`. A Solidity call through an interface that declares \`returns (bool)\` then reverts while decoding. OpenZeppelin's \`SafeERC20\` (\`safeTransfer\`, \`safeTransferFrom\`, \`forceApprove\`) accepts both "returned true" and "returned nothing".
- **Fee on transfer.** The recipient gets less than \`value\`. Measure your own balance before and after instead of trusting the argument.
- **Rebasing.** Balances change without any transfer, so a contract that caches a balance drifts from reality. Protocols usually accept a non-rebasing wrapper instead.
- **Decimals.** Optional, not always 18, and not guaranteed to exist. Never hard-code it; scale explicitly when combining two tokens.

The unit conversion in the panel is done with integers (\`BigInt\`), never floating point: 2²⁵⁶ − 1 has 78 digits, far beyond what a double can hold exactly.`,
      },
      code: {
        lang: 'Solidity',
        source: `// EIP-20, as an interface.
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);

    function transfer(address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// Optional, but nearly universal.
interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

// shown = stored / 10 ** decimals   (done off chain, for people)
// 2_500_000 with 6 decimals  ->  2.5
// 2_500_000 with 18 decimals ->  0.0000000000025`,
      },
    },
    supply: {
      title: 'Mint and burn: where tokens come from',
      alt: 'The balances board again, now with a tall orange column beside it that stands for the total supply and a dark pit in front for burned tokens. Minting drops a new token onto the board from above: Alice\'s bar and the supply column both grow. Burning sends a token into the pit: both shrink.',
      body: {
        beginner: `Tokens do not have to exist from the start. The contract can create new ones, which is called [[mint|minting]], and destroy existing ones, which is called [[burn|burning]].

Minting does not take tokens from anywhere. The contract just writes a bigger number in someone's row, and the count of all tokens in existence, the [[total-supply]], grows by the same amount. Burning is the reverse.

Press **mint** and **burn** and watch the tall column: it always equals all the rows added together. Then burn until Alice has nothing left and try once more.

Who is allowed to mint is the most important rule of any token, because whoever can mint freely can make everyone else's share worth less.`,
        intermediate: `[[total-supply]] is one more number in the contract, and the code keeps it equal to the sum of all balances:

- a [[mint]] adds to one balance and to the total;
- a [[burn]] subtracts from one balance and from the total;
- a transfer changes two balances and leaves the total alone.

Both emit the usual \`Transfer\` [[event-log]]: a mint is recorded as a transfer **from** the zero address, a burn as a transfer **to** it. That way an app that only listens to \`Transfer\` still sees every change in balances.

[[erc-20]] itself does not say who may mint. Each token decides in its own code:

- a fixed supply minted once at [[deployment]], with no mint function afterwards;
- an issuer with a special role, as in a [[stablecoin]] that mints when dollars come in and burns when they go out;
- a rule in code, as in an [[lp-token]] that is minted when you deposit into a pool and burned when you withdraw.

Before trusting a token, find out which of these it is.`,
        expert: `Neither \`mint\` nor \`burn\` is part of EIP-20. The standard only says a contract creating tokens SHOULD emit \`Transfer\` with \`_from\` set to \`0x0\`. The buttons here call the common shapes \`mint(address,uint256)\` (\`0x40c10f19\`) and \`burn(uint256)\` (\`0x42966c68\`); real tokens name and guard them however they like.

In OpenZeppelin v5, \`_mint(to, value)\` is \`_update(address(0), to, value)\` and \`_burn(from, value)\` is \`_update(from, address(0), value)\`. \`_update\` adjusts \`_totalSupply\` when either side is the zero address, with checked arithmetic on the supply and \`unchecked\` on balances, which is safe because no balance can exceed the total. Access control is left to the inheriting contract: \`Ownable\`, \`AccessControl\` roles, a cap (\`ERC20Capped\`), or \`ERC20Burnable\` for holder-initiated \`burn\` and allowance-based \`burnFrom\`.

Two details that matter in audits:

- Sending tokens to a dead address such as \`0x…dEaD\` is not a burn as far as the contract is concerned: \`totalSupply()\` is unchanged. Only code that reduces \`_totalSupply\` shrinks it.
- A privileged minter is an unlimited claim on every holder. Check who holds the role, whether it sits behind a timelock or multisig, and whether an upgradeable proxy could add a mint function later.

Supply that changes by formula rather than by calls (rebasing tokens) keeps a scaling factor and computes \`balanceOf\` on the fly, so individual balances change with no \`Transfer\` at all.`,
      },
      code: {
        lang: 'Solidity',
        source: `// Simplified from OpenZeppelin Contracts v5: every balance change in one place.
function _update(address from, address to, uint256 value) internal {
    if (from == address(0)) {
        _totalSupply += value;                     // mint
    } else {
        uint256 fromBalance = _balances[from];
        if (fromBalance < value) revert ERC20InsufficientBalance(from, fromBalance, value);
        unchecked { _balances[from] = fromBalance - value; }
    }

    if (to == address(0)) {
        unchecked { _totalSupply -= value; }       // burn
    } else {
        unchecked { _balances[to] += value; }
    }

    emit Transfer(from, to, value);                // also for mint and burn
}

function _mint(address to, uint256 value) internal { _update(address(0), to, value); }
function _burn(address from, uint256 value) internal { _update(from, address(0), value); }`,
      },
    },
    approve: {
      title: 'Approve and transferFrom: letting a contract spend for you',
      alt: 'The balances board, with Alice on the left and an exchange contract on the right. Between them stands a gauge showing how much the exchange is allowed to take from Alice. Approving raises the gauge; each time the exchange pulls tokens, a token flies from the board to the exchange, Alice\'s bar shrinks, the DEX bar grows and the gauge drops. With unlimited approval the gauge turns red and never drops.',
      body: {
        beginner: `An exchange is a [[smart-contract]]. To trade your tokens it has to take them from you, but only you can change your row in the token's table. So tokens have a second mechanism: you tell the token contract "this exchange may take up to this many of my tokens". That permission is an [[allowance]].

Set the slider and press **approve**: the gauge rises, but no tokens move yet. Now press **DEX takes 30**. The exchange pulls 30 and the gauge drops by 30. Press it again and it fails, because what is left of the allowance is too small.

Now tick **unlimited** and approve again. The exchange can take everything Alice has, today or a year from now. Many apps ask for exactly this, because it saves you a step later. If that contract is ever broken into, or was dishonest all along, your tokens are gone. **Revoke** sets the permission back to zero.`,
        intermediate: `Paying a contract with [[ether]] is easy: you attach the ETH to the call. A [[token]] cannot be attached. The exchange would have to call \`transfer\` in your name, and the token contract only moves the caller's own balance.

[[erc-20]] solves this with two calls:

- \`approve(spender, value)\`: sent by you to the **token** contract. It records an [[allowance]]: "spender may move up to \`value\` of my tokens". This is the [[token-approval]] your wallet asks you to confirm.
- \`transferFrom(from, to, value)\`: sent later by the spender. The token checks the allowance, moves the tokens and reduces the allowance by \`value\`.

Things to try, and what they show:

- approve 40, then take 30 twice: the second call does a [[revert]], allowance too low;
- approve 40, then **DEX takes all**: fails as well. Alice has 100 and the exchange may move 40, so an exact allowance caps what can go wrong;
- **unlimited**, then **DEX takes all**: every token leaves, and the allowance is still unlimited afterwards.

An allowance stays until you change it. It is not tied to one trade, and it covers tokens you receive later. Approving again **replaces** the old value; approving 0 revokes it.`,
        expert: `Allowances are \`mapping(address owner => mapping(address spender => uint256))\`. "Unlimited" means \`type(uint256).max\`: the calldata in the panel is \`0x095ea7b3\`, the spender, and 32 bytes of \`ff\`. OpenZeppelin does not decrease an allowance of that value in \`transferFrom\`, which saves a storage write per trade; v5 also emits no \`Approval\` event when \`transferFrom\` spends an allowance. A shortfall reverts with \`ERC20InsufficientAllowance(spender, allowance, needed)\`, and the allowance is checked before the balance.

**The approve race.** Changing an allowance from N to M with one \`approve\` lets a spender who sees the pending transaction spend N first and then M as well. EIP-20 itself recommends setting the allowance to 0 before setting a new value. Some tokens enforce it: USDT reverts on \`approve\` from non-zero to non-zero, which is what \`SafeERC20.forceApprove\` works around. \`increaseAllowance\` / \`decreaseAllowance\` were never part of the standard, and OpenZeppelin removed them in v5.

**Permit (EIP-2612).** \`permit(owner, spender, value, deadline, v, r, s)\` sets an allowance from an EIP-712 signature instead of a transaction from the owner, guarded by a per-owner \`nonces\` counter and the \`DOMAIN_SEPARATOR\`. Approval and use can then happen in one transaction paid for by someone else. The trade-off is that a signature costs nothing to produce, so phishing for one costs the victim nothing up front.

Approvals are the main standing risk for token holders: the spender's code, including any upgrade of it, can move the approved amount at any time. Exact-amount approvals and periodic revocation limit the damage.`,
      },
      code: {
        lang: 'Solidity',
        source: `// Simplified from OpenZeppelin Contracts v5.
mapping(address owner => mapping(address spender => uint256)) private _allowances;

function approve(address spender, uint256 value) public returns (bool) {
    _allowances[msg.sender][spender] = value;      // overwrites, never adds
    emit Approval(msg.sender, spender, value);
    return true;
}

function transferFrom(address from, address to, uint256 value) public returns (bool) {
    uint256 current = _allowances[from][msg.sender];
    if (current != type(uint256).max) {            // "unlimited" is never reduced
        if (current < value) revert ERC20InsufficientAllowance(msg.sender, current, value);
        unchecked { _allowances[from][msg.sender] = current - value; }
    }
    _update(from, to, value);                      // reverts if the balance is too low
    return true;
}

// EIP-2612: the same allowance, set by a signature instead of a transaction.
function permit(address owner, address spender, uint256 value, uint256 deadline,
                uint8 v, bytes32 r, bytes32 s) external;`,
      },
    },
    kinds: {
      title: 'Stablecoins, wrapped tokens and LP tokens',
      alt: 'Alice stands on the left with a stack of ETH coins and a stack of WETH tokens. In the middle is the WETH contract, and beside it two stacks of equal height: the ETH the contract holds and the WETH it has issued. Moving the slider sends a parcel between Alice and the contract; her two stacks trade places coin by coin, and the two stacks beside the contract rise and fall together.',
      body: {
        beginner: `The same kind of table can stand for very different things.

- A [[stablecoin]] is a token meant to stay worth one dollar. Usually a company holds real dollars and issues one token for each.
- A [[wrapped-token]] is a token that stands in for another asset, one for one. You hand the asset to a contract and get the wrapped version; hand it back and you get the original.
- An [[lp-token]] is a receipt for your share of a pool on an exchange. The Uniswap lessons use it.

The scene shows wrapping. ETH itself is not a token of this kind, so many apps use WETH, "wrapped ETH". Move the slider: each ETH Alice puts in becomes one WETH, and back again. Watch the two stacks beside the contract. They are always the same height, which is the whole promise: every WETH is backed by one real ETH.`,
        intermediate: `A [[stablecoin]] comes in one of two main designs. A fiat-backed one, such as USDC or USDT, has an issuer that holds dollars and short-term government debt, performs a [[mint]] when money comes in and a [[burn]] when it is redeemed. You trust the issuer, who can also freeze an [[address]]. A crypto-backed one, such as DAI, is minted by a [[smart-contract]] against collateral that is worth more than the tokens created, and the collateral is sold automatically if its value falls too far.

A [[wrapped-token]] like WETH exists because [[ether]] is older than [[erc-20]] and does not follow it: it has no \`transferFrom\` and no [[allowance]]. The WETH contract fixes that. \`deposit()\` takes your ETH and credits the same amount of WETH; \`withdraw(amount)\` destroys the WETH and sends the ETH back. No fee, no price, no owner. The contract's ETH balance always equals the WETH in existence.

Wrapped assets from other chains, such as WBTC for bitcoin, look the same on the surface but rest on a custodian holding the real asset somewhere else.

An [[lp-token]] is minted by a pool when you deposit and burned when you withdraw. Because all three are plain [[erc-20]] tokens, any of them can be traded, lent or used as collateral by apps that know nothing about how they are made.`,
        expert: `WETH9, the canonical mainnet contract at \`0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\`, is about 60 lines. \`deposit()\` (\`0xd0e30db0\`, payable) does \`balanceOf[msg.sender] += msg.value\`; the fallback calls it, so plain ETH sent to the contract wraps too. \`withdraw(uint wad)\` (\`0x2e1a7d4d\`) checks and decrements the balance, then \`msg.sender.transfer(wad)\`: effects before the interaction, plus the 2,300-gas stipend. \`totalSupply()\` is simply \`address(this).balance\`, and the contract emits \`Deposit\` / \`Withdrawal\` rather than \`Transfer\` from or to the zero address, so supply tracking by \`Transfer\` logs alone does not work for it. It has 18 decimals and no \`permit\`.

The slider here issues the real calls: moving right is \`deposit()\` with \`msg.value\`, moving left is \`withdraw(wad)\` with zero value.

Uniswap v2 and v3 pools hold WETH and their routers wrap and unwrap around a swap; v4 supports [[native-eth]] directly.

Stablecoins as integration targets: USDC has 6 decimals, sits behind an upgradeable proxy and has a blacklist that makes \`transfer\` revert for listed addresses; USDT has the missing-return-value and approve quirks from the earlier steps. Treat "1 token = 1 dollar" as a price that can move, not as a constant in code.

Yield-bearing and vault tokens add another layer: ERC-4626 standardises a vault whose shares are an [[erc-20]] and whose share price rises as assets accrue, which avoids rebasing. For any wrapper, the questions are the same: what backs it, who can [[mint]], and can redemption be paused.`,
      },
      code: {
        lang: 'Solidity',
        source: `// WETH9, abridged (Solidity 0.4 syntax, as deployed).
contract WETH9 {
    string public name     = "Wrapped Ether";
    string public symbol   = "WETH";
    uint8  public decimals = 18;

    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);

    mapping (address => uint) public balanceOf;

    function() public payable { deposit(); }       // plain ETH wraps too

    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;        // 1 ETH in, 1 WETH credited
        Deposit(msg.sender, msg.value);
    }

    function withdraw(uint wad) public {
        require(balanceOf[msg.sender] >= wad);
        balanceOf[msg.sender] -= wad;              // WETH destroyed first,
        msg.sender.transfer(wad);                  // then the ETH is sent back
        Withdrawal(msg.sender, wad);
    }

    function totalSupply() public view returns (uint) {
        return this.balance;                       // backing and supply are one number
    }
}`,
      },
    },
    nft: {
      title: 'NFTs: one owner per token id',
      alt: 'Two platforms, one for Alice and one for Bob. Four differently shaped objects, numbered 1 to 4, stand on them: each is one token id. The selected one is raised and glows, and a dashed line runs from it to a small server at the back where its picture and description are kept. Transferring moves that one object to the other platform; if the caller does not own it, its label turns red and it stays put.',
      body: {
        beginner: `With the tokens so far, any unit is as good as any other, like money. Some things are not like that: a concert ticket for seat 14, a deed to a house, a piece of art. For these there is the [[nft]], a "non-fungible token": every one is numbered and has exactly one owner.

The contract's table is turned around. Instead of "how many does each person have", it records "who owns number 1, who owns number 2".

Pick a number and transfer it. Notice that one particular object moves, not an amount. Then pick number 3, which belongs to Bob, and try to move it as Alice. The contract refuses.

One more thing to notice: the dashed line. The picture you see for an NFT is usually **not** on the blockchain. The contract only stores a link to it.`,
        intermediate: `The standard for an [[nft]] is [[erc-721]]. Its central function is \`ownerOf(tokenId)\`, which returns one [[address]]. \`balanceOf(owner)\` still exists, but it only counts how many ids an address holds; it says nothing about which.

A transfer names the id: \`transferFrom(from, to, tokenId)\`. The contract checks that the caller is the owner (or was approved by the owner) and rewrites the owner of that one id. There is no amount and nothing to split.

What the token **is** comes from metadata. \`tokenURI(tokenId)\` returns a link to a small JSON file with a name, a description and an image link. Where those files live matters:

- on a company's web server: they can be changed or disappear;
- on IPFS, where the link is a [[hash]] of the content: it cannot be swapped for something else, but it only stays available while someone keeps hosting it;
- fully on chain: rare, because storage is expensive.

Owning the token means the contract lists you as its owner. It does not by itself give you copyright in the picture.

ERC-1155 is a later standard that puts many ids in one contract and gives each id a balance, so one contract can hold both unique items and items that exist a thousand times, and move several in one call. NFTs are also used for things that are not art: a Uniswap v3 position is one (see [[nft-position]]).`,
        expert: `[[erc-721]] in full:

- \`balanceOf(address)\`, \`ownerOf(uint256)\`
- \`transferFrom(address,address,uint256)\` \`0x23b872dd\`, \`safeTransferFrom(address,address,uint256)\` \`0x42842e0e\` and \`safeTransferFrom(address,address,uint256,bytes)\` \`0xb88d4fde\`
- \`approve(address,uint256)\`, \`getApproved(uint256)\`, \`setApprovalForAll(address,bool)\` \`0xa22cb465\`, \`isApprovedForAll(address,address)\`
- events \`Transfer(address indexed, address indexed, uint256 indexed tokenId)\`, \`Approval(…)\` and \`ApprovalForAll(address indexed, address indexed, bool)\`
- ERC-165 \`supportsInterface\`: \`0x80ac58cd\` for ERC-721, \`0x5b5e139f\` for the metadata extension (\`name\`, \`symbol\`, \`tokenURI\`)

\`transferFrom\` has the same signature, and so the same selector, as the [[erc-20]] one, and the \`Transfer\` event has the same \`topic0\`. The difference is that the third argument is indexed here: four topics for an NFT, three for an ERC-20. Indexers tell them apart by that.

\`safeTransferFrom\` exists because plain \`transferFrom\` will happily send an NFT to a contract that can never move it. After the transfer, if the recipient has code, it calls \`onERC721Received(operator, from, tokenId, data)\` and reverts unless the return value is that function's selector, \`0x150b7a02\`. That callback is an external call in the middle of a transfer, so it is a [[reentrancy]] entry point: mint and transfer functions that use it must update state first.

\`setApprovalForAll(operator, true)\` is the NFT version of an unlimited approval: the operator can move every token you own in that collection, now and later. Marketplaces rely on it, and so do most NFT drainers.

ERC-1155: \`balanceOf(address,uint256)\`, \`safeTransferFrom(address,address,uint256,uint256,bytes)\`, \`safeBatchTransferFrom\`, events \`TransferSingle\` / \`TransferBatch\`, and one \`uri(id)\` template in which clients substitute \`{id}\` with the id as 64 lowercase hex digits. It has no \`ownerOf\`.`,
      },
      code: {
        lang: 'Solidity',
        source: `// As in OpenZeppelin's IERC721. (The EIP also marks the transfer functions and approve as payable.)
interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;

    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

// A contract that wants to receive NFTs through safeTransferFrom:
interface IERC721Receiver {
    // must return 0x150b7a02, its own selector
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external returns (bytes4);
}

// tokenURI(2) -> "ipfs://<hash>/2.json" -> { "name": "...", "description": "...", "image": "ipfs://..." }`,
      },
    },
  },
};

export default content;

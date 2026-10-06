import { describe, expect, it } from 'vitest';
import { keccakText, selector } from '../../sim/keys';
import {
  ALICE,
  BOB,
  GAS,
  INCREMENT_CODE,
  WEI,
  bankCall,
  create2Address,
  createAddress,
  createPreimage,
  disassemble,
  evmInit,
  evmRun,
  evmStep,
  intBytes,
  keccakHex,
  mappingSlot,
  singleSlotStorageRoot,
  EMPTY_TRIE_ROOT,
  newBank,
  nextCost,
  rlpEncode,
  sendTx,
  shortCalldata,
  shortHex,
  simulateAttack,
} from './logic';

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
const text = (s: string) => new TextEncoder().encode(s);

describe('RLP and contract addresses', () => {
  it('encodes the examples from the Ethereum RLP documentation', () => {
    expect(hex(rlpEncode(text('dog')))).toBe('83646f67');
    expect(hex(rlpEncode([text('cat'), text('dog')]))).toBe('c88363617483646f67');
    expect(hex(rlpEncode(new Uint8Array(0)))).toBe('80');
    expect(hex(rlpEncode([]))).toBe('c0');
    expect(hex(rlpEncode(intBytes(0n)))).toBe('80');
    expect(hex(rlpEncode(intBytes(15n)))).toBe('0f');
    expect(hex(rlpEncode(intBytes(1024n)))).toBe('820400');
    expect(hex(rlpEncode([[], [[]], [[], [[]]]]))).toBe('c7c0c1c0c3c0c1c0');
    const long = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit';
    expect(hex(rlpEncode(text(long)))).toBe('b838' + hex(text(long)));
  });

  it('derives known CREATE addresses', () => {
    // First two contracts deployed by Hardhat/Anvil account #0.
    expect(createAddress(ALICE, 0)).toBe('0x5fbdb2315678afecb367f032d93f642f64180aa3');
    expect(createAddress(ALICE, 1)).toBe('0xe7f1725e7734ce288f8367e1bb143e90bb3f0512');
    expect(createPreimage(ALICE, 0)).toBe('0xd694f39fd6e51aad88f6f4ce6ab8827279cfffb9226680');
    expect(createPreimage(ALICE, 1)).toBe('0xd694f39fd6e51aad88f6f4ce6ab8827279cfffb9226601');
    // Nonces of 128 and above take a length prefix.
    expect(createPreimage(ALICE, 128)).toBe('0xd794f39fd6e51aad88f6f4ce6ab8827279cfffb922668180');
    expect(createPreimage(ALICE, 256)).toBe('0xd894f39fd6e51aad88f6f4ce6ab8827279cfffb92266820100');
    // Bad input falls back to nonce 0.
    expect(createAddress(ALICE, -3)).toBe(createAddress(ALICE, 0));
    expect(createAddress(ALICE, Number.NaN)).toBe(createAddress(ALICE, 0));
    expect(createAddress(ALICE.toUpperCase().replace('0X', '0x'), 0)).toBe(createAddress(ALICE, 0));
  });

  it('derives the CREATE2 examples of EIP-1014', () => {
    expect(create2Address('0x0000000000000000000000000000000000000000', '0x00', '0x00')).toBe('0x4d1a2e2bb4f88f0250f26ffff098b0b30b26bf38');
    expect(create2Address('0xdeadbeef00000000000000000000000000000000', '0x00', '0x00')).toBe('0xb928f69bb1d91cd65274e3c79d8986362984fda3');
  });

  it('computes mapping slots and well-known hashes', () => {
    // keccak256 of 64 zero bytes: key 0 in a mapping at slot 0.
    expect(mappingSlot('0x0000000000000000000000000000000000000000', 0n)).toBe('0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5');
    expect(mappingSlot(ALICE, 1n)).not.toBe(mappingSlot(BOB, 1n));
    expect(mappingSlot(ALICE, 1n)).not.toBe(mappingSlot(ALICE, 2n));
    expect(mappingSlot(ALICE, 1n)).toMatch(/^0x[0-9a-f]{64}$/);
    // Empty code hash and empty trie root, as stored in every plain account.
    expect(keccakHex('0x')).toBe('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
    expect(keccakHex('0x80')).toBe('0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421');
    // EIP-1967 implementation slot.
    const slot = BigInt(keccakText('eip1967.proxy.implementation')) - 1n;
    expect(`0x${slot.toString(16)}`).toBe('0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
  });

  it('computes the storage root of an account with one slot', () => {
    // Storage { 0: 1 }, a value that appears in the Ethereum state tests.
    expect(singleSlotStorageRoot(0n, 1n)).toBe('0x821e2556a290c86405f8160a2d662042a431ba456b9db265c79bb837c04be5f0');
    expect(singleSlotStorageRoot(0n, 0n)).toBe(EMPTY_TRIE_ROOT);
    expect(singleSlotStorageRoot(0n, 2n)).not.toBe(singleSlotStorageRoot(0n, 1n));
  });

  it('shortens hex for display', () => {
    expect(shortHex('0x5fbdb2315678afecb367f032d93f642f64180aa3')).toBe('0x5fbd…0aa3');
    expect(shortHex('0x1234')).toBe('0x1234');
    expect(shortCalldata('0xd0e30db0')).toBe('0xd0e30db0');
    expect(shortCalldata('0x2e1a7d4d' + '0'.repeat(48) + '0de0b6b3a7640000')).toBe('0x2e1a7d4d 0…de0b6b3a7640000');
    expect(shortCalldata('0x2e1a7d4d' + '0'.repeat(64))).toBe('0x2e1a7d4d 0…0');
  });
});

describe('piggy bank contract', () => {
  it('deposits, counts and withdraws', () => {
    let r = bankCall(newBank(), 'deposit', ALICE, 2n * WEI);
    expect(r.ok).toBe(true);
    expect(r.calldata).toBe(selector('deposit()'));
    expect(r.calldata).toBe('0xd0e30db0');
    expect(r.value).toBe(2n * WEI);
    expect(r.state.eth).toBe(2n * WEI);
    expect(r.state.balances[ALICE]).toBe(2n * WEI);
    expect(r.state.wallets[ALICE]).toBe(3n * WEI);

    r = bankCall(r.state, 'increment', ALICE);
    expect(r.state.count).toBe(1n);
    expect(r.calldata).toBe('0xd09de08a');
    expect(r.value).toBe(0n);

    r = bankCall(r.state, 'withdraw', ALICE, WEI);
    expect(r.ok).toBe(true);
    expect(r.calldata).toBe('0x2e1a7d4d' + '0'.repeat(48) + '0de0b6b3a7640000');
    expect(r.state.eth).toBe(WEI);
    expect(r.state.balances[ALICE]).toBe(WEI);
    expect(r.state.wallets[ALICE]).toBe(4n * WEI);
    expect(r.state.count).toBe(1n);
  });

  it('reverts without changing anything', () => {
    const start = bankCall(newBank(), 'deposit', ALICE, WEI).state;
    const tooMuch = bankCall(start, 'withdraw', ALICE, 2n * WEI);
    expect(tooMuch.ok).toBe(false);
    expect(tooMuch.error).toBe('insufficient-balance');
    expect(tooMuch.state).toBe(start);
    // Bob never deposited: his slot is zero.
    expect(bankCall(start, 'withdraw', BOB, WEI).ok).toBe(false);
    const broke = bankCall(start, 'deposit', ALICE, 100n * WEI);
    expect(broke.error).toBe('insufficient-funds');
    expect(broke.state).toBe(start);
    // Unknown caller, zero and negative amounts.
    expect(bankCall(start, 'deposit', '0x00000000000000000000000000000000000000aa', WEI).ok).toBe(false);
    expect(bankCall(start, 'withdraw', ALICE, 0n).ok).toBe(true);
    expect(bankCall(start, 'withdraw', ALICE, -5n).state.eth).toBe(WEI);
  });

  it('keeps the contract balance equal to the sum of recorded balances', () => {
    let s = newBank();
    for (const [fn, who, amt] of [['deposit', ALICE, 3n], ['deposit', BOB, 5n], ['withdraw', ALICE, 1n], ['withdraw', BOB, 9n], ['deposit', BOB, 1n]] as const) {
      s = bankCall(s, fn, who, amt * WEI).state;
    }
    expect(s.eth).toBe(Object.values(s.balances).reduce((a, b) => a + b, 0n));
    expect(s.eth).toBe(7n * WEI);
  });
});

describe('tiny EVM', () => {
  const program = disassemble(INCREMENT_CODE);

  it('disassembles', () => {
    expect(program.map((i) => i.name)).toEqual(['PUSH0', 'SLOAD', 'PUSH1', 'ADD', 'PUSH0', 'SSTORE', 'STOP']);
    expect(program[2].arg).toBe(1n);
    expect(program.map((i) => i.pc)).toEqual([0, 1, 2, 4, 5, 6, 7]);
    expect(disassemble('0xfe')[0].name).toBe('INVALID');
    expect(disassemble('0x60')[0].arg).toBe(0n);
  });

  it('charges the real gas for each step of count += 1 from zero', () => {
    let s = evmInit(100_000, {});
    const costs: number[] = [];
    while (s.status === 'running') {
      s = evmStep(program, s);
      costs.push(s.lastCost);
    }
    // PUSH0 2, cold SLOAD 2100, PUSH1 3, ADD 3, PUSH0 2, SSTORE 0 -> non-zero on a warm slot 20000, STOP 0
    expect(costs).toEqual([2, 2100, 3, 3, 2, 20_000, 0]);
    expect(s.status).toBe('stopped');
    expect(s.storage['0']).toBe(1n);
    expect(s.gasStart - s.gasLeft).toBe(22_110);
    expect(s.stack).toEqual([]);
    expect(evmStep(program, s)).toBe(s);
  });

  it('charges 2,900 for changing a slot that is already non-zero', () => {
    const s = evmRun(program, 100_000, { '0': 41n });
    expect(s.storage['0']).toBe(42n);
    expect(s.gasStart - s.gasLeft).toBe(2 + 2100 + 3 + 3 + 2 + 2900);
  });

  it('prices cold and dirty writes', () => {
    // PUSH1 5, PUSH0, SSTORE: a cold slot set from zero costs 20000 + 2100.
    expect(evmRun(disassemble('0x60055f55'), 100_000).gasLeft).toBe(100_000 - 3 - 2 - 22_100);
    // Writing the value that is already there costs the warm read price (plus the cold surcharge).
    expect(evmRun(disassemble('0x60055f55'), 100_000, { '0': 5n }).gasLeft).toBe(100_000 - 3 - 2 - 2_200);
    // Second write to the same slot in one transaction: 100.
    const twice = evmRun(disassemble('0x60055f5560065f55'), 100_000);
    expect(twice.gasLeft).toBe(100_000 - 5 - 22_100 - 5 - 100);
    expect(twice.storage['0']).toBe(6n);
  });

  it('runs out of gas, restores storage and keeps nothing', () => {
    const s = evmRun(program, 22_109, {});
    expect(s.status).toBe('out-of-gas');
    expect(s.gasLeft).toBe(0);
    expect(s.storage).toEqual({});
    expect(program[s.ip].name).toBe('SSTORE');
    const early = evmRun(program, 1_000, { '0': 7n });
    expect(early.status).toBe('out-of-gas');
    expect(program[early.ip].name).toBe('SLOAD');
    expect(early.storage).toEqual({ '0': 7n });
    expect(evmRun(program, 0).status).toBe('out-of-gas');
    expect(evmRun(program, Number.NaN).status).toBe('out-of-gas');
    expect(evmRun(program, 22_110).status).toBe('stopped');
  });

  it('refuses SSTORE with 2,300 gas or less left', () => {
    // Slot already holds 5; writing 5 again would cost only 2,200, but the sentry applies first.
    expect(evmRun(disassemble('0x60055f55'), 5 + 2_300, { '0': 5n }).status).toBe('out-of-gas');
    expect(evmRun(disassemble('0x60055f55'), 5 + 2_301, { '0': 5n }).status).toBe('stopped');
  });

  it('does arithmetic modulo 2^256 and rejects bad programs', () => {
    // PUSH1 1, PUSH0, SUB -> 0 - 1 wraps around
    expect(evmRun(disassemble('0x60015f03'), 100).stack).toEqual([(1n << 256n) - 1n]);
    // PUSH1 3, DUP1, MUL -> 9 ; PUSH1 2, SWAP1, SUB -> 9 - 2
    expect(evmRun(disassemble('0x6003800260029003'), 100).stack).toEqual([7n]);
    expect(evmRun(disassemble('0x600350'), 100).stack).toEqual([]);
    const underflow = evmRun(disassemble('0x01'), 100);
    expect(underflow.status).toBe('invalid');
    expect(underflow.gasLeft).toBe(0);
    expect(evmRun(disassemble('0xfe'), 100).status).toBe('invalid');
    // Code that simply ends stops normally.
    expect(evmRun(disassemble('0x5f'), 100).status).toBe('stopped');
    expect(nextCost(program, evmInit(10))).toBe(2);
    expect(nextCost(disassemble('0x01'), evmInit(10))).toBeNull();
  });

  it('prices a whole transaction across the gas-limit slider', () => {
    const need = GAS.TX + 22_110;
    const enough = sendTx(program, 50_000, {}, 20);
    expect(enough).toMatchObject({ valid: true, ok: true, gasUsed: need, gasUnused: 50_000 - need, feeGwei: need * 20, gasNeeded: need });
    expect(enough.storage['0']).toBe(1n);
    expect(sendTx(program, need, {}, 20).ok).toBe(true);

    const short = sendTx(program, need - 1, {}, 20);
    expect(short).toMatchObject({ valid: true, ok: false, status: 'out-of-gas', gasUsed: need - 1, gasUnused: 0, feeGwei: (need - 1) * 20 });
    expect(short.storage).toEqual({});

    const min = sendTx(program, GAS.TX, { '0': 3n }, 20);
    expect(min).toMatchObject({ valid: true, ok: false, gasUsed: 21_000, gasNeeded: 21_000 + 5_010 });
    expect(min.storage).toEqual({ '0': 3n });
    expect(sendTx(program, 26_010, { '0': 3n }, 20).storage['0']).toBe(4n);

    expect(sendTx(program, 20_999, {}, 20)).toMatchObject({ valid: false, ok: false, gasUsed: 0, feeGwei: 0 });
    expect(sendTx(program, Number.NaN, {}, Number.NaN)).toMatchObject({ valid: false, feeGwei: 0 });
    for (const r of [enough, short, min]) for (const v of [r.gasUsed, r.feeGwei, r.gasUnused, r.execGas]) expect(Number.isFinite(v)).toBe(true);
  });
});

describe('reentrancy', () => {
  it('drains the vault when the balance is cleared after the send', () => {
    const r = simulateAttack({ others: 9, deposit: 1, effectsFirst: false });
    expect(r.reverted).toBe(false);
    expect(r.vault).toBe(0);
    expect(r.attacker).toBe(10);
    expect(r.stolen).toBe(9);
    expect(r.maxDepth).toBe(10);
    expect(r.recorded).toBe(0);
    expect(r.events[0]).toEqual({ kind: 'start', depth: 0, vault: 10, attacker: 0, recorded: 1 });
    expect(r.events.at(-1)?.kind).toBe('done');
    // ETH is conserved at every step.
    for (const e of r.events) expect(e.vault + e.attacker).toBe(10);
    // The recorded balance is still 1 during every nested call.
    expect(r.events.filter((e) => e.kind === 'send').every((e) => e.recorded === 1)).toBe(true);
  });

  it('reverts the whole attack when the balance is cleared first', () => {
    const r = simulateAttack({ others: 9, deposit: 1, effectsFirst: true });
    expect(r.reverted).toBe(true);
    expect(r).toMatchObject({ vault: 10, attacker: 0, recorded: 1, stolen: 0, maxDepth: 2 });
    expect(r.events.map((e) => `${e.kind}${e.depth}`)).toEqual(['start0', 'call1', 'write1', 'send1', 'call2', 'revert2', 'revert1', 'revert0']);
    expect(r.events.at(-1)).toEqual({ kind: 'revert', depth: 0, vault: 10, attacker: 0, recorded: 1 });
  });

  it('handles the slider extremes', () => {
    // Nothing to steal: the attacker only gets the deposit back, either way.
    for (const effectsFirst of [true, false]) {
      expect(simulateAttack({ others: 0, deposit: 1, effectsFirst })).toMatchObject({ reverted: false, vault: 0, attacker: 1, stolen: 0, maxDepth: 1 });
    }
    // No deposit: withdraw() fails its first check.
    expect(simulateAttack({ others: 5, deposit: 0, effectsFirst: false })).toMatchObject({ reverted: true, vault: 5, attacker: 0, stolen: 0 });
    expect(simulateAttack({ others: 12, deposit: 1, effectsFirst: false })).toMatchObject({ vault: 0, attacker: 13, stolen: 12, maxDepth: 13 });
    expect(simulateAttack({ others: Number.NaN, deposit: -2, effectsFirst: false })).toMatchObject({ reverted: true, vault: 0 });
    // A deposit of 2 against 9: the vault keeps the remainder it cannot pay in full.
    expect(simulateAttack({ others: 9, deposit: 2, effectsFirst: false })).toMatchObject({ vault: 1, attacker: 10, stolen: 8 });
  });
});

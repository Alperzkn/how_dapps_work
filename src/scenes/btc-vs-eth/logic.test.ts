import { describe, expect, it } from 'vitest';
import {
  annualBurn,
  annualIssuance,
  applyPayment,
  counterProgram,
  evmRun,
  evmStart,
  evmStep,
  feeSplit,
  fillBlock,
  FLAT_FEE,
  GAS,
  gasAtFullness,
  GWEI,
  hash160,
  issuedBefore,
  makeSpend,
  MAX_SUPPLY,
  nextBaseFee,
  P2PKH,
  planPayment,
  SAT,
  scriptRun,
  scriptStart,
  scriptStep,
  subsidyAfter,
  transfer,
  TRANSFER_FEE,
  type Utxo,
} from './logic';

const btc = (v: number) => Math.round(v * SAT);
const wallet = (): Utxo[] => [0.5, 0.3, 0.8, 0.4].map((v, i) => ({ id: `a${i}`, owner: 'alice', value: btc(v) }));
const total = (set: Utxo[]) => set.reduce((a, c) => a + c.value, 0);

describe('UTXO payments', () => {
  it('spends 0.5 + 0.3 to pay 0.6, with 0.19 change and 0.01 fee', () => {
    const plan = planPayment(wallet(), btc(0.6));
    expect(plan.ok).toBe(true);
    expect(plan.inputs.map((c) => c.value)).toEqual([btc(0.5), btc(0.3)]);
    expect(plan).toMatchObject({ payment: btc(0.6), change: btc(0.19), fee: btc(0.01) });
    expect(plan.inputTotal).toBe(plan.payment + plan.change + plan.fee);
  });

  it('consumes the inputs and creates new coins, conserving value minus the fee', () => {
    const set = wallet();
    const plan = planPayment(set, btc(0.6));
    const next = applyPayment(set, plan, 1);
    expect(next.map((c) => c.id)).toEqual(['a2', 'a3', 'tx1:0', 'tx1:1']);
    expect(next.find((c) => c.id === 'tx1:0')).toMatchObject({ owner: 'bob', value: btc(0.6) });
    expect(next.find((c) => c.id === 'tx1:1')).toMatchObject({ owner: 'alice', value: btc(0.19) });
    expect(total(next)).toBe(total(set) - FLAT_FEE);
  });

  it('fragments over repeated payments until the wallet cannot pay', () => {
    let set = wallet();
    let n = 0;
    for (;;) {
      const plan = planPayment(
        set.filter((c) => c.owner === 'alice'),
        btc(0.6),
      );
      if (!plan.ok) break;
      set = applyPayment(set, plan, ++n);
    }
    expect(n).toBe(3);
    expect(set.filter((c) => c.owner === 'bob')).toHaveLength(3);
    expect(set.filter((c) => c.owner === 'alice').map((c) => c.value)).toEqual([btc(0.17)]);
    expect(total(set)).toBe(btc(2) - 3 * FLAT_FEE);
  });

  it('creates no change output when the coins match exactly', () => {
    const set: Utxo[] = [{ id: 'x', owner: 'alice', value: btc(0.61) }];
    const plan = planPayment(set, btc(0.6));
    expect(plan.change).toBe(0);
    expect(applyPayment(set, plan, 1)).toEqual([{ id: 'tx1:0', owner: 'bob', value: btc(0.6) }]);
  });

  it('refuses zero, negative, non-numeric and unaffordable amounts', () => {
    for (const amount of [0, -5, NaN, Infinity, btc(1.995), btc(50)]) {
      const plan = planPayment(wallet(), amount);
      expect(plan.ok).toBe(false);
      expect(plan.inputs).toEqual([]);
      expect(applyPayment(wallet(), plan, 1)).toEqual(wallet());
    }
    expect(planPayment([], btc(0.1)).ok).toBe(false);
    expect(planPayment(wallet(), btc(1.99)).ok).toBe(true);
  });
});

describe('account transfers', () => {
  const start = { alice: 2e9, bob: 1e9, aliceNonce: 7 };
  it('changes two balances and the nonce', () => {
    const r = transfer(start, 0.6e9);
    expect(r.ok).toBe(true);
    expect(r.next).toEqual({ alice: 2e9 - 0.6e9 - TRANSFER_FEE, bob: 1.6e9, aliceNonce: 8 });
  });
  it('rejects what the sender cannot afford and leaves the state alone', () => {
    expect(transfer(start, 2e9)).toEqual({ ok: false, next: start });
    expect(transfer(start, 0)).toEqual({ ok: false, next: start });
    expect(transfer(start, NaN)).toEqual({ ok: false, next: start });
    expect(transfer(start, 2e9 - TRANSFER_FEE).next.alice).toBe(0);
  });
});

describe('Bitcoin Script (P2PKH)', () => {
  it('hashes like Bitcoin: HASH160 of the generator public key', () => {
    expect(hash160('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798')).toBe('751e76e8199196d454941c45d1b3a323f1433bd6');
  });

  it('unlocks with the right signature, step by step', () => {
    const spend = makeSpend();
    let s = scriptStart();
    const depths: number[] = [];
    while (s.status === 'running') {
      s = scriptStep(s, spend);
      depths.push(s.stack.length);
    }
    expect(depths).toEqual([1, 2, 3, 3, 4, 2, 1]);
    expect(s.pc).toBe(P2PKH.length);
    expect(s.status).toBe('valid');
    expect(s.stack.map((i) => i.kind)).toEqual(['true']);
    expect(scriptStep(s, spend)).toBe(s);
  });

  it('fails at OP_CHECKSIG with a signature from the wrong key', () => {
    const s = scriptRun(makeSpend(true));
    expect(s.status).toBe('invalid');
    expect(s.pc).toBe(P2PKH.length);
    expect(s.stack.map((i) => i.kind)).toEqual(['false']);
  });

  it('fails at OP_EQUALVERIFY when the public key does not match the lock', () => {
    const spend = { ...makeSpend(), pubKeyHash: '00'.repeat(20) };
    const s = scriptRun(spend);
    expect(s.status).toBe('invalid');
    expect(P2PKH[s.pc - 1]).toBe('OP_EQUALVERIFY');
  });

  it('fails cleanly on an empty stack', () => {
    expect(scriptRun(makeSpend(), ['OP_DUP']).status).toBe('invalid');
    expect(scriptRun(makeSpend(), ['OP_CHECKSIG']).status).toBe('invalid');
    expect(scriptRun(makeSpend(), []).status).toBe('running');
  });
});

describe('EVM steps', () => {
  const program = counterProgram(3);

  it('charges the gas the lesson quotes and stores count + n', () => {
    let s = evmStart(60_000, 5n);
    expect(s.gasLeft).toBe(39_000);
    const costs: number[] = [];
    while (s.status === 'running') {
      s = evmStep(s, program);
      costs.push(s.lastCost);
    }
    expect(costs).toEqual([3, 2_100, 3, 3, 3, 2_900, 0]);
    expect(s.status).toBe('done');
    expect(s.slot).toBe(8n);
    expect(s.stack).toEqual([]);
    expect(s.gasLimit - s.gasLeft).toBe(26_012);
    expect(evmStep(s, program)).toBe(s);
  });

  it('charges 20,000 to fill an empty slot and 100 to write the same value', () => {
    expect(60_000 - evmRun(60_000, 0n, program).gasLeft).toBe(21_000 + 3 + 2_100 + 3 + 3 + 3 + GAS.sstoreSet);
    const same = evmRun(60_000, 5n, counterProgram(0));
    expect(same.slot).toBe(5n);
    expect(60_000 - same.gasLeft).toBe(21_000 + 3 + 2_100 + 3 + 3 + 3 + GAS.warmAccess);
  });

  it('runs out of gas, reverts the slot and keeps the fee', () => {
    const s = evmRun(25_000, 5n, program);
    expect(s.status).toBe('out-of-gas');
    expect(s.slot).toBe(5n);
    expect(s.gasLeft).toBe(0);
    expect(program[s.pc - 1].op).toBe('SSTORE');
    // Enough for the 2,900 itself, but not above the 2,300 sentry plus the cost.
    expect(evmRun(21_000 + 2_112 + 2_300, 5n, program).status).toBe('out-of-gas');
    expect(evmRun(26_012, 5n, program).status).toBe('done');
    expect(evmRun(26_011, 5n, program).status).toBe('out-of-gas');
  });

  it('handles a gas limit below the intrinsic cost and wraps at 2^256', () => {
    expect(evmStart(20_000, 5n)).toMatchObject({ status: 'out-of-gas', gasLeft: 0 });
    expect(evmStart(NaN, 5n).status).toBe('out-of-gas');
    expect(evmRun(60_000, (1n << 256n) - 1n, counterProgram(1)).slot).toBe(0n);
  });
});

describe('Bitcoin fee market', () => {
  const others = [12, 40, 2, 25, 5].map((feeRate, i) => ({ id: `t${i}`, feeRate, vsize: 200 }));
  const withYou = (feeRate: number) => fillBlock([...others, { id: 'you', feeRate, vsize: 200 }], 600);

  it('takes the three best fee rates', () => {
    const r = fillBlock(others, 600);
    expect(r.filter((t) => t.included).map((t) => t.feeRate)).toEqual([12, 40, 25]);
    expect(r.map((t) => t.rank)).toEqual([3, 1, 5, 2, 4]);
  });

  it('lets you in only above the third-best rate; ties go to the earlier transaction', () => {
    expect(withYou(12)[5]).toMatchObject({ included: false, rank: 4, fee: 2400 });
    expect(withYou(13)[5]).toMatchObject({ included: true, rank: 3, fee: 2600 });
    expect(withYou(13)[0].included).toBe(false);
    expect(withYou(1)[5]).toMatchObject({ included: false, rank: 6 });
    expect(withYou(60)[5]).toMatchObject({ included: true, rank: 1 });
  });

  it('copes with no space, no transactions and bad numbers', () => {
    expect(fillBlock(others, 0).some((t) => t.included)).toBe(false);
    expect(fillBlock([], 600)).toEqual([]);
    const r = fillBlock([{ id: 'x', feeRate: NaN, vsize: 200 }], NaN);
    expect(r[0]).toMatchObject({ included: false, fee: 0, rank: 1 });
  });
});

describe('EIP-1559', () => {
  const target = 15_000_000n;
  const base = 10n * GWEI;

  it('moves the base fee by at most 12.5% per block', () => {
    expect(nextBaseFee(base, target, target)).toBe(base);
    expect(nextBaseFee(base, 2n * target, target)).toBe(11_250_000_000n);
    expect(nextBaseFee(base, 0n, target)).toBe(8_750_000_000n);
    expect(nextBaseFee(base, gasAtFullness(150, target), target)).toBe(10_625_000_000n);
    expect(nextBaseFee(base, gasAtFullness(50, target), target)).toBe(9_375_000_000n);
  });

  it('matches the EIP at tiny values: rises by at least 1 wei, and can stall near zero', () => {
    expect(nextBaseFee(1n, target + 1n, target)).toBe(2n);
    expect(nextBaseFee(7n, 0n, target)).toBe(7n);
    expect(nextBaseFee(0n, 0n, target)).toBe(0n);
    expect(nextBaseFee(0n, 2n * target, target)).toBe(1n);
    expect(nextBaseFee(base, 5n, 0n)).toBe(base);
  });

  it('clamps block fullness to 0 … 200% of the target', () => {
    expect(gasAtFullness(-10, target)).toBe(0n);
    expect(gasAtFullness(500, target)).toBe(30_000_000n);
    expect(gasAtFullness(NaN, target)).toBe(0n);
  });

  it('burns the base fee and tips at most what the fee cap leaves', () => {
    const gas = 21_000n;
    expect(feeSplit(gas, base, 30n * GWEI, 2n * GWEI)).toEqual({ included: true, tipPerGas: 2n * GWEI, burned: gas * base, tipped: gas * 2n * GWEI });
    expect(feeSplit(gas, 29n * GWEI, 30n * GWEI, 2n * GWEI).tipPerGas).toBe(GWEI);
    expect(feeSplit(gas, 30n * GWEI, 30n * GWEI, 2n * GWEI)).toMatchObject({ included: true, tipped: 0n });
    expect(feeSplit(gas, 31n * GWEI, 30n * GWEI, 2n * GWEI)).toEqual({ included: false, tipPerGas: 0n, burned: 0n, tipped: 0n });
  });
});

describe('supply', () => {
  it('halves the Bitcoin subsidy in whole satoshis', () => {
    expect(subsidyAfter(0)).toBe(50 * SAT);
    expect(subsidyAfter(4)).toBe(312_500_000);
    expect(subsidyAfter(9)).toBe(9_765_625);
    expect(subsidyAfter(10)).toBe(4_882_812);
    expect(subsidyAfter(32)).toBe(1);
    expect(subsidyAfter(33)).toBe(0);
    expect(subsidyAfter(64)).toBe(0);
    expect(subsidyAfter(-3)).toBe(50 * SAT);
    expect(subsidyAfter(NaN)).toBe(50 * SAT);
  });

  it('adds up to 20,999,999.9769 BTC and no more', () => {
    expect(issuedBefore(0)).toBe(0);
    expect(issuedBefore(1)).toBe(10_500_000 * SAT);
    expect(issuedBefore(4)).toBe(19_687_500 * SAT);
    expect(issuedBefore(33)).toBe(2_099_999_997_690_000);
    expect(MAX_SUPPLY).toBe(2_099_999_997_690_000);
    expect(Number.isSafeInteger(MAX_SUPPLY)).toBe(true);
    expect(issuedBefore(1000)).toBe(MAX_SUPPLY);
  });

  it('approximates Ethereum issuance as about 166 × √staked', () => {
    expect(annualIssuance(36_000_000)).toBeCloseTo(166.32 * Math.sqrt(36_000_000), -3);
    expect(annualIssuance(36_000_000)).toBeGreaterThan(900_000);
    expect(annualIssuance(36_000_000)).toBeLessThan(1_100_000);
    expect(annualIssuance(4 * 9_000_000)).toBeCloseTo(2 * annualIssuance(9_000_000), 3);
    expect(annualIssuance(0)).toBe(0);
    expect(annualIssuance(-5)).toBe(0);
    expect(annualIssuance(NaN)).toBe(0);
  });

  it('burns base fee × gas for every block of the year', () => {
    expect(annualBurn(1, 15_000_000)).toBeCloseTo(39_447, 0);
    expect(annualBurn(0, 15_000_000)).toBe(0);
    expect(annualBurn(NaN, 15_000_000)).toBe(0);
    expect(annualBurn(25, 15_000_000)).toBeGreaterThan(annualIssuance(36_000_000) * 0.95);
  });
});

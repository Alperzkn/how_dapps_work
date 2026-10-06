import { describe, expect, it } from 'vitest';
import { selector } from '../../sim/keys';
import {
  activeProvider, addressTopic, buildCall, cleanAmount, execute, filterLogs, initialToken, matches, MAX_AMOUNT, MAX_UINT256, outage, PEOPLE, RPC, shortHex, shortWord,
  signRequest, TOKEN_ADDRESS, TOPIC0, topicsFor, topicsOf, toUnits, UNKNOWN_SPENDER, walletRequest,
} from './logic';

describe('calldata', () => {
  it('builds the transfer from the lesson text', () => {
    const c = buildCall('transfer', PEOPLE.ben.address, 10);
    expect(c.selector).toBe('0xa9059cbb');
    expect(c.words).toEqual(['0'.repeat(24) + '2'.repeat(40), '0000000000000000000000000000000000000000000000008ac7230489e80000']);
    expect(c.data).toBe(c.selector + c.words.join(''));
    expect(c.data).toHaveLength(2 + 8 + 128);
  });

  it('changes the selector with the function and drops the amount for balanceOf', () => {
    expect(buildCall('approve', PEOPLE.cem.address, 1).selector).toBe('0x095ea7b3');
    const read = buildCall('balanceOf', PEOPLE.ayse.address, 99);
    expect(read.selector).toBe('0x70a08231');
    expect(read.words).toHaveLength(1);
    expect(read.words[0]).toBe('0'.repeat(24) + PEOPLE.ayse.address.slice(2));
    expect(read.selector).toBe(selector(read.signature));
  });

  it('encodes the amount extremes', () => {
    expect(buildCall('transfer', PEOPLE.ben.address, 0).words[1]).toBe('0'.repeat(64));
    expect(buildCall('transfer', PEOPLE.ben.address, MAX_AMOUNT).words[1]).toBe((1000n * 10n ** 18n).toString(16).padStart(64, '0'));
    expect(buildCall('approve', UNKNOWN_SPENDER, MAX_UINT256).words[1]).toBe('f'.repeat(64));
  });

  it('cleans whatever is typed into the amount box', () => {
    expect(cleanAmount('12')).toBe(12);
    expect(cleanAmount('12.9')).toBe(12);
    expect(cleanAmount('12,9')).toBe(12);
    expect(cleanAmount('')).toBe(0);
    expect(cleanAmount('abc')).toBe(0);
    expect(cleanAmount(-5)).toBe(0);
    expect(cleanAmount(1e12)).toBe(MAX_AMOUNT);
    expect(cleanAmount(NaN)).toBe(0);
    expect(cleanAmount(Infinity)).toBe(0);
    expect(toUnits(10)).toBe(10n ** 19n);
    expect(toUnits(NaN)).toBe(0n);
  });

  it('shortens hex for display without losing the significant part', () => {
    expect(shortHex(TOKEN_ADDRESS)).toBe('0x5fbd…0aa3');
    expect(shortHex('0xa9059cbb')).toBe('0xa9059cbb');
    expect(shortWord('0000000000000000000000000000000000000000000000008ac7230489e80000')).toBe('000…8ac7230489e80000');
    expect(shortWord('0'.repeat(24) + '2'.repeat(40))).toBe('000…222222…222222');
    expect(shortWord('0'.repeat(64))).toBe('000…0');
    expect(shortWord('f'.repeat(64))).toBe('ffff…ffffffff');
  });
});

describe('token', () => {
  it('moves a balance and emits one Transfer log', () => {
    const t0 = initialToken();
    const r = execute(t0, 'transfer', 'ayse', 'ben', 10);
    expect(r.ok).toBe(true);
    expect(r.outcome).toBe('transferred');
    expect(r.state.balances).toEqual({ ayse: 90, ben: 30, cem: 5 });
    expect(r.state.logs).toHaveLength(t0.logs.length + 1);
    expect(r.log).toMatchObject({ event: 'Transfer', from: 'ayse', to: 'ben', value: 10, block: t0.block + 1 });
    // The original state is untouched.
    expect(t0.balances.ayse).toBe(100);
  });

  it('reverts a transfer above the balance and changes nothing', () => {
    const t0 = initialToken();
    const r = execute(t0, 'transfer', 'ayse', 'ben', 101);
    expect(r.ok).toBe(false);
    expect(r.outcome).toBe('insufficient');
    expect(r.state).toBe(t0);
    expect(r.log).toBeUndefined();
    // Exactly the balance is fine; zero is a valid transfer that still logs.
    expect(execute(t0, 'transfer', 'ayse', 'ben', 100).state.balances.ayse).toBe(0);
    const zero = execute(t0, 'transfer', 'ayse', 'ben', 0);
    expect(zero.ok).toBe(true);
    expect(zero.log?.value).toBe(0);
  });

  it('keeps the total supply constant', () => {
    let t = initialToken();
    const total = (s: typeof t) => s.balances.ayse + s.balances.ben + s.balances.cem;
    const before = total(t);
    for (const [to, n] of [['ben', 30], ['cem', 70], ['ben', 1], ['cem', 0]] as const) t = execute(t, 'transfer', 'ayse', to, n).state;
    expect(total(t)).toBe(before);
    expect(t.balances.ayse).toBe(0);
  });

  it('approve sets an allowance, moves no balance and emits Approval', () => {
    const t0 = initialToken();
    const r = execute(t0, 'approve', 'ayse', 'cem', 500);
    expect(r.outcome).toBe('approved');
    expect(r.state.balances).toEqual(t0.balances);
    expect(r.state.allowances['ayse>cem']).toBe(500);
    expect(r.log?.event).toBe('Approval');
  });

  it('balanceOf reads without a log or a new block', () => {
    const t0 = initialToken();
    const r = execute(t0, 'balanceOf', 'ayse', 'ben', 123);
    expect(r.outcome).toBe('read');
    expect(r.returned).toBe(20);
    expect(r.state).toBe(t0);
  });
});

describe('logs', () => {
  it('uses the real event topics', () => {
    expect(TOPIC0.Transfer).toBe('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef');
    expect(TOPIC0.Approval).toBe('0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925');
    expect(addressTopic(PEOPLE.ben.address)).toBe('0x' + '0'.repeat(24) + '2'.repeat(40));
  });

  it('filters by sender, by recipient, or not at all', () => {
    const { logs } = initialToken();
    expect(filterLogs(logs, { kind: 'all', who: 'ayse' })).toHaveLength(3);
    expect(filterLogs(logs, { kind: 'from', who: 'ayse' }).map((l) => l.id)).toEqual([2]);
    expect(filterLogs(logs, { kind: 'to', who: 'ayse' }).map((l) => l.id)).toEqual([1]);
    expect(filterLogs(logs, { kind: 'to', who: 'ben' }).map((l) => l.id)).toEqual([3]);
    expect(filterLogs([], { kind: 'from', who: 'cem' })).toEqual([]);
  });

  it('matches topics by position with null as a wildcard, and never returns an Approval for a Transfer query', () => {
    const t = execute(initialToken(), 'approve', 'ayse', 'ben', 5).state;
    const approval = t.logs[t.logs.length - 1];
    expect(topicsOf(approval)[0]).toBe(TOPIC0.Approval);
    expect(filterLogs(t.logs, { kind: 'all', who: 'ayse' })).toHaveLength(3);
    expect(matches(approval, [null, addressTopic(PEOPLE.ayse.address)])).toBe(true);
    expect(topicsFor({ kind: 'to', who: 'ben' })).toEqual([TOPIC0.Transfer, null, addressTopic(PEOPLE.ben.address)]);
    expect(topicsFor({ kind: 'from', who: 'cem' })).toHaveLength(2);
    expect(topicsFor({ kind: 'all', who: 'cem' })).toEqual([TOPIC0.Transfer]);
  });
});

describe('wallet', () => {
  it('signs the request text with the wallet key, verifiably', () => {
    const req = walletRequest('transfer');
    expect(req.to).toBe(TOKEN_ADDRESS);
    expect(req.message).toContain(req.call.data);
    const sig = signRequest(req);
    expect(sig.r).toMatch(/^0x[0-9a-f]{64}$/);
    expect(sig.s).toMatch(/^0x[0-9a-f]{64}$/);
    expect(sig.valid).toBe(true);
    expect(sig.signer).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    expect(signRequest(req)).toEqual(sig);
  });

  it('the suspicious request is an unlimited approve to a stranger, with a different signature', () => {
    const req = walletRequest('unlimited');
    expect(req.call.selector).toBe('0x095ea7b3');
    expect(req.call.words[0]).toBe('0'.repeat(24) + UNKNOWN_SPENDER.slice(2));
    expect(req.call.words[1]).toBe('f'.repeat(64));
    expect(req.unlimited).toBe(true);
    expect(signRequest(req).r).not.toBe(signRequest(walletRequest('transfer')).r);
  });
});

describe('rpc and outage', () => {
  it('separates reads from writes', () => {
    expect(RPC.read).toEqual({ method: 'eth_call', gas: false, signature: false, gossiped: false, waitsForBlock: false });
    expect(RPC.write.method).toBe('eth_sendRawTransaction');
    expect(RPC.write.gas && RPC.write.signature && RPC.write.gossiped && RPC.write.waitsForBlock).toBe(true);
  });

  it('routes around a dead provider only after switching', () => {
    expect(activeProvider(false, false)).toBe(0);
    expect(activeProvider(true, false)).toBeNull();
    expect(activeProvider(true, true)).toBe(1);
    expect(activeProvider(false, true)).toBe(1);
  });

  it('a shutdown kills the normal app but not the contract', () => {
    expect(outage(false, false)).toEqual({ normalApp: true, contract: true, dapp: true });
    expect(outage(true, false)).toEqual({ normalApp: false, contract: true, dapp: false });
    expect(outage(true, true)).toEqual({ normalApp: false, contract: true, dapp: true });
  });
});

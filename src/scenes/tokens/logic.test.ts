import { describe, expect, it } from 'vitest';
import { selector } from '../../sim/keys';
import {
  ALICE,
  BOB,
  DEX,
  MAX_UINT256,
  ZERO,
  allowanceOf,
  approve,
  balanceOf,
  burn,
  formatUnits,
  groupDigits,
  mint,
  newErc20,
  newErc721,
  newWeth,
  nftApprove,
  nftBalanceOf,
  nftTransferFrom,
  ownerOf,
  parseRaw,
  parseUnits,
  sumOfBalances,
  transfer,
  transferFrom,
  wethDeposit,
  wethSetWrapped,
  wethSupply,
  wethWithdraw,
} from './logic';

const E18 = 10n ** 18n;
const start = () => newErc20(18, { [ALICE]: 100n * E18, [BOB]: 20n * E18, [DEX]: 0n });

describe('units', () => {
  it('parses what a person types into the raw integer, exactly', () => {
    expect(parseUnits('1', 18)).toBe(E18);
    expect(parseUnits('1.5', 6)).toBe(1_500_000n);
    expect(parseUnits('0.000001', 6)).toBe(1n);
    expect(parseUnits('.5', 6)).toBe(500_000n);
    expect(parseUnits('5.', 6)).toBe(5_000_000n);
    expect(parseUnits('1,5', 6)).toBe(1_500_000n);
    expect(parseUnits(' 25 ', 18)).toBe(25n * E18);
    expect(parseUnits('0', 18)).toBe(0n);
    expect(parseUnits('0.1', 18)).toBe(10n ** 17n);
    expect(parseUnits('123456789.123456789123456789', 18)).toBe(123456789123456789123456789n);
    expect(parseUnits('7', 0)).toBe(7n);
    expect(parseUnits('1.50', 1)).toBe(15n);
  });

  it('rejects what a token cannot represent', () => {
    for (const bad of ['', ' ', 'abc', '-1', '1e18', '1.2.3', '.', '0x10', '1 000']) expect(parseUnits(bad, 18)).toBeNull();
    expect(parseUnits('0.0000001', 6)).toBeNull();
    expect(parseUnits('1.5', 0)).toBeNull();
    expect(parseUnits('9'.repeat(41), 18)).toBeNull();
  });

  it('formats a raw integer exactly for any number of decimals', () => {
    expect(formatUnits(2_500_000n, 6)).toBe('2.5');
    expect(formatUnits(2_500_000n, 18)).toBe('0.0000000000025');
    expect(formatUnits(2_500_000n, 8)).toBe('0.025');
    expect(formatUnits(2_500_000n, 0)).toBe('2500000');
    expect(formatUnits(0n, 18)).toBe('0');
    expect(formatUnits(1n, 18)).toBe('0.000000000000000001');
    expect(formatUnits(E18, 18)).toBe('1');
    expect(formatUnits(MAX_UINT256, 18)).toBe('115792089237316195423570985008687907853269984665640564039457.584007913129639935');
    expect(formatUnits(-15n, 1)).toBe('-1.5');
    expect(formatUnits(5n, Number.NaN)).toBe('5');
    for (const [text, d] of [['1.5', 6], ['0.000001', 6], ['1234.000000000000000001', 18], ['42', 0]] as const) {
      expect(formatUnits(parseUnits(text, d) as bigint, d)).toBe(text);
    }
  });

  it('groups digits and cleans raw input', () => {
    expect(groupDigits('1234567.5')).toBe('1,234,567.5');
    expect(groupDigits('1234567.5', 'tr')).toBe('1.234.567,5');
    expect(groupDigits('999')).toBe('999');
    expect(groupDigits('0.0000025')).toBe('0.0000025');
    expect(parseRaw('2,500,000')).toBe(2_500_000n);
    expect(parseRaw('')).toBe(0n);
    expect(parseRaw('abc')).toBe(0n);
    expect(parseRaw('9'.repeat(50)).toString().length).toBe(30);
  });
});

describe('ERC-20', () => {
  it('uses the standard selectors', () => {
    expect(selector('transfer(address,uint256)')).toBe('0xa9059cbb');
    expect(selector('approve(address,uint256)')).toBe('0x095ea7b3');
    expect(selector('transferFrom(address,address,uint256)')).toBe('0x23b872dd');
    expect(selector('balanceOf(address)')).toBe('0x70a08231');
    expect(selector('totalSupply()')).toBe('0x18160ddd');
    expect(selector('allowance(address,address)')).toBe('0xdd62ed3e');
    expect(selector('decimals()')).toBe('0x313ce567');
  });

  it('transfers and emits Transfer', () => {
    const r = transfer(start(), ALICE, BOB, 25n * E18);
    expect(r.ok).toBe(true);
    expect(balanceOf(r.state, ALICE)).toBe(75n * E18);
    expect(balanceOf(r.state, BOB)).toBe(45n * E18);
    expect(r.state.totalSupply).toBe(120n * E18);
    expect(r.events).toEqual([{ name: 'Transfer', from: ALICE, to: BOB, value: 25n * E18 }]);
    expect(r.calldata).toBe('0xa9059cbb' + '000000000000000000000000' + BOB.slice(2) + (25n * E18).toString(16).padStart(64, '0'));
  });

  it('reverts a transfer above the balance and changes nothing', () => {
    const s = start();
    const r = transfer(s, ALICE, BOB, 100n * E18 + 1n);
    expect(r).toMatchObject({ ok: false, error: 'insufficient-balance', events: [] });
    expect(r.state).toBe(s);
    expect(transfer(s, ALICE, BOB, 100n * E18).ok).toBe(true);
    expect(transfer(s, DEX, BOB, 1n).ok).toBe(false);
    expect(transfer(s, ALICE, ZERO, 1n).error).toBe('zero-address');
  });

  it('treats zero and self transfers as normal transfers', () => {
    const zero = transfer(start(), ALICE, BOB, 0n);
    expect(zero.ok).toBe(true);
    expect(zero.events).toHaveLength(1);
    const self = transfer(start(), ALICE, ALICE, 10n * E18);
    expect(balanceOf(self.state, ALICE)).toBe(100n * E18);
    expect(transfer(start(), ALICE, BOB, -5n).events[0].value).toBe(0n);
  });

  it('mints and burns, keeping totalSupply equal to the sum of balances', () => {
    let s = start();
    const m = mint(s, ALICE, 50n * E18);
    expect(m.events).toEqual([{ name: 'Transfer', from: ZERO, to: ALICE, value: 50n * E18 }]);
    expect(m.state.totalSupply).toBe(170n * E18);
    s = m.state;
    const b = burn(s, ALICE, 150n * E18);
    expect(b.events).toEqual([{ name: 'Transfer', from: ALICE, to: ZERO, value: 150n * E18 }]);
    expect(b.state.totalSupply).toBe(20n * E18);
    expect(balanceOf(b.state, ALICE)).toBe(0n);
    expect(burn(b.state, ALICE, 1n)).toMatchObject({ ok: false, error: 'insufficient-balance' });
    expect(mint(s, ZERO, 1n).ok).toBe(false);
    for (const st of [s, b.state, transfer(s, ALICE, DEX, 3n).state]) expect(sumOfBalances(st)).toBe(st.totalSupply);
  });

  it('approve then transferFrom spends the allowance', () => {
    let s = approve(start(), ALICE, DEX, 40n * E18).state;
    expect(allowanceOf(s, ALICE, DEX)).toBe(40n * E18);
    expect(allowanceOf(s, DEX, ALICE)).toBe(0n);
    const pull = transferFrom(s, DEX, ALICE, DEX, 30n * E18);
    expect(pull.ok).toBe(true);
    expect(pull.events).toEqual([{ name: 'Transfer', from: ALICE, to: DEX, value: 30n * E18 }]);
    s = pull.state;
    expect(allowanceOf(s, ALICE, DEX)).toBe(10n * E18);
    expect(balanceOf(s, DEX)).toBe(30n * E18);
    expect(balanceOf(s, ALICE)).toBe(70n * E18);
    // More than what is left of the allowance.
    const again = transferFrom(s, DEX, ALICE, DEX, 30n * E18);
    expect(again).toMatchObject({ ok: false, error: 'insufficient-allowance' });
    expect(again.state).toBe(s);
    // Bob was never approved.
    expect(transferFrom(s, BOB, ALICE, BOB, 1n).error).toBe('insufficient-allowance');
    expect(pull.calldata.slice(0, 10)).toBe('0x23b872dd');
    expect(pull.calldata.length).toBe(10 + 3 * 64);
  });

  it('approve overwrites, and zero revokes', () => {
    let s = approve(start(), ALICE, DEX, 40n * E18).state;
    s = approve(s, ALICE, DEX, 5n * E18).state;
    expect(allowanceOf(s, ALICE, DEX)).toBe(5n * E18);
    const revoke = approve(s, ALICE, DEX, 0n);
    expect(revoke.events).toEqual([{ name: 'Approval', from: ALICE, to: DEX, value: 0n }]);
    expect(transferFrom(revoke.state, DEX, ALICE, DEX, 1n).ok).toBe(false);
    expect(approve(s, ALICE, ZERO, 1n).ok).toBe(false);
  });

  it('an unlimited approval never runs down and exposes the whole balance', () => {
    let s = approve(start(), ALICE, DEX, MAX_UINT256).state;
    expect(approve(start(), ALICE, DEX, MAX_UINT256 + 5n).state.allowances[ALICE][DEX]).toBe(MAX_UINT256);
    const all = transferFrom(s, DEX, ALICE, DEX, 100n * E18);
    expect(all.ok).toBe(true);
    s = all.state;
    expect(allowanceOf(s, ALICE, DEX)).toBe(MAX_UINT256);
    expect(balanceOf(s, ALICE)).toBe(0n);
    // The allowance is still there, but there is nothing left to take.
    expect(transferFrom(s, DEX, ALICE, DEX, 1n).error).toBe('insufficient-balance');
    expect(approve(s, ALICE, DEX, MAX_UINT256).calldata).toBe('0x095ea7b3' + '000000000000000000000000' + DEX.slice(2) + 'f'.repeat(64));
  });

  it('an allowance above the balance does not create tokens', () => {
    const s = approve(start(), ALICE, DEX, 500n * E18).state;
    expect(transferFrom(s, DEX, ALICE, DEX, 101n * E18).error).toBe('insufficient-balance');
  });
});

describe('WETH', () => {
  it('wraps and unwraps 1:1 and stays fully backed', () => {
    let w = newWeth(10n * E18, 5n * E18);
    expect(w.contractEth).toBe(wethSupply(w));
    const d = wethDeposit(w, 4n * E18);
    expect(d).toMatchObject({ ok: true, calldata: '0xd0e30db0', value: 4n * E18 });
    w = d.state;
    expect(w).toMatchObject({ walletEth: 6n * E18, walletWeth: 4n * E18, contractEth: 9n * E18 });
    expect(w.contractEth).toBe(wethSupply(w));
    const u = wethWithdraw(w, 3n * E18);
    expect(u.calldata).toBe('0x2e1a7d4d' + (3n * E18).toString(16).padStart(64, '0'));
    expect(u.value).toBe(0n);
    w = u.state;
    expect(w).toMatchObject({ walletEth: 9n * E18, walletWeth: E18, contractEth: 6n * E18 });
    expect(w.contractEth).toBe(wethSupply(w));
  });

  it('refuses more than you have', () => {
    const w = newWeth(10n * E18, 5n * E18);
    expect(wethDeposit(w, 11n * E18)).toMatchObject({ ok: false, state: w });
    expect(wethWithdraw(w, 1n)).toMatchObject({ ok: false, state: w });
  });

  it('follows the slider across its whole range', () => {
    let w = newWeth(10n * E18, 5n * E18);
    for (const target of [10n, 0n, 3n, 3n, 7n, 25n, -4n]) {
      const r = wethSetWrapped(w, target * E18);
      expect(r.ok).toBe(true);
      w = r.state;
      const want = target > 10n ? 10n : target < 0n ? 0n : target;
      expect(w.walletWeth).toBe(want * E18);
      expect(w.walletEth + w.walletWeth).toBe(10n * E18);
      expect(w.contractEth).toBe(wethSupply(w));
    }
    expect(wethSetWrapped(w, 4n * E18).signature).toBe('deposit()');
    expect(wethSetWrapped(wethSetWrapped(w, 4n * E18).state, E18).signature).toBe('withdraw(uint256)');
  });
});

describe('ERC-721', () => {
  const gallery = () => newErc721({ '1': ALICE, '2': ALICE, '3': BOB, '4': ALICE });

  it('uses the standard selectors', () => {
    expect(selector('ownerOf(uint256)')).toBe('0x6352211e');
    expect(selector('safeTransferFrom(address,address,uint256)')).toBe('0x42842e0e');
    expect(selector('safeTransferFrom(address,address,uint256,bytes)')).toBe('0xb88d4fde');
    expect(selector('setApprovalForAll(address,bool)')).toBe('0xa22cb465');
    expect(selector('onERC721Received(address,address,uint256,bytes)')).toBe('0x150b7a02');
    expect(selector('tokenURI(uint256)')).toBe('0xc87b56dd');
  });

  it('gives every token id exactly one owner', () => {
    const s = gallery();
    expect(ownerOf(s, 1n)).toBe(ALICE);
    expect(ownerOf(s, 3n)).toBe(BOB);
    expect(ownerOf(s, 9n)).toBeNull();
    expect(nftBalanceOf(s, ALICE)).toBe(3);
    expect(nftBalanceOf(s, BOB)).toBe(1);
    expect(nftBalanceOf(s, DEX)).toBe(0);
  });

  it('lets the owner transfer a token', () => {
    const r = nftTransferFrom(gallery(), ALICE, ALICE, BOB, 2n);
    expect(r.ok).toBe(true);
    expect(ownerOf(r.state, 2n)).toBe(BOB);
    expect(nftBalanceOf(r.state, ALICE)).toBe(2);
    expect(nftBalanceOf(r.state, BOB)).toBe(2);
    expect(r.event).toEqual({ from: ALICE, to: BOB, tokenId: 2n });
    expect(r.calldata).toBe('0x23b872dd' + '000000000000000000000000' + ALICE.slice(2) + '000000000000000000000000' + BOB.slice(2) + '2'.padStart(64, '0'));
  });

  it('reverts for anyone else, for wrong owners and for missing tokens', () => {
    const s = gallery();
    const notMine = nftTransferFrom(s, ALICE, ALICE, BOB, 3n);
    expect(notMine).toMatchObject({ ok: false, error: 'not-authorized' });
    expect(notMine.state).toBe(s);
    expect(nftTransferFrom(s, BOB, BOB, ALICE, 1n).error).toBe('not-authorized');
    expect(nftTransferFrom(s, ALICE, BOB, DEX, 1n).error).toBe('incorrect-owner');
    expect(nftTransferFrom(s, ALICE, ALICE, BOB, 9n).error).toBe('nonexistent-token');
    expect(nftTransferFrom(s, ALICE, ALICE, ZERO, 1n).error).toBe('zero-address');
  });

  it('a single-token approval works once and is cleared by the transfer', () => {
    let s = gallery();
    expect(nftApprove(s, BOB, DEX, 1n).error).toBe('not-authorized');
    expect(nftApprove(s, ALICE, DEX, 9n).error).toBe('nonexistent-token');
    s = nftApprove(s, ALICE, DEX, 1n).state;
    const r = nftTransferFrom(s, DEX, ALICE, DEX, 1n);
    expect(r.ok).toBe(true);
    expect(ownerOf(r.state, 1n)).toBe(DEX);
    expect(r.state.approved['1']).toBeUndefined();
    expect(nftTransferFrom(r.state, ALICE, DEX, ALICE, 1n).ok).toBe(false);
  });
});

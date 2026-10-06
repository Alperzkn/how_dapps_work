import { describe, expect, it } from 'vitest';
import { abiWord, addressOf, encodeCall, keccakText, publicKeyOf, randomPrivateKey, selector, signText, verifyText } from './keys';

// Well-known test key (Hardhat/Anvil account #0).
const KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe('keys', () => {
  it('derives the known address from a known private key', () => {
    const pub = publicKeyOf(KEY);
    expect(pub).toMatch(/^0x04[0-9a-f]{128}$/);
    expect(addressOf(pub)).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
  });

  it('hashes with Keccak-256, not SHA3-256', () => {
    expect(keccakText('')).toBe('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
    expect(selector('transfer(address,uint256)')).toBe('0xa9059cbb');
    expect(selector('balanceOf(address)')).toBe('0x70a08231');
    expect(selector('approve(address,uint256)')).toBe('0x095ea7b3');
  });

  it('signs and verifies; any change to the message or key fails', () => {
    const pub = publicKeyOf(KEY);
    const sig = signText('send 1 ETH to Bob', KEY);
    expect(sig.r).toMatch(/^0x[0-9a-f]{64}$/);
    expect(signText('send 1 ETH to Bob', KEY)).toEqual(sig);
    expect(verifyText('send 1 ETH to Bob', sig, pub)).toBe(true);
    expect(verifyText('send 9 ETH to Bob', sig, pub)).toBe(false);
    expect(verifyText('send 1 ETH to Bob', sig, publicKeyOf(randomPrivateKey()))).toBe(false);
    expect(verifyText('x', { r: '0x00', s: 'junk' }, pub)).toBe(false);
  });

  it('makes distinct random keys', () => {
    expect(randomPrivateKey()).not.toBe(randomPrivateKey());
    expect(randomPrivateKey()).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('encodes calldata for static arguments', () => {
    expect(abiWord(10n)).toBe('0'.repeat(63) + 'a');
    const data = encodeCall('transfer(address,uint256)', ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 10n ** 19n]);
    expect(data).toBe('0xa9059cbb' + '000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266' + '0000000000000000000000000000000000000000000000008ac7230489e80000');
  });
});

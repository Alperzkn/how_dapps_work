// Real Ethereum key math for the interactive scenes: secp256k1 keys, Keccak-256, ECDSA.
// Keys made here are for demonstration only and must never hold real funds.
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

const strip = (hex: string) => (hex.startsWith('0x') ? hex.slice(2) : hex);

/** Keccak-256 of a UTF-8 string, as 0x-prefixed hex. */
export const keccakText = (text: string): string => `0x${bytesToHex(keccak_256(utf8ToBytes(text)))}`;

/** First 4 bytes of the hash of a function signature, e.g. transfer(address,uint256) -> 0xa9059cbb. */
export const selector = (signature: string): string => keccakText(signature).slice(0, 10);

/** A new random 32-byte private key, 0x-prefixed. */
export const randomPrivateKey = (): string => `0x${bytesToHex(secp256k1.utils.randomSecretKey())}`;

/** Uncompressed public key (65 bytes, starts 04), 0x-prefixed. Throws on an invalid key. */
export function publicKeyOf(privateKey: string): string {
  return `0x${bytesToHex(secp256k1.getPublicKey(hexToBytes(strip(privateKey)), false))}`;
}

/** Ethereum address: last 20 bytes of keccak256(public key without its 04 prefix). */
export function addressOf(publicKey: string): string {
  const body = hexToBytes(strip(publicKey)).slice(1);
  return `0x${bytesToHex(keccak_256(body).slice(12))}`;
}

export interface Signature {
  r: string;
  s: string;
}

/** ECDSA signature over keccak256(message). Deterministic (RFC 6979), low-s. */
export function signText(message: string, privateKey: string): Signature {
  const digest = keccak_256(utf8ToBytes(message));
  const sig = secp256k1.sign(digest, hexToBytes(strip(privateKey)), { prehash: false });
  const hex = bytesToHex(sig);
  return { r: `0x${hex.slice(0, 64)}`, s: `0x${hex.slice(64, 128)}` };
}

/** True only if the signature was made over exactly this message by this key. Never throws. */
export function verifyText(message: string, signature: Signature, publicKey: string): boolean {
  try {
    const sig = hexToBytes(strip(signature.r) + strip(signature.s));
    return secp256k1.verify(sig, keccak_256(utf8ToBytes(message)), hexToBytes(strip(publicKey)), { prehash: false });
  } catch {
    return false;
  }
}

/** One 32-byte ABI word for an unsigned integer or an address. */
export function abiWord(value: bigint | string): string {
  const hex = typeof value === 'bigint' ? value.toString(16) : strip(value).toLowerCase();
  return hex.padStart(64, '0').slice(-64);
}

/** Calldata for a call with static arguments: selector followed by one word per argument. */
export function encodeCall(signature: string, args: (bigint | string)[]): string {
  return selector(signature) + args.map(abiWord).join('');
}

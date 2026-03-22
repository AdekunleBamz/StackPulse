import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

/**
 * Crypto Utility
 * Secure wallet derivation and key management
 */

/**
 * Generate a new random mnemonic
 */
export function generateMnemonic(): string {
  return bip39.generateMnemonic();
}

/**
 * Derive a private key from mnemonic and path
 */
export async function deriveKey(mnemonic: string, path: string = "m/44'/5757'/0'/0/0") {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const node = bip32.fromSeed(seed);
  const child = node.derivePath(path);
  
  return child.privateKey?.toString('hex');
}

/**
 * Validate mnemonic phrase
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

export default { generateMnemonic, deriveKey, validateMnemonic };

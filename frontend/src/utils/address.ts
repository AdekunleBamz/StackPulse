/**
 * Truncates a Stacks address for display purposes.
 * Shows the first and last few characters with an ellipsis in between.
 *
 * @param address - The full Stacks address to truncate.
 * @param startChars - Number of characters to show at the start (default: 6).
 * @param endChars - Number of characters to show at the end (default: 4).
 * @returns A truncated address string (e.g., "SP123...4567").
 *
 * @example
 * ```ts
 * truncateAddress('SP1234567890ABCDEFGHIJKLMNOPQRST')
 * // Returns: "SP1234...QRST"
 * ```
 */
const TRUNCATE_ADDRESS_DEFAULT_START = 6;
const TRUNCATE_ADDRESS_DEFAULT_END = 4;

export function truncateAddress(address: string, startChars = TRUNCATE_ADDRESS_DEFAULT_START, endChars = TRUNCATE_ADDRESS_DEFAULT_END): string {
  if (!address) return '';
  const safeStart = Number.isFinite(startChars) ? Math.max(0, Math.floor(startChars)) : TRUNCATE_ADDRESS_DEFAULT_START;
  const safeEnd = Number.isFinite(endChars) ? Math.max(0, Math.floor(endChars)) : TRUNCATE_ADDRESS_DEFAULT_END;
  if (safeStart + safeEnd <= 0) return '';
  if (address.length <= safeStart + safeEnd) return address;
  const tail = safeEnd > 0 ? address.slice(-safeEnd) : '';
  return `${address.slice(0, safeStart)}...${tail}`;
}

/**
 * Returns true if the string looks like a well-formed Stacks address.
 * Accepts mainnet (SP/SM) and testnet (ST/SN) prefixes.
 *
 * @param address - The string to check.
 */
export function isValidStacksAddress(address: string): boolean {
  if (typeof address !== 'string') return false;
  return /^(S[PMN]|ST)[A-Z0-9]{38,40}$/.test(address.trim());
}

/**
 * Returns the network type of a Stacks address based on its prefix.
 * SP/SM = mainnet, ST/SN = testnet.
 *
 * @param address - The Stacks address to inspect.
 * @returns 'mainnet', 'testnet', or 'unknown'.
 */
export function getAddressNetwork(address: string): 'mainnet' | 'testnet' | 'unknown' {
  if (typeof address !== 'string') return 'unknown';
  const trimmed = address.trim();
  if (/^S[PM]/.test(trimmed)) return 'mainnet';
  if (/^S[TN]/.test(trimmed)) return 'testnet';
  return 'unknown';
}

/**
 * Returns true if two Stacks addresses are equal, ignoring case and surrounding whitespace.
 *
 * @param a - First address.
 * @param b - Second address.
 */
export function isSameAddress(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Returns true if the given Stacks address looks like a contract address
 * (contains a dot separator between the deployer and contract name).
 *
 * @param address - The address or contract identifier to check.
 */
export function isContractAddress(address: string): boolean {
  if (typeof address !== 'string') return false;
  return address.includes('.');
}

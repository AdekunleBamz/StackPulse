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
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  const safeStart = Number.isFinite(startChars) ? Math.max(0, Math.floor(startChars)) : 6;
  const safeEnd = Number.isFinite(endChars) ? Math.max(0, Math.floor(endChars)) : 4;
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

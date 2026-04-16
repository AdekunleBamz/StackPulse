/**
 * Checks whether a string looks like a valid Stacks address.
 * Mainnet addresses start with SP, testnet addresses start with ST.
 *
 * @param address - The address string to test.
 * @returns True if the address passes the format check.
 */
export function isValidAddress(address: string): boolean {
  if (!address) return false;
  return /^S[PT][A-Z0-9]{39}$/.test(address.trim());
}

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

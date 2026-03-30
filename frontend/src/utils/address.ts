export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  const safeStart = Number.isFinite(startChars) ? Math.max(0, Math.floor(startChars)) : 6;
  const safeEnd = Number.isFinite(endChars) ? Math.max(0, Math.floor(endChars)) : 4;
  if (safeStart + safeEnd <= 0) return '';
  if (address.length <= safeStart + safeEnd) return address;
  return `${address.slice(0, safeStart)}...${address.slice(-safeEnd)}`;
}

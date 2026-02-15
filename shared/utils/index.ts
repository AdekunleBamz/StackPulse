/**
 * StackPulse Utility Functions
 * Shared utilities for frontend and server
 */

import { SubscriptionTier, AlertType, BadgeType, NotificationType } from '../types';
import { 
  DEPLOYER_ADDRESS, 
  CONTRACTS, 
  BLOCKS_PER_MONTH, 
  WHALE_THRESHOLD_MICROSTX,
  ALERT_BITMASKS,
  TierNames,
  AlertTypeNames,
  BadgeDefinitions,
} from '../constants';

// ============================================
// STX FORMATTING
// ============================================

/**
 * Convert microSTX to STX
 */
export function microToSTX(microSTX: number): number {
  return microSTX / 1_000_000;
}

/**
 * Convert STX to microSTX
 */
export function stxToMicro(stx: number): number {
  return stx * 1_000_000;
}

/**
 * Format STX amount for display
 */
export function formatSTX(microSTX: number, decimals: number = 2): string {
  const stx = microToSTX(microSTX);
  return stx.toLocaleString(undefined, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompact(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

// ============================================
// ADDRESS FORMATTING
// ============================================

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Validate Stacks address format
 */
export function isValidStacksAddress(address: string): boolean {
  if (!address) return false;
  // Mainnet: SP, Testnet: ST
  return /^S[PT][A-Z0-9]{38,39}$/.test(address);
}

/**
 * Get contract identifier
 */
export function getContractId(contractName: string): string {
  return `${DEPLOYER_ADDRESS}.${contractName}`;
}

// ============================================
// SUBSCRIPTION HELPERS
// ============================================

/**
 * Get tier name from tier number
 */
export function getTierName(tier: SubscriptionTier): string {
  return TierNames[tier] || 'Unknown';
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(tier: SubscriptionTier, endsAt: number, currentBlock: number): boolean {
  // Free tier is always active
  if (tier === 0) return true;
  // Paid tiers need valid subscription
  return endsAt > currentBlock;
}

/**
 * Calculate subscription end block
 */
export function calculateSubscriptionEnd(currentBlock: number, months: number = 1): number {
  return currentBlock + (BLOCKS_PER_MONTH * months);
}

/**
 * Get blocks remaining in subscription
 */
export function getBlocksRemaining(endsAt: number, currentBlock: number): number {
  return Math.max(0, endsAt - currentBlock);
}

/**
 * Estimate days remaining in subscription
 */
export function getDaysRemaining(endsAt: number, currentBlock: number): number {
  const blocksRemaining = getBlocksRemaining(endsAt, currentBlock);
  return Math.floor(blocksRemaining / 144); // ~144 blocks per day
}

// ============================================
// ALERT HELPERS
// ============================================

/**
 * Get alert type name
 */
export function getAlertTypeName(type: AlertType): string {
  return AlertTypeNames[type] || 'Unknown';
}

/**
 * Check if amount qualifies as whale transfer
 */
export function isWhaleTransfer(amountMicroSTX: number): boolean {
  return amountMicroSTX >= WHALE_THRESHOLD_MICROSTX;
}

/**
 * Parse alerts bitmask to array of enabled types
 */
export function parseAlertsBitmask(bitmask: number): string[] {
  const alerts: string[] = [];
  if (bitmask & ALERT_BITMASKS.WHALE) alerts.push('whale');
  if (bitmask & ALERT_BITMASKS.NFT) alerts.push('nft');
  if (bitmask & ALERT_BITMASKS.TOKEN) alerts.push('token');
  if (bitmask & ALERT_BITMASKS.SWAP) alerts.push('swap');
  if (bitmask & ALERT_BITMASKS.CONTRACT) alerts.push('contract');
  return alerts;
}

/**
 * Create alerts bitmask from array
 */
export function createAlertsBitmask(alerts: string[]): number {
  let bitmask = 0;
  if (alerts.includes('whale')) bitmask |= ALERT_BITMASKS.WHALE;
  if (alerts.includes('nft')) bitmask |= ALERT_BITMASKS.NFT;
  if (alerts.includes('token')) bitmask |= ALERT_BITMASKS.TOKEN;
  if (alerts.includes('swap')) bitmask |= ALERT_BITMASKS.SWAP;
  if (alerts.includes('contract')) bitmask |= ALERT_BITMASKS.CONTRACT;
  return bitmask;
}

// ============================================
// BADGE HELPERS
// ============================================

/**
 * Get badge info
 */
export function getBadgeInfo(type: BadgeType): { name: string; description: string; maxSupply: number } {
  return BadgeDefinitions[type] || { name: 'Unknown', description: '', maxSupply: 0 };
}

/**
 * Check if badge has limited supply
 */
export function isLimitedBadge(type: BadgeType): boolean {
  const info = getBadgeInfo(type);
  return info.maxSupply > 0;
}

// ============================================
// TIME HELPERS
// ============================================

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'Just now';
}

/**
 * Format block height to approximate date
 */
export function blockToApproxDate(blockHeight: number, currentBlock: number): Date {
  const blockDiff = currentBlock - blockHeight;
  const minutesDiff = blockDiff * 10; // ~10 min per block
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesDiff);
  return date;
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate username
 */
export function isValidUsername(username: string): boolean {
  return username.length >= 1 && username.length <= 32;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 64;
}

/**
 * Validate alert type
 */
export function isValidAlertType(type: number): type is AlertType {
  return type >= 1 && type <= 6;
}

/**
 * Validate tier
 */
export function isValidTier(tier: number): tier is SubscriptionTier {
  return tier >= 0 && tier <= 3;
}

// ============================================
// NOTIFICATION HELPERS
// ============================================

/**
 * Get notification icon
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    whale: '🐋',
    contract: '📜',
    nft: '🎨',
    token: '🪙',
    swap: '💱',
    subscription: '✨',
    alert: '🔔',
    fee: '💰',
    badge: '🏆',
  };
  return icons[type] || '📢';
}

/**
 * Get notification color (hex)
 */
export function getNotificationColor(type: NotificationType): number {
  const colors: Record<NotificationType, number> = {
    whale: 0x3B82F6,    // blue
    contract: 0x8B5CF6, // purple
    nft: 0xEC4899,      // pink
    token: 0xF59E0B,    // amber
    swap: 0x10B981,     // green
    subscription: 0x6366F1, // indigo
    alert: 0xEF4444,    // red
    fee: 0x14B8A6,      // teal
    badge: 0xF97316,    // orange
  };
  return colors[type] || 0x6B7280;
}

// ============================================
// HASH HELPERS
// ============================================

/**
 * Get transaction explorer URL
 */
export function getTxExplorerUrl(txHash: string, network: 'mainnet' | 'testnet' = 'mainnet'): string {
  const baseUrl = network === 'mainnet' 
    ? 'https://explorer.hiro.so/txid'
    : 'https://explorer.hiro.so/txid';
  return `${baseUrl}/${txHash}?chain=${network}`;
}

/**
 * Get address explorer URL
 */
export function getAddressExplorerUrl(address: string, network: 'mainnet' | 'testnet' = 'mainnet'): string {
  const baseUrl = 'https://explorer.hiro.so/address';
  return `${baseUrl}/${address}?chain=${network}`;
}

/**
 * Get contract explorer URL
 */
export function getContractExplorerUrl(contractId: string, network: 'mainnet' | 'testnet' = 'mainnet'): string {
  const baseUrl = 'https://explorer.hiro.so/txid';
  return `${baseUrl}/${contractId}?chain=${network}`;
}

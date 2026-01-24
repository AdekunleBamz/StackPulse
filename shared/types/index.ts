/**
 * StackPulse API Types
 * Shared type definitions for frontend and server
 */

// ============================================
// USER TYPES
// ============================================

export interface User {
  address: string;
  userId: number;
  username: string;
  email: string;
  tier: SubscriptionTier;
  subscriptionEnds: number;
  alertsEnabled: number;
  createdAt: number;
  updatedAt: number;
  totalTriggers: number;
}

export type SubscriptionTier = 0 | 1 | 2 | 3;

export const TierNames: Record<SubscriptionTier, string> = {
  0: 'Free',
  1: 'Basic',
  2: 'Pro',
  3: 'Premium',
};

export const TierPrices: Record<SubscriptionTier, number> = {
  0: 0,
  1: 1000000,      // 1 STX
  2: 5000000,      // 5 STX
  3: 20000000,     // 20 STX
};

export const TierAlertLimits: Record<SubscriptionTier, number> = {
  0: 3,
  1: 10,
  2: 25,
  3: 999,
};

export interface SubscriptionStatus {
  registered: boolean;
  tier: SubscriptionTier;
  active: boolean;
  endsAt: number;
  totalTriggers: number;
}

// ============================================
// ALERT TYPES
// ============================================

export type AlertType = 1 | 2 | 3 | 4 | 5 | 6;

export const AlertTypeNames: Record<AlertType, string> = {
  1: 'Whale Transfer',
  2: 'Contract Deployed',
  3: 'NFT Mint',
  4: 'Token Launch',
  5: 'Large Swap',
  6: 'Address Watch',
};

export const AlertTypeIcons: Record<AlertType, string> = {
  1: '🐋',
  2: '📜',
  3: '🎨',
  4: '🪙',
  5: '💱',
  6: '👁️',
};

export interface Alert {
  id: number;
  owner: string;
  alertType: AlertType;
  name: string;
  targetAddress?: string;
  threshold: number;
  enabled: boolean;
  triggerCount: number;
  lastTriggered: number;
  createdAt: number;
}

export interface CreateAlertParams {
  alertType: AlertType;
  name: string;
  targetAddress?: string;
  threshold: number;
}

export interface AlertStats {
  totalAlerts: number;
  totalTriggers: number;
  nextId: number;
  version: string;
}

// ============================================
// BADGE TYPES
// ============================================

export type BadgeType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const BadgeDefinitions: Record<BadgeType, { name: string; description: string; maxSupply: number }> = {
  1: { name: 'Early Adopter', description: 'Among the first 100 StackPulse users', maxSupply: 100 },
  2: { name: 'Whale Watcher', description: 'Detected 10+ whale transfers', maxSupply: 0 },
  3: { name: 'Alert Master', description: 'Created 25+ alerts', maxSupply: 0 },
  4: { name: 'Power User', description: 'Pro or Premium subscriber', maxSupply: 0 },
  5: { name: 'Referral Champion', description: 'Referred 5+ users', maxSupply: 0 },
  6: { name: 'Year One', description: 'Active for 1 year', maxSupply: 0 },
  7: { name: 'Community Builder', description: 'Active in governance', maxSupply: 0 },
  8: { name: 'Bug Hunter', description: 'Reported valid bugs', maxSupply: 0 },
  9: { name: 'StackPulse OG', description: 'Original beta tester', maxSupply: 50 },
};

export interface Badge {
  tokenId: number;
  badgeType: BadgeType;
  name: string;
  recipient: string;
  mintedAt: number;
}

export interface BadgeStats {
  totalMinted: number;
  lastId: number;
}

// ============================================
// FEE VAULT TYPES
// ============================================

export interface UserPayment {
  totalPaid: number;
  lastPayment: number;
  subscriptionCount: number;
  currentTier: SubscriptionTier;
}

export interface VaultStats {
  totalCollected: number;
  totalFees: number;
  totalSubscriptions: number;
  totalReferralPaid: number;
  contractBalance: number;
  tierRevenue: Record<SubscriptionTier, number>;
  version: string;
}

export interface ReferralInfo {
  referrer?: string;
  earnings: number;
  referralCount: number;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 
  | 'whale' 
  | 'contract' 
  | 'nft' 
  | 'token' 
  | 'swap' 
  | 'subscription' 
  | 'alert' 
  | 'fee' 
  | 'badge';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  txHash?: string;
  blockHeight?: number;
  timestamp: Date;
  read: boolean;
}

export interface NotificationPreferences {
  address: string;
  email?: string;
  discord?: string;
  telegram?: string;
  enabledTypes: NotificationType[];
  pushEnabled: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// CHAINHOOK TYPES
// ============================================

export interface ChainhookEvent {
  type: NotificationType;
  txHash: string;
  blockHeight: number;
  blockHash: string;
  sender: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface WhaleTransferEvent extends ChainhookEvent {
  type: 'whale';
  data: {
    amount: number;
    amountSTX: string;
    sender: string;
    recipient: string;
  };
}

export interface ContractDeployedEvent extends ChainhookEvent {
  type: 'contract';
  data: {
    contractId: string;
    contractName: string;
    deployer: string;
  };
}

export interface NFTMintEvent extends ChainhookEvent {
  type: 'nft';
  data: {
    assetIdentifier: string;
    assetName: string;
    tokenId: string;
    recipient: string;
    contractAddress: string;
  };
}

export interface TokenLaunchEvent extends ChainhookEvent {
  type: 'token';
  data: {
    contractId: string;
    tokenName?: string;
    symbol?: string;
    deployer: string;
  };
}

export interface SwapEvent extends ChainhookEvent {
  type: 'swap';
  data: {
    swapper: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: number;
    amountOut: number;
    dex: string;
  };
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface DashboardStats {
  totalUsers: number;
  totalAlerts: number;
  totalTriggers: number;
  totalBadges: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
}

export interface EventAnalytics {
  whaleTransfers: number;
  contractDeployments: number;
  nftMints: number;
  tokenLaunches: number;
  largeSwaps: number;
}

export interface UserAnalytics {
  registrations: TimeSeriesDataPoint[];
  subscriptions: TimeSeriesDataPoint[];
  alerts: TimeSeriesDataPoint[];
  triggers: TimeSeriesDataPoint[];
}

// ============================================
// UTILITY TYPES
// ============================================

export type ContractName = 
  | 'stackpulse-v3'
  | 'stackpulse-v3-1'
  | 'alert-manager-v3'
  | 'fee-vault-v3'
  | 'reputation-badges-v3';

export interface ContractCall {
  contractAddress: string;
  contractName: ContractName;
  functionName: string;
  functionArgs: any[];
}

export interface TransactionResult {
  txId: string;
  success: boolean;
  error?: string;
}

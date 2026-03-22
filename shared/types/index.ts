/**
 * Shared Types
 * Common type definitions used across the StackPulse application.
 *
 * These types are shared between the frontend, server, and shared packages
 * to ensure type consistency across the entire codebase.
 */

// ============================================================================
// Alert Types
// ============================================================================

/**
 * Represents a user-configured blockchain event alert.
 */
export interface Alert {
  /** Unique identifier for the alert */
  id: string;
  /** Human-readable name for the alert */
  name: string;
  /** Stacks wallet address of the alert owner */
  userAddress: string;
  /** Alert type identifier (1=whale, 2=contract, 3=nft, 4=token, 5=swap, 6=custom) */
  alertType: number;
  /** Minimum value required to trigger (e.g. STX amount for whale transfers, or number of events) */
  threshold?: number;
  /** Optional specific address to monitor (e.g. for address watch alerts) */
  targetAddress?: string;
  /** Optional webhook URL for external notifications */
  webhookUrl?: string;
  /** Whether the alert is currently active */
  enabled: boolean;
  /** Unix timestamp when the alert was created */
  createdAt: number;
  /** Unix timestamp when the alert was last modified */
  updatedAt: number;
  /** Number of times this alert has been triggered */
  triggerCount: number;
}

/** 
 * Alert type identifiers matching the Clarity contract definitions.
 * These IDs are used to route alerts correctly to the notification dispatchers.
 */
export enum AlertTypeId {
  /** Triggered when a large amount of STX is transferred */
  WhaleTransfer = 1,
  /** Triggered when a new smart contract is deployed to the blockchain */
  ContractDeployed = 2,
  /** Triggered when an NFT is minted in a tracked collection */
  NFTMint = 3,
  /** Triggered when a new SIP-010 token contract is detected */
  TokenLaunch = 4,
  /** Triggered when a swap exceeding a certain value is detected */
  LargeSwap = 5,
  /** Triggered when any activity is detected on a specific address */
  AddressWatch = 6,
}

/** The minimum valid AlertTypeId value */
export const MIN_ALERT_TYPE_ID = AlertTypeId.WhaleTransfer;
/** The maximum valid AlertTypeId value */
export const MAX_ALERT_TYPE_ID = AlertTypeId.AddressWatch;

/** Request body for creating a new alert */
export interface CreateAlertRequest {
  /** Alert type identifier */
  type: number;
  /** Alert name */
  name: string;
  /** Optional threshold value */
  threshold?: number;
  /** Optional target address to monitor */
  targetAddress?: string;
  /** Optional transaction ID reference */
  txId?: string;
}

// ============================================================================
// User Types
// ============================================================================

/**
 * Represents a registered StackPulse user.
 */
export interface User {
  /** Stacks wallet address (primary identifier) */
  address: string;
  /** Optional display name for the user */
  displayName?: string;
  /** Subscription tier level (0=free, 1=basic, 2=pro, 3=premium) */
  tier: number;
  /** Unix timestamp when the user registered */
  createdAt: number;
  /** Total number of alerts configured by this user */
  alertCount: number;
  /** Total number of badges earned by this user */
  badgeCount: number;
}

export type UserTier = 'Free' | 'Basic' | 'Pro' | 'Premium';

export interface TierLimits {
  maxAlerts: number;
  features: string[];
  webhookSupport: boolean;
}

// Notification Types
// ============================================================================

/** Types of notifications that can be sent to users */
export type NotificationType = 'alert' | 'badge' | 'subscription' | 'system';

/**
 * Represents a notification sent to a user.
 */
export interface Notification {
  /** Unique notification identifier */
  id: string;
  /** Type of notification */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message body */
  message: string;
  /** Optional user address for targeted notifications */
  userAddress?: string;
  /** Unix timestamp when the notification was created */
  timestamp: number;
  /** Whether the notification has been read */
  read: boolean;
}

/** Request to broadcast a notification */
export interface BroadcastNotificationRequest {
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Notification type */
  type: NotificationType;
  /** Optional additional data */
  data?: Record<string, unknown>;
  /** Optional transaction hash */
  txHash?: string;
  /** Optional block height */
  blockHeight?: number;
  /** Optional list of user addresses to notify */
  targetUsers?: string[];
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper for all endpoints.
 */
export interface ApiResponse<T = unknown> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data (present on success) */
  data?: T;
  /** Error message (present on failure) */
  error?: string;
  /** Additional message */
  message?: string;
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Paginated response wrapper for list endpoints.
 */
export interface PaginatedResponse<T = unknown> {
  /** Array of items for the current page */
  items: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Whether there are more pages available */
  hasMore: boolean;
}

/** Query parameters for paginated requests */
export interface PaginationQuery {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 10, max: 100) */
  limit?: number;
}

// ============================================================================
// Chainhook Event Types
// ============================================================================

/** Block identifier in chainhook events */
export interface BlockIdentifier {
  index: number;
  hash: string;
}

/** Transaction identifier in chainhook events */
export interface TransactionIdentifier {
  hash: string;
}

/** Event data in chainhook receipts */
export interface ChainhookEvent {
  type?: string;
  data?: Record<string, unknown>;
}

/** Transaction metadata in chainhook payloads */
export interface TransactionMetadata {
  success: boolean;
  sender: string;
  fee: number;
  kind?: {
    type?: string;
    data?: Record<string, unknown>;
  };
  receipt: {
    events: ChainhookEvent[];
  };
}

/** Transaction in chainhook apply block */
export interface ChainhookTransaction {
  transaction_identifier: TransactionIdentifier;
  metadata: TransactionMetadata;
}

/** Block in chainhook apply array */
export interface ChainhookBlock {
  block_identifier: BlockIdentifier;
  transactions: ChainhookTransaction[];
}

/** Chainhook predicate configuration */
export interface ChainhookPredicate {
  scope?: string;
  equals?: string;
  [key: string]: unknown;
}

/** Chainhook reference in payload */
export interface ChainhookRef {
  uuid: string;
  predicate: ChainhookPredicate;
}

/** Full chainhook payload structure */
export interface ChainhookPayload {
  apply: ChainhookBlock[];
  rollback?: Record<string, unknown>[];
  chainhook: ChainhookRef;
}

// ============================================================================
// Badge Types
// ============================================================================

/** Badge type identifiers */
export enum BadgeType {
  EarlyAdopter = 'early-adopter',
  WhaleWatcher = 'whale-watcher',
  ContractDeployer = 'contract-deployer',
  NFTCollector = 'nft-collector',
  TokenTrader = 'token-trader',
  LoyalUser = 'loyal-user',
}

/** Represents an earned badge */
export interface Badge {
  /** Unique badge identifier */
  id: string;
  /** Badge type */
  type: BadgeType;
  /** Badge name */
  name: string;
  /** Badge description */
  description: string;
  /** Recipient's wallet address */
  recipient: string;
  /** Unix timestamp when the badge was earned */
  earnedAt: number;
  /** Token ID in the reputation badges contract */
  tokenId: number;
}

// ============================================================================
// Subscription Types
// ============================================================================

/** Subscription event data */
export interface SubscriptionEvent {
  /** User address */
  user: string;
  /** Subscription tier */
  tier: number;
  /** Price paid in micro-STX */
  price: number;
}

/** Alert trigger event data */
export interface AlertTriggerEvent {
  /** Alert owner address */
  owner: string;
  /** Alert ID */
  alertId: number;
  /** Alert type */
  alertType: string;
}

/** Fee collection event data */
export interface FeeCollectedEvent {
  /** Source of the fee */
  source: string;
  /** Amount in micro-STX */
  amount: number;
}

// Note: All types and enums are already exported above.
// This file exports both types and enums for use across the application.

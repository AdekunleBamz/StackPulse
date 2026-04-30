/**
 * Types of activities that can trigger an alert
 */
export enum AlertType {
  /** Transfer of a significant amount of STX (typically >10,000) */
  WhaleTransfer = 1,
  /** Deployment of a new smart contract to the blockchain */
  ContractDeploy = 2,
  /** Minting of a new Non-Fungible Token */
  NFTMint = 3,
  /** Deployment of a new SIP-010 fungible token */
  TokenLaunch = 4,
  /** Large value swap on a Decentralized Exchange */
  LargeSwap = 5,
  /** Specific activity on a watched Stacks address */
  AddressWatch = 6,
}

export const AlertTypeNames: Record<AlertType, string> = {
  [AlertType.WhaleTransfer]: 'Whale Transfer',
  [AlertType.ContractDeploy]: 'Contract Deploy',
  [AlertType.NFTMint]: 'NFT Mint',
  [AlertType.TokenLaunch]: 'Token Launch',
  [AlertType.LargeSwap]: 'Large Swap',
  [AlertType.AddressWatch]: 'Address Watch',
};

export const AlertTypeIcons: Record<AlertType, string> = {
  [AlertType.WhaleTransfer]: '🐋',
  [AlertType.ContractDeploy]: '📄',
  [AlertType.NFTMint]: '🎨',
  [AlertType.TokenLaunch]: '🚀',
  [AlertType.LargeSwap]: '💸',
  [AlertType.AddressWatch]: '👁️',
};

/**
 * Represents a configured alert in the system.
 */
export interface Alert {
  /** Unique identifier for the alert */
  id: string;
  /** ID of the user who owns this alert */
  userId: string;
  /** Human-readable name for the alert */
  name: string;
  /** The type of activity this alert monitors */
  alertType: AlertType;
  /** Optional numerical threshold for triggering (e.g., amount in STX) */
  threshold?: number;
  /** Optional Stacks address to monitor */
  targetAddress?: string;
  /** URL to receive webhook notifications when triggered */
  webhookUrl?: string;
  /** Whether the alert is currently active */
  enabled: boolean;
  /** Timestamp when the alert was created */
  createdAt: number;
  /** Timestamp when the alert was last triggered */
  lastTriggered?: number;
  /** Total number of times this alert has been triggered */
  triggerCount: number;
}

/**
 * Request payload for creating a new alert.
 */
export interface CreateAlertRequest {
  /** Name of the alert */
  name: string;
  /** Type of activity to monitor */
  alertType: AlertType;
  /** Optional numerical threshold */
  threshold?: number;
  /** Optional address to monitor */
  targetAddress?: string;
  /** Optional webhook destination */
  webhookUrl?: string;
}

/**
 * Request payload for updating an existing alert.
 */
export interface UpdateAlertRequest {
  /** Updated name for the alert */
  name?: string;
  /** Updated numerical threshold */
  threshold?: number;
  /** Updated address to monitor */
  targetAddress?: string;
  /** Updated webhook destination */
  webhookUrl?: string;
  /** Updated enabled status */
  enabled?: boolean;
}

/**
 * Statistics overview for a user's alerts.
 */
export interface AlertStats {
  /** Total number of alerts configured by the user */
  total: number;
  /** Number of enabled/active alerts */
  active: number;
  /** Total cumulative number of times all alerts have been triggered */
  totalTriggers: number;
  /** Breakdown of alerts by their type */
  byType: Record<AlertType, number>;
}

/**
 * Generic wrapper for paginated API responses.
 */
export interface AlertPagination {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether a subsequent page exists */
  hasNext: boolean;
  /** Whether a preceding page exists */
  hasPrev: boolean;
}

export interface PaginatedAlerts<T = unknown> {
  /** Array of items for the current page */
  items: T[];
  /** Pagination metadata */
  pagination: AlertPagination;
}

/**
 * Filter criteria for querying alerts.
 */
export type AlertFilter = {
  /** Filter by a specific alert type */
  alertType?: AlertType;
  /** Filter by enabled/disabled status */
  enabled?: boolean;
  /** Search string for filtering by name or address */
  search?: string;
};

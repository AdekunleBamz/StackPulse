/**
 * Alert type definitions
 */

export enum AlertType {
  WhaleTransfer = 1,
  ContractDeploy = 2,
  NFTMint = 3,
  TokenLaunch = 4,
  LargeSwap = 5,
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

export interface AlertStats {
  total: number;
  active: number;
  totalTriggers: number;
  byType: Record<AlertType, number>;
}

export interface PaginatedAlerts<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type AlertFilter = {
  alertType?: AlertType;
  enabled?: boolean;
  search?: string;
};

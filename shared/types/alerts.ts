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

export interface Alert {
  id: string;
  userId: string;
  name: string;
  alertType: AlertType;
  threshold?: number;
  targetAddress?: string;
  webhookUrl?: string;
  enabled: boolean;
  createdAt: number;
  lastTriggered?: number;
  triggerCount: number;
}

export interface CreateAlertRequest {
  name: string;
  alertType: AlertType;
  threshold?: number;
  targetAddress?: string;
  webhookUrl?: string;
}

export interface UpdateAlertRequest {
  name?: string;
  threshold?: number;
  targetAddress?: string;
  webhookUrl?: string;
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

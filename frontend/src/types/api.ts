export interface EventStats {
  whaleTransfers: number;
  contractDeployments: number;
  nftMints: number;
  tokenLaunches: number;
  largeSwaps: number;
  subscriptions: number;
  alertsTriggered: number;
  feesCollected: number;
  badgesEarned: number;
}

export interface UserPreferences {
  address: string;
  username: string;
  email?: string;
  discord?: string;
  telegram?: string;
  tier: number;
  enabledAlerts: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  stats?: T; // For backward compatibility with some endpoints
  user?: T;  // For backward compatibility with some endpoints
}

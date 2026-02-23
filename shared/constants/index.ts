/**
 * Shared Constants
 * Common constants used across the application
 */

// API URLs
export const API_URLS = {
  STACKS_API: 'https://stacks-node-api.mainnet.stacks.co',
  STACKS_API_TESTNET: 'https://stacks-node-api.testnet.stacks.co',
  HIRO_API: 'https://api.hiro.so',
};

// Alert Types
export const ALERT_TYPES = {
  WHALE_TRANSFER: 1,
  CONTRACT_DEPLOYED: 2,
  NFT_MINT: 3,
  TOKEN_LAUNCH: 4,
  LARGE_SWAP: 5,
  ADDRESS_WATCH: 6,
};

// Alert Type Names
export const ALERT_TYPE_NAMES: Record<number, string> = {
  [ALERT_TYPES.WHALE_TRANSFER]: 'Whale Transfer',
  [ALERT_TYPES.CONTRACT_DEPLOYED]: 'Contract Deployed',
  [ALERT_TYPES.NFT_MINT]: 'NFT Mint',
  [ALERT_TYPES.TOKEN_LAUNCH]: 'Token Launch',
  [ALERT_TYPES.LARGE_SWAP]: 'Large Swap',
  [ALERT_TYPES.ADDRESS_WATCH]: 'Address Watch',
};

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  ENTERPRISE: 3,
};

// Tier Names
export const TIER_NAMES: Record<number, string> = {
  [SUBSCRIPTION_TIERS.FREE]: 'Free',
  [SUBSCRIPTION_TIERS.BASIC]: 'Basic',
  [SUBSCRIPTION_TIERS.PREMIUM]: 'Premium',
  [SUBSCRIPTION_TIERS.ENTERPRISE]: 'Enterprise',
};

// Network Types
export const NETWORK_TYPES = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
  DEVNET: 'devnet',
};

// Default Values
export const DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  API_TIMEOUT: 30000,
  WS_RECONNECT_DELAY: 5000,
  CACHE_TTL: 300000, // 5 minutes
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_ADDRESS: 'Invalid Stacks address',
  NETWORK_ERROR: 'Network error occurred',
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  RATE_LIMITED: 'Rate limit exceeded',
};

export default {
  API_URLS,
  ALERT_TYPES,
  ALERT_TYPE_NAMES,
  SUBSCRIPTION_TIERS,
  TIER_NAMES,
  NETWORK_TYPES,
  DEFAULTS,
  ERROR_MESSAGES,
};

/**
 * Shared application constants.
 *
 * Keep this file additive/backwards-compatible where possible because it is
 * imported from both server and frontend code.
 */

/**
 * External API endpoints used across the application.
 * SERVER URL can be overridden via NEXT_PUBLIC_SERVER_URL environment variable.
 */
export const API_URLS = {
  SERVER: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  STACKS_API: 'https://stacks-node-api.mainnet.stacks.co',
  STACKS_API_TESTNET: 'https://stacks-node-api.testnet.stacks.co',
  HIRO_API: 'https://api.hiro.so',
} as const;

/**
 * Clarity contract addresses for different networks.
 * Addresses can be overridden via environment variables.
 */
export const CONTRACT_ADDRESSES = {
  MAINNET: {
    ALERT_MANAGER: process.env.ALERT_MANAGER_MAINNET || '',
    FEE_VAULT: process.env.FEE_VAULT_MAINNET || '',
    REPUTATION_BADGES: process.env.REPUTATION_BADGES_MAINNET || '',
  },
  TESTNET: {
    ALERT_MANAGER: process.env.ALERT_MANAGER_TESTNET || '',
    FEE_VAULT: process.env.FEE_VAULT_TESTNET || '',
    REPUTATION_BADGES: process.env.REPUTATION_BADGES_TESTNET || '',
  },
} as const;

/**
 * Supported blockchain networks.
 * NETWORK_TYPES is a backwards-compatible alias.
 */
export const NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
  DEVNET: 'devnet',
} as const;

// Backwards-compatible alias
export const NETWORK_TYPES = NETWORKS;

/**
 * Pagination configuration defaults.
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Cache time-to-live values in milliseconds.
 */
export const CACHE_TTL = {
  SHORT: 60000, // 1 minute
  MEDIUM: 300000, // 5 minutes
  LONG: 3600000, // 1 hour
  DAY: 86400000, // 24 hours
} as const;

/**
 * Rate limiting configuration for different endpoint types.
 */
export const RATE_LIMITS = {
  PUBLIC: {
    WINDOW_MS: 60000,
    MAX_REQUESTS: 100,
  },
  USER: {
    WINDOW_MS: 60000,
    MAX_REQUESTS: 60,
  },
  STRICT: {
    WINDOW_MS: 60000,
    MAX_REQUESTS: 10,
  },
} as const;

/**
 * WebSocket connection configuration.
 */
export const WS_CONFIG = {
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000,
} as const;

/**
 * Alert type identifiers. CONTRACT_DEPLOY is an alias for CONTRACT_DEPLOYED.
 */
export const ALERT_TYPES = {
  WHALE_TRANSFER: 1,
  CONTRACT_DEPLOYED: 2,
  CONTRACT_DEPLOY: 2,
  NFT_MINT: 3,
  TOKEN_LAUNCH: 4,
  LARGE_SWAP: 5,
  ADDRESS_WATCH: 6,
} as const;

// Alert Type Names
export const ALERT_TYPE_NAMES: Record<number, string> = {
  [ALERT_TYPES.WHALE_TRANSFER]: 'Whale Transfer',
  [ALERT_TYPES.CONTRACT_DEPLOYED]: 'Contract Deployed',
  [ALERT_TYPES.NFT_MINT]: 'NFT Mint',
  [ALERT_TYPES.TOKEN_LAUNCH]: 'Token Launch',
  [ALERT_TYPES.LARGE_SWAP]: 'Large Swap',
  [ALERT_TYPES.ADDRESS_WATCH]: 'Address Watch',
};

/**
 * Subscription tier levels matching smart contract definitions.
 * USER_TIERS is a backwards-compatible alias.
 */
export const SUBSCRIPTION_TIERS = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  PREMIUM: 3,
} as const;

export const USER_TIERS = SUBSCRIPTION_TIERS;

// Tier Names
export const TIER_NAMES: Record<number, string> = {
  [SUBSCRIPTION_TIERS.FREE]: 'Free',
  [SUBSCRIPTION_TIERS.BASIC]: 'Basic',
  [SUBSCRIPTION_TIERS.PRO]: 'Pro',
  [SUBSCRIPTION_TIERS.PREMIUM]: 'Premium',
};

/**
 * Application-wide default values.
 */
export const DEFAULTS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  API_TIMEOUT: 30000,
  WS_RECONNECT_DELAY: 5000,
  CACHE_TTL: CACHE_TTL.MEDIUM,
};

/**
 * Standardized error messages for consistent user feedback.
 */
export const ERROR_MESSAGES = {
  INVALID_ADDRESS: 'Invalid Stacks address',
  NETWORK_ERROR: 'Network error occurred',
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  REQUEST_TIMEOUT: 'Request timed out',
  PAYLOAD_TOO_LARGE: 'Payload exceeds allowed size',
  RATE_LIMITED: 'Rate limit exceeded',
} as const;

/**
 * Internal event type strings for the event system.
 */
export const EVENT_TYPES = {
  ALERT_CREATED: 'alert.created',
  ALERT_UPDATED: 'alert.updated',
  ALERT_DELETED: 'alert.deleted',
  ALERT_TRIGGERED: 'alert.triggered',
  ALERT_ENABLED: 'alert.enabled',
  ALERT_DISABLED: 'alert.disabled',
  USER_REGISTERED: 'user.registered',
  USER_SUBSCRIBED: 'user.subscribed',
  USER_UNSUBSCRIBED: 'user.unsubscribed',
  BADGE_EARNED: 'badge.earned',
  FEE_COLLECTED: 'fee.collected',
} as const;

/**
 * HTTP status codes for API responses.
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,
  BAD_GATEWAY: 502,
  GATEWAY_TIMEOUT: 504,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Application-specific error codes for error handling.
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  ALERT_LIMIT_REACHED: 'ALERT_LIMIT_REACHED',
  INVALID_ALERT_TYPE: 'INVALID_ALERT_TYPE',
} as const;

/**
 * Hiro Chainhook event type identifiers.
 * Note: Event naming may vary by integration version.
 */
export const CHAINHOOK_EVENTS = {
  WHALE_TRANSFER: 'stacks::stx_transfer',
  CONTRACT_DEPLOY: 'stacks::contract_deployment',
  NFT_MINT: 'stacks::nft_mint',
  TOKEN_LAUNCH: 'stacks::token_launch',
  LARGE_SWAP: 'stacks::large_swap',
  ADDRESS_WATCH: 'stacks::address_activity',
} as const;

/**
 * Feature flags for gradual rollouts and A/B testing.
 */
export const FEATURE_FLAGS = {
  ANALYTICS: true,
  BADGES: true,
  WEBSOCKET: true,
  REAL_TIME_STATS: true,
  PROMETHEUS_METRICS: true,
} as const;

export const ALERT_LIMITS = {
  FREE: 3,
  BASIC: 10,
  PRO: 50,
  PREMIUM: 200,
} as const;

export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export const TRANSACTION_TYPES = {
  STX_TRANSFER: 'token_transfer',
  CONTRACT_CALL: 'contract_call',
  CONTRACT_DEPLOY: 'smart_contract',
} as const;

export const MAX_ALERT_NAME_LENGTH = 100;

export const UI_CONSTANTS = {
  DEBOUNCE_MS: 300,
  MIN_SEARCH_LENGTH: 2,
  PAGE_SIZE: 20,
  TOAST_DURATION_MS: 4000,
} as const;

export const BADGE_TYPES = {
  EARLY_ADOPTER: 'early_adopter',
  POWER_USER: 'power_user',
  WHALE_WATCHER: 'whale_watcher',
  STREAK_7: 'streak_7',
} as const;

export default {
  API_URLS,
  CONTRACT_ADDRESSES,
  NETWORKS,
  NETWORK_TYPES,
  PAGINATION,
  CACHE_TTL,
  RATE_LIMITS,
  WS_CONFIG,
  ALERT_TYPES,
  ALERT_TYPE_NAMES,
  SUBSCRIPTION_TIERS,
  USER_TIERS,
  TIER_NAMES,
  DEFAULTS,
  ERROR_MESSAGES,
  EVENT_TYPES,
  HTTP_STATUS,
  ERROR_CODES,
  CHAINHOOK_EVENTS,
  FEATURE_FLAGS,
};

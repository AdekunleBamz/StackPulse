/**
 * StackPulse Constants
 * Shared constants for frontend and server
 */

// ============================================
// CONTRACT ADDRESSES
// ============================================

export const DEPLOYER_ADDRESS = 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N';

export const CONTRACTS = {
  REGISTRY: 'stackpulse-v3-1',
  ALERT_MANAGER: 'alert-manager-v3',
  FEE_VAULT: 'fee-vault-v3',
  BADGES: 'reputation-badges-v3',
} as const;

export const CONTRACT_ADDRESSES = {
  REGISTRY: `${DEPLOYER_ADDRESS}.${CONTRACTS.REGISTRY}`,
  ALERT_MANAGER: `${DEPLOYER_ADDRESS}.${CONTRACTS.ALERT_MANAGER}`,
  FEE_VAULT: `${DEPLOYER_ADDRESS}.${CONTRACTS.FEE_VAULT}`,
  BADGES: `${DEPLOYER_ADDRESS}.${CONTRACTS.BADGES}`,
} as const;

// ============================================
// API ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  // Stacks API
  MAINNET_API: 'https://api.mainnet.hiro.so',
  TESTNET_API: 'https://api.testnet.hiro.so',
  
  // StackPulse Server
  PRODUCTION_SERVER: 'https://stackpulse-b8fw.onrender.com',
  LOCAL_SERVER: 'http://localhost:3000',
} as const;

// ============================================
// SUBSCRIPTION CONSTANTS
// ============================================

export const BLOCKS_PER_MINUTE = 0.1; // ~10 min per block
export const BLOCKS_PER_HOUR = 6;
export const BLOCKS_PER_DAY = 144;
export const BLOCKS_PER_MONTH = 4320;
export const BLOCKS_PER_YEAR = 52560;

export const TIER_PRICES_MICROSTX = {
  FREE: 0,
  BASIC: 1_000_000,      // 1 STX
  PRO: 5_000_000,        // 5 STX
  PREMIUM: 20_000_000,   // 20 STX
} as const;

export const TIER_PRICES_STX = {
  FREE: 0,
  BASIC: 1,
  PRO: 5,
  PREMIUM: 20,
} as const;

export const VAULT_PRICES_MICROSTX = {
  FREE: 0,
  BASIC: 5_000_000,      // 5 STX
  PRO: 15_000_000,       // 15 STX
  PREMIUM: 45_000_000,   // 45 STX
} as const;

export const ALERT_LIMITS = {
  FREE: 3,
  BASIC: 10,
  PRO: 25,
  PREMIUM: 999,
} as const;

// ============================================
// FEE CONSTANTS
// ============================================

export const PLATFORM_FEE_BPS = 1000;      // 10% in basis points
export const REFERRAL_BONUS_BPS = 500;     // 5% in basis points
export const BASIS_POINTS_DIVISOR = 10_000;

// ============================================
// ALERT BITMASK
// ============================================

export const ALERT_BITMASKS = {
  WHALE: 1,      // 0b00001
  NFT: 2,        // 0b00010
  TOKEN: 4,      // 0b00100
  SWAP: 8,       // 0b01000
  CONTRACT: 16,  // 0b10000
  ALL: 31,       // 0b11111
} as const;

// ============================================
// WHALE THRESHOLD
// ============================================

export const WHALE_THRESHOLD_MICROSTX = 10_000_000_000; // 10,000 STX
export const WHALE_THRESHOLD_STX = 10_000;

// ============================================
// BADGE THRESHOLDS
// ============================================

export const BADGE_THRESHOLDS = {
  EARLY_ADOPTER_MAX: 100,
  WHALE_WATCHER_TRIGGERS: 10,
  ALERT_MASTER_ALERTS: 25,
  REFERRAL_CHAMPION_REFERRALS: 5,
  YEAR_ONE_BLOCKS: BLOCKS_PER_YEAR,
  OG_MAX: 50,
} as const;

// ============================================
// VALIDATION
// ============================================

export const VALIDATION = {
  USERNAME_MIN_LENGTH: 1,
  USERNAME_MAX_LENGTH: 32,
  EMAIL_MAX_LENGTH: 64,
  ALERT_NAME_MAX_LENGTH: 64,
  MIN_ALERT_TYPE: 1,
  MAX_ALERT_TYPE: 6,
  MIN_TIER: 0,
  MAX_TIER: 3,
  MAX_ALERTS_BITMASK: 31,
} as const;

// ============================================
// ERROR CODES
// ============================================

export const ERROR_CODES = {
  // Registry errors
  ERR_ALREADY_REGISTERED: 101,
  ERR_NOT_REGISTERED: 102,
  ERR_INVALID_TIER: 103,
  ERR_TRANSFER_FAILED: 104,
  ERR_NOT_AUTHORIZED: 105,
  ERR_INVALID_USERNAME: 106,
  ERR_INVALID_ALERTS: 107,
  ERR_SUBSCRIPTION_EXPIRED: 108,
  ERR_SAME_TIER: 109,
  ERR_INVALID_HOOK_TYPE: 110,
  
  // Alert Manager errors
  AM_ERR_NOT_AUTHORIZED: 100,
  AM_ERR_NOT_REGISTERED: 101,
  AM_ERR_ALERT_NOT_FOUND: 102,
  AM_ERR_MAX_ALERTS_REACHED: 103,
  AM_ERR_INVALID_ALERT_TYPE: 104,
  AM_ERR_INVALID_NAME: 105,
  AM_ERR_ALERT_DISABLED: 106,
  AM_ERR_DUPLICATE_ALERT: 107,
  
  // Fee Vault errors
  FV_ERR_NOT_AUTHORIZED: 100,
  FV_ERR_INVALID_AMOUNT: 101,
  FV_ERR_INSUFFICIENT_BALANCE: 102,
  FV_ERR_INVALID_TIER: 103,
  FV_ERR_ZERO_AMOUNT: 104,
  FV_ERR_SELF_REFERRAL: 105,
  FV_ERR_NO_EARNINGS: 106,
  
  // Badge errors
  BG_ERR_NOT_AUTHORIZED: 100,
  BG_ERR_NOT_FOUND: 101,
  BG_ERR_ALREADY_MINTED: 102,
  BG_ERR_INVALID_BADGE: 103,
} as const;

// ============================================
// CHAINHOOK IDs
// ============================================

export const CHAINHOOK_IDS = {
  WHALE_TRANSFER: 'whale-transfer-alert',
  CONTRACT_DEPLOYED: 'new-contract-deployed',
  NFT_MINT: 'nft-mint-tracker',
  TOKEN_LAUNCH: 'token-launch-detector',
  LARGE_SWAP: 'large-swap-alert',
  SUBSCRIPTION_CREATED: 'user-subscription-created',
  ALERT_TRIGGERED: 'alert-triggered',
  FEE_COLLECTED: 'fee-collected',
  BADGE_EARNED: 'badge-earned',
} as const;

// ============================================
// UI CONSTANTS
// ============================================

export const TIER_COLORS = {
  FREE: 'gray',
  BASIC: 'blue',
  PRO: 'purple',
  PREMIUM: 'yellow',
} as const;

export const ALERT_TYPE_COLORS = {
  1: 'blue',    // Whale
  2: 'purple',  // Contract
  3: 'pink',    // NFT
  4: 'yellow',  // Token
  5: 'green',   // Swap
  6: 'orange',  // Address
} as const;

// ============================================
// PAGINATION
// ============================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

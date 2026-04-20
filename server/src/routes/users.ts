import { Router, Request, Response } from 'express';
import logger from '../utils/logger';
import { UserTier } from '../services/tier';

const router = Router();

interface UserRecord {
  address: string;
  displayName: string;
  tier: UserTier;
  createdAt: number;
  alertCount: number;
  badgeCount: number;
  username?: string;
  email?: string;
  discord?: string;
  telegram?: string;
  enabledAlerts?: string[];
}

// In-memory user store
const users = new Map<string, UserRecord>();

const USER_DISPLAY_NAME_MAX_LENGTH = 64;
const USER_USERNAME_MAX_LENGTH = 32;
const USER_EMAIL_MAX_LENGTH = 128;
const USER_SOCIAL_HANDLE_MAX_LENGTH = 64;
const USER_ADDRESS_FALLBACK_PREFIX_LENGTH = 8;

/**
 * GET /api/users
 * List all users
 */
router.get('/', (req: Request, res: Response) => {
  const allUsers = Array.from(users.values());
  res.json({
    success: true,
    users: allUsers,
    count: allUsers.length
  });
});

/**
 * GET /api/users/:address
 * Get user by address
 */
router.get('/:address', (req: Request, res: Response) => {
  const { address } = req.params;
  const user = users.get(address);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  res.json({
    success: true,
    user
  });
});

/**
 * POST /api/users
 * Register a new user
 */
router.post('/', (req: Request, res: Response) => {
  const { address, displayName } = req.body;
  const normalizedAddress = typeof address === 'string' ? address.trim() : '';
  const normalizedDisplayName =
    typeof displayName === 'string' ? displayName.trim().slice(0, USER_DISPLAY_NAME_MAX_LENGTH) : '';
  
  if (!normalizedAddress) {
    return res.status(400).json({
      success: false,
      error: 'Address is required'
    });
  }
  
  if (users.has(normalizedAddress)) {
    return res.status(409).json({
      success: false,
      error: 'User already exists'
    });
  }
  
  const user: UserRecord = {
    address: normalizedAddress,
    displayName: normalizedDisplayName || normalizedAddress.slice(0, USER_ADDRESS_FALLBACK_PREFIX_LENGTH),
    tier: UserTier.FREE,
    createdAt: Date.now(),
    alertCount: 0,
    badgeCount: 0,
  };
  
  users.set(normalizedAddress, user);
  
  logger.info('User registered', { address: normalizedAddress, displayName: user.displayName });
  
  res.status(201).json({
    success: true,
    user
  });
});

/**
 * PATCH /api/users/:address
 * Update user
 */
router.patch('/:address', (req: Request, res: Response) => {
  const { address } = req.params;
  const user = users.get(address);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  const updates = req.body as Partial<
    Pick<UserRecord, 'displayName' | 'username' | 'email' | 'discord' | 'telegram' | 'enabledAlerts'>
  >;
  const normalizedDisplayName =
    typeof updates.displayName === 'string' ? updates.displayName.trim().slice(0, USER_DISPLAY_NAME_MAX_LENGTH) : undefined;
  const normalizedUsername =
    typeof updates.username === 'string' ? updates.username.trim().slice(0, USER_USERNAME_MAX_LENGTH) : undefined;
  const normalizedEmail =
    typeof updates.email === 'string' ? updates.email.trim().slice(0, USER_EMAIL_MAX_LENGTH) : undefined;
  const normalizedDiscord =
    typeof updates.discord === 'string' ? updates.discord.trim().slice(0, USER_SOCIAL_HANDLE_MAX_LENGTH) : undefined;
  const normalizedTelegram =
    typeof updates.telegram === 'string' ? updates.telegram.trim().slice(0, USER_SOCIAL_HANDLE_MAX_LENGTH) : undefined;
  const normalizedEnabledAlerts = Array.isArray(updates.enabledAlerts)
    ? Array.from(
        new Set(
          updates.enabledAlerts
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)
        )
      )
    : undefined;
  const updatedUser: UserRecord = {
    ...user,
    ...updates,
    displayName: normalizedDisplayName || user.displayName,
    ...(normalizedUsername !== undefined ? { username: normalizedUsername } : {}),
    ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
    ...(normalizedDiscord !== undefined ? { discord: normalizedDiscord } : {}),
    ...(normalizedTelegram !== undefined ? { telegram: normalizedTelegram } : {}),
    ...(normalizedEnabledAlerts !== undefined ? { enabledAlerts: normalizedEnabledAlerts } : {}),
    address: user.address,
    createdAt: user.createdAt,
    tier: user.tier,
    alertCount: user.alertCount,
  };
  users.set(address, updatedUser);

  logger.info('User updated', { address, updates: Object.keys(updates) });

  res.json({
    success: true,
    user: updatedUser
  });
});

/**
 * POST /api/users/:address/upgrade
 * Upgrade user tier
 */
router.post('/:address/upgrade', (req: Request, res: Response) => {
  const { address } = req.params;
  const { tier } = req.body;
  const user = users.get(address);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  const parsedTier =
    typeof tier === 'number' ? tier : typeof tier === 'string' ? Number.parseInt(tier, 10) : Number.NaN;
  if (!Number.isInteger(parsedTier) || parsedTier < UserTier.FREE || parsedTier > UserTier.EXCHANGE) {
    return res.status(400).json({
      success: false,
      error: 'Invalid tier specified'
    });
  }
  
  const updatedUser = { ...user, tier: parsedTier as UserTier };
  users.set(address, updatedUser);
  
  logger.info('User tier upgraded', { address, oldTier: user.tier, newTier: parsedTier });
  
  res.json({
    success: true,
    user: updatedUser
  });
});

export default router;

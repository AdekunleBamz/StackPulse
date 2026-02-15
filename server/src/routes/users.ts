import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { cache } from '../services/cache';

const router = Router();

// Types
interface User {
  address: string;
  tier: number;
  tierName: string;
  alertCount: number;
  maxAlerts: number;
  totalAlertsTriggers: number;
  registeredAt: Date;
  expiresAt?: Date;
  referrer?: string;
  referralCount: number;
  badges: number[];
}

// In-memory store
const users: Map<string, User> = new Map();

// Tier configuration
const tierConfig: Record<number, { name: string; maxAlerts: number; price: number }> = {
  1: { name: 'Free', maxAlerts: 3, price: 0 },
  2: { name: 'Pro', maxAlerts: 25, price: 5000000 }, // 5 STX
  3: { name: 'Premium', maxAlerts: 100, price: 15000000 }, // 15 STX
};

/**
 * GET /api/users/:address
 * Get user profile
 */
router.get(
  '/:address',
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;

    // Validate address format
    if (!address.match(/^S[PM][A-Z0-9]{38,39}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Stacks address format',
      });
    }

    // Check cache
    const cacheKey = `user:${address}`;
    const cached = cache.get<User>(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        user: cached,
        fromCache: true,
      });
    }

    // Get or create user
    let user = users.get(address);
    
    if (!user) {
      // Create new free tier user
      user = {
        address,
        tier: 1,
        tierName: 'Free',
        alertCount: 0,
        maxAlerts: 3,
        totalAlertsTriggers: 0,
        registeredAt: new Date(),
        referralCount: 0,
        badges: [],
      };
      users.set(address, user);
    }

    // Cache for 5 minutes
    cache.set(cacheKey, user, 300000);

    res.json({
      success: true,
      user,
    });
  })
);

/**
 * POST /api/users/register
 * Register a new user
 */
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { address, referrer } = req.body;

    // Validate address
    if (!address || !address.match(/^S[PM][A-Z0-9]{38,39}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Stacks address format',
      });
    }

    // Check if already registered
    if (users.has(address)) {
      return res.status(400).json({
        success: false,
        error: 'User already registered',
      });
    }

    // Create user
    const user: User = {
      address,
      tier: 1,
      tierName: 'Free',
      alertCount: 0,
      maxAlerts: 3,
      totalAlertsTriggers: 0,
      registeredAt: new Date(),
      referrer,
      referralCount: 0,
      badges: [],
    };

    users.set(address, user);

    // Update referrer's count
    if (referrer && users.has(referrer)) {
      const referrerUser = users.get(referrer)!;
      referrerUser.referralCount++;
      users.set(referrer, referrerUser);
      cache.delete(`user:${referrer}`);
    }

    res.status(201).json({
      success: true,
      user,
      message: 'Registration successful! Welcome to StackPulse.',
    });
  })
);

/**
 * POST /api/users/:address/upgrade
 * Upgrade user tier
 */
router.post(
  '/:address/upgrade',
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const { tier, txId } = req.body;

    // Validate tier
    if (![2, 3].includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier. Must be 2 (Pro) or 3 (Premium)',
      });
    }

    // Get user
    let user = users.get(address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please register first.',
      });
    }

    // In production, verify the transaction on-chain
    // For now, just update the tier
    const tierInfo = tierConfig[tier];
    
    user = {
      ...user,
      tier,
      tierName: tierInfo.name,
      maxAlerts: tierInfo.maxAlerts,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };

    users.set(address, user);
    cache.delete(`user:${address}`);

    res.json({
      success: true,
      user,
      message: `Upgraded to ${tierInfo.name} tier!`,
    });
  })
);

/**
 * GET /api/users/:address/badges
 * Get user's badges
 */
router.get(
  '/:address/badges',
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;

    const user = users.get(address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Badge definitions
    const badgeDefinitions: Record<number, { name: string; description: string; icon: string }> = {
      1: { name: 'Early Adopter', description: 'Among the first 100 users', icon: '🌟' },
      2: { name: 'Whale Watcher', description: 'Detected 10+ whale transfers', icon: '🐋' },
      3: { name: 'Alert Master', description: 'Created 25+ alerts', icon: '🔔' },
      4: { name: 'Power User', description: 'Pro or Premium subscriber', icon: '⚡' },
      5: { name: 'Referral Champion', description: 'Referred 5+ users', icon: '🤝' },
    };

    const badges = user.badges.map(id => ({
      id,
      ...badgeDefinitions[id],
    }));

    res.json({
      success: true,
      badges,
      count: badges.length,
    });
  })
);

/**
 * GET /api/users/:address/stats
 * Get user statistics
 */
router.get(
  '/:address/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;

    const user = users.get(address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const daysSinceRegistration = Math.floor(
      (Date.now() - user.registeredAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const stats = {
      tier: user.tierName,
      alertsUsed: user.alertCount,
      alertsAvailable: user.maxAlerts - user.alertCount,
      alertsMax: user.maxAlerts,
      totalTriggers: user.totalAlertsTriggers,
      referrals: user.referralCount,
      badgeCount: user.badges.length,
      memberSince: user.registeredAt,
      daysActive: daysSinceRegistration,
      subscriptionActive: !user.expiresAt || user.expiresAt > new Date(),
      expiresAt: user.expiresAt,
    };

    res.json({
      success: true,
      stats,
    });
  })
);

/**
 * GET /api/users/leaderboard
 * Get top users by various metrics
 */
router.get(
  '/leaderboard',
  asyncHandler(async (req: Request, res: Response) => {
    const { metric = 'referrals', limit = 10 } = req.query;

    const allUsers = Array.from(users.values());
    let sorted: User[];

    switch (metric) {
      case 'referrals':
        sorted = allUsers.sort((a, b) => b.referralCount - a.referralCount);
        break;
      case 'triggers':
        sorted = allUsers.sort((a, b) => b.totalAlertsTriggers - a.totalAlertsTriggers);
        break;
      case 'badges':
        sorted = allUsers.sort((a, b) => b.badges.length - a.badges.length);
        break;
      default:
        sorted = allUsers;
    }

    const leaderboard = sorted.slice(0, Number(limit)).map((user, index) => ({
      rank: index + 1,
      address: `${user.address.slice(0, 8)}...${user.address.slice(-4)}`,
      value: metric === 'referrals' 
        ? user.referralCount 
        : metric === 'triggers' 
          ? user.totalAlertsTriggers 
          : user.badges.length,
      tier: user.tierName,
    }));

    res.json({
      success: true,
      metric,
      leaderboard,
    });
  })
);

export default router;

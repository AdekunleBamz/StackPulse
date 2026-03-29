import { Router, Request, Response } from 'express';
import logger from '../utils/logger';
import { UserTier } from '../services/tier';

const router = Router();

// In-memory user store
const users = new Map();

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
  
  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Address is required'
    });
  }
  
  if (users.has(address)) {
    return res.status(409).json({
      success: false,
      error: 'User already exists'
    });
  }
  
  const user = {
    address,
    displayName: displayName || address.slice(0, 8),
    tier: UserTier.FREE,
    createdAt: Date.now(),
    alertCount: 0
  };
  
  users.set(address, user);
  
  logger.info('User registered', { address, displayName: user.displayName });
  
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
  
  const updates = req.body;
  const updatedUser = { ...user, ...updates };
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
  
  if (tier === undefined || tier < 0 || tier > 3) {
    return res.status(400).json({
      success: false,
      error: 'Invalid tier specified'
    });
  }
  
  const updatedUser = { ...user, tier };
  users.set(address, updatedUser);
  
  logger.info('User tier upgraded', { address, oldTier: user.tier, newTier: tier });
  
  res.json({
    success: true,
    user: updatedUser
  });
});

export default router;

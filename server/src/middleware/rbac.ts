import { Request, Response, NextFunction } from 'express';
import { UserTier } from '../services/tier';
import logger from '../utils/logger';

/**
 * Middleware to enforce role-based access control
 */
export const requireTier = (minTier: UserTier) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // In a real app, user info would be attached by an auth middleware (e.g. JWT)
    // For this context, we assume (req as any).user.tier exists
    const user = (req as any).user;

    if (!user) {
      logger.warn('RBAC: Unauthorized access attempt (no user)', { url: req.originalUrl });
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (user.tier < minTier) {
      logger.warn('RBAC: Forbidden access attempt (insufficient tier)', { 
        userId: user.address, 
        userTier: user.tier, 
        requiredTier: minTier 
      });
      return res.status(403).json({
        success: false,
        error: `Action restricted. Required tier: ${UserTier[minTier]}. Your tier: ${UserTier[user.tier]}`
      });
    }

    next();
  };
};

/**
 * Higher-order middleware for complex permission checks
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    // Simple logic: mapping tiers to permission sets
    const tierPermissions: Record<number, string[]> = {
      [UserTier.FREE]: ['read:alerts', 'read:stats'],
      [UserTier.PRO]: ['read:alerts', 'read:stats', 'create:alerts', 'read:whale-history'],
      [UserTier.WHALE]: ['read:alerts', 'read:stats', 'create:alerts', 'read:whale-history', 'api:access'],
    };

    const userPermissions = tierPermissions[user?.tier ?? UserTier.FREE] ?? [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `Permission denied: ${permission}`
      });
    }

    next();
  };
};

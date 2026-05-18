import { Router, Request, Response } from 'express';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import cache from '../services/cache';
import logger from '../utils/logger';
import { getTierLimits, UserTier } from '../services/tier';
import { randomUUID } from 'crypto';

const router = Router();

type TierRequest = Request & {
  user?: {
    tier?: UserTier;
  };
};

// Types
interface Alert {
  id: string;
  userId: string;
  name: string;
  alertType: number;
  threshold?: number;
  targetAddress?: string;
  webhookUrl?: string;
  enabled: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

interface CreateAlertRequest {
  name: string;
  alertType: number;
  threshold?: number;
  targetAddress?: string;
  webhookUrl?: string;
}

// In-memory store (replace with database in production)
const alerts: Map<string, Alert> = new Map();

// Alert type names
const alertTypeNames: Record<number, string> = {
  1: 'Whale Transfer',
  2: 'Contract Deploy',
  3: 'NFT Mint',
  4: 'Token Launch',
  5: 'Large Swap',
  6: 'Address Watch',
};

const VALID_ALERT_SORT_FIELDS = new Set(['createdAt', 'name', 'alertType', 'enabled', 'triggerCount']);
const VALID_SORT_ORDERS = new Set(['asc', 'desc']);

function parsePositiveInt(value: string | undefined, fallback: number, max?: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  if (typeof max === 'number') {
    return Math.min(parsed, max);
  }
  return parsed;
}

/**
 * GET /api/alerts
 * List all alerts for a user
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    // Check cache first
    const cacheKey = `alerts:${address}`;
    const cached = cache.get<Alert[]>(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        alerts: cached,
        fromCache: true,
      });
    }

    // Filter alerts by user
    let userAlerts = Array.from(alerts.values()).filter((alert) => alert.userId === address);

    // Pagination
    const page = parsePositiveInt(req.query.page as string | undefined, 1);
    const limit = parsePositiveInt(req.query.limit as string | undefined, 10, 100);
    const sortByInput = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'createdAt';
    const sortOrderInput = typeof req.query.sortOrder === 'string' ? req.query.sortOrder : 'desc';
    const sortBy = VALID_ALERT_SORT_FIELDS.has(sortByInput) ? sortByInput : 'createdAt';
    const sortOrder = VALID_SORT_ORDERS.has(sortOrderInput) ? sortOrderInput : 'desc';

    // Apply sorting
    userAlerts.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'alertType':
          aVal = a.alertType;
          bVal = b.alertType;
          break;
        case 'enabled':
          aVal = a.enabled ? 1 : 0;
          bVal = b.enabled ? 1 : 0;
          break;
        case 'triggerCount':
          aVal = a.triggerCount;
          bVal = b.triggerCount;
          break;
        default:
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    // Calculate pagination
    const total = userAlerts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAlerts = userAlerts.slice(startIndex, endIndex);

    // Cache for 1 minute
    cache.set(cacheKey, paginatedAlerts, 60000);

    res.json({
      success: true,
      alerts: paginatedAlerts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  })
);

/**
 * GET /api/alerts/:id
 * Get a specific alert
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const alert = alerts.get(id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    res.json({
      success: true,
      alert,
    });
  })
);

/**
 * POST /api/alerts
 * Create a new alert
 */
router.post(
  '/',
  validateBody(schemas.createAlert),
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.query;
    const body = req.body as CreateAlertRequest;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    // Count existing alerts
    const existingCount = Array.from(alerts.values())
      .filter(a => a.userId === address).length;

    // Check alert limits based on user tier
    // In a real app, we'd fetch the user's tier from the database
    const userTier = (req as TierRequest).user?.tier ?? UserTier.FREE;
    const limits = getTierLimits(userTier);

    if (existingCount >= limits.maxAlerts) {
      return res.status(403).json({
        success: false,
        error: `Alert limit reached for your tier (${limits.maxAlerts}). Upgrade to create more alerts.`,
      });
    }

    // Create alert
    const alert: Alert = {
      id: `alert-${randomUUID()}`,
      userId: address,
      name: body.name,
      alertType: body.alertType,
      threshold: body.threshold,
      targetAddress: body.targetAddress,
      webhookUrl: body.webhookUrl,
      enabled: true,
      createdAt: new Date(),
      triggerCount: 0,
    };

    alerts.set(alert.id, alert);

    logger.info('Alert created', { 
      address, 
      alertId: alert.id, 
      type: alertTypeNames[body.alertType] 
    });

    // Invalidate cache
    cache.delete(`alerts:${address}`);

    res.status(201).json({
      success: true,
      alert,
      message: `${alertTypeNames[body.alertType]} alert created successfully`,
    });
  })
);

/**
 * PATCH /api/alerts/:id
 * Update an alert
 */
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { address } = req.query;
    const updates = req.body as Partial<
      Pick<Alert, 'name' | 'threshold' | 'targetAddress' | 'webhookUrl' | 'enabled'>
    >;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const alert = alerts.get(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    // Check ownership
    if (alert.userId !== address) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this alert',
      });
    }

    // Apply updates (only allowed fields)
    if (typeof updates.name === 'string') {
      alert.name = updates.name;
    }
    if (typeof updates.threshold === 'number') {
      alert.threshold = updates.threshold;
    }
    if (typeof updates.targetAddress === 'string' || updates.targetAddress === undefined) {
      alert.targetAddress = updates.targetAddress;
    }
    if (typeof updates.webhookUrl === 'string' || updates.webhookUrl === undefined) {
      alert.webhookUrl = updates.webhookUrl;
    }
    if (typeof updates.enabled === 'boolean') {
      alert.enabled = updates.enabled;
    }

    alerts.set(id, alert);

    // Invalidate cache
    cache.delete(`alerts:${address}`);

    res.json({
      success: true,
      alert,
    });
  })
);

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const alert = alerts.get(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    // Check ownership
    if (alert.userId !== address) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this alert',
      });
    }

    alerts.delete(id);

    logger.info('Alert deleted', { address, alertId: id });

    // Invalidate cache
    cache.delete(`alerts:${address}`);

    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  })
);

/**
 * POST /api/alerts/:id/toggle
 * Enable/disable an alert
 */
router.post(
  '/:id/toggle',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const alert = alerts.get(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    // Check ownership
    if (alert.userId !== address) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this alert',
      });
    }

    alert.enabled = !alert.enabled;
    alerts.set(id, alert);

    logger.info('Alert toggled', { address, alertId: id, enabled: alert.enabled });

    // Invalidate cache
    cache.delete(`alerts:${address}`);

    res.json({
      success: true,
      alert,
      message: alert.enabled ? 'Alert enabled' : 'Alert disabled',
    });
  })
);

/**
 * GET /api/alerts/stats/summary
 * Get alert statistics
 */
router.get(
  '/stats/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const userAlerts = Array.from(alerts.values())
      .filter(alert => alert.userId === address);

    const stats = {
      total: userAlerts.length,
      active: userAlerts.filter(a => a.enabled).length,
      totalTriggers: userAlerts.reduce((sum, a) => sum + a.triggerCount, 0),
      byType: {} as Record<string, number>,
    };

    // Count by type
    for (const alert of userAlerts) {
      const typeName = alertTypeNames[alert.alertType] || 'Unknown';
      stats.byType[typeName] = (stats.byType[typeName] ?? 0) + 1;
    }

    res.json({
      success: true,
      stats,
    });
  })
);

export default router;

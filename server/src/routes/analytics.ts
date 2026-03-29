import { Router, Request, Response } from 'express';
import { trackEvent } from '../services/analytics';

const router = Router();

/**
 * GET /api/analytics
 * Get analytics data
 */
router.get('/', (req: Request, res: Response) => {
  // Return analytics data
  res.json({
    success: true,
    data: {
      totalAlerts: 0,
      activeAlerts: 0,
      totalTriggers: 0,
      recentActivity: []
    }
  });
});

/**
 * GET /api/analytics/summary
 * Get analytics summary
 */
router.get('/summary', (req: Request, res: Response) => {
  res.json({
    success: true,
    summary: {
      alerts: {
        total: 0,
        active: 0,
        triggers: 0
      },
      users: {
        total: 0,
        active: 0
      },
      revenue: {
        total: 0,
        monthly: 0
      }
    }
  });
});

/**
 * POST /api/analytics/track
 * Track an analytics event
 */
router.post('/track', (req: Request, res: Response) => {
  const { eventType, metadata } = req.body;
  const address = req.headers['x-user-address'] as string;

  if (!eventType || typeof eventType !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'eventType is required',
    });
  }
  if (metadata != null && typeof metadata !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'metadata must be an object',
    });
  }
  
  // In a real app, fetch tier from user store
  const tier = 0; // Default to FREE

  trackEvent(eventType, metadata, address, tier);
  
  res.json({
    success: true,
    message: 'Event tracked'
  });
});

export default router;

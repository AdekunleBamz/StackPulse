import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { cache } from '../services/cache';
import { getStats as getWSStats } from '../services/websocket';

const router = Router();

// Types
interface AnalyticsData {
  users: {
    total: number;
    active24h: number;
    newToday: number;
    byTier: Record<string, number>;
  };
  alerts: {
    total: number;
    active: number;
    triggered24h: number;
    byType: Record<string, number>;
  };
  events: {
    total24h: number;
    whaleTransfers: number;
    contractDeploys: number;
    nftMints: number;
    tokenLaunches: number;
    largeSwaps: number;
  };
  revenue: {
    total: number;
    monthly: number;
    subscriptions: number;
  };
}

// Simulated analytics data (replace with database queries)
const mockAnalytics: AnalyticsData = {
  users: {
    total: 1247,
    active24h: 342,
    newToday: 28,
    byTier: {
      Free: 980,
      Pro: 215,
      Premium: 52,
    },
  },
  alerts: {
    total: 4892,
    active: 3567,
    triggered24h: 847,
    byType: {
      'Whale Transfer': 1823,
      'Contract Deploy': 456,
      'NFT Mint': 1234,
      'Token Launch': 298,
      'Large Swap': 654,
      'Address Watch': 427,
    },
  },
  events: {
    total24h: 12456,
    whaleTransfers: 234,
    contractDeploys: 56,
    nftMints: 1892,
    tokenLaunches: 12,
    largeSwaps: 456,
  },
  revenue: {
    total: 125000000, // 125 STX in microSTX
    monthly: 45000000, // 45 STX
    subscriptions: 267,
  },
};

/**
 * GET /api/analytics/overview
 * Get analytics overview
 */
router.get(
  '/overview',
  asyncHandler(async (req: Request, res: Response) => {
    // Check cache
    const cacheKey = 'analytics:overview';
    const cached = cache.get<AnalyticsData>(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        fromCache: true,
      });
    }

    // In production, fetch from database
    const data = {
      ...mockAnalytics,
      // Add some random variance for demo
      users: {
        ...mockAnalytics.users,
        active24h: mockAnalytics.users.active24h + Math.floor(Math.random() * 50),
      },
      events: {
        ...mockAnalytics.events,
        total24h: mockAnalytics.events.total24h + Math.floor(Math.random() * 500),
      },
    };

    // Cache for 5 minutes
    cache.set(cacheKey, data, 300000);

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * GET /api/analytics/events
 * Get event analytics with time series
 */
router.get(
  '/events',
  asyncHandler(async (req: Request, res: Response) => {
    const { period = '24h' } = req.query;

    // Generate time series data
    const hours = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const interval = period === '24h' ? 1 : period === '7d' ? 6 : 24;
    const points = hours / interval;

    const timeSeries = [];
    const now = new Date();

    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * interval * 60 * 60 * 1000);
      timeSeries.push({
        timestamp: timestamp.toISOString(),
        whaleTransfers: Math.floor(Math.random() * 20) + 5,
        contractDeploys: Math.floor(Math.random() * 5),
        nftMints: Math.floor(Math.random() * 100) + 20,
        tokenLaunches: Math.floor(Math.random() * 2),
        largeSwaps: Math.floor(Math.random() * 30) + 10,
      });
    }

    res.json({
      success: true,
      period,
      data: {
        timeSeries,
        totals: mockAnalytics.events,
      },
    });
  })
);

/**
 * GET /api/analytics/users
 * Get user analytics
 */
router.get(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    const { period = '7d' } = req.query;

    // Generate user growth data
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const growthData = [];
    const now = new Date();
    let total = mockAnalytics.users.total - days * 20; // Backtrack

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const newUsers = Math.floor(Math.random() * 30) + 10;
      total += newUsers;
      growthData.push({
        date: date.toISOString().split('T')[0],
        totalUsers: total,
        newUsers,
        activeUsers: Math.floor(total * (0.2 + Math.random() * 0.1)),
      });
    }

    res.json({
      success: true,
      period,
      data: {
        current: mockAnalytics.users,
        growth: growthData,
        retention: {
          day1: 0.72,
          day7: 0.45,
          day30: 0.28,
        },
      },
    });
  })
);

/**
 * GET /api/analytics/alerts
 * Get alert analytics
 */
router.get(
  '/alerts',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        overview: mockAnalytics.alerts,
        performance: {
          avgResponseTime: 1.2, // seconds
          successRate: 0.998,
          falsePositiveRate: 0.02,
        },
        popular: [
          { type: 'Whale Transfer', count: 1823, triggerRate: 0.15 },
          { type: 'NFT Mint', count: 1234, triggerRate: 0.45 },
          { type: 'Large Swap', count: 654, triggerRate: 0.22 },
          { type: 'Contract Deploy', count: 456, triggerRate: 0.08 },
          { type: 'Address Watch', count: 427, triggerRate: 0.35 },
          { type: 'Token Launch', count: 298, triggerRate: 0.05 },
        ],
      },
    });
  })
);

/**
 * GET /api/analytics/revenue
 * Get revenue analytics (admin only)
 */
router.get(
  '/revenue',
  asyncHandler(async (req: Request, res: Response) => {
    // In production, add admin authentication
    
    const days = 30;
    const revenueData = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      revenueData.push({
        date: date.toISOString().split('T')[0],
        subscriptions: Math.floor(Math.random() * 5) + 1,
        revenue: (Math.floor(Math.random() * 50) + 10) * 1000000, // in microSTX
      });
    }

    res.json({
      success: true,
      data: {
        overview: mockAnalytics.revenue,
        daily: revenueData,
        breakdown: {
          pro: mockAnalytics.revenue.total * 0.4,
          premium: mockAnalytics.revenue.total * 0.6,
        },
      },
    });
  })
);

/**
 * GET /api/analytics/realtime
 * Get real-time stats
 */
router.get(
  '/realtime',
  asyncHandler(async (req: Request, res: Response) => {
    const wsStats = getWSStats();

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        websocket: wsStats,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
        recent: {
          eventsLastMinute: Math.floor(Math.random() * 50) + 10,
          alertsLastMinute: Math.floor(Math.random() * 20) + 5,
          apiRequestsLastMinute: Math.floor(Math.random() * 200) + 50,
        },
      },
    });
  })
);

/**
 * GET /api/analytics/leaderboard
 * Get various leaderboards
 */
router.get(
  '/leaderboard',
  asyncHandler(async (req: Request, res: Response) => {
    const { type = 'alerts' } = req.query;

    // Mock leaderboard data
    const leaderboards: Record<string, any[]> = {
      alerts: [
        { rank: 1, address: 'SP1A2B...XY3Z', alerts: 47, tier: 'Premium' },
        { rank: 2, address: 'SP3C4D...UV5W', alerts: 38, tier: 'Premium' },
        { rank: 3, address: 'SP5E6F...ST7R', alerts: 32, tier: 'Pro' },
        { rank: 4, address: 'SP7G8H...QP9O', alerts: 28, tier: 'Pro' },
        { rank: 5, address: 'SP9I0J...NM1L', alerts: 25, tier: 'Premium' },
      ],
      referrals: [
        { rank: 1, address: 'SP2B3C...WX4Y', referrals: 23, earnings: 115000000 },
        { rank: 2, address: 'SP4D5E...UV6W', referrals: 18, earnings: 90000000 },
        { rank: 3, address: 'SP6F7G...ST8R', referrals: 14, earnings: 70000000 },
        { rank: 4, address: 'SP8H9I...QP0O', referrals: 11, earnings: 55000000 },
        { rank: 5, address: 'SP0J1K...NM2L', referrals: 9, earnings: 45000000 },
      ],
      badges: [
        { rank: 1, address: 'SP3C4D...UV5W', badges: 8, rarest: 'StackPulse OG' },
        { rank: 2, address: 'SP1A2B...XY3Z', badges: 7, rarest: 'Early Adopter' },
        { rank: 3, address: 'SP5E6F...ST7R', badges: 6, rarest: 'Bug Hunter' },
        { rank: 4, address: 'SP7G8H...QP9O', badges: 5, rarest: 'Year One' },
        { rank: 5, address: 'SP9I0J...NM1L', badges: 5, rarest: 'Power User' },
      ],
    };

    res.json({
      success: true,
      type,
      data: leaderboards[type as string] || leaderboards.alerts,
    });
  })
);

export default router;

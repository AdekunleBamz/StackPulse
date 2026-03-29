/**
 * Health Check Service
 * Monitors system health and resource usage
 */

import logger from '../utils/logger';
import os from 'os';

interface SystemHealth {
  status: 'ok' | 'degraded' | 'critical';
  uptime: number;
  memory: {
    free: number;
    total: number;
    usagePercent: number;
  };
  cpu: {
    loadAvg: number[];
  };
  components: {
    [key: string]: { status: 'up' | 'down'; details?: unknown };
  };
  timestamp: number;
}

class HealthService {
  /**
   * Get system health metrics
   */
  getHealth(): SystemHealth {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    const health: SystemHealth = {
      status: usagePercent > 90 ? 'degraded' : 'ok',
      uptime: os.uptime(),
      memory: {
        free: freeMemory,
        total: totalMemory,
        usagePercent
      },
      cpu: {
        loadAvg: os.loadavg()
      },
      components: {
        database: { status: 'up' },
        cache: { status: 'up' },
        notifications: { status: 'up' }
      },
      timestamp: Date.now()
    };

    if (usagePercent > 95) {
      health.status = 'critical';
      logger.error('System memory usage critical', { usagePercent });
    }

    return health;
  }
}

export default new HealthService();

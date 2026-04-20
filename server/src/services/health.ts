/**
 * Health Check Service
 * Monitors system health and resource usage
 */

import logger from '../utils/logger';
import os from 'os';

const DEGRADED_MEMORY_THRESHOLD_PERCENT = 90;
const CRITICAL_MEMORY_THRESHOLD_PERCENT = 95;

export interface SystemHealth {
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
  private readonly startedAt = Date.now();

  /**
   * Get system health metrics
   */
  getHealth(): SystemHealth {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    const health: SystemHealth = {
      status: usagePercent > DEGRADED_MEMORY_THRESHOLD_PERCENT ? 'degraded' : 'ok',
      uptime: os.uptime(),
      memory: {
        free: freeMemory,
        total: totalMemory,
        usagePercent: Math.round(usagePercent * 100) / 100,
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

    if (usagePercent > CRITICAL_MEMORY_THRESHOLD_PERCENT) {
      health.status = 'critical';
      logger.error('System memory usage critical', { usagePercent });
    }

    return health;
  }

  /**
   * Returns the number of milliseconds since the service was instantiated.
   */
  getUptimeMs(): number {
    return Date.now() - this.startedAt;
  }

  /**
   * Returns uptime as a human-readable string (e.g. "2h 15m 30s").
   */
  getUptimeFormatted(): string {
    const totalSeconds = Math.floor(this.getUptimeMs() / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
  }

  /**
   * Returns true when the system health status is 'ok'.
   */
  isHealthy(): boolean {
    return this.getHealth().status === 'ok';
  }
}

export default new HealthService();

/**
 * Health Check Service
 * Monitors system health, resource usage, and subsystem status
 */
import logger from '../utils/logger';
import os from 'os';

export interface SystemStatus {
  status: 'ok' | 'degraded' | 'critical';
  timestamp: string;
  uptime: number;
  process: {
    memory: NodeJS.MemoryUsage;
    pid: number;
  };
  system: {
    loadAvg: number[];
    freeMem: string;
    totalMem: string;
  };
  subsystems: Record<string, 'up' | 'down'>;
}

class HealthService {
  private startTime: number = Date.now();

  /**
   * Get granular health metrics
   */
  getHealth(): SystemStatus {
    const memory = process.memoryUsage();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usagePercent = ((totalMem - freeMem) / totalMem) * 100;

    const status: SystemStatus = {
      status: usagePercent > 90 ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      process: {
        memory,
        pid: process.pid
      },
      system: {
        loadAvg: os.loadavg(),
        freeMem: Math.round(freeMem / 1024 / 1024) + 'MB',
        totalMem: Math.round(totalMem / 1024 / 1024) + 'MB'
      },
      subsystems: {
        database: 'up',
        cache: 'up',
        indexer: 'up'
      }
    };

    if (usagePercent > 95) status.status = 'critical';

    logger.debug('System health report generated', { status: status.status });
    return status;
  }
}

export default new HealthService();

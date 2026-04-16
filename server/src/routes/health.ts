import { Router, Request, Response } from 'express';
import os from 'os';
import logger from '../utils/logger';
import HealthService from '../services/health';

const router = Router();

router.use((req: Request, res: Response, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: {
    memory: { status: 'ok' | 'warning' | 'error'; usage: number };
    cpu: { status: 'ok' | 'warning' | 'error'; load: number[] };
  };
}

/**
 * GET /health
 * Basic health check
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? 'unknown',
  });
});

/**
 * GET /health/ready
 * Readiness check - can the service handle requests?
 */
router.get('/ready', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  // Check if memory usage is too high
  if (heapUsedPercent > 90) {
    logger.warn('Readiness check failed: high memory usage', { heapUsedPercent: heapUsedPercent.toFixed(2) });
    return res.status(503).json({
      status: 'not_ready',
      reason: 'high_memory_usage',
      memory: {
        heapUsedPercent: heapUsedPercent.toFixed(2)
      }
    });
  }
  
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/live
 * Liveness check - is the service running?
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /health/full
 * Detailed health check with all metrics
 */
router.get('/full', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const loadAvg = os.loadavg();
  const cpuCount = Math.max(1, os.cpus().length);
  
  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (heapUsedPercent > 90 || loadAvg[0] > cpuCount * 0.8) {
    status = 'unhealthy';
  } else if (heapUsedPercent > 70 || loadAvg[0] > cpuCount * 0.5) {
    status = 'degraded';
  }
  
  const healthCheck: HealthCheckResult = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      memory: {
        status: heapUsedPercent > 90 ? 'error' : heapUsedPercent > 70 ? 'warning' : 'ok',
        usage: heapUsedPercent
      },
      cpu: {
        status: loadAvg[0] > cpuCount * 0.8 ? 'error' : loadAvg[0] > cpuCount * 0.5 ? 'warning' : 'ok',
        load: loadAvg
      }
    }
  };
  
  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

/**
 * GET /health/system
 * Advanced system metrics from HealthService
 */
router.get('/system', (req: Request, res: Response) => {
  const systemHealth = HealthService.getHealth();
  res.json(systemHealth);
});

export default router;

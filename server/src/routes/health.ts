import { Router, Request, Response } from 'express';
import os from 'os';
import { getStats as getWSStats } from '../services/websocket';
import { cache } from '../services/cache';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      latency?: number;
      message?: string;
    };
  };
}

const startTime = Date.now();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check critical dependencies
    const checks = await performHealthChecks();
    const isReady = Object.values(checks).every(c => c.status !== 'fail');
    
    if (isReady) {
      res.status(200).json({ status: 'ready', checks });
    } else {
      res.status(503).json({ status: 'not ready', checks });
    }
  } catch (error) {
    res.status(503).json({ status: 'error', error: (error as Error).message });
  }
});

/**
 * GET /health/detailed
 * Detailed health status with all checks
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const checks = await performHealthChecks();
    const failedChecks = Object.values(checks).filter(c => c.status === 'fail').length;
    const warnChecks = Object.values(checks).filter(c => c.status === 'warn').length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (failedChecks > 0) status = 'unhealthy';
    else if (warnChecks > 0) status = 'degraded';
    
    const health: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    };
    
    const statusCode = status === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /health/metrics
 * Prometheus-compatible metrics
 */
router.get('/metrics', (req: Request, res: Response) => {
  const wsStats = getWSStats();
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const cacheStats = cache.getStats();
  
  const metrics = [
    // Process metrics
    `# HELP process_uptime_seconds Process uptime in seconds`,
    `# TYPE process_uptime_seconds gauge`,
    `process_uptime_seconds ${Math.floor((Date.now() - startTime) / 1000)}`,
    
    `# HELP process_memory_heap_used_bytes Process heap memory used`,
    `# TYPE process_memory_heap_used_bytes gauge`,
    `process_memory_heap_used_bytes ${memUsage.heapUsed}`,
    
    `# HELP process_memory_heap_total_bytes Process total heap memory`,
    `# TYPE process_memory_heap_total_bytes gauge`,
    `process_memory_heap_total_bytes ${memUsage.heapTotal}`,
    
    `# HELP process_memory_rss_bytes Process resident set size`,
    `# TYPE process_memory_rss_bytes gauge`,
    `process_memory_rss_bytes ${memUsage.rss}`,
    
    // WebSocket metrics
    `# HELP websocket_connections_total Total WebSocket connections`,
    `# TYPE websocket_connections_total gauge`,
    `websocket_connections_total ${wsStats.totalClients}`,
    
    `# HELP websocket_authenticated_connections Authenticated WebSocket connections`,
    `# TYPE websocket_authenticated_connections gauge`,
    `websocket_authenticated_connections ${wsStats.authenticatedClients}`,
    
    // Cache metrics
    `# HELP cache_hits_total Total cache hits`,
    `# TYPE cache_hits_total counter`,
    `cache_hits_total ${cacheStats.hits}`,
    
    `# HELP cache_misses_total Total cache misses`,
    `# TYPE cache_misses_total counter`,
    `cache_misses_total ${cacheStats.misses}`,
    
    `# HELP cache_size_items Current cache size in items`,
    `# TYPE cache_size_items gauge`,
    `cache_size_items ${cacheStats.size}`,
  ].join('\n');
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

/**
 * GET /health/system
 * System information
 */
router.get('/system', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    cpus: os.cpus().length,
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      process: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
      },
    },
    loadAvg: os.loadavg(),
    uptime: {
      system: os.uptime(),
      process: process.uptime(),
    },
  });
});

/**
 * Perform all health checks
 */
async function performHealthChecks(): Promise<HealthStatus['checks']> {
  const checks: HealthStatus['checks'] = {};
  
  // Check Stacks API
  checks.stacksApi = await checkStacksApi();
  
  // Check cache
  checks.cache = checkCache();
  
  // Check WebSocket
  checks.websocket = checkWebSocket();
  
  // Check memory
  checks.memory = checkMemory();
  
  // Check disk (if applicable)
  checks.disk = checkDisk();
  
  return checks;
}

async function checkStacksApi(): Promise<{ status: 'pass' | 'fail' | 'warn'; latency?: number; message?: string }> {
  const start = Date.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.mainnet.hiro.so/v2/info', {
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    const latency = Date.now() - start;
    
    if (response.ok) {
      return { status: latency > 2000 ? 'warn' : 'pass', latency };
    }
    
    return { status: 'fail', latency, message: `Status: ${response.status}` };
  } catch (error) {
    return { status: 'fail', message: (error as Error).message };
  }
}

function checkCache(): { status: 'pass' | 'fail' | 'warn'; message?: string } {
  try {
    const testKey = '__health_check__';
    cache.set(testKey, 'test', 1000);
    const value = cache.get<string>(testKey);
    cache.delete(testKey);
    
    if (value === 'test') {
      return { status: 'pass' };
    }
    return { status: 'fail', message: 'Cache read/write failed' };
  } catch (error) {
    return { status: 'fail', message: (error as Error).message };
  }
}

function checkWebSocket(): { status: 'pass' | 'fail' | 'warn'; message?: string } {
  const stats = getWSStats();
  
  // Warn if more than 1000 connections
  if (stats.totalClients > 1000) {
    return { status: 'warn', message: `High connection count: ${stats.totalClients}` };
  }
  
  return { status: 'pass', message: `${stats.totalClients} clients connected` };
}

function checkMemory(): { status: 'pass' | 'fail' | 'warn'; message?: string } {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  if (heapUsedPercent > 90) {
    return { status: 'fail', message: `Heap usage critical: ${heapUsedPercent.toFixed(1)}%` };
  }
  if (heapUsedPercent > 75) {
    return { status: 'warn', message: `Heap usage high: ${heapUsedPercent.toFixed(1)}%` };
  }
  
  return { status: 'pass', message: `Heap usage: ${heapUsedPercent.toFixed(1)}%` };
}

function checkDisk(): { status: 'pass' | 'fail' | 'warn'; message?: string } {
  // Simplified disk check - in production, use a proper disk check library
  try {
    const freeMemPercent = (os.freemem() / os.totalmem()) * 100;
    
    if (freeMemPercent < 10) {
      return { status: 'warn', message: `Low system memory: ${freeMemPercent.toFixed(1)}% free` };
    }
    
    return { status: 'pass' };
  } catch (error) {
    return { status: 'pass', message: 'Disk check skipped' };
  }
}

export default router;

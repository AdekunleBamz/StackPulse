import { Router, Request, Response } from 'express';
import os from 'os';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

type TierRequest = Request & {
  user?: {
    tier?: number;
  };
};

// Tiered rate limiter for metrics ingestion
const metricsLimiter = rateLimiter({
  windowMs: 60000,
  maxRequests: 10, // Default
  maxRequestsGenerator: (req) => {
    const userTier = (req as TierRequest).user?.tier ?? 0;
    const limits = [10, 100, 500, 2000];
    const safeTier = Number.isInteger(userTier) && userTier >= 0 ? userTier : 0;
    return limits[safeTier] || 10;
  }
});

interface MetricsData {
  server: {
    uptime: number;
    timestamp: string;
    version: string;
  };
  system: {
    cpu: {
      cores: number;
      loadAverage: number[];
    };
    memory: {
      total: number;
      free: number;
      used: number;
      usagePercent: number;
    };
    process: {
      memory: {
        heapTotal: number;
        heapUsed: number;
        rss: number;
      };
    };
  };
  requests: {
    total: number;
    byEndpoint: Record<string, number>;
  };
}

// In-memory request counter
let totalRequests = 0;
const requestsByEndpoint: Record<string, number> = {};

// Track requests
router.use((req: Request, res: Response, next) => {
  totalRequests++;
  const endpoint = req.path;
  requestsByEndpoint[endpoint] = (requestsByEndpoint[endpoint] ?? 0) + 1;
  next();
});

// Apply route-level rate limiting for all metrics endpoints.
router.use(metricsLimiter);

/**
 * GET /api/metrics
 * Get server and system metrics
 */
router.get('/', (req: Request, res: Response) => {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = process.memoryUsage();
  
  const metrics: MetricsData = {
    server: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    },
    system: {
      cpu: {
        cores: cpus.length,
        loadAverage: os.loadavg()
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usagePercent: (usedMemory / totalMemory) * 100
      },
      process: {
        memory: {
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          rss: memoryUsage.rss
        }
      }
    },
    requests: {
      total: totalRequests,
      byEndpoint: { ...requestsByEndpoint }
    }
  };
  
  res.json({
    success: true,
    metrics
  });
});

/**
 * GET /api/metrics/prometheus
 * Get metrics in Prometheus format
 */
router.get('/prometheus', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const cpus = os.cpus();
  
  let output = '';
  
  // Server metrics
  output += `# HELP server_uptime Server uptime in seconds\n`;
  output += `# TYPE server_uptime gauge\n`;
  output += `server_uptime ${process.uptime()}\n`;
  
  // Memory metrics
  output += `# HELP process_resident_memory Resident set memory in bytes\n`;
  output += `# TYPE process_resident_memory gauge\n`;
  output += `process_resident_memory ${memUsage.rss}\n`;
  
  output += `# HELP process_heap_used Heap memory used in bytes\n`;
  output += `# TYPE process_heap_used gauge\n`;
  output += `process_heap_used ${memUsage.heapUsed}\n`;
  
  output += `# HELP process_heap_total Heap memory total in bytes\n`;
  output += `# TYPE process_heap_total gauge\n`;
  output += `process_heap_total ${memUsage.heapTotal}\n`;
  
  // CPU metrics
  output += `# HELP system_cpu_load System CPU load average\n`;
  output += `# TYPE system_cpu_load gauge\n`;
  os.loadavg().forEach((load, i) => {
    output += `system_cpu_load{interval="${i === 0 ? '1m' : i === 1 ? '5m' : '15m'}'} ${load}\n`;
  });
  
  output += `# HELP system_cpu_cores Number of CPU cores\n`;
  output += `# TYPE system_cpu_cores gauge\n`;
  output += `system_cpu_cores ${cpus.length}\n`;
  
  // Request metrics
  output += `# HELP http_requests_total Total HTTP requests\n`;
  output += `# TYPE http_requests_total counter\n`;
  output += `http_requests_total ${totalRequests}\n`;
  
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(output);
});

/**
 * GET /api/metrics/health
 * Quick health check for load balancers
 */
router.get('/health', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  // Check if memory usage is too high
  if (heapUsedPercent > 90) {
    return res.status(503).json({
      status: 'unhealthy',
      reason: 'high_memory_usage',
      memory: {
        heapUsedPercent: heapUsedPercent.toFixed(2)
      }
    });
  }
  
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default router;

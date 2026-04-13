/**
 * Request Logger Middleware
 * Logs all HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import MetricsService from '../services/metrics';
import { randomUUID } from 'crypto';

export interface RequestLogOptions {
  logBody?: boolean;
  logHeaders?: boolean;
  excludePaths?: string[];
}

const defaultOptions: RequestLogOptions = {
  logBody: false,
  logHeaders: false,
  excludePaths: ['/health', '/health/ready', '/health/live']
};

function getLogLevel(statusCode: number): 'error' | 'warn' | 'info' {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
}

/**
 * Request logger middleware
 */
export function requestLogger(options: RequestLogOptions = defaultOptions) {
  const { logBody, logHeaders, excludePaths } = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (excludePaths && excludePaths.includes(req.path)) {
      return next();
    }

    const startTime = process.hrtime.bigint();
    const requestId = randomUUID();
    
    // Attach requestId to request object for use in other logs
    (req as any).id = requestId;
    
    const queryData = Object.keys(req.query).length > 0 ? req.query : undefined;

    // Log request
    logger.info('Incoming request', {
      requestId,
      method: req.method,
      path: req.path,
      ...(queryData ? { query: queryData } : {}),
      ip: req.ip,
      userAgent: req.get('user-agent'),
      referer: req.get('referer'),
      ...(logHeaders ? { headers: req.headers } : {}),
      ...(logBody ? { body: req.body } : {}),
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (body: unknown) {
      const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
      const duration = durationMs.toFixed(2);
      
      const logLevel = getLogLevel(res.statusCode);
      
      MetricsService.recordMetric('http_request_duration', durationMs, {
        method: req.method,
        path: req.baseUrl + req.path,
        status: res.statusCode.toString()
      });

      logger.log(logLevel, 'Request completed', {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });

      return originalSend.call(this, body);
    };

    next();
  };
}

export default requestLogger;

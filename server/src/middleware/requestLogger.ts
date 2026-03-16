/**
 * Request Logger Middleware
 * Logs all HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import MetricsService from '../services/metrics';

export interface RequestLogOptions {
  logBody?: boolean;
  logHeaders?: boolean;
  excludePaths?: string[];
}

const defaultOptions: RequestLogOptions = {
  logBody: false,
  logHeaders: false,
  excludePaths: ['/health', '/health/ready', '/health/live', '/health/full']
};

const HTTP_SERVER_ERROR_THRESHOLD = 500;
const HTTP_CLIENT_ERROR_THRESHOLD = 400;

function getLogLevel(statusCode: number): 'error' | 'warn' | 'info' {
  if (statusCode >= HTTP_SERVER_ERROR_THRESHOLD) return 'error';
  if (statusCode >= HTTP_CLIENT_ERROR_THRESHOLD) return 'warn';
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

    const startTime = process.hrtime();
    const requestId = Math.random().toString(36).substring(7);

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
    res.send = function (body: any) {
      const diff = process.hrtime(startTime);
      const duration = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
      
      const logLevel = getLogLevel(res.statusCode);
      
      MetricsService.recordMetric('http_request_duration', parseFloat(duration), {
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

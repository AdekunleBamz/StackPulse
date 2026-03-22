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
  excludePaths: ['/health', '/health/ready', '/health/live']
};

/**
 * Request logger middleware
 */
export function requestLogger(options: RequestLogOptions = defaultOptions) {
  const { logBody, logHeaders, excludePaths } = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    if (excludePaths && excludePaths.includes(req.path)) return next();

    const startTime = process.hrtime();
    const requestId = req.get('X-Request-ID') || Math.random().toString(36).substring(7);

    // Set request ID for downstream usage and client correlation
    res.setHeader('X-Request-ID', requestId);
    (req as any).requestId = requestId;

    logger.debug(`${req.method} ${req.path} [START]`, { requestId });

    const originalSend = res.send;
    res.send = function (body: any) {
      const diff = process.hrtime(startTime);
      const duration = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
      
      const statusCode = res.statusCode;
      const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
      
      MetricsService.recordMetric('http_request_duration', parseFloat(duration), {
        method: req.method,
        path: req.baseUrl + req.path,
        status: statusCode.toString()
      });

      logger.log(level, `${req.method} ${req.path} [DONE]`, {
        requestId,
        statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });

      return originalSend.call(this, body);
    };

    next();
  };
}

export default requestLogger;

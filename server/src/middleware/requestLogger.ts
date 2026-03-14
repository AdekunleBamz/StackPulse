/**
 * Request Logger Middleware
 * Logs all HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

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
    // Skip excluded paths
    if (excludePaths && excludePaths.includes(req.path)) {
      return next();
    }

    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    // Log request
    logger.info('Incoming request', {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (body: any) {
      const duration = Date.now() - startTime;
      
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      
      logger.log(level, 'Request completed', {
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

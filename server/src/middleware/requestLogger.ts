/**
 * Request Logger Middleware
 * Logs all incoming requests with timing information
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger, format, transports } from 'winston';
import { randomUUID } from 'crypto';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} ${level}: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
});

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

interface RequestLogData {
  requestId: string;
  method: string;
  path: string;
  query: Record<string, any>;
  ip: string;
  userAgent: string;
  contentLength?: number;
  referer?: string;
}

interface ResponseLogData extends RequestLogData {
  statusCode: number;
  duration: number;
  contentType?: string;
}

// Paths to exclude from logging
const excludePaths = [
  '/health',
  '/favicon.ico',
  '/robots.txt',
];

// Determine if path should be logged
function shouldLog(path: string): boolean {
  return !excludePaths.some(p => path.startsWith(p));
}

// Get color based on status code
function getStatusColor(status: number): string {
  if (status >= 500) return '\x1b[31m'; // Red
  if (status >= 400) return '\x1b[33m'; // Yellow
  if (status >= 300) return '\x1b[36m'; // Cyan
  if (status >= 200) return '\x1b[32m'; // Green
  return '\x1b[0m'; // Reset
}

/**
 * Request logger middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Skip excluded paths
  if (!shouldLog(req.path)) {
    return next();
  }

  // Generate unique request ID
  req.requestId = randomUUID().slice(0, 8);
  req.startTime = Date.now();

  // Set request ID header for tracing
  res.setHeader('X-Request-ID', req.requestId);

  // Log request
  const requestData: RequestLogData = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query as Record<string, any>,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    contentLength: parseInt(req.get('content-length') || '0', 10) || undefined,
    referer: req.get('referer'),
  };

  logger.debug('Incoming request', requestData);

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());
    
    const responseData: ResponseLogData = {
      ...requestData,
      statusCode: res.statusCode,
      duration,
      contentType: res.get('content-type'),
    };

    // Log level based on status
    if (res.statusCode >= 500) {
      logger.error('Request completed', responseData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed', responseData);
    } else {
      logger.info('Request completed', responseData);
    }
  });

  next();
}

/**
 * Simple request logger (one-line format)
 */
export function simpleRequestLogger(req: Request, res: Response, next: NextFunction): void {
  if (!shouldLog(req.path)) {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const color = getStatusColor(status);
    const reset = '\x1b[0m';

    console.log(
      `${color}${status}${reset} ${req.method} ${req.path} - ${duration}ms`
    );
  });

  next();
}

/**
 * Get request context for logging
 */
export function getRequestContext(req: Request): { requestId: string; path: string } {
  return {
    requestId: req.requestId || 'unknown',
    path: req.path,
  };
}

export default requestLogger;

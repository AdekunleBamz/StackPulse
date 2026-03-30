import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Request timeout middleware
 */
const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

export function requestTimeout(timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout reached', { 
          method: req.method, 
          url: req.originalUrl,
          timeoutMs 
        });
        res.status(504).json({
          success: false,
          error: 'Request timeout'
        });
      }
    }, timeoutMs);
    timer.unref();

    const clearTimer = () => clearTimeout(timer);
    res.once('finish', clearTimer);
    res.once('close', clearTimer);
    next();
  };
}

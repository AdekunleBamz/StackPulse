import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Request timeout middleware
 */
export function requestTimeout(timeoutMs: number = 30000) {
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

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
}

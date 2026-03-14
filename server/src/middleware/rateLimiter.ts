/**
 * Rate Limiter Middleware
 * API rate limiting functionality
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  maxRequestsGenerator?: (req: Request) => number;
}

const defaultOptions: RateLimitOptions = {
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  message: 'Too many requests, please try again later.',
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
};

/**
 * Rate limiter middleware factory
 */
export function rateLimiter(options: RateLimitOptions = defaultOptions) {
  const { windowMs, maxRequests, message, keyGenerator } = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator!(req);
    const now = Date.now();
    const effectiveMaxRequests = maxRequestsGenerator ? maxRequestsGenerator(req) : maxRequests;

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // New window
      entry = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, entry);
      return next();
    }

    // Check if limit exceeded
    if (entry.count >= effectiveMaxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      logger.warn('Rate limit exceeded', { 
        key, 
        path: req.path, 
        requests: entry.count, 
        retryAfter 
      });

      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter
      });
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', effectiveMaxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (effectiveMaxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());

    next();
  };
}

// Pre-configured rate limiters
export const apiLimiter = rateLimiter({
  windowMs: 60000,
  maxRequests: 100
});

export const authLimiter = rateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 5
});

export const webhookLimiter = rateLimiter({
  windowMs: 60000,
  maxRequests: 1000
});

export default {
  rateLimiter,
  apiLimiter,
  authLimiter,
  webhookLimiter
};

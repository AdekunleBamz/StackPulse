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
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60000;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_UNKNOWN_KEY = 'unknown';

type TierRequest = Request & {
  user?: {
    tier?: number;
  };
};

// Clean up expired entries every minute
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_CLEANUP_INTERVAL_MS);
cleanupInterval.unref();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  maxRequestsGenerator?: (req: Request) => number;
}

const defaultOptions: RateLimitOptions = {
  windowMs: DEFAULT_RATE_LIMIT_WINDOW_MS, // 1 minute
  maxRequests: DEFAULT_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests, please try again later.',
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || RATE_LIMIT_UNKNOWN_KEY;
  }
};

/**
 * Rate limiter middleware factory
 */
export function rateLimiter(options: RateLimitOptions = defaultOptions) {
  const { windowMs, maxRequests, message, keyGenerator, maxRequestsGenerator } = { ...defaultOptions, ...options };

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
      res.setHeader('X-RateLimit-Limit', effectiveMaxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (effectiveMaxRequests - entry.count).toString());
      res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());
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
  windowMs: DEFAULT_RATE_LIMIT_WINDOW_MS,
  maxRequests: DEFAULT_RATE_LIMIT_MAX_REQUESTS
});

export const tieredApiLimiter = rateLimiter({
  windowMs: DEFAULT_RATE_LIMIT_WINDOW_MS,
  maxRequests: DEFAULT_RATE_LIMIT_MAX_REQUESTS, // Default
  maxRequestsGenerator: (req) => {
    // In a real app, fetch tier from user store
    const userTier = (req as TierRequest).user?.tier || 0;
    const limits = [100, 1000, 5000, 20000]; // Defined earlier in tier.ts
    const safeTier = Number.isInteger(userTier) && userTier >= 0 ? userTier : 0;
    return limits[safeTier] || DEFAULT_RATE_LIMIT_MAX_REQUESTS;
  }
});

export const authLimiter = rateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 5
});

export const webhookLimiter = rateLimiter({
  windowMs: DEFAULT_RATE_LIMIT_WINDOW_MS,
  maxRequests: 1000
});

export default {
  rateLimiter,
  apiLimiter,
  authLimiter,
  webhookLimiter
};

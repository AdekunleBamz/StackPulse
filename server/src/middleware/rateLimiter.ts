/**
 * Rate Limiter Middleware
 * Implements token bucket algorithm for API rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  message?: string;      // Custom error message
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

// Token bucket for each client
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// In-memory store (use Redis in production)
const buckets = new Map<string, TokenBucket>();

// Default key generator: use IP address
const defaultKeyGenerator = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

// Clean up old buckets periodically
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > oneHour) {
      buckets.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = defaultKeyGenerator,
    skip,
  } = config;

  const refillRate = maxRequests / windowMs; // Tokens per millisecond

  return (req: Request, res: Response, next: NextFunction) => {
    // Check if this request should be skipped
    if (skip && skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    // Get or create bucket
    let bucket = buckets.get(key);
    
    if (!bucket) {
      bucket = {
        tokens: maxRequests,
        lastRefill: now,
      };
      buckets.set(key, bucket);
    }

    // Refill tokens based on time elapsed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = timePassed * refillRate;
    bucket.tokens = Math.min(maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if request can proceed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));
      res.setHeader('X-RateLimit-Reset', Math.ceil(now + windowMs));
      
      return next();
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((1 - bucket.tokens) / refillRate / 1000);
    
    logger.warn('Rate limit exceeded', {
      key,
      path: req.path,
      method: req.method,
      retryAfter,
    });

    res.setHeader('Retry-After', retryAfter);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.ceil(now + windowMs));

    return res.status(429).json({
      success: false,
      error: message,
      retryAfter,
    });
  };
}

// Pre-configured rate limiters
export const publicRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 100,       // 100 requests per minute
  message: 'Too many requests. Please try again in a minute.',
});

export const userRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 60,        // 60 requests per minute
  keyGenerator: (req) => {
    // Use wallet address if available, otherwise IP
    const address = req.params.address || req.query.address;
    if (typeof address === 'string') {
      return `user:${address}`;
    }
    return defaultKeyGenerator(req);
  },
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,    // 1 minute
  maxRequests: 10,        // 10 requests per minute
  message: 'Rate limit exceeded. This endpoint has strict limits.',
});

// Chainhook endpoints should not be rate limited
export const chainhookRateLimiter = createRateLimiter({
  windowMs: 1000,
  maxRequests: 1000,      // Effectively unlimited
  skip: (req) => {
    // Skip rate limiting for authenticated chainhook requests
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.CHAINHOOK_AUTH_TOKEN;
    return !!expectedToken && authHeader === `Bearer ${expectedToken}`;
  },
});

export default createRateLimiter;

import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware
 * Adds various security-related HTTP headers
 */
export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS filter in browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https://api.mainnet.hiro.so https://api.coingecko.com wss:",
        "frame-ancestors 'none'",
      ].join('; ')
    );
    
    // Permissions Policy (replaces Feature-Policy)
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
    
    // Strict Transport Security (HSTS)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }
    
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    
    next();
  };
}

/**
 * CORS middleware with fine-grained control
 */
export function corsMiddleware(options: {
  origins?: string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
} = {}) {
  const {
    origins = ['http://localhost:3000', 'https://stackpulse.vercel.app'],
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders = ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials = true,
    maxAge = 86400, // 24 hours
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    // Check if origin is allowed
    if (origin && (origins.includes('*') || origins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    res.setHeader('Access-Control-Max-Age', maxAge.toString());
    
    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  };
}

/**
 * Sanitize request inputs to prevent XSS and injection attacks
 */
export function sanitizeInputs() {
  const sanitize = (str: string): string => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\\/g, '&#x5C;')
      .replace(/`/g, '&#x60;');
  };

  const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitize(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(v => 
          typeof v === 'string' ? sanitize(v) : 
          typeof v === 'object' ? sanitizeObject(v) : v
        );
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query as Record<string, any>);
    }
    
    next();
  };
}

/**
 * Request size limiter
 */
export function requestSizeLimiter(maxSize: string = '10mb') {
  const parseSize = (size: string): number => {
    const units: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };
    
    const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/);
    if (!match) return 10 * 1024 * 1024; // Default 10MB
    
    const value = parseInt(match[1], 10);
    const unit = match[2] || 'b';
    
    return value * units[unit];
  };

  const maxBytes = parseSize(maxSize);

  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        error: 'Request entity too large',
        maxSize,
      });
    }
    
    next();
  };
}

export default {
  securityHeaders,
  corsMiddleware,
  sanitizeInputs,
  requestSizeLimiter,
};

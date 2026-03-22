/**
 * Security Middleware
 * Production hardening with Helmet and custom CSP
 */
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Enhanced security middleware
 */
export const securityMetrics = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://api.mainnet.hiro.so"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * CORS middleware (kept for compatibility)
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001'];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
}

/**
 * Legacy removal of powered-by (Helmet does this, kept for explicit clarity)
 */
export function removePoweredBy(req: Request, res: Response, next: NextFunction) {
  res.removeHeader('X-Powered-By');
  next();
}

export default {
  securityMetrics,
  corsMiddleware,
  removePoweredBy
};

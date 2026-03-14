/**
 * Security Middleware
 * Security headers and protections
 */

import { Request, Response, NextFunction } from 'express';

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'] as const;
const PREFLIGHT_SUCCESS_STATUS = 200;
/** HSTS max-age in seconds (1 year). */
const HSTS_MAX_AGE_SECONDS = 31_536_000;
/** CORS preflight cache duration in seconds (24 hours). */
const CORS_MAX_AGE_SECONDS = 86_400;

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content-Security-Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  
  // Permissions-Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // COOP
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  
  // CORP
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  
  next();
}

/**
 * CORS middleware
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'];
  
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}

/**
 * Prevent clickjacking
 */
export function preventClickjacking(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
}

/**
 * Remove powered by header
 */
export function removePoweredBy(req: Request, res: Response, next: NextFunction) {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
}

export default {
  securityHeaders,
  corsMiddleware,
  preventClickjacking,
  removePoweredBy
};

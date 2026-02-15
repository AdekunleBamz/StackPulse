/**
 * Error Handler Middleware
 * Centralized error handling for the API
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Custom error class
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(
    statusCode: number,
    message: string,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined errors
export const Errors = {
  BadRequest: (message: string = 'Bad request', details?: any) =>
    new ApiError(400, message, 'BAD_REQUEST', details),
    
  Unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(401, message, 'UNAUTHORIZED'),
    
  Forbidden: (message: string = 'Forbidden') =>
    new ApiError(403, message, 'FORBIDDEN'),
    
  NotFound: (resource: string = 'Resource') =>
    new ApiError(404, `${resource} not found`, 'NOT_FOUND'),
    
  Conflict: (message: string = 'Conflict') =>
    new ApiError(409, message, 'CONFLICT'),
    
  RateLimited: (retryAfter: number = 60) =>
    new ApiError(429, 'Too many requests', 'RATE_LIMITED', { retryAfter }),
    
  Internal: (message: string = 'Internal server error') =>
    new ApiError(500, message, 'INTERNAL_ERROR'),
    
  ServiceUnavailable: (message: string = 'Service temporarily unavailable') =>
    new ApiError(503, message, 'SERVICE_UNAVAILABLE'),
    
  ValidationError: (errors: any[]) =>
    new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', { errors }),
};

// Error handler middleware
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default to 500 if not an ApiError
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'SyntaxError') {
    // JSON parse error
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
  }

  // Log the error
  const logData = {
    statusCode,
    code,
    message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  if (statusCode >= 500) {
    logger.error('Server error', { ...logData, stack: err.stack });
  } else if (statusCode >= 400) {
    logger.warn('Client error', logData);
  }

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  const response: any = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details && !isProduction) {
    response.error.details = details;
  }

  if (!isProduction && err.stack) {
    response.error.stack = err.stack.split('\n').slice(0, 5);
  }

  res.status(statusCode).json(response);
}

// Not found handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

// Async handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Request validation helper
export function validateRequest(schema: {
  body?: (data: any) => { valid: boolean; errors?: string[] };
  params?: (data: any) => { valid: boolean; errors?: string[] };
  query?: (data: any) => { valid: boolean; errors?: string[] };
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    if (schema.body) {
      const result = schema.body(req.body);
      if (!result.valid && result.errors) {
        errors.push(...result.errors.map(e => `body: ${e}`));
      }
    }

    if (schema.params) {
      const result = schema.params(req.params);
      if (!result.valid && result.errors) {
        errors.push(...result.errors.map(e => `params: ${e}`));
      }
    }

    if (schema.query) {
      const result = schema.query(req.query);
      if (!result.valid && result.errors) {
        errors.push(...result.errors.map(e => `query: ${e}`));
      }
    }

    if (errors.length > 0) {
      throw Errors.ValidationError(errors);
    }

    next();
  };
}

export default errorHandler;

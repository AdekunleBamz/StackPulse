/**
 * Error Handler Middleware
 * Global error handling for the Express application.
 *
 * Provides consistent error responses with proper HTTP status codes,
 * operational error handling, and development/production modes.
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Extended Error interface for operational errors.
 * Operational errors are expected errors with known status codes.
 */
export interface AppError extends Error {
  /** HTTP status code for the error response */
  statusCode?: number;
  /** Whether this is an operational (expected) error */
  isOperational?: boolean;
  /** Optional error code for programmatic handling */
  code?: string;
}

/**
 * Error response structure sent to clients.
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    code?: string;
    stack?: string;
  };
}

/**
 * Create an operational error with a specific status code.
 *
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code (4xx or 5xx)
 * @param code - Optional error code for programmatic handling
 * @returns AppError instance marked as operational
 *
 * @example
 * ```typescript
 * throw createError('User not found', 404, 'USER_NOT_FOUND');
 * ```
 */
export function createError(message: string, statusCode: number, code?: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  error.code = code;
  return error;
}

/**
 * Validation error factory for 400 Bad Request responses.
 *
 * @param message - Description of the validation failure
 * @returns AppError with 400 status code
 */
export function createValidationError(message: string): AppError {
  return createError(message, 400, 'VALIDATION_ERROR');
}

/**
 * Unauthorized error factory for 401 responses.
 *
 * @param message - Description of the authentication failure
 * @returns AppError with 401 status code
 */
export function createUnauthorizedError(message: string): AppError {
  return createError(message, 401, 'UNAUTHORIZED');
}

/**
 * Forbidden error factory for 403 responses.
 *
 * @param message - Description of the permission denial
 * @returns AppError with 403 status code
 */
export function createForbiddenError(message: string): AppError {
  return createError(message, 403, 'FORBIDDEN');
}

/**
 * Not found error factory for 404 responses.
 *
 * @param resource - Description of the missing resource
 * @returns AppError with 404 status code
 */
export function createNotFoundError(resource: string): AppError {
  return createError(`${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Conflict error factory for 409 responses.
 *
 * @param message - Description of the conflict
 * @returns AppError with 409 status code
 */
export function createConflictError(message: string): AppError {
  return createError(message, 409, 'CONFLICT');
}

/**
 * Rate limit error factory for 429 responses.
 *
 * @param retryAfter - Seconds until the client can retry
 * @returns AppError with 429 status code
 */
export function createRateLimitError(retryAfter?: number): AppError {
  const message = retryAfter
    ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
    : 'Rate limit exceeded. Please try again later.';
  return createError(message, 429, 'RATE_LIMIT_EXCEEDED');
}

/**
 * Error handler middleware.
 *
 * Handles all errors passed to Express via next(err).
 * Distinguishes between operational errors (expected) and
 * programming errors (unexpected) for proper logging and response.
 *
 * In development mode, includes stack traces in responses.
 * In production mode, only shows safe error messages.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const rawStatusCode = err.statusCode ?? 500;
  const statusCode =
    Number.isInteger(rawStatusCode) && rawStatusCode >= 400 && rawStatusCode <= 599
      ? rawStatusCode
      : 500;

  const isOperational = err.isOperational ?? false;
  const message = isOperational ? err.message : 'Internal server error';

  // Log error with appropriate severity
  if (isOperational) {
    logger.warn(`[Operational Error] ${statusCode}: ${err.message}`, {
      code: err.code,
      path: _req?.path,
      method: _req?.method,
    });
  } else {
    logger.error(`[Unhandled Error] ${statusCode}: ${err.message}`, {
      stack: err.stack,
      path: _req?.path,
      method: _req?.method,
    });
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      statusCode,
      ...(err.code && { code: err.code }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  res.status(statusCode).json(response);
}

/**
 * Async handler wrapper to catch promise rejections.
 *
 * Wraps async route handlers to automatically forward
 * errors to the error handler middleware.
 *
 * @param fn - Async route handler function
 * @returns Synchronous route handler that catches promise rejections
 *
 * @example
 * ```typescript
 * app.get('/users', asyncHandler(async (req, res) => {
 *   const users = await db.users.findAll();
 *   res.json({ success: true, data: users });
 * }));
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler for unmatched routes.
 *
 * Should be registered as the last route in the Express app
 * to catch all unmatched paths.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const message = `Route ${req.method} ${req.originalUrl} not found`;
  logger.info(`[404] ${message}`, { ip: req.ip, userAgent: req.get('User-Agent') });

  res.status(404).json({
    success: false,
    error: {
      message,
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
    },
  });
}

/**
 * Global unhandled rejection handler.
 *
 * Catches any unhandled promise rejections that escape
 * the Express middleware chain.
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Unhandled Rejection]', { reason, promise });
});

/**
 * Global uncaught exception handler.
 *
 * Catches any uncaught exceptions that escape the Express error handler.
 * Note: After handling, the process should be restarted by a process manager.
 */
process.on('uncaughtException', (err) => {
  logger.error('[Uncaught Exception]', { error: err.message, stack: err.stack });
  // Give logging time to complete before exiting
  setTimeout(() => process.exit(1), 100);
});

export default {
  createError,
  createValidationError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createRateLimitError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
};
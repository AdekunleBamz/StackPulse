import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom application error classes
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;
  const message = isOperational ? err.message : 'An unexpected error occurred';

  // Log error with context
  logger.error(`${req.method} ${req.path} - ${statusCode}: ${err.message}`, {
    stack: !isOperational ? err.stack : undefined,
    operational: isOperational
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      type: err.constructor.name
    }
  });
};

/**
 * Async handler wrapper to catch errors in promises
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default { AppError, BadRequestError, NotFoundError, errorHandler, asyncHandler };

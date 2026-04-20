/**
 * Custom Error Classes for StackPulse Server
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too Many Requests') {
    super(message, 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500, false);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service Unavailable') {
    super(message, 503);
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(message: string = 'Gateway Timeout') {
    super(message, 504);
  }
}

export class NotImplementedError extends AppError {
  constructor(message: string = 'Not Implemented') {
    super(message, 501);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string = 'Unprocessable Entity') {
    super(message, 422);
  }
}

/**
 * Returns true if the given value is an AppError instance.
 */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/**
 * Returns the HTTP status code from an error, defaulting to 500 for unknown errors.
 */
export function getErrorStatus(err: unknown): number {
  if (isAppError(err)) return err.statusCode;
  return 500;
}

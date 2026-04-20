/**
 * Validation Middleware
 * Request validation for body, query parameters, and route params.
 *
 * Provides type-safe validation with customizable schemas and
 * clear error messages for API consumers.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import logger from '../utils/logger';

/** Payload size limits by subscription tier (in bytes) */
const PAYLOAD_SIZE_LIMITS_BY_TIER = [10_240, 102_400, 1_048_576, 10_485_760] as const; // 10K, 100K, 1M, 10M
const DEFAULT_TIER_INDEX = 0;
const PAYLOAD_TOO_LARGE_STATUS = 413;
const BAD_REQUEST_STATUS = 400;

/** Request with optional user tier information */
type TierRequest = Request & {
  user?: {
    tier?: number;
  };
};

/**
 * Validation error response structure.
 */
export interface ValidationErrorResponse {
  success: false;
  errors: string[];
}

/**
 * Payload size limit exceeded response.
 */
export interface PayloadTooLargeResponse {
  success: false;
  error: string;
  limit: number;
}

/**
 * Validate request body payload size based on user tier.
 *
 * Higher tiers have larger payload limits:
 * - Tier 0 (Free): 10KB
 * - Tier 1 (Basic): 100KB
 * - Tier 2 (Pro): 1MB
 * - Tier 3 (Premium): 10MB
 */
export function validatePayloadSize(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  const userTier = (req as TierRequest).user?.tier ?? DEFAULT_TIER_INDEX;
  const safeTier =
    Number.isInteger(userTier) && userTier >= 0
      ? Math.min(userTier, PAYLOAD_SIZE_LIMITS_BY_TIER.length - 1)
      : DEFAULT_TIER_INDEX;

  const limit = PAYLOAD_SIZE_LIMITS_BY_TIER[safeTier] ?? PAYLOAD_SIZE_LIMITS_BY_TIER[DEFAULT_TIER_INDEX];

  const contentLength = Number.parseInt(req.headers['content-length'] || '0', 10);

  if (contentLength > limit) {
    logger.warn('Payload size limit exceeded', {
      userTier: safeTier,
      limit,
      contentLength,
      path: req.path,
    });

    return res.status(PAYLOAD_TOO_LARGE_STATUS).json({
      success: false,
      error: `Payload too large for your tier. Maximum size: ${limit} bytes.`,
      limit,
    } satisfies PayloadTooLargeResponse);
  }

  next();
}

/**
 * Validation rule definition for a single field.
 */
export interface ValidationRule {
  /** Expected data type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Whether the field is required */
  required?: boolean;
  /** Minimum value (for numbers) or length (for strings) */
  min?: number;
  /** Maximum value (for numbers) or length (for strings) */
  max?: number;
  /** Regular expression pattern for string validation */
  pattern?: RegExp;
  /** Custom error message */
  message?: string;
}

/**
 * Validation schema definition mapping field names to rules.
 */
export type ValidationSchema = Record<string, ValidationRule>;

/**
 * Check if a value matches the expected type.
 */
function matchesType(
  value: unknown,
  expectedType: ValidationRule['type']
): boolean {
  switch (expectedType) {
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return typeof value === expectedType;
  }
}

/**
 * Validate a single field against its rules.
 *
 * @returns Array of error messages (empty if valid)
 */
function validateField(
  field: string,
  value: unknown,
  rules: ValidationRule,
  context: 'body' | 'query' | 'params'
): string[] {
  const errors: string[] = [];
  const fieldName = context === 'query' ? `Query parameter '${field}'` : `${context} field '${field}'`;

  // Check required
  const isEmpty = value === undefined || value === null || value === '';
  if (rules.required && isEmpty) {
    errors.push(rules.message ?? `${fieldName} is required`);
    return errors;
  }

  // Skip further validation if not provided
  if (isEmpty) {
    return errors;
  }

  // Check type
  if (!matchesType(value, rules.type)) {
    errors.push(rules.message ?? `${fieldName} must be of type ${rules.type}`);
    return errors; // Return early if type doesn't match
  }

  // Check min constraint
  if (rules.min !== undefined) {
    if (typeof value === 'string' && value.length < rules.min) {
      errors.push(rules.message ?? `${fieldName} must be at least ${rules.min} characters`);
    }
    if (typeof value === 'number' && value < rules.min) {
      errors.push(rules.message ?? `${fieldName} must be at least ${rules.min}`);
    }
    if (Array.isArray(value) && value.length < rules.min) {
      errors.push(rules.message ?? `${fieldName} must have at least ${rules.min} items`);
    }
  }

  // Check max constraint
  if (rules.max !== undefined) {
    if (typeof value === 'string' && value.length > rules.max) {
      errors.push(rules.message ?? `${fieldName} must be at most ${rules.max} characters`);
    }
    if (typeof value === 'number' && value > rules.max) {
      errors.push(rules.message ?? `${fieldName} must be at most ${rules.max}`);
    }
    if (Array.isArray(value) && value.length > rules.max) {
      errors.push(rules.message ?? `${fieldName} must have at most ${rules.max} items`);
    }
  }

  // Check pattern
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    errors.push(rules.message ?? `${fieldName} has invalid format`);
  }

  return errors;
}

/**
 * Create a validation middleware for request body.
 *
 * @param schema - Validation schema defining field rules
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * app.post('/alerts',
 *   validateBody({
 *     name: { type: 'string', required: true, min: 1, max: 64 },
 *     type: { type: 'number', required: true, min: 1, max: 6 }
 *   }),
 *   createAlertHandler
 * );
 * ```
 */
export function validateBody(schema: ValidationSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      const fieldErrors = validateField(field, value, rules, 'body');
      errors.push(...fieldErrors);
    }

    if (errors.length > 0) {
      logger.debug('Body validation failed', { errors, path: req.path });
      return res.status(BAD_REQUEST_STATUS).json({
        success: false,
        errors,
      } satisfies ValidationErrorResponse);
    }

    next();
  };
}

/**
 * Create a validation middleware for query parameters.
 *
 * @param schema - Validation schema defining parameter rules
 * @returns Express middleware function
 */
export function validateQuery(schema: ValidationSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.query[field];

      // Handle array values by taking the first element
      const rawValue = Array.isArray(value) ? value[0] : value;

      if (rules.required && !rawValue) {
        errors.push(rules.message ?? `Query parameter '${field}' is required`);
        continue;
      }

      if (!rawValue) {
        continue;
      }

      if (typeof rawValue !== 'string') {
        errors.push(rules.message ?? `Query parameter '${field}' must be a string value`);
        continue;
      }

      const normalizedValue = rawValue.trim();

      // Type-specific validation for query params
      switch (rules.type) {
        case 'number': {
          const parsedValue = Number.parseFloat(normalizedValue);
          if (!Number.isFinite(parsedValue)) {
            errors.push(rules.message ?? `Query parameter '${field}' must be a valid number`);
          }
          break;
        }
        case 'boolean':
          if (normalizedValue !== 'true' && normalizedValue !== 'false') {
            errors.push(rules.message ?? `Query parameter '${field}' must be "true" or "false"`);
          }
          break;
        case 'string':
          // Already validated as string above
          break;
        default:
          errors.push(rules.message ?? `Query parameter '${field}' must be of type ${rules.type}`);
      }
    }

    if (errors.length > 0) {
      logger.debug('Query validation failed', { errors, path: req.path });
      return res.status(BAD_REQUEST_STATUS).json({
        success: false,
        errors,
      } satisfies ValidationErrorResponse);
    }

    next();
  };
}

/**
 * Create a validation middleware for route parameters.
 *
 * @param schema - Validation schema defining param rules
 * @returns Express middleware function
 */
export function validateParams(schema: ValidationSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.params[field];
      const fieldErrors = validateField(field, value, rules, 'params');
      errors.push(...fieldErrors);
    }

    if (errors.length > 0) {
      logger.debug('Params validation failed', { errors, path: req.path });
      return res.status(BAD_REQUEST_STATUS).json({
        success: false,
        errors,
      } satisfies ValidationErrorResponse);
    }

    next();
  };
}

// ============================================================================
// Predefined Validation Schemas
// ============================================================================

/** Common regex patterns for validation */
export const patterns = {
  /** Valid Stacks address (SP or ST prefix followed by 41 alphanumeric chars) */
  stacksAddress: /^S[PT][0-9A-HJ-NP-Z]{41}$/,
  /** Valid email format */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Valid URL format */
  url: /^https?:\/\/.+$/,
  /** Alphanumeric with hyphens and underscores */
  slug: /^[a-zA-Z0-9-_]+$/,
};

/** Predefined schema field length limits */
const SCHEMA_ALERT_NAME_MAX = 100;
const SCHEMA_ALERT_TYPE_MAX = 6;
const SCHEMA_USERNAME_MAX = 50;
const SCHEMA_DISCORD_MIN = 2;
const SCHEMA_DISCORD_MAX = 32;
const SCHEMA_TELEGRAM_MAX = 32;
const SCHEMA_PAGINATION_PAGE_MAX = 1000;
const SCHEMA_PAGINATION_LIMIT_MAX = 100;

/**
 * Predefined validation schemas for common use cases.
 */
export const schemas: Record<string, ValidationSchema> = {
  /** Schema for creating a new alert */
  createAlert: {
    name: { type: 'string', required: true, min: 1, max: SCHEMA_ALERT_NAME_MAX },
    type: { type: 'number', required: true, min: 1, max: SCHEMA_ALERT_TYPE_MAX },
    threshold: { type: 'number', required: false, min: 0 },
    targetAddress: { type: 'string', required: false, pattern: patterns.stacksAddress },
    webhookUrl: { type: 'string', required: false, pattern: patterns.url },
  },

  /** Schema for updating an existing alert */
  updateAlert: {
    name: { type: 'string', required: false, min: 1, max: SCHEMA_ALERT_NAME_MAX },
    threshold: { type: 'number', required: false, min: 0 },
    targetAddress: { type: 'string', required: false, pattern: patterns.stacksAddress },
    webhookUrl: { type: 'string', required: false, pattern: patterns.url },
    enabled: { type: 'boolean', required: false },
  },

  /** Schema for creating a user */
  createUser: {
    address: { type: 'string', required: true, pattern: patterns.stacksAddress },
    username: { type: 'string', required: false, min: 1, max: SCHEMA_USERNAME_MAX },
    email: { type: 'string', required: false, pattern: patterns.email },
    discord: { type: 'string', required: false, min: SCHEMA_DISCORD_MIN, max: SCHEMA_DISCORD_MAX },
    telegram: { type: 'string', required: false, min: 1, max: SCHEMA_TELEGRAM_MAX },
  },

  /** Schema for pagination parameters */
  pagination: {
    page: { type: 'number', required: false, min: 1, max: SCHEMA_PAGINATION_PAGE_MAX },
    limit: { type: 'number', required: false, min: 1, max: SCHEMA_PAGINATION_LIMIT_MAX },
  },

  /** Schema for address-based lookups */
  addressLookup: {
    address: { type: 'string', required: true, pattern: patterns.stacksAddress },
  },
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  schemas,
  patterns,
};
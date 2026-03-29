import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Validate body payload size based on tier
 */
export function validatePayloadSize(req: Request, res: Response, next: NextFunction) {
  const userTier = (req as any).user?.tier || 0;
  const limits = [10240, 102400, 1048576, 10485760]; // 10K, 100K, 1M, 10M
  const limit = limits[userTier] || 10240;
  
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > limit) {
    logger.warn('Payload size limit exceeded', { userTier, limit, contentLength });
    return res.status(413).json({
      success: false,
      error: `Payload too large for your tier. Limit: ${limit} bytes.`
    });
  }
  next();
}

interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
}

/**
 * Validate request body against schema
 */
export function validateBody(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field}' is required`);
        continue;
      }

      // Skip validation if not required and not provided
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }

      // Check type
      if (typeof value !== rules.type) {
        errors.push(`Field '${field}' must be of type ${rules.type}`);
      }

      // Check min length
      if (rules.min !== undefined) {
        if (typeof value === 'string' && value.length < rules.min) {
          errors.push(`Field '${field}' must be at least ${rules.min} characters`);
        }
        if (typeof value === 'number' && value < rules.min) {
          errors.push(`Field '${field}' must be at least ${rules.min}`);
        }
      }

      // Check max length
      if (rules.max !== undefined) {
        if (typeof value === 'string' && value.length > rules.max) {
          errors.push(`Field '${field}' must be at most ${rules.max} characters`);
        }
        if (typeof value === 'number' && value > rules.max) {
          errors.push(`Field '${field}' must be at most ${rules.max}`);
        }
      }

      // Check pattern
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(`Field '${field}' has invalid format`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  };
}

/**
 * Validate request query parameters
 */
export function validateQuery(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.query[field];

      // Check required
      if (rules.required && !value) {
        errors.push(`Query parameter '${field}' is required`);
        continue;
      }

      // Skip if not required and not provided
      if (!rules.required && !value) {
        continue;
      }

      // Check type
      const parsedValue = rules.type === 'number' ? parseFloat(value as string) : value;
      if (typeof parsedValue !== rules.type) {
        errors.push(`Query parameter '${field}' must be of type ${rules.type}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  };
}

/**
 * Validate request params
 */
export function validateParams(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.params[field];

      // Check required
      if (rules.required && !value) {
        errors.push(`Parameter '${field}' is required`);
        continue;
      }

      // Check type
      if (value && typeof value !== rules.type) {
        errors.push(`Parameter '${field}' must be of type ${rules.type}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  };
}

// Predefined validation schemas
export const schemas: Record<string, ValidationSchema> = {
  createAlert: {
    name: { type: 'string', required: true, min: 1, max: 64 },
    alertType: { type: 'number', required: true, min: 1, max: 6 },
    threshold: { type: 'number', required: false, min: 0 },
    targetAddress: { type: 'string', required: false },
    webhookUrl: { type: 'string', required: false }
  },
  updateAlert: {
    name: { type: 'string', required: false, min: 1, max: 64 },
    threshold: { type: 'number', required: false, min: 0 },
    targetAddress: { type: 'string', required: false },
    webhookUrl: { type: 'string', required: false }
  }
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  schemas
};

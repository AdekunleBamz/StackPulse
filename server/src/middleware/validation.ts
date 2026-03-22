import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Enhanced schema validation middleware
 * Inspired by Zod's declarative approach
 */
export type SchemaRule = {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  regex?: RegExp;
  message?: string;
};

export type ValidationSchema = Record<string, SchemaRule>;

/**
 * Validate request against schema
 */
export const validate = (schema: ValidationSchema, part: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[part];
    const errors: Record<string, string> = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors[field] = rule.message || `Field '${field}' is required`;
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rule.type === 'array' && !Array.isArray(value)) {
          errors[field] = `Field '${field}' must be an array`;
        } else if (rule.type !== 'array' && typeof value !== rule.type) {
          errors[field] = `Field '${field}' must be a ${rule.type}`;
        }

        if (rule.min !== undefined) {
          const val = rule.type === 'string' ? (value as string).length : (value as number);
          if (val < rule.min) errors[field] = `Minimum ${rule.min} required`;
        }

        if (rule.max !== undefined) {
          const val = rule.type === 'string' ? (value as string).length : (value as number);
          if (val > rule.max) errors[field] = `Maximum ${rule.max} allowed`;
        }

        if (rule.regex && !rule.regex.test(String(value))) {
          errors[field] = `Invalid format for '${field}'`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      logger.warn(`Validation failed on ${req.path}`, { part, errors });
      return res.status(400).json({ success: false, errors });
    }

    next();
  };
};

/**
 * Predefined schemas
 */
export const schemas = {
  alert: {
    name: { type: 'string', required: true, min: 2, max: 64 },
    type: { type: 'number', required: true, min: 0, max: 10 },
    threshold: { type: 'number', required: false, min: 0 },
  },
  registration: {
    address: { type: 'string', required: true, regex: /^S[P|N|M|B][0-9A-Z]{38,39}$/i },
  }
};

export default { validate, schemas };

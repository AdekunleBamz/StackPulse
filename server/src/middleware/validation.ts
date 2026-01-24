import { Request, Response, NextFunction, RequestHandler } from 'express';

// Type definition for schema validators
type SchemaType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'array' 
  | 'object'
  | 'email'
  | 'address'
  | 'txid'
  | 'uuid';

interface SchemaField {
  type: SchemaType;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: (string | number)[];
  items?: SchemaField;
  properties?: Record<string, SchemaField>;
  message?: string;
}

type Schema = Record<string, SchemaField>;

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Common regex patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  stxAddress: /^S[PM][A-Z0-9]{38,39}$/,
  txid: /^0x[a-fA-F0-9]{64}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

/**
 * Validate a value against a schema field
 */
function validateField(
  value: any, 
  schema: SchemaField, 
  fieldName: string
): ValidationError | null {
  // Check required
  if (schema.required && (value === undefined || value === null || value === '')) {
    return {
      field: fieldName,
      message: schema.message || `${fieldName} is required`,
      value,
    };
  }

  // Skip validation if not required and not provided
  if (value === undefined || value === null) {
    return null;
  }

  // Type-specific validation
  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') {
        return {
          field: fieldName,
          message: `${fieldName} must be a string`,
          value,
        };
      }
      if (schema.min !== undefined && value.length < schema.min) {
        return {
          field: fieldName,
          message: `${fieldName} must be at least ${schema.min} characters`,
          value,
        };
      }
      if (schema.max !== undefined && value.length > schema.max) {
        return {
          field: fieldName,
          message: `${fieldName} must be at most ${schema.max} characters`,
          value,
        };
      }
      if (schema.pattern && !schema.pattern.test(value)) {
        return {
          field: fieldName,
          message: schema.message || `${fieldName} has invalid format`,
          value,
        };
      }
      if (schema.enum && !schema.enum.includes(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be one of: ${schema.enum.join(', ')}`,
          value,
        };
      }
      break;

    case 'number':
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof numValue !== 'number' || isNaN(numValue)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a number`,
          value,
        };
      }
      if (schema.min !== undefined && numValue < schema.min) {
        return {
          field: fieldName,
          message: `${fieldName} must be at least ${schema.min}`,
          value,
        };
      }
      if (schema.max !== undefined && numValue > schema.max) {
        return {
          field: fieldName,
          message: `${fieldName} must be at most ${schema.max}`,
          value,
        };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return {
          field: fieldName,
          message: `${fieldName} must be a boolean`,
          value,
        };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be an array`,
          value,
        };
      }
      if (schema.min !== undefined && value.length < schema.min) {
        return {
          field: fieldName,
          message: `${fieldName} must have at least ${schema.min} items`,
          value,
        };
      }
      if (schema.max !== undefined && value.length > schema.max) {
        return {
          field: fieldName,
          message: `${fieldName} must have at most ${schema.max} items`,
          value,
        };
      }
      // Validate array items
      if (schema.items) {
        for (let i = 0; i < value.length; i++) {
          const itemError = validateField(value[i], schema.items, `${fieldName}[${i}]`);
          if (itemError) return itemError;
        }
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be an object`,
          value,
        };
      }
      // Validate object properties
      if (schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          const propError = validateField(
            value[propName], 
            propSchema, 
            `${fieldName}.${propName}`
          );
          if (propError) return propError;
        }
      }
      break;

    case 'email':
      if (typeof value !== 'string' || !patterns.email.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid email address`,
          value,
        };
      }
      break;

    case 'address':
      if (typeof value !== 'string' || !patterns.stxAddress.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid Stacks address`,
          value,
        };
      }
      break;

    case 'txid':
      if (typeof value !== 'string' || !patterns.txid.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid transaction ID`,
          value,
        };
      }
      break;

    case 'uuid':
      if (typeof value !== 'string' || !patterns.uuid.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid UUID`,
          value,
        };
      }
      break;
  }

  return null;
}

/**
 * Validate request data against a schema
 */
function validate(
  data: Record<string, any>,
  schema: Schema
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const error = validateField(data[fieldName], fieldSchema, fieldName);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * Express middleware factory for request validation
 */
export function validateRequest(options: {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const allErrors: ValidationError[] = [];

    if (options.body) {
      allErrors.push(...validate(req.body || {}, options.body));
    }

    if (options.query) {
      allErrors.push(...validate((req.query as Record<string, any>) || {}, options.query));
    }

    if (options.params) {
      allErrors.push(...validate(req.params || {}, options.params));
    }

    if (allErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: allErrors,
      });
    }

    next();
  };
}

// Pre-defined validation schemas
export const schemas = {
  // Alert creation
  createAlert: {
    body: {
      name: { type: 'string' as SchemaType, required: true, min: 1, max: 100 },
      alertType: { type: 'number' as SchemaType, required: true, min: 1, max: 6 },
      threshold: { type: 'number' as SchemaType, min: 0 },
      targetAddress: { type: 'address' as SchemaType },
      webhookUrl: { type: 'string' as SchemaType, max: 500 },
    },
  },

  // User registration
  register: {
    body: {
      address: { type: 'address' as SchemaType, required: true },
      referrer: { type: 'address' as SchemaType },
    },
  },

  // Subscription
  subscribe: {
    body: {
      address: { type: 'address' as SchemaType, required: true },
      tier: { 
        type: 'number' as SchemaType, 
        required: true, 
        enum: [1, 2, 3],
        message: 'Tier must be 1 (Free), 2 (Pro), or 3 (Premium)',
      },
    },
  },

  // Notification settings
  notificationSettings: {
    body: {
      email: { type: 'email' as SchemaType },
      telegram: { type: 'string' as SchemaType, max: 100 },
      discord: { type: 'string' as SchemaType, max: 100 },
      enabledTypes: {
        type: 'array' as SchemaType,
        items: { type: 'number' as SchemaType, min: 1, max: 6 },
      },
    },
  },

  // Pagination
  pagination: {
    query: {
      page: { type: 'number' as SchemaType, min: 1 },
      limit: { type: 'number' as SchemaType, min: 1, max: 100 },
    },
  },

  // Address param
  addressParam: {
    params: {
      address: { type: 'address' as SchemaType, required: true },
    },
  },

  // ID param
  idParam: {
    params: {
      id: { type: 'uuid' as SchemaType, required: true },
    },
  },
};

// Helper functions
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove potential HTML
    .trim()
    .slice(0, 1000); // Limit length
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = Array.isArray(value)
        ? value.map(v => typeof v === 'string' ? sanitizeString(v) : v)
        : sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export default { validateRequest, schemas, sanitizeString, sanitizeObject };

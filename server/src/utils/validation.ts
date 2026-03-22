import { z } from 'zod';
import { BadRequestError } from '../middleware/errorHandler';

/**
 * Validation Utility
 * Centralized request validation using Zod schemas
 */

/**
 * Alert payload schema
 */
export const alertSchema = z.object({
  type: z.enum(['whale_transfer', 'contract_call', 'stx_transfer']),
  amount: z.number().positive(),
  sender: z.string().min(1),
  recipient: z.string().min(1),
  txId: z.string().startsWith('0x').length(66),
  timestamp: z.number()
});

/**
 * Validate data against a schema
 */
export function validate<T>(schema: z.Schema<T>, data: any): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errorDetails = result.error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    
    throw new BadRequestError(`Validation failed: ${errorDetails}`);
  }
  
  return result.data;
}

export default { alertSchema, validate };

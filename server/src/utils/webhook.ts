/**
 * Webhook Utility
 * Validates and processes webhook payloads
 */

import crypto from 'crypto';
import logger from './logger';

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
}

interface WebhookConfig {
  secret: string;
  signatureHeader: string;
}

const MAX_WEBHOOKS_PER_USER = new Map<number, number>([
  [0, 1],    // FREE
  [1, 10],   // PRO
  [2, 100],  // WHALE
  [3, 1000]  // EXCHANGE
]);

/**
 * Generate HMAC signature for webhook payload
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

/**
 * Verify webhook signature with secret rotation support
 */
export function verifySignature(
  payload: string,
  signature: string,
  secrets: string | string[]
): boolean {
  const secretList = Array.isArray(secrets) ? secrets : [secrets];
  const providedSignature = Buffer.from(signature, 'utf8');

  for (const secret of secretList) {
    const expectedSignature = generateSignature(payload, secret);
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');

    if (
      providedSignature.length === expectedSignatureBuffer.length &&
      crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Validate webhook payload structure with strict type checks
 */
export function validateWebhookPayload(data: any): { payload: WebhookPayload | null; error?: string } {
  if (!data || typeof data !== 'object') {
    return { payload: null, error: 'Invalid or missing payload object' };
  }
  
  const { event, data: payloadData, timestamp } = data;
  
  if (!event || typeof event !== 'string') {
    return { payload: null, error: 'Event type must be a valid string' };
  }
  
  if (!payloadData || typeof payloadData !== 'object') {
    return { payload: null, error: 'Payload data must be a valid object' };
  }
  
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    return { payload: null, error: 'Timestamp must be a valid unix numeric value' };
  }
  
  // Strict 5-minute window check for replay protection
  const now = Date.now();
  if (Math.abs(now - timestamp) > 300000) {
    return { payload: null, error: 'Webhook signature expired (5min window)' };
  }
  
  return {
    payload: { event, data: payloadData, timestamp }
  };
}

/**
 * Process authenticated webhook request
 */
export function processWebhook(
  body: any,
  signature: string | undefined,
  config: WebhookConfig & { alternateSecrets?: string[] }
): { valid: boolean; payload?: WebhookPayload; error?: string } {
  if (config.signatureHeader && signature) {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    const allSecrets = [config.secret, ...(config.alternateSecrets || [])];
    
    if (!verifySignature(bodyString, signature, allSecrets)) {
      logger.warn('Webhook signature verification failed', { signatureExists: !!signature });
      return { valid: false, error: 'Unauthorized: Invalid signature' };
    }
  }
  
  return validateWebhookPayload(body).payload 
    ? { valid: true, payload: body } 
    : { valid: false, error: 'Malformed payload structure' };
}

/**
 * Send webhook notification
 */
export async function sendWebhook(
  url: string,
  payload: WebhookPayload,
  rateLimit: number = 100 // Default rate limit
): Promise<boolean> {
  // Simulating rate limit check
  // In a real app, we'd use a Redis-based rate limiter
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      logger.warn('Webhook delivery failed', { 
        url, 
        status: response.status, 
        duration: `${duration}ms` 
      });
      return false;
    }

    logger.info('Webhook delivered successfully', { 
      url, 
      status: response.status, 
      duration: `${duration}ms` 
    });
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Webhook delivery error', { 
      url, 
      error, 
      duration: `${duration}ms` 
    });
    return false;
  }
}

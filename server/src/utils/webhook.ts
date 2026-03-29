/**
 * Webhook Utility
 * Validates and processes webhook payloads
 */

import crypto from 'crypto';
import logger from './logger';

interface WebhookPayload {
  event: string;
  data: unknown;
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
/** Acceptable time window for webhook replay protection (5 minutes in ms). */
const WEBHOOK_REPLAY_WINDOW_MS = 5 * 60 * 1_000;
/** Default rate limit (requests per window) for outbound webhook delivery. */
const WEBHOOK_DEFAULT_RATE_LIMIT = 100;

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
 * Verify webhook signature
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  const providedSignature = Buffer.from(signature, 'utf8');
  const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');

  if (providedSignature.length !== expectedSignatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    providedSignature,
    expectedSignatureBuffer
  );
}

/**
 * Validate webhook payload structure
 */
export function validateWebhookPayload(data: any): { payload: WebhookPayload | null; error?: string } {
  if (!data) return { payload: null, error: 'Empty payload' };
  
  const { event, data: payloadData, timestamp } = data;
  
  if (!event || typeof event !== 'string') {
    return { payload: null, error: 'Missing or invalid event type' };
  }
  
  if (!payloadData) {
    return { payload: null, error: 'Missing payload data' };
  }
  
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return { payload: null, error: 'Missing or invalid timestamp' };
  }
  
  // Check if timestamp is within acceptable range (5 minutes)
  const now = Date.now();
  if (Math.abs(now - timestamp) > 300000) {
    return { payload: null, error: 'Webhook timestamp expired' };
  }
  
  return {
    payload: {
      event,
      data: payloadData,
      timestamp
    }
  };
}

/**
 * Process webhook request
 */
export function processWebhook(
  body: unknown,
  signature: string | undefined,
  config: WebhookConfig
): { valid: boolean; payload?: WebhookPayload; error?: string } {
  // Verify signature if provided
  if (config.signatureHeader && signature) {
    const bodyString = JSON.stringify(body);
    if (!verifySignature(bodyString, signature, config.secret)) {
      return { valid: false, error: 'Invalid signature' };
    }
  }
  
  // Validate payload
  const { payload, error } = validateWebhookPayload(body);
  if (!payload) {
    return { valid: false, error: error || 'Invalid payload' };
  }
  
  return { valid: true, payload };
}

/**
 * Send webhook notification
 */
export async function sendWebhook(
  url: string,
  payload: WebhookPayload,
  rateLimit: number = WEBHOOK_DEFAULT_RATE_LIMIT
): Promise<boolean> {
  // Simulating rate limit check
  // In a real app, we'd use a Redis-based rate limiter
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Rate-Limit': String(rateLimit),
      },
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

/**
 * Returns the maximum number of webhooks allowed for a given user tier.
 * Returns 0 for unrecognised tiers.
 *
 * @param tier - Numeric tier identifier (0 = FREE, 1 = PRO, 2 = WHALE, 3 = EXCHANGE).
 */
export function getMaxWebhooksForTier(tier: number): number {
  return MAX_WEBHOOKS_PER_USER.get(tier) ?? 0;
}

/**
 * Returns true if a given URL is a valid absolute HTTP(S) URL suitable for webhook delivery.
 *
 * @param url - The URL string to validate.
 */
export function isValidWebhookUrl(url: string): boolean {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

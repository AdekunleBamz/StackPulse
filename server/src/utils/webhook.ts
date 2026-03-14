/**
 * Webhook Utility
 * Validates and processes webhook payloads
 */

import crypto from 'crypto';

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
}

interface WebhookConfig {
  secret: string;
  signatureHeader: string;
}

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
  
  if (!timestamp || typeof timestamp !== 'number') {
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
  body: any,
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

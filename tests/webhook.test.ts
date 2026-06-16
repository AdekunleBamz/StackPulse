import { describe, it, expect } from 'vitest';
import { 
  generateSignature, 
  verifySignature,
  validateWebhookPayload,
  processWebhook 
} from '../server/src/utils/webhook';

describe('Webhook Utilities', () => {
  const secret = 'test-secret';

  describe('generateSignature', () => {
    it('should generate a valid HMAC signature', () => {
      const payload = '{"event":"test","data":{}}';
      const signature = generateSignature(payload, secret);
      
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // SHA-256 hex is 64 chars
    });

    it('should generate consistent signatures for same payload', () => {
      const payload = '{"event":"test","data":{}}';
      const sig1 = generateSignature(payload, secret);
      const sig2 = generateSignature(payload, secret);
      
      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different payloads', () => {
      const sig1 = generateSignature('{"event":"test1"}', secret);
      const sig2 = generateSignature('{"event":"test2"}', secret);
      
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = '{"event":"test","data":{}}';
      const signature = generateSignature(payload, secret);
      
      expect(verifySignature(payload, signature, secret)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = '{"event":"test","data":{}}';
      
      expect(verifySignature(payload, 'invalid-signature', secret)).toBe(false);
    });
  });

  describe('validateWebhookPayload', () => {
    it('should validate correct payload', () => {
      const payload = {
        event: 'alert.triggered',
        data: { alertId: '123' },
        timestamp: Date.now()
      };
      
      const { payload: result, error } = validateWebhookPayload(payload);
      
      expect(result).not.toBeNull();
      expect(result?.event).toBe('alert.triggered');
      expect(error).toBeUndefined();
    });

    it('should reject payload without event', () => {
      const payload = {
        data: { alertId: '123' },
        timestamp: Date.now()
      };
      
      const { payload: result } = validateWebhookPayload(payload);
      expect(result).toBeNull();
    });

    it('should reject payload without data', () => {
      const payload = {
        event: 'alert.triggered',
        timestamp: Date.now()
      };
      
      const { payload: result } = validateWebhookPayload(payload);
      expect(result).toBeNull();
    });

    it('should reject payload with old timestamp', () => {
      const payload = {
        event: 'alert.triggered',
        data: { alertId: '123' },
        timestamp: Date.now() - 600000 // 10 minutes ago
      };
      
      const { payload: result } = validateWebhookPayload(payload);
      expect(result).toBeNull();
    });
  });

  describe('processWebhook', () => {
    const config = {
      secret,
      signatureHeader: 'x-signature'
    };

    it('should process valid webhook', () => {
      const body = {
        event: 'alert.triggered',
        data: { alertId: '123' },
        timestamp: Date.now()
      };
      
      const result = processWebhook(body, undefined, config);
      
      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.event).toBe('alert.triggered');
    });

    it('should reject invalid payload', () => {
      const body = {
        event: 'alert.triggered'
      };
      
      const result = processWebhook(body, undefined, config);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing payload data');
    });

    it('should process a simulated whale transfer payload', () => {
      const whalePayload = {
        event: 'stx_transfer',
        data: {
          tx_id: '0x123...',
          sender: 'SP123...',
          recipient: 'SP456...',
          amount: '1000000000', // 1000 STX
          memo: 'Whale transfer'
        },
        timestamp: Date.now()
      };

      const result = processWebhook(whalePayload, undefined, config);

      expect(result.valid).toBe(true);
      expect(result.payload?.event).toBe('stx_transfer');
      expect(result.payload?.data.amount).toBeDefined();
    });

    it('should process a simulated alert trigger payload', () => {
      const alertPayload = {
        event: 'alert.triggered',
        data: {
          alertId: '42',
          owner: 'SP789...',
          type: 'price_threshold',
          value: '50000'
        },
        timestamp: Date.now()
      };

      const result = processWebhook(alertPayload, undefined, config);

      expect(result.valid).toBe(true);
      expect(result.payload?.event).toBe('alert.triggered');
      expect(result.payload?.data.alertId).toBe('42');
    });
  });
});

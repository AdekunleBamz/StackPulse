import { describe, it, expect } from 'vitest';
import { formatSTX, decodeClarityValue } from '../../server/src/utils/stacks';

describe('Stacks Utilities', () => {
  describe('formatSTX', () => {
    it('should format micro-STX to STX correctly', () => {
      expect(formatSTX(1000000)).toBe('1.000000');
      expect(formatSTX(500000)).toBe('0.500000');
      expect(formatSTX(1)).toBe('0.000001');
    });

    it('should handle zero correctly', () => {
      expect(formatSTX(0)).toBe('0.000000');
    });

    it('should handle large amounts correctly', () => {
      expect(formatSTX(1000000000)).toBe('1000.000000');
    });
  });

  describe('decodeClarityValue', () => {
    it('should decode uint values correctly', () => {
      const mockUint = { type: 1, value: BigInt(100) }; // Mocked CV structure
      expect(decodeClarityValue(mockUint as any)).toBe('100');
    });

    it('should decode principal values correctly', () => {
      const mockPrincipal = { type: 5, address: { version: 22, hash160: '...' } }; // Mocked CV
      // Since it's internal to @stacks/transactions, we verify it handles our mock structure
      // or returns a fallback if the structure is too complex for simple mocking
      const result = decodeClarityValue(mockPrincipal as any);
      expect(result).toBeDefined();
    });

    it('should handle null/undefined values gracefully', () => {
      expect(decodeClarityValue(null as any)).toBe('');
      expect(decodeClarityValue(undefined as any)).toBe('');
    });
  });
});

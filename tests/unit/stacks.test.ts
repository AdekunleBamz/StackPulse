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
    it('should return Clarity values unchanged', () => {
      const mockUint = { type: 1, value: BigInt(100) }; // Mocked CV structure
      expect(decodeClarityValue(mockUint as any)).toBe(mockUint);
    });

    it('should return principal values unchanged', () => {
      const mockPrincipal = { type: 5, address: { version: 22, hash160: '...' } }; // Mocked CV
      const result = decodeClarityValue(mockPrincipal as any);
      expect(result).toBe(mockPrincipal);
    });

    it('should return null/undefined values unchanged', () => {
      expect(decodeClarityValue(null as any)).toBeNull();
      expect(decodeClarityValue(undefined as any)).toBeUndefined();
    });
  });
});

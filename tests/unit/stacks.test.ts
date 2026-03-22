import { describe, it, expect } from 'vitest';
import { formatSTX } from '../../server/src/utils/stacks';

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
});

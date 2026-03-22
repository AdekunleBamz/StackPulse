import { describe, it, expect } from 'vitest';
import { getClientCount, getClientStats } from '../../server/src/services/websocket';

describe('WebSocket Service', () => {
  describe('State Management', () => {
    it('should return 0 clients initially', () => {
      expect(getClientCount()).toBe(0);
    });

    it('should return empty stats initially', () => {
      const stats = getClientStats();
      expect(stats.connected).toBe(0);
      expect(stats.subscriptions).toBe(0);
    });
  });
});

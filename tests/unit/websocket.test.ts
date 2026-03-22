import { describe, it, expect, vi } from 'vitest';
import { 
  getClientCount, 
  getClientStats, 
  initWebSocket, 
  sendToAddress,
  broadcastNotification
} from '../../server/src/services/websocket';
import { Server as HTTPServer } from 'http';

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

  describe('Client Lifecycle', () => {
    it('should initialize and hold onto the server instance', () => {
      const mockServer = { on: vi.fn() } as unknown as HTTPServer;
      const wss = initWebSocket(mockServer);
      expect(wss).toBeDefined();
    });
  });

  describe('Broadcasting', () => {
    it('should return false when sending to non-existent address', () => {
      const sent = sendToAddress('non-existent', { type: 'notification', data: { message: 'hello' } });
      expect(sent).toBe(false);
    });

    it('should not throw when broadcasting to empty client list', () => {
      expect(() => broadcastNotification({ message: 'test' })).not.toThrow();
    });
  });
});

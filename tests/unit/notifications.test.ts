import { describe, it, expect } from 'vitest';
import { 
  saveUserPreferences, 
  getUserPreferences, 
  getAllUsers,
  deleteUserPreferences,
  trackNotification,
  getNotifications
} from '../../server/src/services/notifications';

describe('Notification Service', () => {
  const testAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

  describe('User Preferences', () => {
    it('should save and retrieve user preferences', () => {
      const prefs = {
        address: testAddress,
        alerts: {
          whaleTransfer: true,
          contractDeploy: false,
          nftMint: true
        }
      };

      saveUserPreferences(prefs);
      const retrieved = getUserPreferences(testAddress);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.address).toBe(testAddress);
      expect(retrieved?.alerts.whaleTransfer).toBe(true);
    });

    it('should return null for non-existent user', () => {
      const retrieved = getUserPreferences('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should list all users with preferences', () => {
      const users = getAllUsers();
      expect(users).toContain(testAddress);
    });

    it('should delete user preferences', () => {
      deleteUserPreferences(testAddress);
      const retrieved = getUserPreferences(testAddress);
      expect(retrieved).toBeNull();
    });
  });

  describe('Notification Tracking', () => {
    it('should track and retrieve notifications for a user', () => {
      const notification = {
        title: 'Whale Alert!',
        message: 'A large STX transfer was detected.',
        type: 'whale_transfer'
      };

      trackNotification(testAddress, notification.type, notification.title, notification.message);
      
      const history = getNotifications(testAddress);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].title).toBe(notification.title);
    });

    it('should return empty array for user with no notifications', () => {
      const history = getNotifications('no-notifications');
      expect(history).toEqual([]);
    });
  });
});

import { describe, it, expect } from 'vitest';
import notificationsService, { 
  saveUserPreferences, 
  getUserPreferences, 
  getAllUsers,
  deleteUserPreferences
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

    it('should return undefined for non-existent user', () => {
      const retrieved = getUserPreferences('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should list all users with preferences', () => {
      const users = getAllUsers();
      expect(users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ address: testAddress })
        ])
      );
    });

    it('should delete user preferences', () => {
      deleteUserPreferences(testAddress);
      const retrieved = getUserPreferences(testAddress);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Notification Tracking', () => {
    it('should track and retrieve notifications for a user', () => {
      const notification = {
        title: 'Whale Alert!',
        message: 'A large STX transfer was detected.',
        type: 'alert' as const
      };

      notificationsService.createNotification(testAddress, notification.type, notification.title, notification.message);
      
      const history = notificationsService.getNotifications(testAddress);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].title).toBe(notification.title);
    });

    it('should return empty array for user with no notifications', () => {
      const history = notificationsService.getNotifications('no-notifications');
      expect(history).toEqual([]);
    });
  });
});

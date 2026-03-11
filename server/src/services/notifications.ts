/**
 * Notifications Service
 * Handles sending notifications to users
 */

interface Notification {
  id: string;
  type: 'alert' | 'badge' | 'subscription' | 'system';
  title: string;
  message: string;
  userAddress?: string;
  timestamp: number;
  read: boolean;
}

class NotificationsService {
  private notifications: Map<string, Notification[]> = new Map();

  /**
   * Create a notification
   */
  createNotification(
    userAddress: string,
    type: Notification['type'],
    title: string,
    message: string
  ): Notification {
    const notification: Notification = {
      id: Math.random().toString(36).substring(7),
      type,
      title,
      message,
      userAddress,
      timestamp: Date.now(),
      read: false
    };

    // Store notification
    const userNotifications = this.notifications.get(userAddress) || [];
    userNotifications.unshift(notification);
    this.notifications.set(userAddress, userNotifications);

    return notification;
  }

  /**
   * Get user notifications
   */
  getNotifications(userAddress: string, limit: number = 50): Notification[] {
    const userNotifications = this.notifications.get(userAddress) || [];
    return userNotifications.slice(0, limit);
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(userAddress: string): number {
    const userNotifications = this.notifications.get(userAddress) || [];
    return userNotifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(userAddress: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userAddress) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      return true;
    }
    
    return false;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userAddress: string): void {
    const userNotifications = this.notifications.get(userAddress) || [];
    userNotifications.forEach(n => n.read = true);
  }

  /**
   * Delete a notification
   */
  deleteNotification(userAddress: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userAddress) || [];
    const index = userNotifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
      userNotifications.splice(index, 1);
      this.notifications.set(userAddress, userNotifications);
      return true;
    }
    
    return false;
  }

  /**
   * Send alert notification
   */
  sendAlertNotification(userAddress: string, alertData: any): Notification {
    return this.createNotification(
      userAddress,
      'alert',
      'Alert Triggered',
      `Your alert "${alertData.name}" has been triggered.`
    );
  }

  /**
   * Send badge notification
   */
  sendBadgeNotification(userAddress: string, badgeName: string): Notification {
    return this.createNotification(
      userAddress,
      'badge',
      'Badge Earned!',
      `You earned the "${badgeName}" badge!`
    );
  }

  /**
   * Send subscription notification
   */
  sendSubscriptionNotification(userAddress: string, tier: string): Notification {
    return this.createNotification(
      userAddress,
      'subscription',
      'Subscription Updated',
      `Your subscription has been updated to ${tier}.`
    );
  }
}

export default new NotificationsService();

import logger from '../utils/logger';
import { randomUUID } from 'crypto';

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
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: number;
  read: boolean;
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
  txHash?: string;
  blockHeight?: number;
}

export interface UserPreferences {
  address: string;
  username?: string;
  email?: string;
  discord?: string;
  telegram?: string;
  enabledAlerts?: string[];
}

const MAX_NOTIFICATIONS_PER_USER = 100;
const DEFAULT_NOTIFICATION_RETRIES = 3;
const RETRY_BACKOFF_BASE_MS = 1000;
const userPreferencesStore: Map<string, UserPreferences> = new Map();

class NotificationsService {
  private notifications: Map<string, Notification[]> = new Map();

  private getUserNotificationList(userAddress: string): Notification[] {
    return this.notifications.get(userAddress) ?? [];
  }

  private getAlertName(alertData: unknown): string {
    if (alertData && typeof alertData === 'object' && 'name' in alertData) {
      const rawName = (alertData as { name?: unknown }).name;
      if (typeof rawName === 'string' && rawName.trim().length > 0) {
        return rawName;
      }
    }
    return 'Unnamed Alert';
  }

  /**
   * Create a notification
   */
  createNotification(
    userAddress: string,
    type: Notification['type'],
    title: string,
    message: string,
    priority: Notification['priority'] = 'normal'
  ): Notification {
    const notification: Notification = {
      id: randomUUID(),
      type,
      title,
      message,
      userAddress,
      priority,
      timestamp: Date.now(),
      read: false
    };

    // Store notification
    const userNotifications = this.getUserNotificationList(userAddress);
    userNotifications.unshift(notification);
    
    // Enforce limit
    if (userNotifications.length > MAX_NOTIFICATIONS_PER_USER) {
      userNotifications.splice(MAX_NOTIFICATIONS_PER_USER);
    }
    
    this.notifications.set(userAddress, userNotifications);
    logger.debug('Notification created', { userAddress, type, notificationId: notification.id });

    return notification;
  }

  /**
   * Get user notifications
   */
  getNotifications(userAddress: string, limit: number = 50): Notification[] {
    const userNotifications = this.getUserNotificationList(userAddress);
    const safeLimit = Number.isFinite(limit)
      ? Math.min(MAX_NOTIFICATIONS_PER_USER, Math.max(1, Math.floor(limit)))
      : 50;
    return userNotifications.slice(0, safeLimit);
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(userAddress: string): number {
    const userNotifications = this.getUserNotificationList(userAddress);
    return userNotifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(userAddress: string, notificationId: string): boolean {
    const userNotifications = this.getUserNotificationList(userAddress);
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
    const userNotifications = this.getUserNotificationList(userAddress);
    userNotifications.forEach(n => n.read = true);
  }

  /**
   * Delete a notification
   */
  deleteNotification(userAddress: string, notificationId: string): boolean {
    const userNotifications = this.getUserNotificationList(userAddress);
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
  sendAlertNotification(userAddress: string, alertData: unknown, priority: Notification['priority'] = 'high'): Notification {
    const alertName = this.getAlertName(alertData);
    return this.createNotification(
      userAddress,
      'alert',
      'Alert Triggered',
      `Your alert "${alertName}" has been triggered.`,
      priority
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

  /**
   * Send notification with retry
   */
  async sendWithRetry(
    userAddress: string,
    type: Notification['type'],
    title: string,
    message: string,
    priority: Notification['priority'] = 'normal',
    retries: number = DEFAULT_NOTIFICATION_RETRIES
  ): Promise<Notification | null> {
    const safeRetries = Number.isFinite(retries)
      ? Math.max(1, Math.floor(retries))
      : DEFAULT_NOTIFICATION_RETRIES;
    let lastError: unknown;
    
    for (let i = 0; i < safeRetries; i++) {
      try {
        // In a real app, this might involve an external push service
        return this.createNotification(userAddress, type, title, message, priority);
      } catch (err) {
        lastError = err;
        logger.warn(`Notification attempt ${i + 1} failed`, { userAddress, i, err });
        await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_BASE_MS * Math.pow(2, i))); // Exponential backoff
      }
    }
    
    logger.error('Failed to send notification after retries', { userAddress, retries: safeRetries, lastError });
    return null;
  }

  /**
   * Create notifications in batch
   */
  createNotificationsBatch(
    batch: Array<{
      userAddress: string;
      type: Notification['type'];
      title: string;
      message: string;
      priority?: Notification['priority'];
    }>
  ): Notification[] {
    logger.info('Creating notifications batch', { count: batch.length });
    return batch.map(item => 
      this.createNotification(item.userAddress, item.type, item.title, item.message, item.priority)
    );
  }
}

const notificationsService = new NotificationsService();

function normalizeNotificationType(type: string): Notification['type'] {
  if (type === 'alert' || type === 'badge' || type === 'subscription' || type === 'system') {
    return type;
  }
  return 'system';
}

export function saveUserPreferences(input: UserPreferences): UserPreferences {
  const existing = userPreferencesStore.get(input.address) || { address: input.address };
  const merged: UserPreferences = {
    ...existing,
    ...input,
    address: input.address,
  };
  userPreferencesStore.set(input.address, merged);
  return merged;
}

export function getUserPreferences(address: string): UserPreferences | undefined {
  return userPreferencesStore.get(address);
}

export function getAllUsers(): UserPreferences[] {
  return Array.from(userPreferencesStore.values());
}

export function deleteUserPreferences(address: string): boolean {
  return userPreferencesStore.delete(address);
}

export async function broadcastNotification(payload: NotificationPayload, recipients?: string[]): Promise<void> {
  const targets = recipients && recipients.length > 0
    ? Array.from(new Set(recipients))
    : Array.from(userPreferencesStore.keys());

  const normalizedType = normalizeNotificationType(payload.type);

  for (const address of targets) {
    notificationsService.createNotification(
      address,
      normalizedType,
      payload.title,
      payload.message,
      normalizedType === 'alert' ? 'high' : 'normal'
    );
  }

  logger.info('Notification broadcast queued', {
    recipients: targets.length,
    type: payload.type,
    txHash: payload.txHash,
  });
}

export default notificationsService;

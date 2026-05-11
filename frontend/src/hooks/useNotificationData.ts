import { useState, useEffect, useCallback } from 'react';

/**
 * A single in-app notification record.
 * @property read - Whether the user has seen this notification
 * @property txHash - Optional on-chain transaction hash associated with the event
 */
export interface Notification {
  id: string;
  type: 'whale' | 'contract' | 'nft' | 'token' | 'swap' | 'alert' | 'badge';
  title: string;
  message: string;
  txHash?: string;
  timestamp: Date;
  read: boolean;
}

/**
 * Hook for fetching and managing in-app notifications with 30-second polling.
 * @param limit - Maximum number of notifications to fetch (default: 50)
 */
export function useNotificationData(limit: number = 50) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';
      const response = await fetch(`${serverUrl}/api/notifications?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        if (data.notifications) {
          setNotifications(data.notifications.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll
  };
}

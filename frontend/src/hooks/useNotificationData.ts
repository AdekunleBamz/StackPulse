import { useState, useEffect, useCallback, useMemo } from 'react';

export interface Notification {
  id: string;
  type: 'whale' | 'contract' | 'nft' | 'token' | 'swap' | 'alert' | 'badge';
  title: string;
  message: string;
  txHash?: string;
  timestamp: Date;
  read: boolean;
}

export function useNotificationData(limit: number = 50) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

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

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

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

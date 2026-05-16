import { useCallback, useState } from 'react';

/**
 * Hook for managing browser Notification API permission and dispatching alerts.
 * Gracefully handles environments where the Notification API is unavailable (e.g., SSR).
 * @returns {{ permission, requestPermission, sendNotification }} Notification controls
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
  );

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied' as NotificationPermission;
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          body: 'StackPulse Alert Triggered',
          ...options
        });
      } catch (err) {
        console.warn('Desktop notification failed:', err);
      }
    }
  }, []);

  return { permission, requestPermission, sendNotification };
}

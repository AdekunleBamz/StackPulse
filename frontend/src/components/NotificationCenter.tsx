'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';
import { apiUrl } from '@/lib/env';
import logger from '@/lib/logger';

interface Notification {
  id: string;
  type: 'whale' | 'contract' | 'nft' | 'token' | 'swap' | 'alert' | 'badge';
  title: string;
  message: string;
  txHash?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationApiItem {
  id: string;
  type: Notification['type'];
  title: string;
  message: string;
  txHash?: string;
  timestamp: string;
  read: boolean;
}

const notificationIcons: Record<Notification['type'], string> = {
  whale: '🐋',
  contract: '📜',
  nft: '🎨',
  token: '🪙',
  swap: '💱',
  alert: '🔔',
  badge: '🏆',
};

const NOTIFICATION_DEFAULT_MAX = 50;
const NOTIFICATION_POLL_INTERVAL_MS = 30000;

interface NotificationCenterProps {
  maxNotifications?: number;
  pollInterval?: number;
}

export default function NotificationCenter({
  maxNotifications = NOTIFICATION_DEFAULT_MAX,
  pollInterval = NOTIFICATION_POLL_INTERVAL_MS,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const safeMaxNotifications = Number.isFinite(maxNotifications)
    ? Math.max(1, Math.floor(maxNotifications))
    : NOTIFICATION_DEFAULT_MAX;
  const safePollInterval = Number.isFinite(pollInterval)
    ? Math.max(1_000, Math.floor(pollInterval))
    : NOTIFICATION_POLL_INTERVAL_MS;

  // Fetch notifications from server
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(apiUrl(`/api/notifications?limit=${safeMaxNotifications}`), {
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.notifications) {
            setNotifications(
              (data.notifications as NotificationApiItem[]).map((n) => {
                const timestamp = new Date(n.timestamp);
                return {
                  ...n,
                  timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
                };
              })
            );
          }
        }
      } catch (error) {
        logger.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, safePollInterval);
    return () => clearInterval(interval);
  }, [safeMaxNotifications, safePollInterval]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

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

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded"
                  aria-label="Close notification panel"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[380px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm">We&apos;ll notify you of blockchain events</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-purple-900/10' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <span className="text-2xl">
                          {notificationIcons[notification.type] || '📢'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-white text-sm truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-gray-400 text-sm line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-gray-500 text-xs">
                              {formatTime(notification.timestamp)}
                            </span>
                            {notification.txHash && (
                              <a
                                href={`https://explorer.hiro.so/txid/${notification.txHash}?chain=mainnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`View transaction ${notification.txHash} on Hiro Explorer`}
                                title="View on Hiro Explorer"
                              >
                                View TX
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-700 flex justify-between">
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm text-gray-400 hover:text-white"
                  aria-label="Clear all notifications"
                >
                  Clear all
                </button>
                <a
                  href="/notifications"
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  View all →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

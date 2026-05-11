/** Notification delivery channel preferences for a user account. */
export interface NotificationPreference {
  email: string;
  discord: string;
  telegram: string;
}

/** Full user preferences including notification channels, theme, and marketing consent. */
export interface UserSettings {
  notifications: NotificationPreference;
  theme: 'dark' | 'light';
  marketing: boolean;
}

/** Union of supported notification delivery channel identifiers. */
export type ChannelAction = 'email' | 'discord' | 'telegram';

/** WebSocket connection status for real-time feed tracking */
export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

/** Tier classification for alert severity display */
export type AlertTier = 'low' | 'medium' | 'high' | 'critical';

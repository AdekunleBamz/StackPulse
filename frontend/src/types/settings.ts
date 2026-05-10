export interface NotificationPreference {
  email: string;
  discord: string;
  telegram: string;
}

export interface UserSettings {
  notifications: NotificationPreference;
  theme: 'dark' | 'light';
  marketing: boolean;
}

export type ChannelAction = 'email' | 'discord' | 'telegram';

/** WebSocket connection status for real-time feed tracking */
export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

/** Tier classification for alert severity display */
export type AlertTier = 'low' | 'medium' | 'high' | 'critical';

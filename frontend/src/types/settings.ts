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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import Link from 'next/link';
import {
  Settings,
  Bell,
  Mail,
  MessageCircle,
  Smartphone,
  Shield,
  CreditCard,
  User,
  Zap,
  Save,
  Check,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import CopyButton from '@/components/ui/CopyButton';
import { toast } from '@/components/Toast';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import { Breadcrumbs } from '@/components';

interface UserSettings {
  notifications: {
    email: boolean;
    discord: boolean;
    telegram: boolean;
    push: boolean;
  };
  alertTypes: {
    whale: boolean;
    contract: boolean;
    nft: boolean;
    token: boolean;
    swap: boolean;
  };
  profile: {
    username: string;
    email: string;
    discord: string;
    telegram: string;
  };
  preferences: {
    theme: 'dark' | 'light' | 'system';
    language: string;
    timezone: string;
  };
}

const ToggleSwitch = ({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? 'bg-purple-600' : 'bg-gray-600'
    } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90`}
    role="switch"
    aria-checked={enabled}
    aria-label={label}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const SettingsSection = ({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
    <div className="flex items-start gap-4 mb-6">
      <div className="p-2 bg-gray-700 rounded-lg">
        <Icon className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

import { ErrorState } from '@/components/EmptyState';

export default function SettingsPage() {
  const { isConnected, address, disconnect } = useWallet();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      discord: false,
      telegram: false,
      push: true,
    },
    alertTypes: {
      whale: true,
      contract: true,
      nft: true,
      token: true,
      swap: true,
    },
    profile: {
      username: '',
      email: '',
      discord: '',
      telegram: '',
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
    },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://stackpulse-b8fw.onrender.com';
      const response = await fetch(`${serverUrl}/api/users/${address}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setSettings(prev => ({
            ...prev,
            profile: {
              username: data.data.username || '',
              email: data.data.email || '',
              discord: data.data.discord || '',
              telegram: data.data.telegram || '',
            },
          }));
        }
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load your profile settings. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (!address) return;
    
    const toastId = toast.loading('Saving Settings', 'Updating your profile preferences...');
    setSaving(true);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://stackpulse-b8fw.onrender.com';
      const res = await fetch(`${serverUrl}/api/users/${address}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings.profile,
          enabledAlerts: Object.entries(settings.alertTypes)
            .filter(([, enabled]) => enabled)
            .map(([type]) => type),
        }),
      });
      toast.dismiss(toastId);
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      toast.success('Settings saved');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.dismiss(toastId);
      toast.error('Save failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateNotification = (key: keyof typeof settings.notifications, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateAlertType = (key: keyof typeof settings.alertTypes, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      alertTypes: { ...prev.alertTypes, [key]: value },
    }));
  };

  const updateProfile = (key: keyof typeof settings.profile, value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [key]: value },
    }));
  };

  if (!isConnected) {
    return (
      <main id="main" className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Settings className="w-16 h-16 text-gray-700 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Connect Wallet</h2>
          <p className="text-gray-400 mb-8">Please connect your wallet to manage your account settings and notification preferences.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors">
            Go to Home
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main id="main" className="min-h-screen bg-gray-950 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="h-10 w-48 bg-gray-800 rounded-lg animate-pulse" />
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main id="main" className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <ErrorState 
          message={error} 
          onRetry={loadSettings}
          className="max-w-md bg-gray-900 border border-gray-800 p-8 rounded-3xl"
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">StackPulse</span>
          </Link>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 rounded-lg text-sm font-medium transition-all"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </header>

      <main id="main" className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Breadcrumbs />
        {/* Profile Section */}
        <SettingsSection
          title="Profile"
          description="Manage your profile information"
          icon={User}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Wallet Address</label>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 font-mono text-sm truncate">
                  {address}
                </div>
                <CopyButton value={address || ''} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input
                type="text"
                value={settings.profile.username}
                onChange={(e) => updateProfile('username', e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) => updateProfile('email', e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </SettingsSection>

        {/* Notification Channels */}
        <SettingsSection
          title="Notification Channels"
          description="Choose how you want to receive alerts"
          icon={Bell}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white">Email Notifications</p>
                  <p className="text-gray-500 text-sm">Receive alerts via email</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.notifications.email}
                onChange={(v) => updateNotification('email', v)}
                label="Email notifications"
              />
            </div>
            
            <div className="flex items-center justify-between py-2 border-t border-gray-700 pt-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white">Discord Notifications</p>
                  <p className="text-gray-500 text-sm">Get alerts in Discord</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.notifications.discord}
                onChange={(v) => updateNotification('discord', v)}
                label="Discord notifications"
              />
            </div>

            {settings.notifications.discord && (
              <input
                type="text"
                value={settings.profile.discord}
                onChange={(e) => updateProfile('discord', e.target.value)}
                placeholder="Discord webhook URL"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            )}
            
            <div className="flex items-center justify-between py-2 border-t border-gray-700 pt-4">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white">Telegram Notifications</p>
                  <p className="text-gray-500 text-sm">Receive alerts on Telegram</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.notifications.telegram}
                onChange={(v) => updateNotification('telegram', v)}
                label="Telegram notifications"
              />
            </div>

            {settings.notifications.telegram && (
              <input
                type="text"
                value={settings.profile.telegram}
                onChange={(e) => updateProfile('telegram', e.target.value)}
                placeholder="@username or chat ID"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            )}
          </div>
        </SettingsSection>

        {/* Alert Types */}
        <SettingsSection
          title="Alert Types"
          description="Choose which blockchain events to monitor"
          icon={Zap}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'whale', icon: '🐋', name: 'Whale Transfers', desc: 'Large STX transfers' },
              { key: 'contract', icon: '📜', name: 'Contract Deploys', desc: 'New smart contracts' },
              { key: 'nft', icon: '🎨', name: 'NFT Mints', desc: 'NFT minting events' },
              { key: 'token', icon: '🪙', name: 'Token Launches', desc: 'New token deployments' },
              { key: 'swap', icon: '💱', name: 'Large Swaps', desc: 'DEX swap events' },
            ].map((alert) => (
              <button
                type="button"
                key={alert.key}
                className={`w-full text-left flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90 ${
                  settings.alertTypes[alert.key as keyof typeof settings.alertTypes]
                    ? 'bg-purple-900/20 border-purple-500/50'
                    : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                }`}
                onClick={() =>
                  updateAlertType(
                    alert.key as keyof typeof settings.alertTypes,
                    !settings.alertTypes[alert.key as keyof typeof settings.alertTypes]
                  )
                }
                aria-pressed={settings.alertTypes[alert.key as keyof typeof settings.alertTypes]}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{alert.icon}</span>
                  <div>
                    <p className="text-white font-medium">{alert.name}</p>
                    <p className="text-gray-500 text-sm">{alert.desc}</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    settings.alertTypes[alert.key as keyof typeof settings.alertTypes]
                      ? 'bg-purple-600 border-purple-600'
                      : 'border-gray-600'
                  }`}
                >
                  {settings.alertTypes[alert.key as keyof typeof settings.alertTypes] && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </SettingsSection>

        {/* Subscription */}
        <SettingsSection
          title="Subscription"
          description="Manage your subscription and billing"
          icon={CreditCard}
        >
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
            <div>
              <p className="text-white font-medium">Current Plan: Free</p>
              <p className="text-gray-400 text-sm">3 alerts, basic features</p>
            </div>
            <Link
              href="/register"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-all"
            >
              Upgrade
            </Link>
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection
          title="Danger Zone"
          description="Irreversible account actions"
          icon={Shield}
        >
          <div className="space-y-4">
            <button
              type="button"
              onClick={() =>
                confirm({
                  title: 'Disconnect wallet?',
                  message: 'You can reconnect anytime, but you may need to re-approve wallet permissions.',
                  confirmLabel: 'Disconnect',
                  cancelLabel: 'Cancel',
                  variant: 'warning',
                  onConfirm: () => disconnect(),
                })
              }
              className="w-full py-3 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
            >
              Disconnect Wallet
            </button>
          </div>
        </SettingsSection>
      </main>
      {ConfirmDialog}
    </div>
  );
}

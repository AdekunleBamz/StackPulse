'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/Toast';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import { NoAlertsState } from '@/components/EmptyState';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import Button from '@/components/ui/Button';
import { useAccount } from '@/hooks/useAccount';
import { useSound } from '@/hooks/useSound';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Bell, 
  Wallet, 
  Plus, 
  Activity,
  Zap,
  FileCode,
  Image,
  Coins,
  ArrowLeftRight,
  Award,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Volume2,
  VolumeX,
  Monitor,
  MonitorOff
} from 'lucide-react';
import { Breadcrumbs } from '@/components';
import { apiUrl } from '@/lib/env';
import { CONTRACT_NAMES, DEPLOYER_ADDRESS } from '@/lib/contracts';
import { logger } from '@/lib/logger';

/** Alert type definitions matching contract event types and chainhook configurations. */
const alertTypes = [
  { id: 1, name: 'Whale Transfers', icon: Wallet, description: 'Large STX transfers (>10,000 STX)', iconBgClass: 'bg-blue-500/20', iconClass: 'text-blue-400' },
  { id: 2, name: 'Contract Deployments', icon: FileCode, description: 'New smart contract deployments', iconBgClass: 'bg-purple-500/20', iconClass: 'text-purple-400' },
  { id: 3, name: 'NFT Mints', icon: Image, description: 'NFT collection mints', iconBgClass: 'bg-pink-500/20', iconClass: 'text-pink-400' },
  { id: 4, name: 'Token Launches', icon: Coins, description: 'New SIP-010 token deployments', iconBgClass: 'bg-yellow-500/20', iconClass: 'text-yellow-300' },
  { id: 5, name: 'Large Swaps', icon: ArrowLeftRight, description: 'DEX swaps over threshold', iconBgClass: 'bg-green-500/20', iconClass: 'text-green-400' },
  { id: 6, name: 'Address Watch', icon: Activity, description: 'Monitor specific addresses', iconBgClass: 'bg-orange-500/20', iconClass: 'text-orange-300' },
];

export interface DashboardAlert {
  id: number;
  type: number;
  name: string;
  enabled: boolean;
  threshold?: number;
  targetAddress?: string;
  triggerCount: number;
  createdAt?: string;
}

export interface AlertHistoryItem {
  id: string;
  alertId: number;
  type: number;
  message: string;
  timestamp: string;
  txId?: string;
  data?: unknown;
}

export default function DashboardPage() {
  const { address, isConnected, connect, userData, isLoading: isAccountLoading } = useAccount();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlertType, setNewAlertType] = useState(1);
  const [newAlertName, setNewAlertName] = useState('');
  const [newAlertThreshold, setNewAlertThreshold] = useState('10000');
  const [history, setHistory] = useState<AlertHistoryItem[]>([]);
  const [visibleHistoryLimit, setVisibleHistoryLimit] = useState(10);
  const { enabled: soundEnabled, toggle: toggleSound, playSound } = useSound();
  const { permission: notifyPermission, requestPermission, sendNotification } = useNotifications();
  const createAlertSelectRef = useRef<HTMLSelectElement>(null);
  const createAlertTitleId = useId();
  const createAlertDescId = useId();
  const maxAlerts: Record<number, number> = { 0: 3, 1: 10, 2: 25, 3: 100 };
  const tierNames = ['Free', 'Basic', 'Pro', 'Premium'];

  const clearHistory = () => {
    setHistory([]);
  };
  
  // Load alerts from server when address changes
  useEffect(() => {
    const loadAlerts = async () => {
      if (!address) return;
      try {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://stackpulse-b8fw.onrender.com';
        const alertsResponse = await fetch(`${serverUrl}/api/users/${address}/alerts`);
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          if (alertsData.alerts) {
            setAlerts(alertsData.alerts);
          }
        }
      } catch (err) {
        console.error('Error loading alerts:', err);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadAlerts();
  }, [address]);

  const isLoading = isAccountLoading || (isConnected && isDataLoading);

  useEffect(() => {
    if (!showCreateAlert) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => createAlertSelectRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCreateAlert(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [showCreateAlert]);

  // Create alert on-chain
  const handleCreateAlert = async () => {
    if (!address || !userData) return;

    const toastId = toast.loading('Creating Alert', 'Waiting for wallet confirmation...');
    setIsCreating(true);
    try {
      const { openContractCall } = await import('@stacks/connect');
      const { uintCV, stringAsciiCV, noneCV } = await import('@stacks/transactions');

      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAMES.alertManager,
        functionName: 'create-alert',
        functionArgs: [
          uintCV(newAlertType),
          stringAsciiCV(newAlertName || alertTypes[newAlertType - 1].name),
          noneCV(), // target address (optional)
          uintCV(Number.parseInt(newAlertThreshold) || 10000)
        ],
        onFinish: async (data: { txId: string }) => {
          logger.info('Alert created:', data.txId);
          toast.dismiss(toastId);
          
          // Save to server too
          try {
            await fetch(apiUrl(`/api/users/${address}/alerts`), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: newAlertType,
                name: newAlertName || alertTypes[newAlertType - 1].name,
                threshold: Number.parseInt(newAlertThreshold) || 10000,
                txId: data.txId
              })
            });
          } catch (err) {
            logger.error('Error saving alert to server:', err);
            toast.warning('Alert created', 'Saved on-chain but failed to sync to server.');
          }

          toast.success('Alert created', `TX: ${data.txId}`);
          playSound('success');
          sendNotification('Alert Created', { body: `Alert "${newAlertName || alertTypes[newAlertType - 1].name}" is now active.` });
          setShowCreateAlert(false);
          setNewAlertName('');
          setNewAlertThreshold('10000');
          
          // Add to local state optimistically
          setAlerts(prev => [...prev, {
            id: Date.now(),
            type: newAlertType,
            name: newAlertName || alertTypes[newAlertType - 1].name,
            enabled: true,
            threshold: Number.parseInt(newAlertThreshold),
            triggerCount: 0
          }]);
          setIsCreating(false);
        },
        onCancel: () => {
          logger.debug('Alert creation cancelled');
          toast.dismiss(toastId);
          setIsCreating(false);
        }
      });
    } catch (error) {
      logger.error('Error creating alert:', error);
      toast.dismiss(toastId);
      toast.error('Failed to create alert', 'Please try again.');
      setIsCreating(false);
    } finally {
      // Note: setIsCreating(false) is handled in callbacks because openContractCall is async-finish
    }
  };

  // Toggle alert on/off
  const toggleAlert = async (alertId: number) => {
    const existing = alerts.find((a) => a.id === alertId);
    const nextEnabled = !(existing?.enabled ?? false);
    const toastId = toast.loading('Syncing', `Updating ${existing?.name || 'alert'}...`);

    // Update local state
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, enabled: nextEnabled } : a
    ));

    // Update on server
    try {
      const res = await fetch(apiUrl(`/api/users/${address}/alerts/${alertId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      toast.success('Status Updated', `${existing?.name || 'Alert'} is now ${nextEnabled ? 'enabled' : 'disabled'}.`);
      playSound('notification');
      sendNotification('Status Updated', { body: `${existing?.name || 'Alert'} is now ${nextEnabled ? 'enabled' : 'disabled'}.` });
    } catch (err) {
      logger.error('Error toggling alert:', err);
      // Revert optimism
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, enabled: !nextEnabled } : a))
      );
      toast.error('Sync Failed', 'Could not update alert status. Please try again.');
    } finally {
      toast.dismiss(toastId);
    }
  };

  // Delete alert
  const deleteAlert = async (alertId: number) => {
    confirm({
      title: 'Delete alert?',
      message: 'This removes the alert from your dashboard. You can recreate it anytime.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        const toastId = toast.loading('Deleting', 'Removing alert from dashboard...');
        let removedAlert: DashboardAlert | undefined;
        setAlerts((prev) => {
          removedAlert = prev.find((a) => a.id === alertId);
          return prev.filter((a) => a.id !== alertId);
        });

        try {
          const res = await fetch(apiUrl(`/api/users/${address}/alerts/${alertId}`), {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Delete failed');
          toast.dismiss(toastId);
          toast.success('Alert deleted');
        } catch (err) {
          logger.error('Error deleting alert:', err);
          toast.dismiss(toastId);
          if (removedAlert) {
            setAlerts((prev) => [removedAlert!, ...prev]);
          }
          toast.error('Delete failed', 'Please try again.');
        }
      },
    });
  };

  // Not connected - show connect prompt
  if (!isConnected) {
    return (
      <main id="main" className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400 mb-8">Connect your Stacks wallet to access your dashboard</p>
          <Button
            onClick={connect}
            variant="primary"
            size="lg"
          >
            Connect Wallet
          </Button>
        </div>
      </main>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <main id="main" className="min-h-screen bg-gray-950 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-40 bg-gray-800 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-56 bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="h-10 w-40 bg-gray-800 rounded-xl animate-pulse" />
          </div>
          <DashboardSkeleton />
        </div>
      </main>
    );
  }

  // Not registered - redirect to pricing
  if (!userData) {
    return (
      <main id="main" className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Register First</h1>
          <p className="text-gray-400 mb-8">You need to register on StackPulse before accessing the dashboard</p>
          <Button
            onClick={() => router.push('/#pricing')}
            variant="primary"
            size="lg"
          >
            Register Now
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs />
        {/* Header */}
	        <div className="flex items-center justify-between mb-8">
	          <div>
	            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
	            <p className="text-gray-400">Welcome back, {userData.username || 'User'}</p>
	          </div>
	          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
              <span className="text-gray-400 text-sm">Plan: </span>
              <span className={`font-bold ${
                userData.tier === 0 ? 'text-gray-300' :
                userData.tier === 2 ? 'text-purple-400' :
                'text-yellow-400'
              }`}>
                {tierNames[userData.tier]}
              </span>
	            </div>
	            <Button
	              onClick={() => router.push('/#pricing')}
	              variant="primary"
	              size="md"
	            >
	              {userData.tier === 0 ? 'Upgrade' : 'Manage Plan'}
	            </Button>
	            <button
	              onClick={toggleSound}
	              className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all text-purple-400"
	              title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
	            >
	              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
	            </button>
	            <button
	              onClick={requestPermission}
	              className={`p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all ${notifyPermission === 'granted' ? 'text-blue-400' : 'text-gray-500'}`}
	              title={notifyPermission === 'granted' ? 'Notifications enabled' : 'Enable desktop notifications'}
	            >
	              {notifyPermission === 'granted' ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
	            </button>
	          </div>
	        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8" role="region" aria-label="Quick Statistics">
          <div 
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-fade-in hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
            style={{ animationDelay: '0ms', animationFillMode: 'both' }}
            role="status"
            aria-label={`${alerts.filter(a => a.enabled).length} Active Alerts`}
          >
            <div className="flex items-center gap-3 mb-2" aria-hidden="true">
              <Bell className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Active Alerts</span>
            </div>
            <p className="text-3xl font-bold text-white">{alerts.filter(a => a.enabled).length}</p>
            <p className="text-sm text-gray-400">of {maxAlerts[userData.tier]} max</p>
          </div>
          <div 
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-fade-in hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
            role="status"
            aria-label={`${alerts.reduce((sum, a) => sum + a.triggerCount, 0)} Total Triggers Today`}
          >
            <div className="flex items-center gap-3 mb-2" aria-hidden="true">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400">Triggers Today</span>
            </div>
            <p className="text-3xl font-bold text-white">{alerts.reduce((sum, a) => sum + a.triggerCount, 0)}</p>
            <p className="text-sm text-gray-400">notifications sent</p>
          </div>
          <div 
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-fade-in hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
            style={{ animationDelay: '200ms', animationFillMode: 'both' }}
            role="status"
            aria-label={`${new Set(alerts.map(a => a.type)).size} Alert Types Monitored`}
          >
            <div className="flex items-center gap-3 mb-2" aria-hidden="true">
              <Activity className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">Alert Types</span>
            </div>
            <p className="text-3xl font-bold text-white">{new Set(alerts.map(a => a.type)).size}</p>
            <p className="text-sm text-gray-400">categories monitored</p>
          </div>
          <div 
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-fade-in hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
            style={{ animationDelay: '300ms', animationFillMode: 'both' }}
            role="status"
            aria-label="0 Badges Earned"
          >
            <div className="flex items-center gap-3 mb-2" aria-hidden="true">
              <Award className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Badges Earned</span>
            </div>
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-sm text-gray-400">reputation NFTs</p>
          </div>
        </div>

        {/* Alert Types Section */}
	        <div className="mb-8">
	          <div className="flex items-center justify-between mb-4">
	            <h2 className="text-xl font-bold text-white">Available Alert Types</h2>
	            <div className="flex flex-col items-end gap-1">
	              <Button
	                onClick={() => {
	                  setNewAlertName((prev) => (prev.trim() ? prev : alertTypes[newAlertType - 1]?.name || ''));
	                  setShowCreateAlert(true);
	                }}
	                disabled={alerts.length >= maxAlerts[userData.tier]}
	                variant="primary"
	                size="md"
	                leftIcon={<Plus className="w-4 h-4" />}
	              >
	                Create Alert
	              </Button>
	              {alerts.length >= maxAlerts[userData.tier] && (
	                <span className="text-xs text-yellow-300">
	                  Limit reached ({maxAlerts[userData.tier]} alerts). Upgrade to add more.
	                </span>
	              )}
	            </div>
	          </div>
	          
	          <div className="grid md:grid-cols-3 gap-4">
	            {alertTypes.map((type) => (
	              <div key={type.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all">
	                <div className="flex items-center gap-3 mb-3">
	                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.iconBgClass}`}>
	                    <type.icon className={`w-5 h-5 ${type.iconClass}`} />
	                  </div>
	                  <h3 className="text-white font-semibold">{type.name}</h3>
	                </div>
                <p className="text-gray-400 text-sm mb-4">{type.description}</p>
	                <Button
	                  onClick={() => {
	                    setNewAlertType(type.id);
	                    setNewAlertName(type.name);
	                    setShowCreateAlert(true);
	                  }}
	                  disabled={alerts.length >= maxAlerts[userData.tier]}
	                  variant="secondary"
	                  size="sm"
	                  className="w-full rounded-lg"
	                >
	                  {alerts.some(a => a.type === type.id) ? 'Add Another' : 'Enable'}
	                </Button>
	              </div>
	            ))}
	          </div>
	        </div>

        {/* My Alerts Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">My Alerts</h2>
          
	          {alerts.length === 0 ? (
	            <div className="bg-gray-800 rounded-xl border border-gray-700">
	              <NoAlertsState onCreateAlert={() => setShowCreateAlert(true)} />
	            </div>
	          ) : (
            <div className="space-y-3" role="list">
              {alerts.map((alert, index) => {
                const alertType = alertTypes.find(t => t.id === alert.type);
                return (
                  <div 
                    key={alert.id} 
                    className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between animate-slide-up hover:border-purple-500/50 transition-colors"
                    style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                    role="listitem"
                    aria-label={`Alert: ${alert.name}, ${alert.enabled ? 'Enabled' : 'Disabled'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert.enabled ? 'bg-purple-500/20' : 'bg-gray-700'}`}>
                        {alertType && <alertType.icon className={`w-5 h-5 ${alert.enabled ? 'text-purple-400' : 'text-gray-500'}`} />}
                      </div>
                      <div>
                        <h4 className={`font-semibold ${alert.enabled ? 'text-white' : 'text-gray-400'}`}>{alert.name}</h4>
                        <p className="text-gray-400 text-sm">
                          {alertType?.description} • {alert.triggerCount} triggers
                        </p>
                      </div>
                    </div>
	                    <div className="flex items-center gap-3">
	                      <button
	                        type="button"
	                        onClick={() => toggleAlert(alert.id)}
	                        className="p-2 hover:bg-gray-700 rounded-lg transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
	                        aria-pressed={alert.enabled}
	                        aria-label={alert.enabled ? 'Disable alert' : 'Enable alert'}
	                        title={alert.enabled ? 'Disable alert' : 'Enable alert'}
	                      >
	                        {alert.enabled ? (
	                          <ToggleRight className="w-6 h-6 text-green-500" />
	                        ) : (
	                          <ToggleLeft className="w-6 h-6 text-gray-500" />
	                        )}
	                      </button>
	                      <button
	                        type="button"
	                        onClick={() => deleteAlert(alert.id)}
	                        className="p-2 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
	                        aria-label="Delete alert"
	                        title="Delete alert"
	                      >
	                        <Trash2 className="w-5 h-5 text-red-400" />
	                      </button>
	                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-12 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear History
              </button>
            )}
          </div>

          {isDataLoading ? (
            <HistorySkeleton />
          ) : history.length === 0 ? (
            <div className="bg-gray-900/40 rounded-2xl border border-gray-800/50 p-12 text-center">
              <div className="w-16 h-16 bg-gray-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-40">
                <Activity className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-500 font-medium">No recent activity detected.</p>
              <p className="text-gray-600 text-xs mt-1">Alert triggers will appear here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.slice(0, visibleHistoryLimit).map((item, idx) => (
                <ActivityItem 
                  key={item.id} 
                  item={item} 
                  index={idx} 
                />
              ))}
              
              {history.length > visibleHistoryLimit && (
                <div className="pt-2 flex justify-center">
                  <button
                    onClick={() => setVisibleHistoryLimit(prev => prev + 10)}
                    className="px-6 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 text-gray-400 text-xs font-bold transition-all hover:text-purple-400 active:scale-95"
                  >
                    Load More Activity
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Alert Modal */}
        {showCreateAlert && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateAlert(false)}
          >
            <div
              className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl shadow-purple-900/40 animate-zoom-in"
              role="dialog"
              aria-modal="true"
              aria-labelledby={createAlertTitleId}
              aria-describedby={createAlertDescId}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id={createAlertTitleId} className="text-xl font-bold text-white mb-2">
                Create New Alert
              </h3>
              <p id={createAlertDescId} className="text-sm text-gray-400 mb-6">
                Choose an alert type and set a threshold if needed.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Alert Type</label>
                  <select
                    ref={createAlertSelectRef}
                    value={newAlertType}
                    onChange={(e) => {
                      setNewAlertType(Number.parseInt(e.target.value));
                      setNewAlertName(alertTypes[Number.parseInt(e.target.value) - 1].name);
                    }}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]"
                  >
                    {alertTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Alert Name</label>
                  <input
                    type="text"
                    value={newAlertName}
                    onChange={(e) => setNewAlertName(e.target.value)}
                    placeholder="My Whale Alert"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]"
                  />
                </div>

	                {(newAlertType === 1 || newAlertType === 5) && (
	                  <div>
	                    <label className="block text-gray-400 text-sm mb-2">Threshold (STX)</label>
	                    <input
	                      type="number"
	                      min={1}
	                      step={1}
	                      inputMode="numeric"
	                      value={newAlertThreshold}
	                      onChange={(e) => setNewAlertThreshold(e.target.value)}
	                      placeholder="10000"
	                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]"
	                    />
                    <p className="text-gray-500 text-xs mt-1">Alert when transfers exceed this amount</p>
                  </div>
                )}
              </div>

	              <div className="flex gap-3 mt-6">
	                <Button
	                  onClick={() => setShowCreateAlert(false)}
	                  variant="secondary"
	                  className="flex-1"
	                >
	                  Cancel
	                </Button>
	                <Button
	                  onClick={handleCreateAlert}
	                  disabled={!newAlertName.trim()}
	                  variant="primary"
	                  className="flex-1"
	                  isLoading={isCreating}
	                >
	                  Create Alert
	                </Button>
	              </div>
            </div>
          </div>
        )}
      </div>
      {ConfirmDialog}
    </main>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-20 rounded-2xl border border-gray-800/50 bg-gray-900/40 animate-pulse"
        />
      ))}
    </div>
  );
}

function ActivityItem({ item, index }: { item: AlertHistoryItem; index: number }) {
  return (
    <div
      className="rounded-2xl border border-gray-800/50 bg-gray-900/40 p-4"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <p className="text-sm text-white">{item.message}</p>
      <p className="mt-1 text-xs text-gray-500">
        {new Date(item.timestamp).toLocaleString()}
      </p>
    </div>
  );
}

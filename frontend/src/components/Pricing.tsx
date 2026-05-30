'use client';

import { Check, Wallet, Mail, 
  MessageCircle, 
  Send, 
  CheckCircle2,
  Activity,
  Zap,
  X
} from 'lucide-react';
import { useEffect, useId, useState, memo } from 'react';
import { toast } from '@/components/Toast';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useAccount } from '@/hooks/useAccount';
import { DEPLOYER_ADDRESS, apiUrl } from '@/lib/env';
import { logger } from '@/lib/logger';

const tiers = [
  {
    name: 'Free',
    price: 0,
    tier: 0,
    features: [
      '3 Active Alerts',
      'Email Notifications',
      'Basic Dashboard',
      'Community Support',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    price: 5,
    tier: 2,
    features: [
      '25 Active Alerts',
      'Discord & Telegram',
      'Advanced Filters',
      'API Access',
      'Priority Support',
    ],
    popular: true, // Most popular plan
  },
  {
    name: 'Premium',
    price: 20,
    tier: 3,
    features: [
      'Unlimited Alerts',
      'All Integrations',
      'Custom Webhooks',
      'White-label Options',
      'Dedicated Support',
      'Early Access Features',
    ],
    popular: false,
  },
] as const;

const PRICING_USERNAME_MIN_LENGTH = 3;
const PRICING_USERNAME_MAX_LENGTH = 20;
const TIER_NAMES = ['Free', 'Basic', 'Pro', 'Premium'];
const TIER_PRICES_MICRO_STX: Record<number, number> = {
  0: 0,
  1: 1_000_000,
  2: 5_000_000,
  3: 20_000_000,
};

type ChannelId = 'email' | 'discord' | 'telegram';

interface UserPreferences {
  username?: string;
  email?: string;
  discord?: string;
  telegram?: string;
}

interface ApiResponse<T> {
  user?: T;
  data?: T;
}

export default function Pricing() {
  const { 
    address, 
    isConnected, 
    connect, 
    isRegistered, 
    userData, 
    isLoading: isAccountLoading,
    refresh: refreshAccount 
  } = useAccount();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribingTier, setSubscribingTier] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState<string>('');
  const [discord, setDiscord] = useState<string>('');
  const [telegram, setTelegram] = useState<string>('');
  const [editingChannel, setEditingChannel] = useState<'email' | 'discord' | 'telegram' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const editChannelTitleId = useId();
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Sync state with userData from hook
  useEffect(() => {
    if (userData) {
      setUsername(userData.username || '');
    }
  }, [userData]);

  // Fetch preferences from server if registered
  useEffect(() => {
    const fetchPrefs = async () => {
      if (!isRegistered || !address) return;
      setIsDataLoading(true);
      try {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://stackpulse-b8fw.onrender.com';
        const prefsResponse = await fetch(`${serverUrl}/api/users/${address}`);
        if (prefsResponse.ok) {
          const prefsData: ApiResponse<UserPreferences> = await prefsResponse.json();
          const user = prefsData.user || prefsData.data;
          if (user) {
            setEmail(user.email || '');
            setDiscord(user.discord || '');
            setTelegram(user.telegram || '');
            if (user.username) setUsername(user.username);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user preferences:', err);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchPrefs();
  }, [isRegistered, address]);

  const isLoading = isAccountLoading || isDataLoading || isSubmitting;
  const currentTier = userData?.tier || 0;
  const alertsEnabled = userData?.alertsEnabled || 0;

  useEffect(() => {
    if (!editingChannel) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingChannel(null);
        setTempValue('');
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [editingChannel]);

  const handleRegister = async (selectedTier: number = 0) => {
    if (!isConnected) {
      connect();
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      toast.warning('Username required', 'Enter a username to continue.');
      return;
    }

    if (normalizedUsername.length < PRICING_USERNAME_MIN_LENGTH || normalizedUsername.length > PRICING_USERNAME_MAX_LENGTH) {
      toast.warning('Invalid username', `Username must be ${PRICING_USERNAME_MIN_LENGTH}–${PRICING_USERNAME_MAX_LENGTH} characters.`);
      return;
    }

    if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
      toast.warning('Invalid username', 'Use only letters, numbers, and underscores.');
      return;
    }

    // Calculate price for the tier (in microSTX)
    const price = TIER_PRICES_MICRO_STX[selectedTier] ?? 0;
    setIsSubmitting(true);
    setSubscribingTier(selectedTier);
    try {
      setUsername(normalizedUsername);
      const { openContractCall } = await import('@stacks/connect');
      const { stringAsciiCV, uintCV } = await import('@stacks/transactions');
 
      // Post-condition: allow STX transfer for paid tiers (new v7+ format)
      const postConditions: { type: 'stx-postcondition'; address: string; condition: 'eq'; amount: number }[] = price > 0 && address ? [
        {
          type: 'stx-postcondition',
          address: address,
          condition: 'eq',
          amount: price
        }
      ] : [];
 
      // V3 contract: register-and-subscribe combines both steps
      // alerts bitmask: 31 = all alerts enabled (1+2+4+8+16)
      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'stackpulse-v-j4',
        functionName: 'register-and-subscribe',
        functionArgs: [
          stringAsciiCV(normalizedUsername),
          stringAsciiCV(email || ''),
          uintCV(selectedTier),
          uintCV(31) // Enable all alert types
        ],
        postConditions,
        onFinish: async (data: { txId: string }) => {
          logger.info('Registration + Subscription submitted:', data.txId);
          
          // Save notification preferences to server
          try {
            await fetch(apiUrl('/api/users'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: address,
                username: normalizedUsername,
                email: email || undefined,
                discord: discord || undefined,
                telegram: telegram || undefined,
                tier: selectedTier,
                enabledAlerts: ['whale', 'contract', 'nft', 'token', 'swap', 'alert', 'badge']
              })
            });
            logger.debug('User preferences saved to server');
          } catch (err) {
            logger.error('Failed to save preferences:', err);
            toast.warning('Registered', 'Saved on-chain but failed to sync preferences.');
          }
          
          const tierName = selectedTier === 0 ? 'Free' : selectedTier === 2 ? 'Pro' : 'Premium';
          toast.success('Registration submitted', `Tier: ${tierName}. TX: ${data.txId}`);
          
          // Cache registration locally for instant UX on next visit
          if (address) {
            localStorage.setItem(`stackpulse_registered_${address}`, JSON.stringify({
              tier: selectedTier,
              username: normalizedUsername,
              timestamp: Date.now()
            }));
          }
          
          setSubscribingTier(null);
          await refreshAccount();
        },
        onCancel: () => {
          logger.debug('Registration cancelled');
          setSubscribingTier(null);
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      toast.error('Registration failed', 'Please try again.');
      setSubscribingTier(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscribe = async (tier: number) => {
    if (!isConnected) {
      connect();
      return;
    }

    // If not registered, do register-and-subscribe in one step
    if (!isRegistered) {
      if (!username.trim()) {
        toast.warning('Username required', 'Enter a username to register first.');
        return;
      }
      await handleRegister(tier);
      return;
    }

    // If already registered, upgrade subscription
    if (tier === 0) {
      toast.info('Free tier', 'Upgrade below for more features.');
      return;
    }

    // Calculate price for the tier (in microSTX)
    const price = TIER_PRICES_MICRO_STX[tier] || 0;
    setIsSubmitting(true);
    setSubscribingTier(tier);
    try {
      const { openContractCall } = await import('@stacks/connect');
      const { uintCV } = await import('@stacks/transactions');

      // Post-condition: allow STX transfer from user to contract owner (new v7+ format)
      const postConditions: { type: 'stx-postcondition'; address: string; condition: 'eq'; amount: number }[] = price > 0 && address ? [
        {
          type: 'stx-postcondition',
          address: address,
          condition: 'eq',
          amount: price
        }
      ] : [];

      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'stackpulse-v-j4',
        functionName: 'upgrade-subscription',
        functionArgs: [uintCV(tier)],
        postConditions,
        onFinish: async (data: { txId: string }) => {
          logger.info('Upgrade submitted:', data.txId);
          await refreshAccount();
          // Update cache
          if (address) {
            const cached = localStorage.getItem(`stackpulse_registered_${address}`);
            if (cached) {
              const data = JSON.parse(cached);
              data.tier = tier;
              localStorage.setItem(`stackpulse_registered_${address}`, JSON.stringify(data));
            }
          }
          toast.success(
            'Subscription upgraded',
            `${tier === 1 ? 'Basic' : tier === 2 ? 'Pro' : 'Premium'} tier. TX: ${data.txId}`
          );
          setSubscribingTier(null);
        },
        onCancel: () => {
          logger.debug('Upgrade cancelled');
          setSubscribingTier(null);
        },
      });
    } catch (error) {
      logger.error('Subscription error:', error);
      toast.error('Upgrade failed', 'Please try again.');
      setSubscribingTier(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save a notification channel update
  const saveChannelUpdate = async () => {
    if (!address || !editingChannel) return;
    
    let value = tempValue.trim();
    if (editingChannel === 'email' && value) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!isValidEmail) {
        toast.warning('Invalid email', 'Please enter a valid email address.');
        return;
      }
    }

    if (editingChannel === 'telegram' && value && !value.startsWith('@')) {
      value = `@${value}`;
      setTempValue(value);
    }

    setIsSaving(true);
    try {
      // Update local state
      if (editingChannel === 'email') setEmail(value);
      if (editingChannel === 'discord') setDiscord(value);
      if (editingChannel === 'telegram') setTelegram(value);
      
      // Save to server
      const res = await fetch(apiUrl(`/api/users/${address}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [editingChannel]: value || undefined
        })
      });
      if (!res.ok) throw new Error('Save failed');
      
      setEditingChannel(null);
      setTempValue('');
      toast.success('Saved');
    } catch (error) {
      logger.error('Failed to save channel:', error);
      toast.error('Save failed', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open edit modal for a channel
  const openEditChannel = (channel: 'email' | 'discord' | 'telegram') => {
    setEditingChannel(channel);
    if (channel === 'email') setTempValue(email);
    if (channel === 'discord') setTempValue(discord);
    if (channel === 'telegram') setTempValue(telegram);
  };  return (
    <section className="py-32 px-4 bg-[#030712] relative overflow-hidden" id="pricing">
      {/* Background depth layers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-purple-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-40 left-1/4 w-96 h-96 bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Registration Card - Always at top */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-gray-900/80 via-gray-900 to-indigo-950/20 rounded-3xl p-8 md:p-12 border border-gray-800 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
            {/* Subtle light streak */}
            <div className="absolute -inset-x-full top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent group-hover:inset-x-full transition-all duration-1000" />
            
            <div className="text-center mb-10">
              {isRegistered && (
                <div 
                  className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider"
                  role="status"
                  aria-label="Account is active"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                  Account Active
                </div>
              )}
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
                {isRegistered ? `Welcome, ${username}!` : 'Start Monitoring Stacks'}
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                {isRegistered 
                  ? 'Manage your account, notification channels, and active subscription below.'
                  : 'Connect your wallet and register a username to begin receiving real-time blockchain alerts.'
                }
              </p>
              
              {/* Current Plan Badge - Show when registered */}
              {isRegistered && (
                <div className="mt-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gray-800/40 border border-gray-700/50 backdrop-blur-sm">
                  <span className="text-gray-400 text-sm font-medium">Subscription:</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                    currentTier === 0 ? 'bg-gray-700 text-gray-300' :
                    currentTier === 1 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    currentTier === 2 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {TIER_NAMES[currentTier] || 'Free'}
                  </span>
                  {currentTier === 0 && (
                    <Link href="#pricing-tiers" className="text-xs text-purple-400 hover:text-purple-300 font-bold ml-1 transition-colors">
                      Upgrade Now →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {!isRegistered ? (
              <div className="max-w-xl mx-auto space-y-4">
                {/* Step 1: Wallet & Username Combined for cleaner look */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border transition-all ${isConnected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600'}`}>
                    <div className="flex items-center gap-3 mb-1">
                      <Wallet className={`w-4 h-4 ${isConnected ? 'text-emerald-400' : 'text-purple-400'}`} aria-hidden="true" />
                      <span className="text-white text-sm font-bold">1. Wallet</span>
                    </div>
                    {isConnected ? (
                      <p className="text-emerald-400 text-xs font-mono font-medium truncate">{address?.slice(0, 10)}...{address?.slice(-6)}</p>
                    ) : (
                      <button type="button" onClick={connect} className="text-purple-400 text-xs font-bold hover:underline">Connect Wallet →</button>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">1. Connect Wallet</h3>
                    <p className="text-gray-400 text-sm">
                      {isConnected ? `Connected: ${address?.slice(0, 8)}...${address?.slice(-6)}` : 'Connect your Stacks wallet'}
                    </p>
                  </div>
	                  {!isConnected && (
	                    <Button
	                      onClick={connect}
	                      variant="primary"
	                      size="sm"
	                    >
	                      Connect
	                    </Button>
	                  )}
                  {isConnected && <Check className="w-6 h-6 text-green-500" />}
                </div>

                {/* Step 2: Username */}
                <div className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xl">@</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">2. Choose Username</h3>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="e.g. Satoshi"
                      className="w-full bg-transparent border-none p-0 text-white text-xs font-medium focus:ring-0 placeholder-gray-500"
                      aria-label="Enter username"
                    />
                  </div>
                </div>

                {/* Optional Channels */}
                <div className="p-5 rounded-2xl bg-gray-800/20 border border-gray-700/30 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-center mb-1">Notification Channels (Optional)</h4>
                  <div className="grid gap-3">
                    <div className="relative group/input">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-colors group-focus-within/input:text-purple-400" aria-hidden="true" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email for alerts"
                        className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
                        aria-label="Email for notifications"
                      />
                    </div>
                  </div>
                </div>

                {/* Register Button */}
	                <Button
	                  onClick={() => handleRegister(0)}
	                  disabled={!isConnected || !username.trim() || isLoading}
	                  variant="primary"
	                  size="lg"
	                  className="w-full font-bold"
	                  isLoading={isLoading}
	                >
	                  Register Free on StackPulse
	                </Button>
              </div>
            ) : (
              /* Registered user - show notification settings */
              <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/30 rounded-2xl p-4 text-center border border-emerald-500/20">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3" aria-hidden="true">
                      <Wallet className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-white text-xs font-bold mb-1">Wallet</p>
                    <p className="text-emerald-400 text-[10px] font-mono">Connected</p>
                  </div>
                  {([
                    { id: 'email', icon: Mail, value: email, label: 'Email', color: 'bg-blue-500/10', iconColor: 'text-blue-400' },
                    { id: 'discord', icon: MessageCircle, value: discord, label: 'Discord', color: 'bg-indigo-500/10', iconColor: 'text-indigo-400' },
                    { id: 'telegram', icon: Send, value: telegram, label: 'Telegram', color: 'bg-sky-500/10', iconColor: 'text-sky-400' },
                  ] as const).map((chan: { id: ChannelId; icon: typeof Mail; value: string; label: string; color: string; iconColor: string }) => (
                    <button
                      key={chan.id}
                      type="button"
                      onClick={() => openEditChannel(chan.id)}
                      className="group bg-gray-800/30 rounded-2xl p-4 text-center border border-gray-700/50 hover:border-purple-500/30 hover:bg-gray-800/50 transition-all active:scale-95"
                    >
                      <div className={`w-10 h-10 ${chan.value ? 'bg-emerald-500/10' : chan.color} rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors`} aria-hidden="true">
                        <chan.icon className={`w-5 h-5 ${chan.value ? 'text-emerald-500' : chan.iconColor}`} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-white text-xs font-bold">{chan.label}</p>
                        <div className="flex items-center gap-1.5">
                          {chan.value ? (
                            <span className="flex items-center gap-0.5 text-[9px] font-black uppercase tracking-tighter text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded-md border border-emerald-500/10">
                              <CheckCircle2 className="w-2 h-2" />
                              Linked
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500 bg-gray-500/5 px-1.5 py-0.5 rounded-md border border-gray-500/10">
                              Disconnected
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Dashboard Shortcut & Preview */}
                <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-purple-400 border border-purple-500/20 rounded-2xl font-bold text-sm hover:bg-gray-700 transition-all active:scale-95"
                  >
                    <Activity className="w-4 h-4" />
                    Preview Alerts
                  </button>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-gray-950 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all shadow-xl shadow-white/5 group active:scale-95"
                  >
                    Go To Dashboard
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Notification Preview Modal */}
        {showPreview && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[110] p-4 animate-in fade-in zoom-in duration-300"
            onClick={() => setShowPreview(false)}
          >
            <div 
              className="bg-gray-900 border border-white/10 rounded-[2.5rem] max-w-2xl w-full p-8 md:p-12 shadow-[0_0_100px_rgba(168,85,247,0.15)] relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-black text-white">Alert Preview</h3>
                  <p className="text-gray-400 font-medium">How your notifications will appear</p>
                </div>
                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Discord Mockup */}
                <div className="bg-[#313338] rounded-xl p-4 border-l-4 border-[#5865F2] shadow-lg animate-in slide-in-from-left duration-500">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#5865F2] rounded-full flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold text-sm">StackPulse BOT</span>
                        <span className="bg-[#5865F2] text-[10px] text-white px-1 rounded uppercase font-bold">Bot</span>
                        <span className="text-gray-400 text-xs">Today at 1:42 PM</span>
                      </div>
                      <div className="text-[#DBDEE1] text-sm leading-relaxed">
                        <strong className="block text-white text-base mb-1">🚨 Whale Transfer Detected!</strong>
                        Address <code className="bg-black/20 px-1 rounded text-purple-400">SP3E...VY3B</code> transferred 
                        <strong className="text-emerald-400"> 25,000 STX</strong> to Bitrue.
                        <div className="mt-3 py-2 px-3 bg-black/20 rounded-lg border border-white/5 text-xs text-blue-400 font-mono">
                          TX: 0x4f12...a9c3
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Telegram Mockup */}
                <div className="bg-[#242F3D] rounded-xl p-4 shadow-lg animate-in slide-in-from-right duration-500 delay-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-[#3390EC] rounded-full flex items-center justify-center font-bold text-white text-xs">SP</div>
                    <span className="text-white font-bold text-sm">StackPulse Alerts</span>
                  </div>
                  <div className="text-[#E7E9ED] text-sm whitespace-pre-wrap">
                    🔥 <strong className="text-white font-extrabold uppercase tracking-tight">Contract Deployment</strong>{'\n'}
                    {'\n'}
                    New contract <code className="text-blue-400">alex-dao-v3</code> was deployed by <code className="text-blue-400">SP2Z...</code>
                    {'\n'}
                    {'\n'}
                    <span className="text-gray-400 italic">View on Stacks Explorer →</span>
                  </div>
                </div>

                {/* Email Mockup */}
                <div className="bg-white rounded-xl p-4 shadow-lg text-gray-900 animate-in slide-in-from-bottom duration-500 delay-200">
                  <div className="border-b pb-2 mb-3 flex items-center justify-between">
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded tracking-tighter">StackPulse Security</span>
                    <span className="text-[10px] text-gray-400">1:45 PM</span>
                  </div>
                  <h4 className="font-bold text-base mb-1">Daily Summary: {alertsEnabled} Actives</h4>
                  <p className="text-xs text-gray-600 leading-relaxed italic">
                    You had 12 triggers today. The largest was a 50k STX swap on ALEX DEX.
                  </p>
                </div>
              </div>
              
              <div className="mt-10 pt-6 border-t border-white/5 flex justify-center">
                <button 
                  onClick={() => setShowPreview(false)}
                  className="px-10 py-3 bg-purple-600 text-white rounded-2xl font-black text-sm hover:bg-purple-500 transition-all active:scale-95"
                >
                  Got It, Thanks!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Channel Modal */}
        {editingChannel && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
            onClick={() => {
              setEditingChannel(null);
              setTempValue('');
            }}
          >
            <div
              className="bg-gray-900/90 backdrop-blur-2xl rounded-3xl p-10 max-w-md w-full border border-white/5 shadow-[0_30px_70px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300 relative overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby={editChannelTitleId}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner" aria-hidden="true">
                  {editingChannel === 'email' && <Mail className="w-10 h-10 text-purple-400" />}
                  {editingChannel === 'discord' && <MessageCircle className="w-10 h-10 text-purple-400" />}
                  {editingChannel === 'telegram' && <Send className="w-10 h-10 text-purple-400" />}
                </div>
                <h3 id={editChannelTitleId} className="text-3xl font-bold text-white tracking-tight">
                  Update {editingChannel.charAt(0).toUpperCase() + editingChannel.slice(1)}
                </h3>
                <p className="text-gray-400 font-medium text-sm mt-2 opacity-80">Configure your alert destination</p>
              </div>
 
              <div className="relative mb-8">
                <input
                  id="edit-channel-input"
                  type={editingChannel === 'email' ? 'email' : 'text'}
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  placeholder={
                    editingChannel === 'email' ? 'your@email.com' :
                    editingChannel === 'discord' ? 'username#1234' :
                    '@username'
                  }
                  className="w-full bg-gray-950/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all font-bold text-lg text-center tracking-tight shadow-inner"
                  autoFocus
                  aria-label={`Enter your ${editingChannel}`}
                />
              </div>
 
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    setEditingChannel(null);
                    setTempValue('');
                  }}
                  variant="ghost"
                  className="rounded-2xl font-bold h-12 border border-white/5 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveChannelUpdate}
                  disabled={isSaving}
                  variant="primary"
                  className="rounded-2xl font-bold h-12 shadow-lg shadow-purple-600/20"
                  isLoading={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tiers Section */}
        <div id="pricing-tiers" className="scroll-mt-32 mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Upgrade your monitoring capabilities with our tailored plans. All plans include 24/7 uptime and global event detection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 md:gap-8 lg:gap-8 items-stretch">
            {tiers.map((tier) => (
              <PricingCard
                key={tier.tier}
                tier={tier}
                isRegistered={isRegistered}
                currentTier={currentTier}
                subscribingTier={subscribingTier}
                isLoading={isLoading}
                handleSubscribe={handleSubscribe}
              />
            ))}
          </div>

          {!isRegistered && (
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm font-medium">
                Please register above to unlock subscription options.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const PricingCard = memo(({ 
  tier, 
  isRegistered, 
  currentTier, 
  subscribingTier, 
  isLoading, 
  handleSubscribe 
}: {
  tier: {
    name: string;
    price: number;
    tier: number;
    features: readonly string[];
    popular: boolean;
  };
  isRegistered: boolean;
  currentTier: number;
  subscribingTier: number | null;
  isLoading: boolean;
  handleSubscribe: (tier: number) => void;
}) => {
  const isMostPopular = tier.name === 'Pro';
  
  return (
    <div
      className={`group relative flex flex-col backdrop-blur-xl transition-all duration-500 rounded-[2rem] p-8 sm:p-12 hover:-translate-y-3 hover:ring-1 ${
        isMostPopular
          ? 'border-2 border-purple-500/50 shadow-[0_20px_50px_-20px_rgba(168,85,247,0.25)] scale-[1.05] z-10 bg-gradient-to-br from-gray-900 via-purple-950/20 to-gray-900 hover:shadow-[0_30px_80px_-15px_rgba(168,85,247,0.5)] hover:border-purple-400 hover:ring-purple-500/40'
          : tier.popular
            ? 'border-2 border-purple-500/50 shadow-[0_20px_50px_-20px_rgba(168,85,247,0.15)] scale-[1.02] hover:scale-[1.05] z-10 bg-gradient-to-br from-gray-900/80 via-gray-900/40 to-purple-900/20 hover:shadow-[0_30px_70px_-15px_rgba(168,85,247,0.4)] hover:border-purple-400 hover:ring-purple-500/30'
            : tier.tier === currentTier && isRegistered
              ? 'bg-emerald-500/[0.03] border border-emerald-500/40 shadow-xl shadow-emerald-500/5 hover:scale-[1.03] hover:border-emerald-500/60 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.2)] hover:ring-emerald-500/30'
              : 'bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.05] hover:scale-[1.03] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] hover:ring-white/10'
      } ${!isRegistered ? 'opacity-75 blur-[0.3px]' : ''}`}
    >
      {/* Popular Badge */}
      {(tier.popular || isMostPopular) && (
        <div className={`absolute -top-5 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-[0.25em] px-6 py-2.5 rounded-full z-20 shadow-lg ${
          isMostPopular 
            ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 bg-[length:200%_auto] animate-shimmer shadow-purple-500/40' 
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-600/30'
        }`}>
          {isMostPopular ? 'Most Popular' : 'Popular'}
        </div>
      )}
      
      {/* Current Plan Badge */}
      {isRegistered && tier.tier === currentTier && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.25em] px-6 py-2.5 rounded-full shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)] z-20">
          ✓ Your Plan
        </div>
      )}

      <div className="mb-12">
        <h3 className={`text-xl font-black mb-2 tracking-tighter uppercase ${isMostPopular ? 'text-purple-400' : 'text-white opacity-50'}`}>{tier.name}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-2xl">{tier.price}</span>
          <div className="flex flex-col mb-1 ml-1">
            <span className="text-gray-400 font-black text-xs tracking-[0.2em]">STX</span>
            <span className="text-gray-500/40 font-bold text-[10px] uppercase tracking-widest">/ Month</span>
          </div>
        </div>
      </div>

      <ul className="space-y-5 mb-14 flex-1">
        {tier.features.map((feature, i) => (
          <li key={i} className="group/feature flex items-start gap-4 text-gray-400 font-medium text-[13px] leading-relaxed transition-colors hover:text-white">
            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 group-hover/feature:scale-110 ${
              isMostPopular 
                ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : tier.popular 
                  ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                  : 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
            }`}>
              <Check className="w-3 h-3" strokeWidth={4} />
            </div>
            <span className="group-hover/feature:translate-x-0.5 transition-transform duration-300">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => handleSubscribe(tier.tier)}
        disabled={!isRegistered || (isRegistered && tier.tier === currentTier) || isLoading}
        variant={tier.popular || isMostPopular ? 'primary' : 'secondary'}
        size="lg"
        className={`w-full h-13 rounded-2xl font-black transition-all duration-300 transform active:scale-[0.97] ${
          isMostPopular
            ? 'shadow-xl shadow-purple-600/40 hover:shadow-purple-600/60 hover:scale-[1.02] bg-gradient-to-r from-purple-600 to-indigo-600 border-none'
            : tier.popular 
              ? 'shadow-xl shadow-purple-600/20 hover:shadow-purple-600/50 hover:scale-[1.02]' 
              : 'border border-white/5 hover:border-white/20 hover:bg-white/5'
        }`}
        isLoading={subscribingTier === tier.tier}
      >
        {isRegistered && tier.tier === currentTier ? 'Active Plan' : tier.price === 0 ? 'Current Tier' : 'Upgrade Plan'}
      </Button>
    </div>
  );
});

PricingCard.displayName = 'PricingCard';

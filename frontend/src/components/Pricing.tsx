'use client';

import { useWallet } from '@/context/WalletContext';
import { Check, Wallet, Mail, MessageCircle, Send } from 'lucide-react';
import { useState, useEffect } from 'react';

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
    popular: true,
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
];

const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '';

export default function Pricing() {
  const { isConnected, connect, address } = useWallet();
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentTier, setCurrentTier] = useState(0);
  const [subscriptionEnds, setSubscriptionEnds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [discord, setDiscord] = useState('');
  const [telegram, setTelegram] = useState('');
  const [editingChannel, setEditingChannel] = useState<'email' | 'discord' | 'telegram' | null>(null);
  const [tempValue, setTempValue] = useState('');

  const tierNames = ['Free', 'Basic', 'Pro', 'Premium'];
  const tierColors = ['gray', 'blue', 'purple', 'yellow'];

  // Check registration status when wallet connects
  useEffect(() => {
    const checkRegistration = async () => {
      if (!address) return;
      
      // First check localStorage for cached registration (faster UX)
      const cachedReg = localStorage.getItem(`stackpulse_registered_${address}`);
      if (cachedReg) {
        const cached = JSON.parse(cachedReg);
        setIsRegistered(true);
        setCurrentTier(cached.tier || 0);
        setUsername(cached.username || '');
      }
      
      // Always check contract for latest data
      if (!DEPLOYER_ADDRESS) {
        console.warn('DEPLOYER_ADDRESS not set!');
        return;
      }
      
      try {
        const { principalCV, cvToHex, hexToCV, cvToValue } = await import('@stacks/transactions');
        
        console.log('Checking registration for:', address);
        console.log('Using contract:', DEPLOYER_ADDRESS);
        
        // Use V2 contract
        const response = await fetch(
          `https://api.mainnet.hiro.so/v2/contracts/call-read/${DEPLOYER_ADDRESS}/stackpulse-v2/get-user`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: address,
              arguments: [cvToHex(principalCV(address))]
            })
          }
        );
        
        const data = await response.json();
        console.log('Contract response:', data);
        
        // If result is not 0x09 (none), user is registered
        const registered = data.result && data.result !== '0x09';
        setIsRegistered(registered);
        
        // Parse user data to get tier
        if (registered && data.result) {
          try {
            const cv = hexToCV(data.result);
            const userData = cvToValue(cv);
            console.log('Parsed user data:', userData);
            if (userData && userData.value) {
              const tier = Number(userData.value.tier?.value || 0);
              const uname = userData.value.username?.value || '';
              setCurrentTier(tier);
              setSubscriptionEnds(Number(userData.value['subscription-ends']?.value || 0));
              setUsername(uname);
              
              // Cache registration status for faster future loads
              localStorage.setItem(`stackpulse_registered_${address}`, JSON.stringify({
                tier,
                username: uname,
                timestamp: Date.now()
              }));
            }
          } catch (parseErr) {
            console.error('Error parsing user data:', parseErr);
          }
        } else {
          // Not registered - clear any cached data
          localStorage.removeItem(`stackpulse_registered_${address}`);
        }
        
        // If registered, fetch saved notification preferences from server
        if (registered) {
          try {
            const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';
            const prefsResponse = await fetch(`${serverUrl}/api/users/${address}`);
            if (prefsResponse.ok) {
              const prefsData = await prefsResponse.json();
              if (prefsData.user) {
                setEmail(prefsData.user.email || '');
                setDiscord(prefsData.user.discord || '');
                setTelegram(prefsData.user.telegram || '');
                if (prefsData.user.username) setUsername(prefsData.user.username);
              }
            }
          } catch (err) {
            console.error('Failed to fetch user preferences:', err);
          }
        }
      } catch (error) {
        console.error('Error checking registration:', error);
      }
    };

    checkRegistration();
  }, [address]);

  const handleRegister = async (selectedTier: number = 0) => {
    if (!isConnected) {
      connect();
      return;
    }

    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    // Calculate price for the tier (in microSTX)
    const tierPrices: Record<number, number> = {
      0: 0,         // Free
      1: 1000000,   // 1 STX for Basic
      2: 5000000,   // 5 STX for Pro
      3: 20000000,  // 20 STX for Premium
    };
    const price = tierPrices[selectedTier] || 0;

    setIsLoading(true);
    try {
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

      // V2 contract: register-and-subscribe combines both steps
      // alerts bitmask: 31 = all alerts enabled (1+2+4+8+16)
      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'stackpulse-v2',
        functionName: 'register-and-subscribe',
        functionArgs: [
          stringAsciiCV(username),
          stringAsciiCV(email || ''),
          uintCV(selectedTier),
          uintCV(31) // Enable all alert types
        ],
        postConditions,
        onFinish: async (data: { txId: string }) => {
          console.log('Registration + Subscription submitted:', data.txId);
          
          // Save notification preferences to server
          try {
            const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';
            await fetch(`${serverUrl}/api/users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: address,
                username: username,
                email: email || undefined,
                discord: discord || undefined,
                telegram: telegram || undefined,
                tier: selectedTier,
                enabledAlerts: ['whale', 'contract', 'nft', 'token', 'swap', 'alert', 'badge']
              })
            });
            console.log('User preferences saved to server');
          } catch (err) {
            console.error('Failed to save preferences:', err);
          }
          
          const tierName = selectedTier === 0 ? 'Free' : selectedTier === 2 ? 'Pro' : 'Premium';
          alert(`🎉 Success! You're now registered on ${tierName} tier!\n\nTX: ${data.txId}\n\nYour alerts are now active. Check your dashboard!`);
          
          // Cache registration locally for instant UX on next visit
          if (address) {
            localStorage.setItem(`stackpulse_registered_${address}`, JSON.stringify({
              tier: selectedTier,
              username: username,
              timestamp: Date.now()
            }));
          }
          
          setIsRegistered(true);
          setCurrentTier(selectedTier);
        },
        onCancel: () => {
          console.log('Registration cancelled');
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
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
        alert('Please enter a username first in the registration form above!');
        return;
      }
      await handleRegister(tier);
      return;
    }

    // If already registered, upgrade subscription
    if (tier === 0) {
      alert('You are on the Free tier! Upgrade below for more features.');
      return;
    }

    // Calculate price for the tier (in microSTX)
    const tierPrices: Record<number, number> = {
      1: 1000000,   // 1 STX for Basic
      2: 5000000,   // 5 STX for Pro
      3: 20000000,  // 20 STX for Premium
    };
    const price = tierPrices[tier] || 0;

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
        contractName: 'stackpulse-v2',
        functionName: 'upgrade-subscription',
        functionArgs: [uintCV(tier)],
        postConditions,
        onFinish: async (data: { txId: string }) => {
          console.log('Upgrade submitted:', data.txId);
          setCurrentTier(tier);
          // Update cache
          if (address) {
            const cached = localStorage.getItem(`stackpulse_registered_${address}`);
            if (cached) {
              const data = JSON.parse(cached);
              data.tier = tier;
              localStorage.setItem(`stackpulse_registered_${address}`, JSON.stringify(data));
            }
          }
          alert(`🎉 Subscription upgraded to ${tier === 1 ? 'Basic' : tier === 2 ? 'Pro' : 'Premium'}!\n\nTX: ${data.txId}`);
        },
        onCancel: () => {
          console.log('Upgrade cancelled');
        },
      });
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  // Save a notification channel update
  const saveChannelUpdate = async () => {
    if (!address || !editingChannel) return;
    
    setIsSaving(true);
    try {
      // Update local state
      if (editingChannel === 'email') setEmail(tempValue);
      if (editingChannel === 'discord') setDiscord(tempValue);
      if (editingChannel === 'telegram') setTelegram(tempValue);
      
      // Save to server
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';
      await fetch(`${serverUrl}/api/users/${address}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [editingChannel]: tempValue || undefined
        })
      });
      
      setEditingChannel(null);
      setTempValue('');
    } catch (error) {
      console.error('Failed to save channel:', error);
      alert('Failed to save. Please try again.');
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
  };

  return (
    <section className="py-20 px-4 bg-gray-900/50" id="pricing">
      <div className="max-w-6xl mx-auto">
        {/* Registration Card - Always at top */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-500/30">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                {isRegistered ? '✓ You\'re Registered!' : 'Get Started with StackPulse'}
              </h2>
              <p className="text-gray-400">
                {isRegistered 
                  ? 'Manage your notification channels and subscription below'
                  : 'Connect your wallet and register to start receiving blockchain alerts'
                }
              </p>
              
              {/* Current Plan Badge - Show when registered */}
              {isRegistered && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 border border-gray-700">
                  <span className="text-gray-400">Current Plan:</span>
                  <span className={`font-bold ${
                    currentTier === 0 ? 'text-gray-300' :
                    currentTier === 1 ? 'text-blue-400' :
                    currentTier === 2 ? 'text-purple-400' :
                    'text-yellow-400'
                  }`}>
                    {tierNames[currentTier] || 'Free'}
                  </span>
                  {currentTier === 0 && (
                    <span className="text-xs text-gray-500 ml-2">• Upgrade for more features!</span>
                  )}
                </div>
              )}
            </div>

            {!isRegistered ? (
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Step 1: Connect Wallet */}
                <div className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-600' : 'bg-purple-600'}`}>
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">1. Connect Wallet</h3>
                    <p className="text-gray-400 text-sm">
                      {isConnected ? `Connected: ${address?.slice(0, 8)}...${address?.slice(-6)}` : 'Connect your Stacks wallet'}
                    </p>
                  </div>
                  {!isConnected && (
                    <button
                      onClick={connect}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-all cursor-pointer"
                    >
                      Connect
                    </button>
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
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      maxLength={32}
                      className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Optional: Email */}
                <div className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-4">
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Email <span className="text-gray-500 text-sm">(optional)</span></h3>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Optional: Discord */}
                <div className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Discord <span className="text-gray-500 text-sm">(optional)</span></h3>
                    <input
                      type="text"
                      value={discord}
                      onChange={(e) => setDiscord(e.target.value)}
                      placeholder="username#1234"
                      className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Optional: Telegram */}
                <div className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-4">
                  <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Telegram <span className="text-gray-500 text-sm">(optional)</span></h3>
                    <input
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      placeholder="@username"
                      className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Register Button */}
                <button
                  onClick={() => handleRegister(0)}
                  disabled={!isConnected || !username.trim() || isLoading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-bold text-lg transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Registering...' : 'Register Free on StackPulse'}
                </button>
              </div>
            ) : (
              /* Registered user - show notification settings */
              <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                    <Wallet className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold">Wallet</p>
                    <p className="text-green-400 text-xs">Connected</p>
                  </div>
                  <div 
                    onClick={() => openEditChannel('email')}
                    className="bg-gray-800/50 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-700/50 hover:border-purple-500 border border-transparent transition-all transform hover:scale-105"
                  >
                    <Mail className={`w-8 h-8 mx-auto mb-2 ${email ? 'text-green-500' : 'text-gray-400'}`} />
                    <p className="text-white text-sm font-semibold">Email</p>
                    <p className={`text-xs ${email ? 'text-green-400' : 'text-gray-400'}`}>
                      {email ? email.slice(0, 15) + (email.length > 15 ? '...' : '') : 'Click to add'}
                    </p>
                  </div>
                  <div 
                    onClick={() => openEditChannel('discord')}
                    className="bg-gray-800/50 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-700/50 hover:border-purple-500 border border-transparent transition-all transform hover:scale-105"
                  >
                    <MessageCircle className={`w-8 h-8 mx-auto mb-2 ${discord ? 'text-green-500' : 'text-gray-400'}`} />
                    <p className="text-white text-sm font-semibold">Discord</p>
                    <p className={`text-xs ${discord ? 'text-green-400' : 'text-gray-400'}`}>
                      {discord || 'Click to add'}
                    </p>
                  </div>
                  <div 
                    onClick={() => openEditChannel('telegram')}
                    className="bg-gray-800/50 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-700/50 hover:border-purple-500 border border-transparent transition-all transform hover:scale-105"
                  >
                    <Send className={`w-8 h-8 mx-auto mb-2 ${telegram ? 'text-green-500' : 'text-gray-400'}`} />
                    <p className="text-white text-sm font-semibold">Telegram</p>
                    <p className={`text-xs ${telegram ? 'text-green-400' : 'text-gray-400'}`}>
                      {telegram || 'Click to add'}
                    </p>
                  </div>
                </div>

                {/* Edit Channel Modal */}
                {editingChannel && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-purple-500/30">
                      <h3 className="text-xl font-bold text-white mb-4">
                        {editingChannel === 'email' && '📧 Add Email'}
                        {editingChannel === 'discord' && '💬 Add Discord'}
                        {editingChannel === 'telegram' && '✈️ Add Telegram'}
                      </h3>
                      <input
                        type={editingChannel === 'email' ? 'email' : 'text'}
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        placeholder={
                          editingChannel === 'email' ? 'your@email.com' :
                          editingChannel === 'discord' ? 'username#1234' :
                          '@username'
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 mb-4"
                        autoFocus
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditingChannel(null);
                            setTempValue('');
                          }}
                          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveChannelUpdate}
                          disabled={isSaving}
                          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* What's Next Section - Show after registration */}
                <div className="mt-8 pt-8 border-t border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4 text-center">🚀 What&apos;s Next?</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                      <div className="text-2xl mb-2">1️⃣</div>
                      <h4 className="text-white font-semibold mb-1">Set Up Notifications</h4>
                      <p className="text-gray-400 text-sm">Add your email, Discord, or Telegram above to receive alerts</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                      <div className="text-2xl mb-2">2️⃣</div>
                      <h4 className="text-white font-semibold mb-1">Create Alerts</h4>
                      <p className="text-gray-400 text-sm">Go to <a href="/dashboard" className="text-purple-400 hover:underline">Dashboard</a> to create custom blockchain alerts</p>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                      <div className="text-2xl mb-2">3️⃣</div>
                      <h4 className="text-white font-semibold mb-1">
                        {currentTier === 0 ? 'Upgrade Plan' : 'Monitor Activity'}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {currentTier === 0 
                          ? 'Unlock more alerts and features with Pro or Premium'
                          : 'View your alerts history and blockchain activity'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <a 
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all cursor-pointer"
                    >
                      Go to Dashboard →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            {isRegistered && currentTier > 0 ? 'Your Subscription' : 'Choose Your Plan'}
          </h2>
          <p className="text-gray-400 text-lg">
            {isRegistered 
              ? currentTier === 0 
                ? 'Upgrade to unlock more features'
                : `You're on the ${tierNames[currentTier]} plan`
              : 'Register above, then choose your plan'
            }
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative bg-gray-800 rounded-2xl p-8 border transition-all ${
                tier.popular
                  ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                  : tier.tier === currentTier && isRegistered
                    ? 'border-green-500 shadow-lg shadow-green-500/20'
                    : 'border-gray-700'
              } ${!isRegistered ? 'opacity-60' : ''}`}
            >
              {/* Current Plan Badge */}
              {isRegistered && tier.tier === currentTier && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                  ✓ Current Plan
                </div>
              )}
              
              {/* Popular Badge - only show if not current plan */}
              {tier.popular && !(isRegistered && tier.tier === currentTier) && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">{tier.price}</span>
                <span className="text-gray-400 ml-2">STX/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(tier.tier)}
                disabled={!isRegistered || (isRegistered && tier.tier === currentTier)}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer transform hover:scale-105 hover:-translate-y-1 active:scale-95 disabled:cursor-not-allowed disabled:transform-none ${
                  isRegistered && tier.tier === currentTier
                    ? 'bg-green-600/20 text-green-400 border border-green-500'
                    : tier.popular
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/30 disabled:from-gray-600 disabled:to-gray-600'
                      : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 disabled:hover:bg-gray-700 disabled:hover:border-gray-600'
                }`}
              >
                {isRegistered && tier.tier === currentTier 
                  ? '✓ Active' 
                  : isRegistered && tier.tier > currentTier 
                    ? 'Upgrade' 
                    : tier.tier === 0 
                      ? 'Get Started Free'
                      : 'Subscribe'
                }
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

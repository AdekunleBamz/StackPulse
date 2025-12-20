'use client';

import { useWallet } from '@/context/WalletContext';
import { Check } from 'lucide-react';
import { getStacksNetwork } from '@/context/WalletContext';

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
    cta: 'Get Started',
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
    cta: 'Subscribe',
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
    cta: 'Subscribe',
    popular: false,
  },
];

// Set NEXT_PUBLIC_DEPLOYER_ADDRESS in your environment variables
const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '';

export default function Pricing() {
  const { isConnected, network, connect, address } = useWallet();

  // Check if user is registered before subscribing
  const checkAndSubscribe = async (tier: number) => {
    if (!isConnected || !address) {
      connect();
      return;
    }

    try {
      // Check if user is registered first
      const response = await fetch(
        `https://api.mainnet.hiro.so/v2/contracts/call-read/SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N/stackpulse-registry/is-registered`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: address,
            arguments: [`0x${Buffer.from(address).toString('hex').padStart(66, '0').slice(0, 66)}`]
          })
        }
      );
      
      const data = await response.json();
      const isRegistered = data.result === '0x03'; // true in Clarity
      
      if (!isRegistered) {
        // User needs to register first
        await handleRegister();
      } else {
        // User is registered, proceed with subscription
        await handleSubscribe(tier);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
      // Fallback: try to subscribe anyway, let contract handle the error
      await handleSubscribe(tier);
    }
  };

  const handleRegister = async () => {
    try {
      const { openContractCall } = await import('@stacks/connect');
      const { stringAsciiCV, noneCV } = await import('@stacks/transactions');
      
      // Generate a default username from address
      const username = `user_${Date.now().toString(36)}`;
      
      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'stackpulse-registry',
        functionName: 'register',
        functionArgs: [stringAsciiCV(username), noneCV()],
        onFinish: (data: { txId: string }) => {
          console.log('Registration submitted:', data.txId);
          alert(`Registration submitted! TX: ${data.txId}\n\nPlease wait for confirmation, then try subscribing again.`);
        },
        onCancel: () => {
          console.log('Registration cancelled');
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleSubscribe = async (tier: number) => {
    if (!isConnected) {
      connect();
      return;
    }

    if (tier === 0) return; // Free tier, no transaction needed

    try {
      // Dynamic import to avoid SSR issues
      const { openContractCall } = await import('@stacks/connect');
      const { uintCV } = await import('@stacks/transactions');

      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'stackpulse-registry',
        functionName: 'subscribe',
        functionArgs: [uintCV(tier)],
        onFinish: (data: { txId: string }) => {
          console.log('Transaction submitted:', data.txId);
          alert(`Subscription submitted! TX: ${data.txId}`);
        },
        onCancel: () => {
          console.log('Transaction cancelled');
        },
      });
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  return (
    <section className="py-20 px-4 bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-400 text-lg">
            Choose the plan that fits your monitoring needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative bg-gray-800 rounded-2xl p-8 border ${
                tier.popular
                  ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                  : 'border-gray-700'
              }`}
            >
              {tier.popular && (
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
                onClick={() => checkAndSubscribe(tier.tier)}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer transform hover:scale-105 hover:-translate-y-1 active:scale-95 ${
                  tier.popular
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/30'
                    : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

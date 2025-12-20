'use client';

import { useWallet } from '@/context/WalletContext';
import { Check } from 'lucide-react';
import { openContractCall } from '@stacks/connect';
import { uintCV, stringAsciiCV } from '@stacks/transactions';
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

const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

export default function Pricing() {
  const { isConnected, network, connect } = useWallet();

  const handleSubscribe = async (tier: number, price: number) => {
    if (!isConnected) {
      connect();
      return;
    }

    if (tier === 0) return; // Free tier, no transaction needed

    try {
      await openContractCall({
        contractAddress: DEPLOYER_ADDRESS,
        contractName: 'stackpulse-registry',
        functionName: 'subscribe',
        functionArgs: [uintCV(tier)],
        network: getStacksNetwork(network),
        onFinish: (data) => {
          console.log('Transaction submitted:', data.txId);
          alert(`Transaction submitted! TX: ${data.txId}`);
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
                onClick={() => handleSubscribe(tier.tier, tier.price)}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                  tier.popular
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
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

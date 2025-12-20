'use client';

import { Bell, Zap, TrendingUp, Shield, Coins, Trophy } from 'lucide-react';

const features = [
  {
    icon: Bell,
    title: 'Whale Alerts',
    description: 'Get notified when large STX transfers happen on-chain',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'Token Launches',
    description: 'Be the first to know about new SIP-010 token deployments',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: TrendingUp,
    title: 'DEX Monitoring',
    description: 'Track large swaps and market movements in real-time',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Shield,
    title: 'Contract Tracking',
    description: 'Monitor new smart contract deployments instantly',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Coins,
    title: 'NFT Mints',
    description: 'Never miss an NFT drop with instant mint notifications',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: Trophy,
    title: 'Reputation Badges',
    description: 'Earn NFT badges for your on-chain achievements',
    color: 'from-indigo-500 to-violet-500',
  },
];

export default function Features() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Powerful Blockchain Monitoring
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stay ahead of the market with real-time alerts powered by Hiro Chainhooks
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

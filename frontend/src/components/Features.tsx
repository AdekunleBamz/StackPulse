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
    <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gray-950/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-8 tracking-tighter text-white drop-shadow-md leading-[1.1]">
            Powerful Blockchain <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">Monitoring</span>
          </h2>
          <p className="text-gray-400 text-lg sm:text-2xl max-w-3xl mx-auto font-medium leading-relaxed opacity-90">
            Stay ahead of the market with real-time alerts powered by Hiro Chainhooks
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" role="list" aria-label="Platform features">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 hover:bg-white/[0.04] hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(168,85,247,0.25)] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-950"
              role="listitem"
              tabIndex={0}
              title={feature.title}
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-black/30 relative ring-1 ring-white/20 group-hover:ring-white/50`}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl animate-pulse" />
                <feature.icon className="w-6 h-6 text-white relative z-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3 group-hover:text-purple-300 transition-colors tracking-tighter">
                {feature.title}
              </h3>
              <p className="text-gray-400/90 leading-relaxed font-medium text-sm sm:text-base max-w-[280px]">
                {feature.description}
              </p>
              
              {/* Subtle background glows */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 group-hover:scale-150 transition-all duration-700" />
              <div className="absolute -left-10 -top-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 group-hover:scale-150 transition-all duration-700" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

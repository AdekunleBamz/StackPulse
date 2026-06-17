import Header from '@/components/Header';
import dynamic from 'next/dynamic';
import { memo } from 'react';

const Features = dynamic(() => import('@/components/Features'), {
  loading: () => <div className="min-h-[400px] animate-pulse bg-gray-950/50" />
});

const Pricing = dynamic(() => import('@/components/Pricing'), {
  loading: () => <div className="min-h-[600px] animate-pulse bg-gray-950/50" />
});

const LiveStats = dynamic(() => import('@/components/LiveStats'), {
  loading: () => <div className="min-h-[400px] animate-pulse bg-gray-950/50" />
});

const Footer = dynamic(() => import('@/components/Footer'), {
  loading: () => <div className="h-64 animate-pulse bg-gray-950/50" />
});

const Hero = memo(() => (
  <section className="relative py-40 sm:py-48 px-4 sm:px-6 lg:px-8 overflow-hidden" aria-describedby="hero-subtitle">
    {/* Decorative background kept out of the preload path so first paint is not blocked. */}
    <div
      className="absolute inset-0 z-0 bg-cover bg-center opacity-20 blur-[2px]"
      style={{ backgroundImage: 'url(/images/hero_bg.png)' }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950/90 to-gray-950" />
    </div>

    <div className="max-w-7xl mx-auto text-center relative z-10">
      {/* Badge */}
      <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-10 hover:bg-purple-500/20 hover:border-purple-500/30 transition-all duration-300 transform hover:scale-[1.02] cursor-default group/badge shadow-[0_0_20px_rgba(168,85,247,0.1)]">
        <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2.5 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
        <span className="text-sm font-semibold text-purple-200 tracking-tight group-hover/badge:text-white transition-colors">Powered by Hiro Chainhooks</span>
      </div>
      
      {/* Main Heading */}
      <h1 id="hero-title" className="text-6xl sm:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
        <span className="bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent drop-shadow-sm">
          Real-time Blockchain
        </span>
        <br />
        <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          Alerts & Monitoring
        </span>
      </h1>
      
      {/* Subtitle */}
      <p id="hero-subtitle" className="text-lg sm:text-xl text-gray-400/90 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
        Never miss a whale transfer, token launch, or NFT mint on Stacks. 
        Get instant notifications for on-chain events that matter to you.
      </p>

      <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
        <a
          href="#features"
          className="rounded-full border border-white/5 bg-white/5 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-gray-400 hover:border-purple-500/30 hover:text-white hover:bg-white/10 transition-all duration-300 transform active:scale-95"
        >
          Explore Features
        </a>
        <a
          href="#stats"
          className="rounded-full border border-white/5 bg-white/5 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-gray-400 hover:border-purple-500/30 hover:text-white hover:bg-white/10 transition-all duration-300 transform active:scale-95"
        >
          View Live Stats
        </a>
        <a
          href="#pricing"
          className="rounded-full border border-white/5 bg-white/5 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-gray-400 hover:border-purple-500/30 hover:text-white hover:bg-white/10 transition-all duration-300 transform active:scale-95"
        >
          Compare Plans
        </a>
      </div>
      
      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-5 justify-center mb-20">
        <a 
          href="#pricing" 
          className="px-10 py-4 h-14 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 rounded-2xl font-black text-white hover:from-purple-500 hover:to-indigo-600 transition-all duration-500 shadow-[0_10px_40px_-10px_rgba(168,85,247,0.4)] hover:shadow-[0_20px_60px_-10px_rgba(168,85,247,0.5)] transform hover:-translate-y-1 active:scale-95 inline-flex items-center justify-center min-w-[200px] outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          Start Monitoring
        </a>
        <a 
          href="https://github.com/AdekunleBamz/StackPulse" 
          target="_blank"
          rel="noopener noreferrer"
          className="px-10 py-4 h-14 bg-white/5 border border-white/10 rounded-2xl font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all duration-500 flex items-center justify-center gap-3 transform hover:-translate-y-1 active:scale-95 min-w-[200px] outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          aria-label="View StackPulse repository on GitHub"
        >
          <svg className="w-6 h-6 opacity-80" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          View on GitHub
        </a>
      </div>
      
      {/* Stats Preview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-4xl mx-auto" role="list" aria-label="Monitoring highlights" title="Key monitoring highlights">
        {[
          { label: 'Whale Transfers', value: '1,234+' },
          { label: 'NFT Mints', value: '5,678+' },
          { label: 'Token Launches', value: '89+' },
          { label: 'Active Alerts', value: '456' },
        ].map((stat) => (
          <div 
            key={stat.label}
            className="bg-gray-900/40 border border-white/5 rounded-2xl p-4 lg:p-6 transition-colors hover:border-purple-500/20 group/stat"
            role="listitem"
          >
            <div className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
              {stat.value}
            </div>
            <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
));
Hero.displayName = 'Hero';

export default function Home() {
  return (
    <main id="main" className="min-h-screen" tabIndex={-1} aria-labelledby="hero-title">
      <Header />
      <Hero />
      
      {/* Features Section */}
      <section id="features" className="scroll-mt-32 py-32">
        <Features />
      </section>
      
      {/* Live Stats Section */}
      <section id="stats" className="scroll-mt-32 py-32">
        <LiveStats />
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="scroll-mt-32 py-32">
        <Pricing />
      </section>
      
      {/* Footer */}
      <Footer />
    </main>
  );
}

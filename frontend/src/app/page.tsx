'use client';

import Header from '@/components/Header';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import LiveStats from '@/components/LiveStats';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main id="main" className="min-h-screen" tabIndex={-1} aria-labelledby="hero-title">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8" aria-describedby="hero-subtitle">
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            <span className="text-sm text-purple-300">Powered by Hiro Chainhooks</span>
          </div>
          
          {/* Main Heading */}
          <h1 id="hero-title" className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Real-time Blockchain
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Alerts & Monitoring
            </span>
          </h1>
          
          {/* Subtitle */}
          <p id="hero-subtitle" className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Never miss a whale transfer, token launch, or NFT mint on Stacks. 
            Get instant notifications for on-chain events that matter to you.
          </p>

          <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#features"
              className="rounded-full border border-gray-700 bg-gray-900/60 px-4 py-2 text-sm text-gray-200 hover:border-purple-500/50 hover:text-white transition-colors"
            >
              Explore Features
            </a>
            <a
              href="#stats"
              className="rounded-full border border-gray-700 bg-gray-900/60 px-4 py-2 text-sm text-gray-200 hover:border-purple-500/50 hover:text-white transition-colors"
            >
              View Live Stats
            </a>
            <a
              href="#pricing"
              className="rounded-full border border-gray-700 bg-gray-900/60 px-4 py-2 text-sm text-gray-200 hover:border-purple-500/50 hover:text-white transition-colors"
            >
              Compare Plans
            </a>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a 
              href="#pricing" 
              className="px-8 py-4 min-h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/25 inline-flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
            >
              Start Monitoring
            </a>
            <a 
              href="https://github.com/AdekunleBamz/StackPulse" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 min-h-12 bg-gray-800 border border-gray-700 rounded-lg font-semibold hover:bg-gray-700 transition-all flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
              aria-label="View StackPulse repository on GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </a>
          </div>
          
          {/* Stats Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto" role="list" aria-label="Monitoring highlights">
            {[
              { label: 'Whale Transfers', value: '1,234+' },
              { label: 'NFT Mints', value: '5,678+' },
              { label: 'Token Launches', value: '89+' },
              { label: 'Active Alerts', value: '456' },
            ].map((stat, index) => (
              <div 
                key={stat.label}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
                role="listitem"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="scroll-mt-24">
        <Features />
      </section>
      
      {/* Live Stats Section */}
      <section id="stats" className="scroll-mt-24">
        <LiveStats />
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="scroll-mt-24">
        <Pricing />
      </section>
      
      {/* Footer */}
      <Footer />
    </main>
  );
}

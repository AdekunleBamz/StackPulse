'use client';

import { Activity, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatsCardSkeleton } from './LoadingSkeleton';

interface EventStats {
  whaleTransfers: number;
  contractDeployments: number;
  nftMints: number;
  tokenLaunches: number;
  largeSwaps: number;
  subscriptions: number;
  alertsTriggered: number;
  feesCollected: number;
  badgesEarned: number;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';

export default function LiveStats() {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/stats`);
        if (!res.ok) throw new Error('Bad response');
        const data = await res.json();
        const payload = data?.stats ?? data;
        if (!payload) throw new Error('Missing stats');
        setStats(payload);
        setLastUpdated(new Date());
        setError(null);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setError('Unable to load live stats right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [refreshKey]);

  const statItems = stats ? [
    { label: 'Whale Transfers', value: stats.whaleTransfers, color: 'text-blue-400', glow: 'from-blue-400/20' },
    { label: 'Contracts Deployed', value: stats.contractDeployments, color: 'text-purple-400', glow: 'from-purple-400/20' },
    { label: 'NFTs Minted', value: stats.nftMints, color: 'text-pink-400', glow: 'from-pink-400/20' },
    { label: 'Token Launches', value: stats.tokenLaunches, color: 'text-yellow-400', glow: 'from-yellow-400/20' },
    { label: 'Large Swaps', value: stats.largeSwaps, color: 'text-green-400', glow: 'from-green-400/20' },
    { label: 'Alerts Triggered', value: stats.alertsTriggered, color: 'text-red-400', glow: 'from-red-400/20' },
  ] : [];

  if (loading) {
    return (
      <section className="py-12 px-4 border-y border-gray-800 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 px-4 border-y border-gray-800 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-8 text-center backdrop-blur-sm">
            <Activity className="w-10 h-10 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg">Live stats unavailable</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setRefreshKey((k) => k + 1);
              }}
              className="mt-6 inline-flex items-center justify-center px-6 py-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className="py-12 px-4 border-y border-gray-800 bg-gray-900/30"
      role="region"
      aria-label="Blockchain Event Statistics"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <Activity className="w-5 h-5 text-emerald-500" aria-hidden="true" />
            <div className="absolute inset-0 bg-emerald-500/20 blur-sm rounded-full animate-pulse" />
          </div>
          <span className="text-gray-400 font-bold tracking-widest uppercase text-[10px]">Live Chainhook Events</span>
          {lastUpdated && (
            <span className="hidden sm:inline text-[10px] text-gray-500 font-medium" aria-live="polite">
              • UPDATED {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <a
            href={`${SERVER_URL}/health`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-purple-400 transition-colors rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90 ml-1"
            aria-label="Open server health endpoint"
            title="Open server health endpoint"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="group relative bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-center hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className={`text-3xl font-black tracking-tighter ${item.color} mb-1 group-hover:scale-110 transition-transform duration-500 relative z-10`}>
                {item.value.toLocaleString()}
              </div>
              <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2 group-hover:text-gray-200 transition-colors relative z-10">{item.label}</div>
              
              {/* Subtle background glow on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${item.glow} to-transparent pointer-events-none blur-xl`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

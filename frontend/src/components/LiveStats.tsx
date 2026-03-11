'use client';

import { Activity, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    { label: 'Whale Transfers', value: stats.whaleTransfers, color: 'text-blue-400' },
    { label: 'Contracts Deployed', value: stats.contractDeployments, color: 'text-purple-400' },
    { label: 'NFTs Minted', value: stats.nftMints, color: 'text-pink-400' },
    { label: 'Token Launches', value: stats.tokenLaunches, color: 'text-yellow-400' },
    { label: 'Large Swaps', value: stats.largeSwaps, color: 'text-green-400' },
    { label: 'Alerts Triggered', value: stats.alertsTriggered, color: 'text-red-400' },
  ] : [];

  if (loading) {
    return (
      <section className="py-12 px-4 border-y border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <Activity className="w-5 h-5 animate-pulse" />
            <span>Loading live stats...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 px-4 border-y border-gray-800 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-300 font-medium">Live stats unavailable</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setRefreshKey((k) => k + 1);
              }}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 border-y border-gray-800 bg-gray-900/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Activity className="w-5 h-5 text-green-500 animate-pulse" />
          <span className="text-gray-400">Live Chainhook Events</span>
          {lastUpdated && (
            <span className="hidden sm:inline text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <a
            href={`${SERVER_URL}/health`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 transition-colors rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
            aria-label="Open server health endpoint"
            title="Open server health endpoint"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700"
            >
              <div className={`text-3xl font-bold ${item.color}`}>
                {item.value.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/stats`);
        const data = await res.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

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

  return (
    <section className="py-12 px-4 border-y border-gray-800 bg-gray-900/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Activity className="w-5 h-5 text-green-500 animate-pulse" />
          <span className="text-gray-400">Live Chainhook Events</span>
          <a
            href={`${SERVER_URL}/health`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 transition-colors"
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

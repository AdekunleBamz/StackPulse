'use client';

import { useState, useEffect, useMemo } from 'react';

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

export function useStats(intervalMs: number = 30000) {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/stats`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        const payload = data?.stats ?? data?.data?.stats ?? data;
        
        if (mounted && payload) {
          setStats(payload);
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          console.error('useStats error:', err);
          setError(err.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, intervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  const memoizedStats = useMemo(() => stats, [JSON.stringify(stats)]);

  return {
    stats: memoizedStats,
    loading,
    error,
    lastUpdated,
    refresh: () => setLoading(true)
  };
}

import { useState, useEffect, useCallback } from 'react';

export interface EventStats {
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

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://stackpulse-b8fw.onrender.com';

export function useStats(refreshInterval: number = 30000) {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/stats`);
      if (!res.ok) throw new Error('Statistics service unavailable');
      const data = await res.json();
      const payload = data?.stats ?? data;
      if (!payload) throw new Error('Invalid statistics data');
      
      setStats(payload);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Unable to load live stats right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { 
    stats, 
    loading, 
    error, 
    lastUpdated, 
    refresh: fetchStats 
  };
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Users, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import logger from '@/lib/logger';

interface NetworkStats {
  blockHeight: number;
  txCount24h: number;
  avgBlockTime: number;
  hashRate: string;
  difficulty: string;
  stackingParticipation: number;
  totalSTXLocked: number;
  activeContracts: number;
}

interface NetworkStatusProps {
  refreshInterval?: number;
}

/** Stacks extended API endpoint for network info. */
const STACKS_INFO_API_URL = 'https://api.mainnet.hiro.so/extended/v1/info';
/** Stacks core API endpoint for block and chain info. */
const STACKS_CORE_INFO_API_URL = 'https://api.mainnet.hiro.so/v2/info';
const DEFAULT_REFRESH_INTERVAL_MS = 30000;
const MIN_REFRESH_INTERVAL_MS = 5000;
const JSON_ACCEPT_HEADERS = { Accept: 'application/json' } as const;
const LAST_UPDATED_TIME_OPTIONS: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

export default function NetworkStatus({ refreshInterval = DEFAULT_REFRESH_INTERVAL_MS }: NetworkStatusProps) {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkHealth, setNetworkHealth] = useState<'healthy' | 'degraded' | 'down'>('healthy');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const hasStatsRef = useRef(false);
  const isMountedRef = useRef(true);
  const safeRefreshInterval = Number.isFinite(refreshInterval)
    ? Math.max(MIN_REFRESH_INTERVAL_MS, Math.floor(refreshInterval))
    : DEFAULT_REFRESH_INTERVAL_MS;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchNetworkStats = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch from Stacks API
      const [infoRes, coreRes] = await Promise.all([
        fetch(STACKS_INFO_API_URL, { headers: JSON_ACCEPT_HEADERS }),
        fetch(STACKS_CORE_INFO_API_URL, { headers: JSON_ACCEPT_HEADERS }),
      ]);

      if (!infoRes.ok || !coreRes.ok) {
        throw new Error('Failed to fetch network data');
      }

      const [info, core] = await Promise.all([infoRes.json(), coreRes.json()]);
      if (!isMountedRef.current) {
        return;
      }

      setStats({
        blockHeight: core.stacks_tip_height || 0,
        txCount24h: info.tx_count_per_24h || 0,
        avgBlockTime: core.stacks_tip_consensus_hash ? 10 : 0, // Approximate
        hashRate: 'N/A',
        difficulty: 'N/A',
        stackingParticipation: 0.45, // Approximate
        totalSTXLocked: 400000000, // Approximate
        activeContracts: info.smart_contract_count || 0,
      });
      hasStatsRef.current = true;
      setLastUpdated(new Date());
      setNetworkHealth('healthy');
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      logger.error('Error fetching network stats:', err);
      setError('Failed to fetch network data');
      setNetworkHealth(hasStatsRef.current ? 'degraded' : 'down');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, safeRefreshInterval);
    return () => clearInterval(interval);
  }, [fetchNetworkStats, safeRefreshInterval]);

  const healthColor = useMemo(() => {
    switch (networkHealth) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
    }
  }, [networkHealth]);

  const healthText = useMemo(() => {
    switch (networkHealth) {
      case 'healthy':
        return 'Network Healthy';
      case 'degraded':
        return 'Degraded Performance';
      case 'down':
        return 'Network Issues';
    }
  }, [networkHealth]);

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <h3 className="font-medium text-white">Stacks Network Status</h3>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="hidden sm:inline text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString([], LAST_UPDATED_TIME_OPTIONS)}
            </span>
          )}
          <button
            type="button"
            onClick={fetchNetworkStats}
            disabled={refreshing}
            className="text-xs text-purple-300 hover:text-purple-200 transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <div className="flex items-center gap-2" aria-live="polite">
            <span 
              className={`w-2 h-2 rounded-full ${healthColor} animate-pulse`}
              aria-hidden="true"
            ></span>
            <span className="text-sm text-gray-400 font-medium">{healthText}</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Block Height */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">Block Height</div>
            <div className="text-xl font-semibold text-white">
              {stats.blockHeight.toLocaleString()}
            </div>
          </div>

          {/* 24h Transactions */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">24h Transactions</div>
            <div className="text-xl font-semibold text-white">
              {stats.txCount24h.toLocaleString()}
            </div>
          </div>

          {/* Stacking Rate */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">Stacking Rate</div>
            <div className="text-xl font-semibold text-white">
              {(stats.stackingParticipation * 100).toFixed(1)}%
            </div>
          </div>

          {/* Active Contracts */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">Smart Contracts</div>
            <div className="text-xl font-semibold text-white">
              {stats.activeContracts.toLocaleString()}
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Links */}
      <div className="mt-4 flex items-center gap-4 text-xs">
        <a
          href="https://explorer.hiro.so/?chain=mainnet"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
          aria-label="Open Hiro Explorer in a new tab"
          title="Open Hiro Explorer"
        >
          <TrendingUp className="w-3 h-3" />
          Hiro Explorer
        </a>
        <a
          href="https://stx.is/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
          aria-label="Open Stacking information in a new tab"
          title="Open Stacking information"
        >
          <Users className="w-3 h-3" />
          Stacking
        </a>
      </div>
    </div>
  );
}

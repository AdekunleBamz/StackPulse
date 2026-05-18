'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatsCardSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/EmptyState';
import {
  BarChart3,
  TrendingUp,
  Users,
  Bell,
  Award,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Breadcrumbs } from '@/components';
import { NoResultsState } from '@/components/EmptyState';
import { apiUrl } from '@/lib/env';
import logger from '@/lib/logger';

interface AnalyticsData {
  totalUsers: number;
  totalAlerts: number;
  totalTriggers: number;
  totalBadges: number;
  totalRevenue: number;
  activeSubscriptions: number;
  eventStats: {
    whaleTransfers: number;
    contractDeployments: number;
    nftMints: number;
    tokenLaunches: number;
    largeSwaps: number;
  };
  recentEvents: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
    txHash: string;
  }>;
}

const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  change?: number; 
  icon: LucideIcon; 
  color: string;
}) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500/30 transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{Math.abs(change)}% from last week</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const EVENT_TYPE_ACCENT: Record<string, string> = {
  blue: 'border-blue-500/20 hover:border-blue-500/30',
  purple: 'border-purple-500/20 hover:border-purple-500/30',
  pink: 'border-pink-500/20 hover:border-pink-500/30',
  yellow: 'border-yellow-500/20 hover:border-yellow-500/30',
  green: 'border-green-500/20 hover:border-green-500/30',
};

const EVENT_ICON: Record<string, string> = {
  whale: '🐋',
  contract: '📜',
  nft: '🎨',
  token: '🪙',
  swap: '💱',
};

const EventTypeCard = ({
  type,
  count,
  icon,
  color,
}: {
  type: string;
  count: number;
  icon: string;
  color: string;
}) => {
  const accent =
    EVENT_TYPE_ACCENT[color] ?? 'border-gray-700 hover:border-gray-600';

  return (
    <div
      className={`bg-gray-800/30 border ${accent} rounded-lg p-4 hover:bg-gray-800/50 transition-all`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
        <div>
          <p className="text-white font-medium">{type}</p>
          <p className="text-gray-400 text-sm">{count.toLocaleString()} events</p>
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setError(null);
        const response = await fetch(apiUrl('/api/stats'));
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics({
            totalUsers: data.subscriptions ?? 0,
            totalAlerts: data.alertsTriggered ?? 0,
            totalTriggers: (data.whaleTransfers ?? 0) + (data.nftMints ?? 0) + (data.tokenLaunches ?? 0),
            totalBadges: data.badgesEarned ?? 0,
            totalRevenue: data.feesCollected ?? 0,
            activeSubscriptions: data.subscriptions ?? 0,
            eventStats: {
              whaleTransfers: data.whaleTransfers ?? 0,
              contractDeployments: data.contractDeployments ?? 0,
              nftMints: data.nftMints ?? 0,
              tokenLaunches: data.tokenLaunches ?? 0,
              largeSwaps: data.largeSwaps ?? 0,
            },
            recentEvents: [
              { id: '1', type: 'whale', title: 'Whale Transfer: 50,000 STX', timestamp: '2 min ago', txHash: '0x123' },
              { id: '2', type: 'contract', title: 'Contract Deployed: new-token-v1', timestamp: '5 min ago', txHash: '0x456' },
              { id: '3', type: 'nft', title: 'NFT Minted: StacksPunks', timestamp: '8 min ago', txHash: '0x789' },
              { id: '4', type: 'token', title: 'Token Launched: STACK', timestamp: '15 min ago', txHash: '0xabc' },
              { id: '5', type: 'swap', title: 'Large Swap: 25,000 STX', timestamp: '22 min ago', txHash: '0xdef' },
            ],
          });
          setLastUpdated(new Date());
        } else {
          setError('Failed to load analytics. Please try again.');
        }
      } catch (error) {
        logger.error('Error fetching analytics:', error);
        setError('Failed to load analytics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [timeRange, refreshKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">StackPulse</span>
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">Analytics</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-gray-800 rounded-lg p-1">
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    disabled
                    className="px-3 py-1 rounded-md text-sm text-gray-500"
                  >
                    {range}
                  </button>
                ))}
              </div>
              <div className="h-9 w-24 bg-gray-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </header>

        <main id="main" className="max-w-7xl mx-auto px-4 py-8">
          <Breadcrumbs />
          <div className="mb-8">
            <div className="h-9 w-64 bg-gray-800 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-80 bg-gray-800 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="h-6 w-48 bg-gray-700 rounded animate-pulse mb-6" />
            <div className="h-64 border border-dashed border-gray-700 rounded-lg animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">StackPulse</span>
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">Analytics</span>
            </div>

            <Link
              href="/dashboard"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-all"
            >
              Dashboard
            </Link>
          </div>
        </header>

        <main id="main" className="max-w-7xl mx-auto px-4 py-8">
          <Breadcrumbs />
          <ErrorState
            message={error}
            onRetry={() => {
              setLoading(true);
              setRefreshKey((k) => k + 1);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-6 focus:left-6 focus:z-[100] h-12 px-6 flex items-center justify-center rounded-xl bg-purple-600 text-white font-bold shadow-[0_10px_30px_rgba(168,85,247,0.4)] transition-all active:scale-95 outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
      >
        Skip to content
      </a>
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">StackPulse</span>
            </Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">Analytics</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  aria-pressed={timeRange === range}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    timeRange === range
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90`}
                >
                  {range}
                </button>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs />
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time blockchain monitoring statistics</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={analytics?.totalUsers ?? 0}
            change={12}
            icon={Users}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Active Alerts"
            value={analytics?.totalAlerts ?? 0}
            change={8}
            icon={Bell}
            color="from-purple-500 to-purple-600"
          />
          <StatCard
            title="Events Tracked"
            value={(analytics?.totalTriggers ?? 0).toLocaleString()}
            change={23}
            icon={Activity}
            color="from-green-500 to-green-600"
          />
          <StatCard
            title="Badges Minted"
            value={analytics?.totalBadges ?? 0}
            change={5}
            icon={Award}
            color="from-yellow-500 to-yellow-600"
          />
          <StatCard
            title="Revenue (STX)"
            value={((analytics?.totalRevenue ?? 0) / 1000000).toFixed(2)}
            change={15}
            icon={DollarSign}
            color="from-emerald-500 to-emerald-600"
          />
          <StatCard
            title="Active Subscriptions"
            value={analytics?.activeSubscriptions ?? 0}
            change={10}
            icon={TrendingUp}
            color="from-pink-500 to-pink-600"
          />
        </div>

        {/* Event Types */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Event Types</h2>
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
            role="list"
            aria-label="Event type statistics"
          >
            <EventTypeCard
              type="Whale Transfers"
              count={analytics?.eventStats.whaleTransfers ?? 0}
              icon="🐋"
              color="blue"
            />
            <EventTypeCard
              type="Contract Deploys"
              count={analytics?.eventStats.contractDeployments ?? 0}
              icon="📜"
              color="purple"
            />
            <EventTypeCard
              type="NFT Mints"
              count={analytics?.eventStats.nftMints ?? 0}
              icon="🎨"
              color="pink"
            />
            <EventTypeCard
              type="Token Launches"
              count={analytics?.eventStats.tokenLaunches ?? 0}
              icon="🪙"
              color="yellow"
            />
            <EventTypeCard
              type="Large Swaps"
              count={analytics?.eventStats.largeSwaps ?? 0}
              icon="💱"
              color="green"
            />
          </div>
        </div>

        {/* Activity Chart Placeholder */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Activity Over Time</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              Last updated:{' '}
              {lastUpdated
                ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </span>
          </div>
        </div>
          
          {/* Chart placeholder - would integrate with a charting library */}
          <div className="h-64 flex items-center justify-center border border-dashed border-gray-600 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chart visualization coming soon</p>
              <p className="text-sm">Integrate with Chart.js or Recharts</p>
            </div>
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Live Event Feed</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-400" aria-live="polite" aria-atomic="true">
                Live updates arriving
              </span>
            </div>
          </div>

          <div className="space-y-3" aria-live="polite" aria-relevant="additions">
            {!analytics?.recentEvents || analytics.recentEvents.length === 0 ? (
              <NoResultsState />
            ) : (
              analytics.recentEvents.map((event) => {
                const eventIcon = EVENT_ICON[event.type] ?? '⚡';

                return (
                  <a
                    key={event.id}
                    href={`https://explorer.hiro.so/txid/${event.txHash}?chain=mainnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 border border-transparent hover:border-purple-500/20 transition-all cursor-pointer group"
                    aria-label={`View event transaction ${event.txHash} on Hiro Explorer`}
                    title="View on Hiro Explorer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl group-hover:scale-110 transition-transform">{eventIcon}</span>
                      <div>
                        <p className="text-white font-medium group-hover:text-purple-300 transition-colors">{event.title}</p>
                        <p className="text-gray-500 text-sm">TX: {event.txHash.slice(0, 10)}...</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 text-sm">{event.timestamp}</span>
                      <Zap className="w-3 h-3 text-purple-500 mt-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                );
              })
            )}
          </div>

          <Link
            href="/history"
            className="block w-full mt-4 py-2 text-center text-purple-400 hover:text-purple-300 transition-all text-sm"
          >
            View all events →
          </Link>
        </div>
      </main>
    </div>
  );
}

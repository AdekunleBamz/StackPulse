'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import Link from 'next/link';
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
} from 'lucide-react';

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
  icon: any; 
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
}) => (
  <div className={`bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-all`}>
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-white font-medium">{type}</p>
        <p className="text-gray-400 text-sm">{count.toLocaleString()} events</p>
      </div>
    </div>
  </div>
);

export default function AnalyticsPage() {
  const { isConnected, address } = useWallet();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';
        const response = await fetch(`${serverUrl}/api/stats`);
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics({
            totalUsers: data.subscriptions || 0,
            totalAlerts: data.alertsTriggered || 0,
            totalTriggers: (data.whaleTransfers || 0) + (data.nftMints || 0) + (data.tokenLaunches || 0),
            totalBadges: data.badgesEarned || 0,
            totalRevenue: data.feesCollected || 0,
            activeSubscriptions: data.subscriptions || 0,
            eventStats: {
              whaleTransfers: data.whaleTransfers || 0,
              contractDeployments: data.contractDeployments || 0,
              nftMints: data.nftMints || 0,
              tokenLaunches: data.tokenLaunches || 0,
              largeSwaps: data.largeSwaps || 0,
            },
            recentEvents: [],
          });
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
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
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    timeRange === range
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
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
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time blockchain monitoring statistics</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={analytics?.totalUsers || 0}
            change={12}
            icon={Users}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Active Alerts"
            value={analytics?.totalAlerts || 0}
            change={8}
            icon={Bell}
            color="from-purple-500 to-purple-600"
          />
          <StatCard
            title="Events Tracked"
            value={(analytics?.totalTriggers || 0).toLocaleString()}
            change={23}
            icon={Activity}
            color="from-green-500 to-green-600"
          />
          <StatCard
            title="Badges Minted"
            value={analytics?.totalBadges || 0}
            change={5}
            icon={Award}
            color="from-yellow-500 to-yellow-600"
          />
          <StatCard
            title="Revenue (STX)"
            value={((analytics?.totalRevenue || 0) / 1000000).toFixed(2)}
            change={15}
            icon={DollarSign}
            color="from-emerald-500 to-emerald-600"
          />
          <StatCard
            title="Active Subscriptions"
            value={analytics?.activeSubscriptions || 0}
            change={10}
            icon={TrendingUp}
            color="from-pink-500 to-pink-600"
          />
        </div>

        {/* Event Types */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Event Types</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <EventTypeCard
              type="Whale Transfers"
              count={analytics?.eventStats.whaleTransfers || 0}
              icon="🐋"
              color="blue"
            />
            <EventTypeCard
              type="Contract Deploys"
              count={analytics?.eventStats.contractDeployments || 0}
              icon="📜"
              color="purple"
            />
            <EventTypeCard
              type="NFT Mints"
              count={analytics?.eventStats.nftMints || 0}
              icon="🎨"
              color="pink"
            />
            <EventTypeCard
              type="Token Launches"
              count={analytics?.eventStats.tokenLaunches || 0}
              icon="🪙"
              color="yellow"
            />
            <EventTypeCard
              type="Large Swaps"
              count={analytics?.eventStats.largeSwaps || 0}
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
              <span>Last updated: Just now</span>
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
              <span className="text-sm text-gray-400">Live</span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: '🐋', type: 'Whale Transfer', time: '2 min ago', amount: '50,000 STX' },
              { icon: '📜', type: 'Contract Deployed', time: '5 min ago', name: 'new-token-v1' },
              { icon: '🎨', type: 'NFT Minted', time: '8 min ago', collection: 'StacksPunks' },
              { icon: '🪙', type: 'Token Launched', time: '15 min ago', name: 'STACK' },
              { icon: '💱', type: 'Large Swap', time: '22 min ago', amount: '25,000 STX' },
            ].map((event, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{event.icon}</span>
                  <div>
                    <p className="text-white font-medium">{event.type}</p>
                    <p className="text-gray-400 text-sm">
                      {event.amount || event.name || event.collection}
                    </p>
                  </div>
                </div>
                <span className="text-gray-500 text-sm">{event.time}</span>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-2 text-center text-purple-400 hover:text-purple-300 transition-all text-sm">
            View all events →
          </button>
        </div>
      </main>
    </div>
  );
}

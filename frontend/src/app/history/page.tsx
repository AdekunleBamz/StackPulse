'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, History, Download, ExternalLink } from 'lucide-react';
import AlertHistory from '@/components/AlertHistory';
import { Breadcrumbs } from '@/components';

/** Display metadata for each alert type (matches contract event type IDs). */
const alertTypeInfo = [
  { id: 1, name: 'Whale Transfer', icon: '🐋', color: 'blue' },
  { id: 2, name: 'Contract Deploy', icon: '📜', color: 'purple' },
  { id: 3, name: 'NFT Mint', icon: '🎨', color: 'pink' },
  { id: 4, name: 'Token Launch', icon: '🪙', color: 'yellow' },
  { id: 5, name: 'Large Swap', icon: '💱', color: 'green' },
  { id: 6, name: 'Address Watch', icon: '👁️', color: 'orange' },
];

// Mock data for demo
const recentTriggers = [
  {
    id: 'trig-1',
    alertName: 'Whale Alert > 50k STX',
    type: 1,
    triggeredAt: new Date(Date.now() - 5 * 60 * 1000),
    amount: 125000,
    txHash: '0x1234...abcd',
  },
  {
    id: 'trig-2',
    alertName: 'New Contract on Mainnet',
    type: 2,
    triggeredAt: new Date(Date.now() - 15 * 60 * 1000),
    contractName: 'my-token-v1',
    txHash: '0x5678...efgh',
  },
  {
    id: 'trig-3',
    alertName: 'NFT Mint - Megapont',
    type: 3,
    triggeredAt: new Date(Date.now() - 45 * 60 * 1000),
    collection: 'Megapont',
    txHash: '0x9abc...ijkl',
  },
];

const HISTORY_STATS = {
  totalTriggers: 847,
  todayTriggers: 23,
  avgPerDay: 121,
  topType: 'Whale Transfer',
};

export default function HistoryPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [renderNow] = useState(() => Date.now());
  const [currentHour] = useState(() => new Date().getHours());

  const stats = HISTORY_STATS;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <History className="w-6 h-6 text-purple-400" />
                <h1 className="text-xl font-semibold">Alert History</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                aria-label="Time range"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
              </select>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
                aria-label="Export history"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main">
        <div className="container mx-auto px-4 pt-8 -mb-4">
          <Breadcrumbs />
        </div>
        {/* Stats */}
        <section className="py-8 border-b border-gray-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{stats.totalTriggers}</div>
                <div className="text-gray-400 text-sm">Total Triggers</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-400">{stats.todayTriggers}</div>
                <div className="text-gray-400 text-sm">Today</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-400">{stats.avgPerDay}</div>
                <div className="text-gray-400 text-sm">Avg / Day</div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <div className="text-lg font-bold text-blue-400">🐋 {stats.topType}</div>
                <div className="text-gray-400 text-sm">Top Alert Type</div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Triggers */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-semibold mb-4">Recent Triggers</h2>
            <div 
              className="grid gap-4 mb-8"
              role="list"
              aria-label="Recent alert triggers"
            >
              {recentTriggers.map((trigger) => {
                const typeInfo = alertTypeInfo.find(t => t.id === trigger.type);
                const timeAgo = Math.floor((renderNow - trigger.triggeredAt.getTime()) / 60000);

                return (
                  <div
                    key={trigger.id}
                    className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{typeInfo?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white truncate">{trigger.alertName}</h3>
                          <span className="text-xs text-gray-500">
                            {timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {trigger.type === 1 && trigger.amount !== undefined && `${(trigger.amount / 1000).toFixed(0)}k STX transferred`}
                          {trigger.type === 2 && trigger.contractName && `Contract: ${trigger.contractName}`}
                          {trigger.type === 3 && trigger.collection && `Collection: ${trigger.collection}`}
                        </p>
                      </div>
                    <a
                      href={`https://explorer.hiro.so/txid/${trigger.txHash}?chain=mainnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
                      aria-label={`View transaction ${trigger.txHash} on Hiro Explorer`}
                      title="View on Hiro Explorer"
                    >
                      View TX
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full History Table */}
            <AlertHistory />
          </div>
        </section>

        {/* Alert Type Breakdown */}
        <section className="py-8 bg-gray-900/30">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-semibold mb-6">Triggers by Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {alertTypeInfo.map((type) => {
                const count = ((type.id * 137 + stats.totalTriggers) % 200) + 50;
                const percentage = Math.floor((count / stats.totalTriggers) * 100);

                return (
                  <div
                    key={type.id}
                    className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center"
                  >
                    <span className="text-3xl mb-2 block">{type.icon}</span>
                    <div className="text-xl font-bold text-white">{count}</div>
                    <div className="text-sm text-gray-400">{type.name}</div>
                    <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Activity Timeline */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-semibold mb-6">Activity Timeline (Last 24h)</h2>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="h-40 flex items-end gap-1">
                {Array.from({ length: 24 }).map((_, i) => {
                  const height = ((i * 29 + 47) % 80) + 20;
                  const hour = (currentHour - 23 + i + 24) % 24;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                      {i % 4 === 0 && (
                        <span className="text-xs text-gray-500 mt-2">{hour}:00</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

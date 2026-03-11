'use client';

import { useState, useEffect } from 'react';
import {
  History,
  Filter,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface AlertHistoryEntry {
  id: string;
  alertId: number;
  alertName: string;
  alertType: number;
  triggeredAt: Date;
  txHash: string;
  blockHeight: number;
  data: Record<string, any>;
}

const alertTypeInfo: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: 'Whale Transfer', icon: '🐋', color: 'blue' },
  2: { name: 'Contract Deploy', icon: '📜', color: 'purple' },
  3: { name: 'NFT Mint', icon: '🎨', color: 'pink' },
  4: { name: 'Token Launch', icon: '🪙', color: 'yellow' },
  5: { name: 'Large Swap', icon: '💱', color: 'green' },
  6: { name: 'Address Watch', icon: '👁️', color: 'orange' },
};

interface AlertHistoryProps {
  userAddress?: string;
}

export default function AlertHistory({ userAddress }: AlertHistoryProps) {
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Simulated data - replace with actual API call
        const mockHistory: AlertHistoryEntry[] = Array.from({ length: 50 }, (_, i) => ({
          id: `hist-${i}`,
          alertId: Math.floor(Math.random() * 10) + 1,
          alertName: `Alert #${Math.floor(Math.random() * 10) + 1}`,
          alertType: Math.floor(Math.random() * 6) + 1,
          triggeredAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          blockHeight: 5400000 + Math.floor(Math.random() * 10000),
          data: {
            amount: Math.floor(Math.random() * 100000),
            sender: 'SP1A2B3C...',
            recipient: 'SP4D5E6F...',
          },
        }));

        // Apply filters
        let filtered = mockHistory;
        if (filter !== null) {
          filtered = filtered.filter(h => h.alertType === filter);
        }
        if (searchQuery) {
          filtered = filtered.filter(
            h =>
              h.alertName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              h.txHash.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        // Sort by date
        filtered.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());

        // Paginate
        const start = (page - 1) * pageSize;
        const paginated = filtered.slice(start, start + pageSize);

        setHistory(paginated);
        setTotalPages(Math.ceil(filtered.length / pageSize));
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page, filter, searchQuery, userAddress]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportCSV = () => {
    const headers = ['Date', 'Alert Name', 'Type', 'Block', 'TX Hash'];
    const rows = history.map(h => [
      h.triggeredAt.toISOString(),
      h.alertName,
      alertTypeInfo[h.alertType]?.name || 'Unknown',
      h.blockHeight,
      h.txHash,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alert-history.csv';
    a.click();
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Alert History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-all ${
                showFilters ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
              aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              title={showFilters ? 'Hide filters' : 'Show filters'}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-all"
              aria-label="Export CSV"
              title="Export CSV"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by alert name or transaction..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filter === null
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            {Object.entries(alertTypeInfo).map(([type, info]) => (
              <button
                key={type}
                onClick={() => setFilter(parseInt(type))}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${
                  filter === parseInt(type)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <span>{info.icon}</span>
                <span>{info.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Alert
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Block
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Transaction
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No alert history found
                </td>
              </tr>
            ) : (
              history.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{entry.alertName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span>{alertTypeInfo[entry.alertType]?.icon}</span>
                      <span className="text-gray-300">
                        {alertTypeInfo[entry.alertType]?.name}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {formatDate(entry.triggeredAt)}
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-sm">
                    {entry.blockHeight.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`https://explorer.hiro.so/txid/${entry.txHash}?chain=mainnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm font-mono"
                    >
                      {entry.txHash.slice(0, 8)}...{entry.txHash.slice(-6)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-gray-800 text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-gray-800 text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:text-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { ErrorState, NoResultsState, NoTransactionsState } from '@/components/EmptyState';
import logger from '@/lib/logger';
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
  data: Record<string, unknown>;
}

const alertTypeInfo: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: 'Whale Transfer', icon: '🐋', color: 'blue' },
  2: { name: 'Contract Deploy', icon: '📜', color: 'purple' },
  3: { name: 'NFT Mint', icon: '🎨', color: 'pink' },
  4: { name: 'Token Launch', icon: '🪙', color: 'yellow' },
  5: { name: 'Large Swap', icon: '💱', color: 'green' },
  6: { name: 'Address Watch', icon: '👁️', color: 'orange' },
};

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
}

interface AlertHistoryProps {
  userAddress?: string;
}

export default function AlertHistory({ userAddress }: AlertHistoryProps) {
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filter, setFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const pageSize = 10;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulated data - replace with actual API call
      const mockHistory: AlertHistoryEntry[] = Array.from({ length: 50 }, (_, i) => ({
        id: `hist-${userAddress || 'global'}-${i}`,
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
      if (debouncedSearchQuery) {
        filtered = filtered.filter(
          h =>
            h.alertName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            h.txHash.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
      }

      // Sort by date
      filtered.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());

      // Paginate
      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + pageSize);

      setHistory(paginated);
      setTotalItems(filtered.length);
      setTotalPages(Math.ceil(filtered.length / pageSize));
    } catch (err) {
      logger.error('Error fetching history:', err);
      setError('Failed to load alert history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, filter, page, userAddress]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearchQuery]);

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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              onClick={() => setShowFilters((prev) => !prev)}
              className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                showFilters ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
              aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              aria-pressed={showFilters}
              title={showFilters ? 'Hide filters' : 'Show filters'}
            >
              <Filter className={`w-5 h-5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              aria-label="Export history to CSV"
              title="Export CSV"
            >
              <Download className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <label htmlFor="history-search" className="sr-only">Search alert history</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" aria-hidden="true" />
          <input
            id="history-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by alert name or transaction..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                filter === null
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
              aria-pressed={filter === null}
            >
              All Types
            </button>
            {Object.entries(alertTypeInfo).map(([type, info]) => {
              const typeValue = Number.parseInt(type, 10);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilter(typeValue)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    filter === typeValue
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                  aria-pressed={filter === typeValue}
                >
                  <span aria-hidden="true">{info.icon}</span>
                  <span>{info.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Alert
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Block
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Transaction
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 w-40 bg-gray-700 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-28 bg-gray-700 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-32 bg-gray-700 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-20 bg-gray-700 rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-44 bg-gray-700 rounded" />
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-6 py-12">
                  <ErrorState message={error} onRetry={fetchHistory} />
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12">
                  {filter !== null || debouncedSearchQuery ? (
                    <NoResultsState
                      onClearFilter={() => {
                        setFilter(null);
                        setSearchQuery('');
                        setShowFilters(false);
                      }}
                    />
                  ) : (
                    <NoTransactionsState />
                  )}
                </td>
              </tr>
            ) : (
              history.map((entry) => (
                <tr 
                  key={entry.id} 
                  className="group hover:bg-white/[0.02] transition-all duration-300 ease-out border-l-2 border-transparent hover:border-purple-500/50"
                >
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{entry.alertName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-800/50 border border-gray-700/50 text-xs font-semibold group-hover:border-purple-500/30 transition-colors">
                      <span aria-hidden="true">{alertTypeInfo[entry.alertType]?.icon}</span>
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
                      aria-label={`View transaction ${entry.txHash} on Hiro Explorer`}
                      title="View on Hiro Explorer"
                    >
                      {entry.txHash.slice(0, 8)}...{entry.txHash.slice(-6)}
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      <span className="sr-only">(opens in new tab)</span>
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
            Showing {Math.min((page - 1) * pageSize + 1, totalItems)}–
            {Math.min(page * pageSize, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-gray-800 text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              aria-label="Go to previous page"
              title="Previous page"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-gray-800 text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              aria-label="Go to next page"
              title="Next page"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

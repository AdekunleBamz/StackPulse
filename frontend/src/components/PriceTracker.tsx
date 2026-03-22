'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface PriceData {
  stx: {
    usd: number;
    change24h: number;
  };
  btc: {
    usd: number;
    change24h: number;
  };
}

import { usePrice } from '@/hooks/usePrice';

export default function PriceTracker() {
  const { prices, loading, error, lastUpdate, refresh } = usePrice(60000);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(4)}`;
  };

  const formatChange = (change: number) => {
    const formatted = Math.abs(change).toFixed(2);
    return `${change >= 0 ? '+' : '-'}${formatted}%`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0.1) return <ArrowUp className="w-3 h-3" />;
    if (change < -0.1) return <ArrowDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0.1) return 'text-green-400';
    if (change < -0.1) return 'text-red-400';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-800/50 rounded-lg animate-pulse">
        <div className="w-24 h-4 bg-gray-700 rounded"></div>
        <div className="w-24 h-4 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!prices) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
        <TrendingUp className="w-4 h-4 text-purple-400" />
        <span className="text-gray-400 text-sm">{error || 'Prices unavailable'}</span>
        <button
          type="button"
          onClick={refresh}
          className="ml-auto text-sm text-purple-300 hover:text-purple-200 transition-colors rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="relative">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          {loading && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm hidden sm:inline">{loading ? 'Refreshing...' : 'Prices:'}</span>
      </div>

      {/* STX Price */}
      <div className="flex items-center gap-2">
        <span className="font-medium text-white">STX</span>
        <span className="text-gray-300">{formatPrice(prices.stx.usd)}</span>
        <span
          className={`flex items-center text-xs ${getChangeColor(prices.stx.change24h)}`}
          aria-label={`STX ${prices.stx.change24h >= 0 ? 'up' : 'down'} ${Math.abs(prices.stx.change24h).toFixed(2)} percent in 24 hours`}
        >
          {getChangeIcon(prices.stx.change24h)}
          {formatChange(prices.stx.change24h)}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-700" />

      {/* BTC Price */}
      <div className="flex items-center gap-2">
        <span className="font-medium text-white">BTC</span>
        <span className="text-gray-300">{formatPrice(prices.btc.usd)}</span>
        <span
          className={`flex items-center text-xs ${getChangeColor(prices.btc.change24h)}`}
          aria-label={`BTC ${prices.btc.change24h >= 0 ? 'up' : 'down'} ${Math.abs(prices.btc.change24h).toFixed(2)} percent in 24 hours`}
        >
          {getChangeIcon(prices.btc.change24h)}
          {formatChange(prices.btc.change24h)}
        </span>
      </div>

      {/* Last update tooltip */}
      {lastUpdate && (
        <div className="hidden lg:block text-xs text-gray-500">
          Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}

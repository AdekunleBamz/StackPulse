'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import logger from '@/lib/logger';

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

const PRICE_REFRESH_INTERVAL_MS = 60000;
const PRICE_CHANGE_NEUTRAL_THRESHOLD = 0.1;
const COINGECKO_SIMPLE_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=blockstack,bitcoin&vs_currencies=usd&include_24hr_change=true';

const toFiniteNumber = (value: unknown): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

function formatPrice(price: number) {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${price.toFixed(4)}`;
}

function formatChange(change: number) {
  const formatted = Math.abs(change).toFixed(2);
  return `${change >= 0 ? '+' : '-'}${formatted}%`;
}

function getChangeIcon(change: number) {
  if (change > PRICE_CHANGE_NEUTRAL_THRESHOLD) return <ArrowUp className="w-3 h-3" aria-hidden="true" />;
  if (change < -PRICE_CHANGE_NEUTRAL_THRESHOLD) return <ArrowDown className="w-3 h-3" aria-hidden="true" />;
  return <Minus className="w-3 h-3" aria-hidden="true" />;
}

function getChangeColor(change: number) {
  if (change > PRICE_CHANGE_NEUTRAL_THRESHOLD) return 'text-green-400';
  if (change < -PRICE_CHANGE_NEUTRAL_THRESHOLD) return 'text-red-400';
  return 'text-gray-400';
}

export default function PriceTracker() {
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        // Using CoinGecko API for price data
        const response = await fetch(COINGECKO_SIMPLE_PRICE_URL, {
          headers: { Accept: 'application/json' },
        });
        
        if (!response.ok) throw new Error('Bad response');
        const data = await response.json();
        if (!isMountedRef.current) {
          return;
        }
        const stxUsd = toFiniteNumber(data.blockstack?.usd);
        const stxChange24h = toFiniteNumber(data.blockstack?.usd_24h_change);
        const btcUsd = toFiniteNumber(data.bitcoin?.usd);
        const btcChange24h = toFiniteNumber(data.bitcoin?.usd_24h_change);

        setPrices({
          stx: {
            usd: stxUsd,
            change24h: stxChange24h,
          },
          btc: {
            usd: btcUsd,
            change24h: btcChange24h,
          },
        });
        setLastUpdate(new Date());
        setError(null);
      } catch (error) {
        if (!isMountedRef.current) {
          return;
        }
        logger.error('Error fetching prices:', error);
        setError('Unable to load prices right now.');
        setPrices(null);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, PRICE_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshKey]);

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
          onClick={() => setRefreshKey((k) => k + 1)}
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
        <TrendingUp className="w-4 h-4 text-purple-400" />
        <span className="text-gray-400 text-sm hidden sm:inline">Prices:</span>
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

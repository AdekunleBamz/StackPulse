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

export default function PriceTracker() {
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Using CoinGecko API for price data
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=blockstack,bitcoin&vs_currencies=usd&include_24hr_change=true'
        );
        
        if (response.ok) {
          const data = await response.json();
          setPrices({
            stx: {
              usd: data.blockstack?.usd || 0,
              change24h: data.blockstack?.usd_24h_change || 0,
            },
            btc: {
              usd: data.bitcoin?.usd || 0,
              change24h: data.bitcoin?.usd_24h_change || 0,
            },
          });
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

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
    return null;
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
        <span className={`flex items-center text-xs ${getChangeColor(prices.stx.change24h)}`}>
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
        <span className={`flex items-center text-xs ${getChangeColor(prices.btc.change24h)}`}>
          {getChangeIcon(prices.btc.change24h)}
          {formatChange(prices.btc.change24h)}
        </span>
      </div>

      {/* Last update tooltip */}
      {lastUpdate && (
        <div className="hidden lg:block text-xs text-gray-500">
          Updated {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

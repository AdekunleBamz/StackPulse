import { useState, useEffect, useCallback } from 'react';

/**
 * Live price data snapshot for STX and BTC.
 * @property stx.change24h - 24-hour percentage change for STX
 * @property btc.change24h - 24-hour percentage change for BTC
 */
export interface PriceData {
  stx: {
    usd: number;
    change24h: number;
  };
  btc: {
    usd: number;
    change24h: number;
  };
}

/**
 * Hook for fetching live STX and BTC price data from CoinGecko.
 * @param refreshInterval - Polling interval in milliseconds (default: 60000)
 */
export function usePrice(refreshInterval: number = 60000) {
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      // Using CoinGecko API for price data
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=blockstack,bitcoin&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) throw new Error('Price service unavailable');
      const data = await response.json();
      
      setPrices({
        stx: {
          usd: data.blockstack?.usd ?? 0,
          change24h: data.blockstack?.usd_24h_change ?? 0,
        },
        btc: {
          usd: data.bitcoin?.usd ?? 0,
          change24h: data.bitcoin?.usd_24h_change ?? 0,
        },
      });
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Unable to load prices right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);

  return { 
    prices, 
    loading, 
    error, 
    lastUpdate, 
    refresh: fetchPrices 
  };
}

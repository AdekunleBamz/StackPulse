'use client';

import { useState, useCallback, useMemo } from 'react';

interface MetricPoint {
  timestamp: number;
  value: number;
  [key: string]: unknown;
}

interface UseMetricsOptions {
  windowSize?: number;
  initialData?: MetricPoint[];
}

/**
 * Hook for managing live-updating metric data with a fixed window size.
 * Useful for real-time charts to prevent performance degradation over time.
 */
export function useMetrics(options: UseMetricsOptions = {}) {
  const { windowSize = 50, initialData = [] } = options;
  const [data, setData] = useState<MetricPoint[]>(initialData);

  const addDataPoint = useCallback((point: MetricPoint) => {
    setData((prev) => {
      const newData = [...prev, point];
      if (newData.length > windowSize) {
        return newData.slice(newData.length - windowSize);
      }
      return newData;
    });
  }, [windowSize]);

  const clearData = useCallback(() => {
    setData([]);
  }, []);

  const stats = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 0, avg: 0, latest: 0 };
    
    const values = data.map(p => p.value);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / data.length,
      latest: values[values.length - 1]
    };
  }, [data]);

  return {
    data,
    addDataPoint,
    clearData,
    stats
  };
}

export default useMetrics;

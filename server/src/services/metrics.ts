/**
 * Metrics Service
 * Tracks system performance and event metrics
 */

import logger from '../utils/logger';

interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

class MetricsService {
  private metrics: Map<string, MetricValue[]> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private histograms: Map<string, Record<string, number>> = new Map();

  /**
   * Record a value into a histogram bucket
   */
  recordHistogram(name: string, value: number) {
    const buckets = this.histograms.get(name) || {
      '0-50ms': 0, '50-100ms': 0, '100-250ms': 0, '250-500ms': 0, '500ms-1s': 0, '>1s': 0
    };

    if (value <= 50) buckets['0-50ms']++;
    else if (value <= 100) buckets['50-100ms']++;
    else if (value <= 250) buckets['100-250ms']++;
    else if (value <= 500) buckets['250-500ms']++;
    else if (value <= 1000) buckets['500ms-1s']++;
    else buckets['>1s']++;

    this.histograms.set(name, buckets);
    logger.debug(`Histogram recorded: ${name}`, { value });
  }

  recordMetric(name: string, value: number, labels?: Record<string, string>) {
    const values = this.metrics.get(name) || [];
    values.push({ value, timestamp: Date.now(), labels });
    if (values.length > 1000) values.shift();
    this.metrics.set(name, values);
    
    // Also record as histogram if it's a duration
    if (name.includes('duration')) this.recordHistogram(name, value);
  }

  /**
   * Record an error metric
   */
  recordError(type: string) {
    const current = this.errorCounts.get(type) || 0;
    this.errorCounts.set(type, current + 1);
    logger.error('Error metric recorded', { type, count: current + 1 });
  }

  /**
   * Get average value for a metric
   */
  getAverage(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.length ? values.reduce((acc, curr) => acc + curr.value, 0) / values.length : 0;
  }
}

export default new MetricsService();

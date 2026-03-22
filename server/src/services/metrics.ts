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

  private histograms: Map<string, Record<string, number>> = new Map();

  /**
   * Record a value into a histogram bucket
   */
  recordHistogram(name: string, value: number) {
    const buckets = this.histograms.get(name) || {
      '0-50ms': 0,
      '50-100ms': 0,
      '100-250ms': 0,
      '250-500ms': 0,
      '500ms-1s': 0,
      '>1s': 0
    };

    if (value <= 50) buckets['0-50ms']++;
    else if (value <= 100) buckets['50-100ms']++;
    else if (value <= 250) buckets['100-250ms']++;
    else if (value <= 500) buckets['250-500ms']++;
    else if (value <= 1000) buckets['500ms-1s']++;
    else buckets['>1s']++;

    this.histograms.get(name) || this.histograms.set(name, buckets);
    logger.debug(`Histogram recorded: ${name}`, { value, bucket: this.resolveBucket(value) });
  }

  private resolveBucket(value: number): string {
    if (value <= 50) return '0-50ms';
    if (value <= 100) return '50-100ms';
    if (value <= 250) return '100-250ms';
    if (value <= 500) return '250-500ms';
    if (value <= 1000) return '500ms-1s';
    return '>1s';
  }

  /**
   * Get histogram distribution
   */
  getDistribution(name: string) {
    return this.histograms.get(name) || null;
  }
}

export default new MetricsService();

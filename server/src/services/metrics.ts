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

  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>) {
    const entry: MetricValue = {
      value,
      timestamp: Date.now(),
      labels
    };

    const values = this.metrics.get(name) || [];
    values.push(entry);

    // Keep last 1000 entries per metric
    if (values.length > 1000) {
      values.shift();
    }

    this.metrics.set(name, values);
    logger.debug(`Metric recorded: ${name}`, { value, labels });
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string): MetricValue[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get average value for a metric
   */
  getAverage(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    
    const sum = values.reduce((acc, curr) => acc + curr.value, 0);
    return sum / values.length;
  }
}

export default new MetricsService();

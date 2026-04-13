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

const MAX_METRIC_ENTRIES = 1000;
const PERFORMANCE_WARN_THRESHOLD_MS = 500;

class MetricsService {
  private metrics: Map<string, MetricValue[]> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private eventCounts: Map<string, number[]> = new Map();

  /**
   * Record an error metric
   */
  recordError(type: string): void {
    const current = this.errorCounts.get(type) ?? 0;
    this.errorCounts.set(type, current + 1);
    logger.error(`Error recorded: ${type}`, { count: current + 1 });
  }

  /**
   * Record an event for throughput calculation
   */
  recordEvent(name: string): void {
    const now = Date.now();
    const timestamps = this.eventCounts.get(name) || [];
    timestamps.push(now);
    
    // Keep only last 10 minutes of events
    const tenMinutesAgo = now - 10 * 60 * 1000;
    const filtered = timestamps.filter(t => t > tenMinutesAgo);
    
    this.eventCounts.set(name, filtered);
  }

  /**
   * Get event throughput (events per minute)
   */
  getThroughput(name: string, windowMs: number = 60000): number {
    const now = Date.now();
    const timestamps = this.eventCounts.get(name) || [];
    const windowStart = now - windowMs;
    const count = timestamps.filter(t => t > windowStart).length;
    return (count / windowMs) * 60000;
  }

  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    if (!Number.isFinite(value)) {
      logger.warn(`Skipping non-finite metric: ${name}`, { value, labels });
      return;
    }

    const entry: MetricValue = {
      value,
      timestamp: Date.now(),
      labels
    };

    const values = this.metrics.get(name) || [];
    values.push(entry);

    // Keep last N entries per metric
    if (values.length > MAX_METRIC_ENTRIES) {
      values.shift();
    }

    this.metrics.set(name, values);
    logger.debug(`Metric recorded: ${name}`, { value, labels });
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string): MetricValue[] {
    const values = this.metrics.get(name) || [];
    return values.slice();
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

  /**
   * Monitor performance and log warnings
   */
  monitorPerformance(): void {
    const avgDuration = this.getAverage('http_request_duration');
    if (avgDuration > PERFORMANCE_WARN_THRESHOLD_MS) {
      logger.warn('Performance degraded: high average request duration', { avgDuration: `${avgDuration.toFixed(2)}ms` });
    }
  }
}

export default new MetricsService();

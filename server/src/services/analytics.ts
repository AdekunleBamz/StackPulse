/**
 * Analytics Aggregation Service
 * Tracks and aggregates event data for analytics
 */

import logger from '../utils/logger';

// Time windows for aggregation
type TimeWindow = '1h' | '24h' | '7d' | '30d';

interface EventCount {
  count: number;
  firstSeen: number;
  lastSeen: number;
}

interface AnalyticsData {
  events: Map<string, EventCount>;
  hourly: Map<number, Map<string, number>>;
  daily: Map<number, Map<string, number>>;
}

// Memory safety limits
const MAX_EVENT_TYPES = 1000;
const MAX_HOURLY_ENTRIES = 24 * 7; // 1 week of hourly data
const MAX_DAILY_ENTRIES = 365; // 1 year of daily data

// Track an event
export function trackEvent(eventType: string, metadata?: Record<string, any>): void {
  if (analytics.events.size >= MAX_EVENT_TYPES && !analytics.events.has(eventType)) {
    logger.warn('Maximum event types reached, dropping new event type', { eventType });
    return;
  }
  const now = Date.now();
  const hour = Math.floor(now / 3600000);
  const day = Math.floor(now / 86400000);
  
  // Update event count
  const existing = analytics.events.get(eventType);
  if (existing) {
    analytics.events.set(eventType, {
      count: existing.count + 1,
      firstSeen: existing.firstSeen,
      lastSeen: now
    });
  } else {
    analytics.events.set(eventType, {
      count: 1,
      firstSeen: now,
      lastSeen: now
    });
  }
  
  // Update hourly aggregation
  if (!analytics.hourly.has(hour)) {
    analytics.hourly.set(hour, new Map());
  }
  const hourMap = analytics.hourly.get(hour)!;
  hourMap.set(eventType, (hourMap.get(eventType) || 0) + 1);
  
  // Update daily aggregation
  if (!analytics.daily.has(day)) {
    analytics.daily.set(day, new Map());
  }
  const dayMap = analytics.daily.get(day)!;
  dayMap.set(eventType, (dayMap.get(eventType) || 0) + 1);
  
  logger.debug('Event tracked', { eventType, metadata });
}

// Get event counts
export function getEventCounts(): Record<string, number> {
  const result: Record<string, number> = {};
  analytics.events.forEach((data, eventType) => {
    result[eventType] = data.count;
  });
  return result;
}

// Get events within time window
export function getEventsInWindow(window: TimeWindow): Record<string, number> {
  const now = Date.now();
  let cutoffTime: number;
  
  switch (window) {
    case '1h':
      cutoffTime = now - 3600000;
      break;
    case '24h':
      cutoffTime = now - 86400000;
      break;
    case '7d':
      cutoffTime = now - 604800000;
      break;
    case '30d':
      cutoffTime = now - 2592000000;
      break;
    default:
      cutoffTime = 0;
  }
  
  const cutoffHour = Math.floor(cutoffTime / 3600000);
  const result: Record<string, number> = {};
  
  analytics.hourly.forEach((eventCounts, hour) => {
    if (hour >= cutoffHour) {
      eventCounts.forEach((count, eventType) => {
        result[eventType] = (result[eventType] || 0) + count;
      });
    }
  });
  
  return result;
}

// Get hourly breakdown for a specific event
export function getHourlyBreakdown(eventType: string, hours: number = 24): Record<string, number> {
  const now = Date.now();
  const startHour = Math.floor(now / 3600000) - hours;
  const result: Record<string, number> = {};
  
  for (let i = startHour; i <= startHour + hours; i++) {
    const hourMap = analytics.hourly.get(i);
    if (hourMap) {
      const count = hourMap.get(eventType) || 0;
      const date = new Date(i * 3600000);
      const key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      result[key] = count;
    }
  }
  
  return result;
}

// Get daily breakdown for a specific event
export function getDailyBreakdown(eventType: string, days: number = 30): Record<string, number> {
  const now = Date.now();
  const startDay = Math.floor(now / 86400000) - days;
  const result: Record<string, number> = {};
  
  for (let i = startDay; i <= startDay + days; i++) {
    const dayMap = analytics.daily.get(i);
    if (dayMap) {
      const count = dayMap.get(eventType) || 0;
      const date = new Date(i * 86400000);
      const key = date.toISOString().slice(0, 10); // YYYY-MM-DD
      result[key] = count;
    }
  }
  
  return result;
}

// Get analytics summary
export function getAnalyticsSummary(): {
  totalEvents: number;
  eventTypes: number;
  eventsByType: Record<string, number>;
  last24h: Record<string, number>;
  last7d: Record<string, number>;
} {
  let totalEvents = 0;
  const eventsByType: Record<string, number> = {};
  
  analytics.events.forEach((data, eventType) => {
    totalEvents += data.count;
    eventsByType[eventType] = data.count;
  });
  
  return {
    totalEvents,
    eventTypes: analytics.events.size,
    eventsByType,
    last24h: getEventsInWindow('24h'),
    last7d: getEventsInWindow('7d')
  };
}

// Clear old analytics data (call periodically)
export function clearOldData(maxAgeDays: number = 30): void {
  const maxAge = maxAgeDays * 86400000;
  const now = Date.now();
  const cutoffHour = Math.floor((now - maxAge) / 3600000);
  const cutoffDay = Math.floor((now - maxAge) / 86400000);
  
  // Clear old hourly data
  for (const [hour] of analytics.hourly) {
    if (hour < cutoffHour) {
      analytics.hourly.delete(hour);
    }
  }
  
  // Clear old daily data
  for (const [day] of analytics.daily) {
    if (day < cutoffDay) {
      analytics.daily.delete(day);
    }
  }
  
  logger.info('Cleared old analytics data', { maxAgeDays });
}

// Initialize cleanup interval (every hour)
setInterval(() => clearOldData(30), 3600000);

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
  userEventCounts: Map<string, number>;
}

// Memory safety limits
const MAX_EVENT_TYPES = 50;
const MAX_HOURLY_ENTRIES = 24 * 7; // 1 week of hourly data
const MAX_DAILY_ENTRIES = 365; // 1 year of daily data
const ANALYTICS_CLEANUP_INTERVAL_MS = 3600000;
const MILLISECONDS_PER_HOUR = 3600000;
const MILLISECONDS_PER_DAY = 86400000;
const APPROX_MILLISECONDS_PER_30_DAYS = 2592000000;
const DEFAULT_HOURLY_BREAKDOWN_HOURS = 24;
const MAX_HOURLY_BREAKDOWN_HOURS = 24 * 30;
const DEFAULT_DAILY_BREAKDOWN_DAYS = 30;
const MAX_DAILY_BREAKDOWN_DAYS = 365;
const MAX_EVENTS_PER_USER = new Map<number, number>([
  [0, 1000],  // FREE
  [1, 10000], // PRO
  [2, 100000], // WHALE
  [3, 1000000] // EXCHANGE
]);

// In-memory storage for analytics data
const analytics: AnalyticsData = {
  events: new Map(),
  hourly: new Map(),
  daily: new Map(),
  userEventCounts: new Map(),
};

function trimOldestEntries<T>(map: Map<number, T>, maxEntries: number): void {
  while (map.size > maxEntries) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    map.delete(oldestKey);
  }
}

// Track an event
export function trackEvent(
  eventType: string,
  metadata?: Record<string, unknown>,
  userAddress?: string,
  tier: number = 0
): void {
  if (analytics.events.size >= MAX_EVENT_TYPES && !analytics.events.has(eventType)) {
    logger.warn('Maximum event types reached, dropping new event type', { eventType });
    return;
  }

  if (userAddress) {
    const currentCount = analytics.userEventCounts.get(userAddress) ?? 0;
    const normalizedTier = Number.isInteger(tier) ? tier : 0;
    const limit = MAX_EVENTS_PER_USER.get(normalizedTier) ?? MAX_EVENTS_PER_USER.get(0)!;
    
    if (currentCount >= limit) {
      logger.debug('User analytics limit reached', { userAddress, tier, limit, eventType });
      return;
    }
    
    analytics.userEventCounts.set(userAddress, currentCount + 1);
  }

  const now = Date.now();
  const hour = Math.floor(now / MILLISECONDS_PER_HOUR);
  const day = Math.floor(now / MILLISECONDS_PER_DAY);
  
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
  hourMap.set(eventType, (hourMap.get(eventType) ?? 0) + 1);
  trimOldestEntries(analytics.hourly, MAX_HOURLY_ENTRIES);
  
  // Update daily aggregation
  if (!analytics.daily.has(day)) {
    analytics.daily.set(day, new Map());
  }
  const dayMap = analytics.daily.get(day)!;
  dayMap.set(eventType, (dayMap.get(eventType) ?? 0) + 1);
  trimOldestEntries(analytics.daily, MAX_DAILY_ENTRIES);
  
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
      cutoffTime = now - MILLISECONDS_PER_HOUR;
      break;
    case '24h':
      cutoffTime = now - MILLISECONDS_PER_DAY;
      break;
    case '7d':
      cutoffTime = now - (7 * MILLISECONDS_PER_DAY);
      break;
    case '30d':
      cutoffTime = now - APPROX_MILLISECONDS_PER_30_DAYS;
      break;
    default:
      cutoffTime = 0;
  }
  
  const cutoffHour = Math.floor(cutoffTime / MILLISECONDS_PER_HOUR);
  const result: Record<string, number> = {};
  
  analytics.hourly.forEach((eventCounts, hour) => {
    if (hour >= cutoffHour) {
      eventCounts.forEach((count, eventType) => {
        result[eventType] = (result[eventType] ?? 0) + count;
      });
    }
  });
  
  return result;
}

// Get hourly breakdown for a specific event
export function getHourlyBreakdown(
  eventType: string,
  hours: number = DEFAULT_HOURLY_BREAKDOWN_HOURS
): Record<string, number> {
  const now = Date.now();
  const safeHours = Number.isFinite(hours)
    ? Math.min(MAX_HOURLY_BREAKDOWN_HOURS, Math.max(1, Math.floor(hours)))
    : DEFAULT_HOURLY_BREAKDOWN_HOURS;
  const startHour = Math.floor(now / MILLISECONDS_PER_HOUR) - safeHours;
  const result: Record<string, number> = {};
  
  for (let i = startHour; i < startHour + safeHours; i++) {
    const hourMap = analytics.hourly.get(i);
    if (hourMap) {
      const count = hourMap.get(eventType) ?? 0;
      const date = new Date(i * MILLISECONDS_PER_HOUR);
      const key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      result[key] = count;
    }
  }
  
  return result;
}

// Get daily breakdown for a specific event
export function getDailyBreakdown(
  eventType: string,
  days: number = DEFAULT_DAILY_BREAKDOWN_DAYS
): Record<string, number> {
  const now = Date.now();
  const safeDays = Number.isFinite(days)
    ? Math.min(MAX_DAILY_BREAKDOWN_DAYS, Math.max(1, Math.floor(days)))
    : DEFAULT_DAILY_BREAKDOWN_DAYS;
  const startDay = Math.floor(now / MILLISECONDS_PER_DAY) - safeDays;
  const result: Record<string, number> = {};
  
  for (let i = startDay; i < startDay + safeDays; i++) {
    const dayMap = analytics.daily.get(i);
    if (dayMap) {
      const count = dayMap.get(eventType) ?? 0;
      const date = new Date(i * MILLISECONDS_PER_DAY);
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
  const safeMaxAgeDays = Number.isFinite(maxAgeDays)
    ? Math.max(1, Math.floor(maxAgeDays))
    : 30;
  const maxAge = safeMaxAgeDays * MILLISECONDS_PER_DAY;
  const now = Date.now();
  const cutoffHour = Math.floor((now - maxAge) / MILLISECONDS_PER_HOUR);
  const cutoffDay = Math.floor((now - maxAge) / MILLISECONDS_PER_DAY);
  
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

  // Monthly reset for user event counts if needed
  // For now, just log the size
  if (now % APPROX_MILLISECONDS_PER_30_DAYS < MILLISECONDS_PER_HOUR) { // Approx once a month
    logger.info('Resetting monthly user event counts', { count: analytics.userEventCounts.size });
    analytics.userEventCounts.clear();
  }
  
  logger.info('Cleared old analytics data', { 
    maxAgeDays: safeMaxAgeDays, 
    hourlyRemaining: analytics.hourly.size,
    dailyRemaining: analytics.daily.size 
  });
}

// Initialize cleanup interval (every hour) without holding the process open.
const cleanupInterval = setInterval(() => clearOldData(30), ANALYTICS_CLEANUP_INTERVAL_MS);
cleanupInterval.unref();

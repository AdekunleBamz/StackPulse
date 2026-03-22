import logger from '../utils/logger';
/**
 * Cache Service
 * Simple in-memory caching
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const MAX_CACHE_SIZE = 10000;
const MAX_CACHE_SIZE_PER_USER = new Map<number, number>([
  [0, 100],     // FREE
  [1, 1000],    // PRO
  [2, 10000],   // WHALE
  [3, 100000]   // EXCHANGE
]);

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  /**
   * Set a value in cache with LRU eviction
   */
  set<T>(key: string, value: T, ttlMs: number = 3600000): void {
    // If key exists, delete it first to move it to the end (most recent)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= MAX_CACHE_SIZE) {
      // Evict the oldest entry (first item in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        logger.debug('Cache entry evicted (LRU)', { key: oldestKey });
      }
    }
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  /**
   * Get a value from cache and update its recency
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh recency by re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value as T;
  }
}

const cacheService = new CacheService();
export default cacheService;

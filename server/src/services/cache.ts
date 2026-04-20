import logger from '../utils/logger';
/**
 * Cache Service
 * Simple in-memory caching
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const MAX_CACHE_SIZE = 10_000;
const CACHE_CLEANUP_INTERVAL_MS = 600_000;
const CACHE_DEFAULT_TTL_MS = 3600_000;

/**
 * Standard TTL values in milliseconds
 */
export const CACHE_TTL = {
  SHORT: 60 * 1000,         // 1 minute
  MEDIUM: 5 * 60 * 1000,    // 5 minutes
  LONG: 60 * 60 * 1000,     // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
} as const;

class CacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  private isExpired(entry: CacheEntry<unknown>, now = Date.now()): boolean {
    return now > entry.expiresAt;
  }

  constructor() {
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, CACHE_CLEANUP_INTERVAL_MS);
    this.cleanupInterval.unref();
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttlMs: number = CACHE_DEFAULT_TTL_MS): void {
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(key)) {
      logger.warn('Maximum cache size reached, dropping new entry', { key });
      return;
    }
    
    const safeTtlMs = Number.isFinite(ttlMs) ? Math.max(0, Math.floor(ttlMs)) : 0;

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + safeTtlMs
    });
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Destroy cache service
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
    logger.info('Cache service destroyed');
  }

  /**
   * Cleanup expired items to prevent memory leaks
   */
  cleanupExpired(): void {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry, now)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      logger.info('Cleaned up expired cache items', { count });
    }
  }
}

const cacheService = new CacheService();

export default cacheService;

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
   * Returns the cached value for key if it exists and has not expired.
   * Otherwise calls factory(), stores the result, and returns it.
   */
  async getOrSet<T>(key: string, factory: () => T | Promise<T>, ttlMs: number = CACHE_DEFAULT_TTL_MS): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Refreshes the TTL of an existing cache entry without changing its value.
   * Returns true if the key was found and extended, false if it was missing or expired.
   */
  bump(key: string, ttlMs: number = CACHE_DEFAULT_TTL_MS): boolean {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    const safeTtlMs = Number.isFinite(ttlMs) ? Math.max(0, Math.floor(ttlMs)) : 0;
    this.cache.set(key, { ...entry, expiresAt: Date.now() + safeTtlMs });
    return true;
  }

  /**
   * Fetches multiple keys at once. Returns a Map of key → value for
   * keys that exist and have not expired. Missing or expired keys are
   * omitted from the result.
   */
  mget<T>(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();
    for (const key of keys) {
      const value = this.get<T>(key);
      if (value !== null) result.set(key, value);
    }
    return result;
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
   * Returns remaining TTL in milliseconds for a cached key.
   * Returns -1 if the key does not exist or has expired.
   */
  ttl(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return -1;
    const remaining = entry.expiresAt - Date.now();
    if (remaining <= 0) {
      this.cache.delete(key);
      return -1;
    }
    return remaining;
  }

  /**
   * Returns an array of all non-expired keys currently held in the cache.
   */
  keys(): string[] {
    const now = Date.now();
    const result: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry, now)) {
        result.push(key);
      }
    }
    return result;
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

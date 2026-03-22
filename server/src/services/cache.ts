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
   * Set a value in cache with optional user-tier limits
   */
  set<T>(key: string, value: T, ttlMs: number = 3600000, tier: number = 0): void {
    const limit = MAX_CACHE_SIZE_PER_USER.get(tier) || 100;
    
    // Simple way to count keys per user if they follow a prefix pattern like "alerts:address"
    const userPrefix = key.split(':')[0] + ':' + key.split(':')[1];
    const userEntryCount = Array.from(this.cache.keys()).filter(k => k.startsWith(userPrefix)).length;

    if (userEntryCount >= limit && !this.cache.has(key)) {
      logger.warn('User cache limit reached', { key, tier, limit });
      return;
    }

    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(key)) {
      this.cleanup(); // Force cleanup if full
      if (this.cache.size >= MAX_CACHE_SIZE) return;
    }
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  /**
   * Get-or-set pattern for async operations
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) return cached;

    const fresh = await fetcher();
    this.set(key, fresh, ttlMs);
    return fresh;
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) logger.debug('Cache cleanup', { removed: count });
  }

  destroy(): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

const cacheService = new CacheService();
export default cacheService;

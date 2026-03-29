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

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 600000);
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttlMs: number = 3600000): void {
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(key)) {
      logger.warn('Maximum cache size reached, dropping new entry', { key });
      return;
    }
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
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
    if (Date.now() > entry.expiresAt) {
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
    if (Date.now() > entry.expiresAt) {
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
    if (this.cleanupInterval) { // Only clear if it was set
      clearInterval(this.cleanupInterval);
    }
    logger.info('Cache cleared');
  }

  /**
   * Cleanup expired items to prevent memory leaks
   */
  cleanupExpired() {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
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

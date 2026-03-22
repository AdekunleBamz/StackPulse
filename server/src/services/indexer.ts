import logger from '../utils/logger';

/**
 * Indexer Service
 * Tracks blockchain state and synchronizes local data
 */
class IndexerService {
  private currentHeight: number = 0;
  private lastSync: number = 0;

  /**
   * Update the latest processed block height
   */
  async updateHeight(height: number) {
    if (height <= this.currentHeight) return;
    
    this.currentHeight = height;
    this.lastSync = Date.now();
    
    logger.info('Indexer height updated', { height, timestamp: this.lastSync });
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      height: this.currentHeight,
      lastSync: new Date(this.lastSync).toISOString(),
      isSynced: (Date.now() - this.lastSync) < 600000 // Synced if updated in last 10 mins
    };
  }

  /**
   * Audit synchronization state
   */
  async auditSync(expectedHeight: number) {
    const lag = expectedHeight - this.currentHeight;
    if (lag > 10) {
      logger.warn('Indexer lag detected', { lag, current: this.currentHeight, expected: expectedHeight });
    }
    return lag;
  }
}

export default new IndexerService();

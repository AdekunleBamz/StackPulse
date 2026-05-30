import logger from '../utils/logger';

interface IndexerState {
  lastProcessedBlock: number;
  isSyncing: boolean;
  errors: Array<{ block: number; error: string; timestamp: Date }>;
}

let state: IndexerState = {
  lastProcessedBlock: 0,
  isSyncing: false,
  errors: []
};

/**
 * Update the last processed block height
 */
export const updateLastBlock = (height: number) => {
  if (height > state.lastProcessedBlock) {
    const gap = height - state.lastProcessedBlock;
    if (gap > 1 && state.lastProcessedBlock !== 0) {
      logger.warn(`Indexer: Detected block gap of ${gap} blocks!`, { 
        from: state.lastProcessedBlock, 
        to: height 
      });
      // In a real app, this would trigger a catch-up sync
    }
    state.lastProcessedBlock = height;
    logger.debug(`Indexer: Block processed: ${height}`);
  }
};

/**
 * Log a sync error for a specific block
 */
export const logSyncError = (block: number, error: string) => {
  logger.error(`Indexer sync error at block ${block}`, { error });
  state.errors.push({ block, error, timestamp: new Date() });
  
  // Keep only last 100 errors
  if (state.errors.length > 100) {
    state.errors.shift();
  }
};

/**
 * Get the current indexer state
 */
export const getIndexerState = () => {
  return {
    ...state,
    health: state.errors.length > 10 ? 'degraded' : 'healthy'
  };
};

/**
 * Start a maintenance/catch-up sync (Placeholder)
 */
export const startCatchupSync = async (fromBlock: number, toBlock: number) => {
  if (state.isSyncing) return;
  
  state.isSyncing = true;
  logger.info(`Indexer: Starting manual catch-up from ${fromBlock} to ${toBlock}`);
  
  try {
    // Logic to fetch missed blocks from a Stacks Node/API
    // ...
    state.lastProcessedBlock = toBlock;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logSyncError(0, `Catch-up failed: ${message}`);
  } finally {
    state.isSyncing = false;
  }
};

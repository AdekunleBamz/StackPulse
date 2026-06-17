import logger from '../utils/logger';

interface ChainhookStatus {
  lastEventAt: Date | null;
  eventCount: number;
  isHealthy: boolean;
  errors: number;
}

const statuses: Map<string, ChainhookStatus> = new Map();

/**
 * Update the status of a specific chainhook
 */
export const updateChainhookStatus = (name: string, error: boolean = false) => {
  const current = statuses.get(name) || {
    lastEventAt: null,
    eventCount: 0,
    isHealthy: true,
    errors: 0
  };

  if (error) {
    current.errors++;
    current.isHealthy = false;
  } else {
    current.lastEventAt = new Date();
    current.eventCount++;
    current.isHealthy = true;
  }

  statuses.set(name, current);
};

/**
 * Get the health status of all registered chainhooks
 */
export const getChainhookHealth = () => {
  const health: Record<string, any> = {};
  let overallHealthy = true;

  statuses.forEach((status, name) => {
    health[name] = {
      ...status,
      lastEventSecondsAgo: status.lastEventAt 
        ? Math.floor((Date.now() - status.lastEventAt.getTime()) / 1000)
        : null
    };
    if (!status.isHealthy) overallHealthy = false;
  });

  return {
    healthy: overallHealthy,
    hooks: health,
    totalEvents: Array.from(statuses.values()).reduce((sum, s) => sum + s.eventCount, 0)
  };
};

/**
 * Initialize a chainhook status
 */
export const initChainhook = (name: string) => {
  if (!statuses.has(name)) {
    statuses.set(name, {
      lastEventAt: null,
      eventCount: 0,
      isHealthy: true,
      errors: 0
    });
    logger.debug(`Chainhook initialized: ${name}`);
  }
};

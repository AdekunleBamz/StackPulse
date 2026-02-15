import { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import logger from '../utils/logger';

// Types
interface WSClient {
  ws: WebSocket;
  address?: string;
  subscribedChannels: Set<string>;
  lastPing: number;
  isAlive: boolean;
}

interface WSMessage {
  type: string;
  channel?: string;
  data?: any;
  error?: string;
}

// Event channels
export const channels = {
  WHALE_TRANSFERS: 'whale-transfers',
  CONTRACT_DEPLOYS: 'contract-deploys',
  NFT_MINTS: 'nft-mints',
  TOKEN_LAUNCHES: 'token-launches',
  LARGE_SWAPS: 'large-swaps',
  ALERTS: 'alerts',
  BLOCKS: 'blocks',
  PRICES: 'prices',
};

// WebSocket server singleton
let wss: WebSocketServer | null = null;
const clients: Map<string, WSClient> = new Map();

// Heartbeat interval
const HEARTBEAT_INTERVAL = 30000;
const CLIENT_TIMEOUT = 60000;

/**
 * Initialize WebSocket server
 */
export function initWebSocket(server: HttpServer): WebSocketServer {
  if (wss) {
    return wss;
  }

  wss = new WebSocketServer({ 
    server,
    path: '/ws',
    clientTracking: true,
  });

  logger.info('WebSocket server initialized');

  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const client: WSClient = {
      ws,
      subscribedChannels: new Set(),
      lastPing: Date.now(),
      isAlive: true,
    };
    
    clients.set(clientId, client);
    
    logger.info(`WebSocket client connected: ${clientId}`);

    // Send welcome message
    send(ws, {
      type: 'connected',
      data: {
        clientId,
        availableChannels: Object.values(channels),
        message: 'Welcome to StackPulse real-time updates',
      },
    });

    // Handle messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        handleMessage(clientId, client, message);
      } catch (error) {
        send(ws, {
          type: 'error',
          error: 'Invalid message format',
        });
      }
    });

    // Handle pong (heartbeat response)
    ws.on('pong', () => {
      client.isAlive = true;
      client.lastPing = Date.now();
    });

    // Handle close
    ws.on('close', () => {
      clients.delete(clientId);
      logger.info(`WebSocket client disconnected: ${clientId}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${clientId}:`, error);
      clients.delete(clientId);
    });
  });

  // Start heartbeat interval
  setInterval(() => {
    heartbeat();
  }, HEARTBEAT_INTERVAL);

  return wss;
}

/**
 * Handle incoming WebSocket message
 */
function handleMessage(clientId: string, client: WSClient, message: WSMessage): void {
  switch (message.type) {
    case 'subscribe':
      if (message.channel && Object.values(channels).includes(message.channel)) {
        client.subscribedChannels.add(message.channel);
        send(client.ws, {
          type: 'subscribed',
          channel: message.channel,
        });
        logger.debug(`Client ${clientId} subscribed to ${message.channel}`);
      } else {
        send(client.ws, {
          type: 'error',
          error: `Invalid channel: ${message.channel}`,
        });
      }
      break;

    case 'unsubscribe':
      if (message.channel) {
        client.subscribedChannels.delete(message.channel);
        send(client.ws, {
          type: 'unsubscribed',
          channel: message.channel,
        });
        logger.debug(`Client ${clientId} unsubscribed from ${message.channel}`);
      }
      break;

    case 'auth':
      // Authenticate user for personalized alerts
      if (message.data?.address) {
        client.address = message.data.address;
        send(client.ws, {
          type: 'authenticated',
          data: { address: message.data.address },
        });
        logger.debug(`Client ${clientId} authenticated as ${message.data.address}`);
      }
      break;

    case 'ping':
      send(client.ws, { type: 'pong' });
      break;

    default:
      send(client.ws, {
        type: 'error',
        error: `Unknown message type: ${message.type}`,
      });
  }
}

/**
 * Send message to a WebSocket client
 */
function send(ws: WebSocket, message: WSMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast message to all clients subscribed to a channel
 */
export function broadcast(channel: string, data: any): void {
  let count = 0;
  
  for (const [clientId, client] of clients) {
    if (client.ws.readyState === WebSocket.OPEN && client.subscribedChannels.has(channel)) {
      send(client.ws, {
        type: 'event',
        channel,
        data,
      });
      count++;
    }
  }

  logger.debug(`Broadcast to ${count} clients on channel ${channel}`);
}

/**
 * Send message to a specific user by address
 */
export function sendToUser(address: string, message: WSMessage): void {
  for (const [clientId, client] of clients) {
    if (client.address === address && client.ws.readyState === WebSocket.OPEN) {
      send(client.ws, message);
    }
  }
}

/**
 * Send alert to a specific user
 */
export function sendAlert(address: string, alert: any): void {
  sendToUser(address, {
    type: 'alert',
    channel: channels.ALERTS,
    data: alert,
  });
}

/**
 * Heartbeat to keep connections alive and cleanup dead ones
 */
function heartbeat(): void {
  const now = Date.now();
  
  for (const [clientId, client] of clients) {
    // Check if client has timed out
    if (now - client.lastPing > CLIENT_TIMEOUT) {
      logger.info(`Client ${clientId} timed out, terminating`);
      client.ws.terminate();
      clients.delete(clientId);
      continue;
    }

    // Check if previous ping was not responded to
    if (!client.isAlive) {
      logger.info(`Client ${clientId} not responding, terminating`);
      client.ws.terminate();
      clients.delete(clientId);
      continue;
    }

    // Send ping
    client.isAlive = false;
    client.ws.ping();
  }
}

/**
 * Get WebSocket server stats
 */
export function getStats(): {
  totalClients: number;
  clientsByChannel: Record<string, number>;
  authenticatedClients: number;
} {
  const stats = {
    totalClients: clients.size,
    clientsByChannel: {} as Record<string, number>,
    authenticatedClients: 0,
  };

  // Initialize channel counts
  for (const channel of Object.values(channels)) {
    stats.clientsByChannel[channel] = 0;
  }

  // Count clients
  for (const [, client] of clients) {
    if (client.address) {
      stats.authenticatedClients++;
    }
    for (const channel of client.subscribedChannels) {
      stats.clientsByChannel[channel] = (stats.clientsByChannel[channel] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Get the WebSocket server instance
 */
export function getWSS(): WebSocketServer | null {
  return wss;
}

export default {
  initWebSocket,
  broadcast,
  sendToUser,
  sendAlert,
  getStats,
  getWSS,
  channels,
};

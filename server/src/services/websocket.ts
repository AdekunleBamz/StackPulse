/**
 * StackPulse WebSocket Service
 * Provides real-time notifications to connected clients
 */

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import logger from '../utils/logger';

// WebSocket connection types
interface WSClient {
  id: string;
  socket: WebSocket;
  address?: string;
  subscriptions: Set<string>;
  connectedAt: number;
}

// Message types
interface WSMessage {
  type: 'subscribe' | 'unsubscribe' | 'notification' | 'stats' | 'error' | 'ping' | 'pong';
  data?: Record<string, unknown>;
  subscription?: string;
}

// Active connections
const clients: Map<string, WSClient> = new Map();

// Broadcast to all connected clients
export function broadcastNotification(notification: Record<string, unknown>): void {
  const message: WSMessage = {
    type: 'notification',
    data: notification
  };

  const messageStr = JSON.stringify(message);
  
  clients.forEach((client) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(messageStr);
    }
  });
  
  logger.debug('Broadcast notification', { type: notification.type });
}

// Broadcast stats update
export function broadcastStats(stats: Record<string, unknown>): void {
  const message: WSMessage = {
    type: 'stats',
    data: stats
  };

  const messageStr = JSON.stringify(message);
  
  clients.forEach((client) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(messageStr);
    }
  });
}

// Send to specific address
export function sendToAddress(address: string, message: WSMessage): boolean {
  let sent = false;
  
  clients.forEach((client) => {
    if (client.address === address && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
      sent = true;
    }
  });
  
  return sent;
}

// Initialize WebSocket server
export function initWebSocket(server: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientId = generateClientId();
    const client: WSClient = {
      id: clientId,
      socket: ws,
      subscriptions: new Set<string>(),
      connectedAt: Date.now()
    };
    
    clients.set(clientId, client);
    
    logger.info('WebSocket client connected', { clientId, ip: req.socket.remoteAddress });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'notification',
      data: {
        title: 'Connected to StackPulse',
        message: 'Real-time notifications enabled',
        connectedAt: client.connectedAt
      }
    }));
    
    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        handleMessage(client, message);
      } catch (error) {
        logger.error('WebSocket message parse error', { error });
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Invalid message format' }
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      clients.delete(clientId);
      logger.info('WebSocket client disconnected', { clientId });
    });
    
    // Handle errors
    ws.on('error', (error: Error) => {
      logger.error('WebSocket error', { clientId, error });
      clients.delete(clientId);
    });
    
    // Send ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });

  logger.info('WebSocket server initialized');
  return wss;
}

// Handle incoming WebSocket messages
function handleMessage(client: WSClient, message: WSMessage): void {
  const { socket } = client;
  
  switch (message.type) {
    case 'subscribe':
      if (message.subscription) {
        client.subscriptions.add(message.subscription);
        socket.send(JSON.stringify({
          type: 'notification',
          data: {
            title: 'Subscribed',
            message: `Now tracking: ${message.subscription}`
          }
        }));
        logger.debug('Client subscribed', { clientId: client.id, subscription: message.subscription });
      }
      break;
      
    case 'unsubscribe':
      if (message.subscription) {
        client.subscriptions.delete(message.subscription);
        socket.send(JSON.stringify({
          type: 'notification',
          data: {
            title: 'Unsubscribed',
            message: `No longer tracking: ${message.subscription}`
          }
        }));
        logger.debug('Client unsubscribed', { clientId: client.id, subscription: message.subscription });
      }
      break;
      
    case 'ping':
      socket.send(JSON.stringify({ type: 'pong' }));
      break;
      
    default:
      logger.warn('Unknown WebSocket message type', { clientId: client.id, type: message.type });
  }
}

// Generate unique client ID
function generateClientId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Get connected client count
export function getClientCount(): number {
  return clients.size;
}

// Get client stats
export function getClientStats(): { connected: number; subscriptions: number } {
  let subscriptions = 0;
  clients.forEach(client => {
    subscriptions += client.subscriptions.size;
  });
  
  return {
    connected: clients.size,
    subscriptions
  };
}

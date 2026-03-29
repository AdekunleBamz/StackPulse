/**
 * StackPulse WebSocket Service
 * Provides real-time notifications to connected clients.
 *
 * Protocol (JSON):
 * - { type: 'subscribe'|'unsubscribe', channel?: string, subscription?: string }
 * - { type: 'auth', data: { address: string } }
 * - { type: 'ping' }
 */

import { IncomingMessage } from 'http';
import { Server as HTTPServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import logger from '../utils/logger';

interface WSClient {
  id: string;
  socket: WebSocket;
  address?: string;
  subscriptions: Set<string>;
  connectedAt: number;
}

interface WSMessage {
  type: 'subscribe' | 'unsubscribe' | 'auth' | 'notification' | 'stats' | 'error' | 'ping' | 'pong';
  data?: Record<string, unknown>;
  channel?: string;
  subscription?: string;
}

const clients: Map<string, WSClient> = new Map();
const MAX_CLIENTS = 1000;
const MAX_SUBS_PER_CLIENT = 50;
const WS_PING_INTERVAL_MS = 30000;

function getChannel(message: WSMessage): string | undefined {
  return message.channel || message.subscription;
}

function getNotificationType(notification: Record<string, unknown>): string | undefined {
  const value = notification.type;
  return typeof value === 'string' ? value : undefined;
}

export function broadcastNotification(notification: Record<string, unknown>): void {
  const message: WSMessage = { type: 'notification', data: notification };
  const payload = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(payload);
    }
  });

  logger.debug('Broadcast notification', { type: getNotificationType(notification) });
}

export function broadcastStats(stats: Record<string, unknown>): void {
  const message: WSMessage = { type: 'stats', data: stats };
  const payload = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(payload);
    }
  });
}

export function sendToAddress(address: string, message: WSMessage): boolean {
  const payload = JSON.stringify(message);
  let sent = false;

  clients.forEach((client) => {
    if (client.address === address && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(payload);
      sent = true;
    }
  });

  return sent;
}

export function initWebSocket(server: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    if (clients.size >= MAX_CLIENTS) {
      logger.warn('WS connection rejected: max clients reached');
      ws.close(1013, 'Server at capacity');
      return;
    }
    const clientId = generateClientId();
    const client: WSClient = {
      id: clientId,
      socket: ws,
      subscriptions: new Set<string>(),
      connectedAt: Date.now(),
    };

    clients.set(clientId, client);
    logger.info('WebSocket client connected', { clientId, ip: req.socket.remoteAddress });

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, WS_PING_INTERVAL_MS);
    pingInterval.unref();

    ws.send(
      JSON.stringify({
        type: 'notification',
        data: {
          title: 'Connected to StackPulse',
          message: 'Real-time notifications enabled',
          connectedAt: client.connectedAt,
        },
      })
    );

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        handleMessage(client, message);
      } catch (error) {
        logger.error('WebSocket message parse error', { error });
        ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid message format' } }));
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      clients.delete(clientId);
      logger.info('WebSocket client disconnected', { clientId });
    });

    ws.on('error', (error: Error) => {
      clearInterval(pingInterval);
      logger.error('WebSocket error', { clientId, error });
      clients.delete(clientId);
    });
  });

  logger.info('WebSocket server initialized');
  return wss;
}

function handleMessage(client: WSClient, message: WSMessage): void {
  const { socket } = client;

  switch (message.type) {
    case 'subscribe': {
      const channel = getChannel(message);
      if (!channel) return;
      
      if (client.subscriptions.size >= MAX_SUBS_PER_CLIENT) {
        socket.send(JSON.stringify({ type: 'error', data: { message: 'Max subscriptions reached' } }));
        return;
      }
      
      client.subscriptions.add(channel);
      socket.send(
        JSON.stringify({
          type: 'notification',
          data: { title: 'Subscribed', message: `Now tracking: ${channel}` },
        })
      );
      logger.debug('Client subscribed', { clientId: client.id, channel });
      break;
    }

    case 'unsubscribe': {
      const channel = getChannel(message);
      if (!channel) return;
      client.subscriptions.delete(channel);
      socket.send(
        JSON.stringify({
          type: 'notification',
          data: { title: 'Unsubscribed', message: `No longer tracking: ${channel}` },
        })
      );
      logger.debug('Client unsubscribed', { clientId: client.id, channel });
      break;
    }

    case 'auth': {
      const rawAddress = message.data?.address;
      const address =
        typeof rawAddress === 'string' && rawAddress.trim().length > 0
          ? rawAddress.trim()
          : undefined;
      client.address = address;
      socket.send(JSON.stringify({ type: 'notification', data: { title: 'Authenticated', address } }));
      logger.debug('Client authenticated', { clientId: client.id, address });
      break;
    }

    case 'ping':
      socket.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      logger.warn('Unknown WebSocket message type', { clientId: client.id, type: message.type });
  }
}

function generateClientId(): string {
  return `ws_${randomUUID()}`;
}

export function getClientCount(): number {
  return clients.size;
}

export function getClientStats(): { connected: number; subscriptions: number } {
  let subscriptions = 0;
  clients.forEach((client) => {
    subscriptions += client.subscriptions.size;
  });

  return { connected: clients.size, subscriptions };
}

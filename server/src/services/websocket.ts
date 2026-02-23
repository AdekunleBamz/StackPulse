/**
 * WebSocket Service
 * Manages WebSocket connections for real-time updates
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, Socket> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, socket);

      // Handle client subscribe to alerts
      socket.on('subscribe:alerts', (data: any) => {
        socket.join('alerts');
        console.log(`Client ${socket.id} subscribed to alerts`);
      });

      // Handle client subscribe to notifications
      socket.on('subscribe:notifications', (data: any) => {
        socket.join('notifications');
        console.log(`Client ${socket.id} subscribed to notifications`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Emit alert event to all connected clients
   */
  emitAlert(alert: any): void {
    if (this.io) {
      this.io.to('alerts').emit('alert', alert);
    }
  }

  /**
   * Emit notification to all connected clients
   */
  emitNotification(notification: any): void {
    if (this.io) {
      this.io.to('notifications').emit('notification', notification);
    }
  }

  /**
   * Emit event to specific client
   */
  emitToClient(clientId: string, event: string, data: any): void {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.connectedClients.size;
  }
}

export default new WebSocketService();

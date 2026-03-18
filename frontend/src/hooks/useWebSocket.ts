'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWebSocketOptions {
  url?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (data: any) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: any;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  authenticate: (address: string) => void;
  send: (message: any) => void;
  reconnect: () => void;
  disconnect: () => void;
}

const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://stackpulse-b8fw.onrender.com/ws';

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = DEFAULT_WS_URL,
    reconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const manualDisconnectRef = useRef(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (isConnecting) return;

    manualDisconnectRef.current = false;
    setIsConnecting(true);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = (event) => {
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        onClose?.(event);

        // Attempt to reconnect
        if (!manualDisconnectRef.current && reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      setIsConnecting(false);
      console.error('Failed to create WebSocket:', error);
    }
  }, [url, reconnect, reconnectInterval, maxReconnectAttempts, onOpen, onClose, onError, onMessage, isConnecting]);

  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    send({ type: 'subscribe', channel });
  }, [send]);

  const unsubscribe = useCallback((channel: string) => {
    send({ type: 'unsubscribe', channel });
  }, [send]);

  const authenticate = useCallback((address: string) => {
    send({ type: 'auth', data: { address } });
  }, [send]);

  const doReconnect = useCallback(() => {
    manualDisconnectRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
    manualDisconnectRef.current = false;
    connect();
  }, [connect]);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    subscribe,
    unsubscribe,
    authenticate,
    send,
    reconnect: doReconnect,
    disconnect,
  };
}

export default useWebSocket;

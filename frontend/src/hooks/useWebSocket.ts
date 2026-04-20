'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WS_URL } from '@/lib/env';
import logger from '@/lib/logger';

/** Default interval in ms between WebSocket reconnect attempts. */
const WS_DEFAULT_RECONNECT_INTERVAL_MS = 5000;
/** Default maximum number of reconnect attempts before giving up. */
const WS_DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Configuration options for the useWebSocket hook.
 */
interface UseWebSocketOptions {
  url?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (data: unknown) => void;
}

/**
 * Return type for the useWebSocket hook.
 */
interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  /** True when not connected and not currently trying to connect. */
  isDisconnected: boolean;
  /** Number of reconnect attempts made in the current session. */
  reconnectCount: number;
  /** True when the last connection attempt ended with an error. */
  hasError: boolean;
  lastMessage: unknown;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  authenticate: (address: string) => void;
  send: (message: unknown) => void;
  reconnect: () => void;
  disconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = WS_URL,
    reconnect = true,
    reconnectInterval = WS_DEFAULT_RECONNECT_INTERVAL_MS,
    maxReconnectAttempts = WS_DEFAULT_MAX_RECONNECT_ATTEMPTS,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const manualDisconnectRef = useRef(false);

  const connect = useCallback(function connectSocket() {
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
        setHasError(false);
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
            setReconnectCount(reconnectAttemptsRef.current);
            connectSocket();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setHasError(true);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (error) {
          logger.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      setIsConnecting(false);
      logger.error('Failed to create WebSocket:', error);
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

  const send = useCallback((message: unknown) => {
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
    isDisconnected: !isConnected && !isConnecting,
    reconnectCount,
    hasError,
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

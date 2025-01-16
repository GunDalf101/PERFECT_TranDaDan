
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../components/auth/UserContext';
import PropTypes from 'prop-types';
import { env } from '../config/env';

const WEBSOCKET_URL = `${location.origin.replace(/^https/, 'wss')}/ws/chat`;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000;

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated } = useUser();
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const messageHandlersRef = useRef(new Set());
  const [isConnected, setIsConnected] = useState(false);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      setIsConnected(true);
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No access token found");
        return;
      }

      const ws = new WebSocket(`${WEBSOCKET_URL}/?token=${token}`);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          messageHandlersRef.current.forEach(handler => handler(data));
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);

        if (!event.wasClean && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current));
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      messageHandlersRef.current.clear();
      setIsConnected(false);
    };
  }, [isAuthenticated, connectWebSocket]);

  const sendMessage = useCallback((message) => {
    if (!wsRef.current) {
      console.error("WebSocket connection not initialized");
      return false;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected, current state:", wsRef.current.readyState);
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }, []);

  const value = {
    sendMessage,
    registerMessageHandler: useCallback((handler) => {
      messageHandlersRef.current.add(handler);
      return () => messageHandlersRef.current.delete(handler);
    }, []),
    isConnected,
    connect: connectWebSocket
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

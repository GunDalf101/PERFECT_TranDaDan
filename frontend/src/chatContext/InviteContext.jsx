import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Bell, UserPlus, X, Check } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {getMyData} from '../api/authServiceMe'

const WEBSOCKET_URL = 'ws://localhost:8000/ws/invites';
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000;

const InviteContext = createContext(null);

export const InviteProvider = ({ children }) => {
  const [invites, setInvites] = useState([]);
  const [notification, setNotification] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getMyData();
        if (data) {
          localStorage.setItem("username", data.username);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("Invite WebSocket already connected");
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const username = localStorage.getItem("username");
      if (!username) {
        console.error("No username found");
        return;
      }

      const ws = new WebSocket(`${WEBSOCKET_URL}/?username=${username}`);

      ws.onopen = () => {
        console.log("Invite WebSocket Connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("Invite WebSocket Disconnected", event.code);

        if (!event.wasClean && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current));
        }
      };

      ws.onerror = (error) => {
        console.error("Invite WebSocket error:", error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.log("Error creating Invite WebSocket:", error);
    }
  }, []);

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'game_invite':
        setInvites(prev => [...prev, data]);
        break;
      case 'invite_accepted':
        const gameSession = {
          gameId: data.game_id,
          username: localStorage.getItem("username"),
          opponent: data.opponent,
          isPlayer1: localStorage.getItem("username") === data.player1
        };
        localStorage.setItem('gameSession', JSON.stringify(gameSession));
        setTimeout(() => {
          navigate('/game-lobby/remote-play', {
            state: gameSession
          });
        }, 3000);
        break;
      case 'invite_declined':
        setNotification({
          type: 'error',
          message: `${data.by_username} declined your invitation`
        });
        break;
      case 'invite_error':
        setNotification({
          type: 'error',
          message: data.message
        });
        break;
      case 'invite_sent':
        setNotification({
          type: 'success',
          message: `Invite sent to ${data.target_username}`
        });
        break;
    }
  }, [navigate]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connectWebSocket]);

  const sendInvite = useCallback((targetUsername) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'send_invite',
        target_username: targetUsername,
        game_type: 'standard'
      }));
      return true;
    }
    return false;
  }, []);

  const acceptInvite = useCallback((invite) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'accept_invite',
        from_username: invite.from_username,
        game_type: invite.game_type
      }));
      setInvites(prev => prev.filter(i => i.from_username !== invite.from_username));
      return true;
    }
    return false;
  }, []);

  const declineInvite = useCallback((invite) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'decline_invite',
        from_username: invite.from_username
      }));
      setInvites(prev => prev.filter(i => i.from_username !== invite.from_username));
      return true;
    }
    return false;
  }, []);

  const value = {
    invites,
    notification,
    sendInvite,
    acceptInvite,
    declineInvite,
    setNotification
  };

  return (
    <InviteContext.Provider value={value}>
      {children}
    </InviteContext.Provider>
  );
};

InviteProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useInvite = () => {
  const context = useContext(InviteContext);
  if (!context) {
    throw new Error('useInvite must be used within an InviteProvider');
  }
  return context;
};

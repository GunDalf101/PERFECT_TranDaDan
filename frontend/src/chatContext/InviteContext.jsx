import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useUser } from '../components/auth/UserContext';
import { env } from '../config/env';

const WEBSOCKET_URL = `${env.WS_URL}/ws/invites`;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000;

const InviteContext = createContext(null);

export const InviteProvider = ({ children }) => {
  const [invites, setInvites] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const navigate = useNavigate();

  const { user } = useUser();
  const myUsername = user ? JSON.parse(user).username : null;

  useEffect(() => {
    if (myUsername) {
      setIsReady(true);
    }
  }, [myUsername]);

  const handleWebSocketMessage = useCallback((data) => {
    console.log("Received websocket message:", data.type);
    
    switch (data.type) {
      case 'game_invite':
        setInvites(prev => [...prev, data]);
        // setNotification({
        //   type: 'info',
        //   message: `New game invite from ${data.from_username}`
        // });
        break;

      case 'invite_accepted':
        const gameSession = {
          gameId: data.game_id,
          username: myUsername,
          opponent: data.opponent,
          isPlayer1: myUsername === data.player1
        };
        
        localStorage.setItem('gameSession', JSON.stringify(gameSession));
        
        setNotification({
          type: 'success',
          message: `${data.opponent} accepted your invitation`
        });

        setTimeout(() => {
          navigate('/game-lobby/remote-play', {
            state: gameSession
          });
        }, 2000);
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
          message: data.message || 'An error occurred with the invitation'
        });
        break;

      case 'invite_sent':
        setNotification({
          type: 'success',
          message: `Invite sent to ${data.target_username}`
        });
        break;

      default:
        console.warn('Unknown message type:', data.type);
    }
  }, [navigate, myUsername]);  // Added myUsername to dependencies

  const connectWebSocket = useCallback(() => {
    if (!myUsername) {
      // console.error("Cannot connect WebSocket: No username found");
      // setNotification({
      //   type: 'error',
      //   message: 'Connection error: User not authenticated'
      // });
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(`${WEBSOCKET_URL}/?token=${localStorage.getItem('access_token')}`);

      ws.onopen = () => {
        console.log("WebSocket Connected");
        reconnectAttemptsRef.current = 0;
        // setNotification({
        //   type: 'success',
        //   message: 'Connected to game server'
        // });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          setNotification({
            type: 'error',
            message: 'Error processing server message'
          });
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket Disconnected", event.code);
        
        if (!event.wasClean && 
            reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && 
            myUsername) {
          
          setNotification({
            type: 'warning',
            message: `Connection lost. Reconnecting... (Attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`
          });

          reconnectTimerRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current));
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setNotification({
            type: 'error',
            message: 'Failed to reconnect. Please refresh the page.'
          });
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setNotification({
          type: 'error',
          message: 'Connection error occurred'
        });
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      setNotification({
        type: 'error',
        message: 'Failed to establish connection'
      });
    }
  }, [myUsername, handleWebSocketMessage]);  // Added myUsername and handleWebSocketMessage to dependencies

  useEffect(() => {
    if (isReady) {
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
    };
  }, [isReady, connectWebSocket]);
  
  const sendInvite = useCallback((targetUsername) => {
    if (!isReady) {
      setNotification({
        type: 'error',
        message: 'Cannot send invite: Connection not ready'
      });
      return false;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'send_invite',
        target_username: targetUsername,
        game_type: 'pong'
      }));
      return true;
    }

    setNotification({
      type: 'error',
      message: 'Cannot send invite: No connection to server'
    });
    return false;
  }, [isReady]);

  const acceptInvite = useCallback((invite) => {
    if (!isReady) {
      setNotification({
        type: 'error',
        message: 'Cannot accept invite: Connection not ready'
      });
      return false;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'accept_invite',
        from_username: invite.from_username,
        game_type: invite.game_type
      }));
      setInvites(prev => prev.filter(i => i.from_username !== invite.from_username));
      return true;
    }

    setNotification({
      type: 'error',
      message: 'Cannot accept invite: No connection to server'
    });
    return false;
  }, [isReady]);

  const declineInvite = useCallback((invite) => {
    if (!isReady) {
      setNotification({
        type: 'error',
        message: 'Cannot decline invite: Connection not ready'
      });
      return false;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'decline_invite',
        from_username: invite.from_username
      }));
      setInvites(prev => prev.filter(i => i.from_username !== invite.from_username));
      return true;
    }

    setNotification({
      type: 'error',
      message: 'Cannot decline invite: No connection to server'
    });
    return false;
  }, [isReady]);

  const value = {
    invites,
    notification,
    isReady,
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

export default InviteContext;
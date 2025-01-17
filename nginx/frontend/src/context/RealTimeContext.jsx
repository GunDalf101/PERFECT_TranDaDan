import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '../components/auth/UserContext';
import { useCallback } from 'react';
import { env } from '../config/env';

const RealTimeContext = createContext();

export const useRealTime = () => {
  return useContext(RealTimeContext);
};

export const RealTimeProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [relationshipUpdate, setRelationshipUpdate] = useState(null);
  const [selfRelationshipUpdate, setSelfRelationshipUpdate] = useState(null);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [friends, setFriends] = useState([]);
  const [ws, setWs] = useState(null);
  const { isAuthenticated } = useUser();
  const [retryWSConnect, setRetryWSConnect] = useState(false);
  // const [markedNotifications, setMarkedNotifications] = useState(new Set());
  const [markedIds, setMarkedIds] = useState(new Set());

  const updateFriendsFromFSEvent = (data) => {
    let username = data.username;
    if (data.action == "friends") {
      setFriends((prev) => {
        if (prev.includes(username)) return prev;
        return [username].concat(prev);
      });
      setOnlineFriends((prev) => {
        if (prev.includes(username)) return prev;
        return prev.concat(username);
      });
    } else if (["blocked", "unfriended"].includes(data.action)) {
      setFriends((prev) => {
        if (!prev.includes(username)) return prev;
        return prev.filter(f => f !== username);
      });
      setOnlineFriends((prev) => {
        if (!prev.includes(username)) return prev;
        return prev.filter(f => f !== username);
      });
    }
  }

  useEffect(() => {
    let socket;
    if (isAuthenticated) {
      const accessToken = localStorage.getItem("access_token");

      if (accessToken) {
        socket = new WebSocket(`${location.origin.replace(/^https/, 'wss')}/ws/notifs/?token=${accessToken}`);

        socket.onopen = () => {
          console.log('WebSocket connection established');
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.msgtype === 'notification') {
            setNotifications(notifications => data.notifications.concat(notifications));
          }
          else if (data.msgtype === 'friends') {
            setFriends(data.friends);
          } else if (data.msgtype === 'relationship_update') {
            updateFriendsFromFSEvent(data);
            setRelationshipUpdate(data);
          } else if (data.msgtype === 'friend_status_change') {
            const { username, is_online } = data;

            setOnlineFriends(prevOnlineFriends => {
              if (is_online && !prevOnlineFriends.includes(username)) {
                return [...prevOnlineFriends, username];
              }
              if (!is_online && prevOnlineFriends.includes(username)) {
                return prevOnlineFriends.filter(friend => friend !== username);
              }
              return prevOnlineFriends;
            });
          }
        };

        socket.onclose = socket.onerror = (event) => {
          clearRealTimeContext();
          // setRetryWSConnect(!retryWSConnect);
          console.log('WebSocket connection closed:', event);
        };

        setWs(socket);
      }
    }
    return () => {
      if (socket) {
          socket.close();
          clearRealTimeContext();
      }
    };
  }, [isAuthenticated, retryWSConnect]);

  const sendTournamentRequest = useCallback((username) => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'tournament_request',
        target_username: username
      }));
    }
  }, [ws]);

  const sendRelationshipUpdate = (action, username) => {
    if (ws) {
      let e = {
        action: action,
        username: username,
        type: 'relationship_update',
      }
      updateFriendsFromFSEvent(e);
      setRelationshipUpdate(e);
      ws.send(JSON.stringify(e));
    }
  };

  const markAsRead = useCallback((notificationId) => {
    if (ws && !markedIds.has(notificationId)) {
      ws.send(JSON.stringify({
        type: 'mark_as_read',
        notification_id: notificationId,
      }));

      setMarkedIds(prev => new Set([...prev, notificationId]));
    }
  }, [ws, markedIds]);

  const removeMarkedNotifications = useCallback(() => {
    if (markedIds.size > 0) {
      setNotifications(prev => prev.filter(notif => !markedIds.has(notif.id)));
      setMarkedIds(new Set());
    }
  }, [markedIds]);

  const clearRealTimeContext = () => {
    setNotifications([]);
    setRelationshipUpdate(null);
    setOnlineFriends([]);
  };

  return (
    <RealTimeContext.Provider value={{ notifications, removeMarkedNotifications ,sendTournamentRequest, relationshipUpdate, sendRelationshipUpdate, markAsRead, clearRealTimeContext, onlineFriends, selfRelationshipUpdate, friends }}>
      {children}
    </RealTimeContext.Provider>
  );
};

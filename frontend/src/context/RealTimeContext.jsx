import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '../components/auth/UserContext';
import { useCallback } from 'react';

const RealTimeContext = createContext();

export const useRealTime = () => {
  return useContext(RealTimeContext);
};

export const RealTimeProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [relationshipUpdate, setRelationshipUpdate] = useState(null);
  const [ws, setWs] = useState(null);
  const { isAuthenticated } = useUser();
  const [markedNotifications, setMarkedNotifications] = useState(new Set());
  const [markedIds, setMarkedIds] = useState(new Set());

  useEffect(() => {
    let socket;
    if (isAuthenticated) {
      const accessToken = localStorage.getItem("access_token");

      if (accessToken) {
        socket = new WebSocket(`ws://10.13.5.4:8000/ws/notifs/?token=${accessToken}`);

        socket.onopen = () => {
          console.log('WebSocket connection established');
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.msgtype === 'notification') {
            setNotifications(notifications => data.notifications.concat(notifications));
          } else if (data.msgtype === 'relationship_update') {
            setRelationshipUpdate(data);
          }
        };

        socket.onclose = (event) => {
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
  }, [isAuthenticated]);

  const sendRelationshipUpdate = (action, username) => {
    if (ws) {
      ws.send(JSON.stringify({
        action: action,
        username: username,
        type: 'relationship_update',
      }));
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
  };

  return (
    <RealTimeContext.Provider value={{ notifications, removeMarkedNotifications , relationshipUpdate, sendRelationshipUpdate, markAsRead, clearRealTimeContext }}>
      {children}
    </RealTimeContext.Provider>
  );
};

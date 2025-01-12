import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '../components/auth/UserContext';

const RealTimeContext = createContext();

export const useRealTime = () => {
  return useContext(RealTimeContext);
};

export const RealTimeProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [relationshipUpdate, setRelationshipUpdate] = useState(null);
  const [ws, setWs] = useState(null);
  const { isAuthenticated } = useUser();

  useEffect(() => {
    let socket;
    if (isAuthenticated) {
      const accessToken = localStorage.getItem("access_token");

      if (accessToken) {
        socket = new WebSocket(`ws://localhost:8000/ws/notifs/?token=${accessToken}`);

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

  const markAsRead = (notificationId) => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'mark_as_read',
        notification_id: notificationId,
      }));
    }
  };

  const clearRealTimeContext = () => {
    setNotifications([]);
    setRelationshipUpdate(null);
  };

  return (
    <RealTimeContext.Provider value={{ notifications, relationshipUpdate, sendRelationshipUpdate, markAsRead, clearRealTimeContext }}>
      {children}
    </RealTimeContext.Provider>
  );
};

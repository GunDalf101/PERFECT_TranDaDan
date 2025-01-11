// NotificationContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '../components/auth/UserContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [ws, setWs] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useUser();  // Get authentication status from UserContext

  useEffect(() => {
    if (isAuthenticated) {
      // Only initialize WebSocket when authenticated
      const accessToken = localStorage.getItem("access_token");

      if (accessToken) {
        const socket = new WebSocket(`ws://localhost:8000/ws/notifs/?token=${accessToken}`);

        socket.onopen = () => {
          console.log('WebSocket connection established');
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.notifications) {
            setNotifications(data.notifications);
          }
        };

        socket.onclose = (event) => {
          console.log('WebSocket connection closed:', event);
        };

        setWs(socket);

        // Cleanup WebSocket connection when the component unmounts or user logs out
        return () => {
          if (socket) {
            socket.close();
          }
        };
      } else {
        console.warn("No access token found, WebSocket connection not established.");
      }
    } else {
      console.log("User not authenticated, WebSocket connection will not be established.");
    }
  }, [isAuthenticated]);  // Re-run effect when the authentication status changes

  const markAsRead = (notificationId) => {
    if (ws) {
      ws.send(JSON.stringify({
        action: 'mark_as_read',
        notification_id: notificationId,
      }));
    }
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) =>
        notif.id === notificationId ? { ...notif, read_at: new Date().toISOString() } : notif
      )
    );
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, loading }}>
      {children}
    </NotificationContext.Provider>
  );
};

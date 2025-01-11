import React, { useEffect } from 'react';
import { useNotifications } from '../../../context/NotificationContext';  // Import the context
import { formatDistanceToNow } from 'date-fns'; // Import date-fns for time formatting

const NotifDropdown = React.forwardRef(({ isVisible }, ref) => {
  const { notifications, markAsRead } = useNotifications();

  // Effect to mark notifications as read when they are visible
  useEffect(() => {
    if (isVisible) {
      notifications.forEach((notif) => {
        // If a notification doesn't have a link and is visible, mark as read
        if (!notif.url && !notif.read_at) {
          markAsRead(notif.id);
        }
      });
    }
  }, [isVisible, notifications, markAsRead]);

  return isVisible ? (
    <div id="notificationDropdown" className="notification-dropdown absolute text-white right-0 mt-2 w-auto bg-gray-900 border-2 border-pink-500 shadow-lg rounded-md font-pixel z-10" ref={ref}>
      <div className="p-2">
        <p className="text-center font-bold text-lg">Notifications</p>
        <ul className="mt-2 text-sm">
          {/* If there are no notifications, show a placeholder message */}
          {notifications.length === 0 ? (
            <li className="py-2 px-4 text-center text-gray-500">
              It's quite in here for now...
            </li>
          ) : (
            // Render the list of notifications
            notifications.map((notif) => (
              <li key={notif.id} className="py-2 px-4 border-b border-pink-500">
                {/* Only render <a> if there is a URL */}
                {notif.url ? (
                  <a
                    href={notif.url}
                    className="cursor-pointer"
                    onClick={(e) => {
                      markAsRead(notif.id);
                    }}
                  >
                    <p className="font-semibold">{notif.content}</p>
                    {/* Format created_at to show time ago */}
                    <p className="text-xs opacity-75">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
                  </a>
                ) : (
                  // If no URL, just render the notification content as plain text
                  <div className="cursor-pointer" onClick={() => markAsRead(notif.id)}>
                    <p className="font-semibold">{notif.content}</p>
                    {/* Format created_at to show time ago */}
                    <p className="text-xs opacity-75">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  ) : null;
});

export default NotifDropdown;

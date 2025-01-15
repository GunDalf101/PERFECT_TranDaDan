import React, { useEffect } from 'react';
import { useRealTime } from '../../../context/RealTimeContext';
import { formatDistanceToNow } from 'date-fns';
import styles from './SubNav.module.scss';
import { useNavigate } from 'react-router-dom';

const NotifDropdown = React.forwardRef(({ isVisible }, ref) => {
  const { notifications, markAsRead, removeMarkedNotifications } = useRealTime();
  const navigate = useNavigate()
  useEffect(() => {
    if (isVisible) {
      notifications
        .filter(notif => !notif.url && !notif.read_at)
        .forEach(notif => markAsRead(notif.id));
    } else {
      removeMarkedNotifications();
    }
  }, [isVisible]);

  return isVisible ? (
    <div
      id="notificationDropdown"
      className={`${styles.notificationDropdown} absolute text-white right-0 mt-2 w-80 bg-gray-900 border-2 border-pink-500 shadow-lg rounded-md font-pixel z-10 max-h-96`}
      ref={ref}
    >
      {/* Fixed header */}
      <div className="p-2 border-b border-pink-500 bg-gray-900 sticky top-0 z-10">
        <p className="text-center font-bold text-lg">Notifications</p>
      </div>

      {/* Scrollable content with styled scrollbar */}
      <div className="overflow-y-auto max-h-80 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-pink-500 hover:scrollbar-thumb-pink-400">
        <ul className="text-sm">
          {notifications.length === 0 ? (
            <li className="py-2 px-4 text-center text-gray-500">
              It's quiet in here for now...
            </li>
          ) : (
            notifications.map((notif) => (
              <li key={notif.id} className="py-2 px-4 border-b border-pink-500 last:border-b-0">
                {notif.url ? (
                  <a
                    href={notif.url}
                    className="cursor-pointer block"
                    onClick={() => {markAsRead(notif.id); navigate(notif.url)}}
                  >
                    <p className="font-semibold">{notif.content}</p>
                    <p className="text-xs opacity-75">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </a>
                ) : (
                  <div className="cursor-pointer">
                    <p className="font-semibold">{notif.content}</p>
                    <p className="text-xs opacity-75">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
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

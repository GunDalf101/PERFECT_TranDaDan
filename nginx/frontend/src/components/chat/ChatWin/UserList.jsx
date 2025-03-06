import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import styles from "../styles.module.scss";
import { useRealTime } from "../../../context/RealTimeContext";

const UserList = ({
  friends,
  selectedChat,
  setSelectedChat,
  isLoading,
  currentUsername,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { onlineFriends } = useRealTime();

  const friendsWithOnlineStatus = useMemo(() => {
    const friendsWithStatus = friends.map((friend) => ({
      ...friend,
      online: onlineFriends.includes(friend.name),
    }));
    return friendsWithStatus.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
  }, [friends, onlineFriends]);

  const filteredUsers = friendsWithOnlineStatus.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = (userId) => {
    setSelectedChat(userId);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setHasSearched(true);
  };

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  // Time formatting function
  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Message preview function
  const getMessagePreview = (message, sender) => {
    if (!message) return "No messages yet";
    
    const prefix = sender === currentUsername ? "You: " : "";
    const fullMessage = prefix + message;
    
    if (fullMessage.length <= 35) return fullMessage;
    return fullMessage.substring(0, 35) + "...";
  };

  return (
    <div className={`${styles.chat_sidebar} h-full flex flex-col`}>
      <div className={`${styles.search_container} p-2`}>
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full p-1.5 text-fuchsia-400 bg-gray-600 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 text-xs"
          />
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
        </div>
      </div>
      
      <div className={`${styles.ulist} overflow-y-auto flex-grow`}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={`
                ${styles.user_item}
                transition-all duration-300 ease-in-out
                hover:bg-blue-100 hover:shadow-sm
                active:scale-[0.98]
                ${selectedChat === user.id ? styles.active : ""}
              `}
            >
              <div className={`${styles.user_content} flex items-center`}>
                <div className={`${styles.avatar_container} relative flex-shrink-0`}>
                  <div className={`${styles.avatar} ${selectedChat === user.id ? styles.avatar_selected : ''}`}>
                    <img
                      src={user.avatar || "/default_profile.webp"}
                      className="w-full h-full object-cover rounded-full"
                      alt={`${user.name}'s avatar`}
                    />
                  </div>
                  
                  <div className={`${styles.status_indicator} ${user.online ? styles.online : styles.offline}`} />
                  
                  {user.unreadCount > 0 && selectedChat !== user.id && (
                    <div className={`${styles.mobile_badge}`}>
                      {user.unreadCount > 99 ? '99+' : user.unreadCount}
                    </div>
                  )}
                </div>
                
                <div className={`${styles.user_details}`}>
                  <div className={`${styles.user_header}`}>
                    <h3 className={`${styles.username} ${selectedChat === user.id ? styles.username_active : ''}`}>
                      {user.name}
                    </h3>
                    
                    <div className={`${styles.meta_info}`}>
                      {user.unreadCount > 0 && selectedChat !== user.id && (
                        <span className={`${styles.unread_badge}`}>
                          {user.unreadCount > 99 ? '99+' : user.unreadCount}
                        </span>
                      )}
                      
                      {user.lastMessageTime && (
                        <span className={`${styles.timestamp}`}>
                          {formatTime(user.lastMessageTime)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className={`${styles.message_preview}`}>
                    {getMessagePreview(user.lastMessage, user.lastMessageSender)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            {hasSearched && searchTerm && (
              <div className={`${styles.no_results}`}>
                No users found matching "{searchTerm}"
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserList;
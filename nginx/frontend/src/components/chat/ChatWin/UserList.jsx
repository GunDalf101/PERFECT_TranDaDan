import React, { useState, useEffect, useMemo, useRef } from "react";
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
  const [containerWidth, setContainerWidth] = useState(0);
  const { onlineFriends } = useRealTime();
  const containerRef = useRef(null);

  // Track container width for responsive calculations
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    // Initial measurement
    updateWidth();
    
    // Setup resize observer for dynamic adjustments
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    
    // Cleanup
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

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

  // Dynamic time formatting based on container width
  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    // Determine format based on available space
    const isVeryNarrow = containerWidth < 100;
    const isNarrow = containerWidth >= 100 && containerWidth < 150;
    
    if (diffInHours < 24) {
      // Today: use time
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: !isVeryNarrow, // Use 24h format in very narrow containers
      });
    } else if (diffInHours < 48) {
      // Yesterday
      return isVeryNarrow ? "Y" : isNarrow ? "Yest" : "Yesterday";
    } else {
      // Earlier dates
      if (isVeryNarrow) {
        return `${date.getDate()}/${date.getMonth() + 1}`;
      } else if (isNarrow) {
        return date.toLocaleDateString([], { day: "numeric", month: "numeric" });
      } else {
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    }
  };

  // Calculate message preview length dynamically based on container width
  const getMessagePreview = (message, sender) => {
    if (!message) return "No messages yet";
    
    const prefix = sender === currentUsername ? "You: " : "";
    const fullMessage = prefix + message;
    
    // Dynamic length based on container width
    // This ensures text fits regardless of screen size
    let maxLength;
    
    if (containerWidth < 100) {
      maxLength = 6; // Very narrow
    } else if (containerWidth < 150) {
      maxLength = 12; // Narrow
    } else if (containerWidth < 200) {
      maxLength = 18; // Medium
    } else if (containerWidth < 250) {
      maxLength = 25; // Wide
    } else {
      maxLength = 35; // Very wide
    }
    
    if (fullMessage.length <= maxLength) return fullMessage;
    return fullMessage.substring(0, maxLength) + "...";
  };

  // Calculate appropriate avatar size based on container width
  const getAvatarSize = () => {
    if (containerWidth < 100) return 'w-6 h-6';
    if (containerWidth < 150) return 'w-8 h-8';
    if (containerWidth < 200) return 'w-10 h-10';
    return 'w-12 h-12';
  };

  // Calculate font sizes based on container width
  const getTextSizes = () => {
    if (containerWidth < 100) {
      return {
        username: 'text-[9px]', 
        message: 'text-[7px]',
        time: 'text-[6px]',
        badge: 'text-[6px] px-0.5 py-0'
      };
    }
    if (containerWidth < 150) {
      return {
        username: 'text-[10px]',
        message: 'text-[8px]',
        time: 'text-[7px]',
        badge: 'text-[7px] px-1 py-0.5'
      };
    }
    if (containerWidth < 200) {
      return {
        username: 'text-xs',
        message: 'text-[9px]',
        time: 'text-[8px]',
        badge: 'text-[8px] px-1 py-0.5'
      };
    }
    
    return {
      username: 'text-sm',
      message: 'text-xs',
      time: 'text-[10px]',
      badge: 'text-xs px-1.5 py-0.5'
    };
  };

  const textSizes = getTextSizes();
  const avatarSize = getAvatarSize();

  return (
    <div className={`${styles.chat_sidebar} h-full`} ref={containerRef}>
      <div className="hidden pl-1 pr-1 md:flex relative flex-1 items-center w-full max-w-md mx-auto h-12 sm:h-14 md:h-[70px]">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-2 sm:p-3 text-fuchsia-400 bg-gray-600 border-[2px] border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 text-xs md:text-sm"
        />
      </div>
      <div className={`${styles.ulist} transition-all duration-300 ease-in-out rounded-md p-0.5 sm:p-1`}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={`
                p-1 rounded-md border cursor-pointer mb-0.5
                transition-all duration-300 ease-in-out
                hover:bg-blue-100 hover:shadow-sm
                active:scale-[0.98]
                ${selectedChat === user.id ? "bg-blue-200 shadow-md" : "bg-transparent"}
              `}
            >
              <div className="flex items-center space-x-1 gap-1">
                <div className="relative flex-shrink-0">
                  <div className={`${avatarSize} rounded-full
                    bg-blue-300 flex items-center justify-center overflow-hidden
                    transition-transform duration-300 hover:rotate-6`}>
                    <img
                      src={user.avatar || "/default_profile.webp"}
                      className="w-full h-full object-cover rounded-full"
                      alt={`${user.name}'s avatar`}
                    />
                  </div>
                  <div className={`absolute bottom-0 right-0 
                    w-2 h-2 rounded-full border-[1.5px] border-white
                    transition-all duration-300
                    ${containerWidth < 100 ? 'w-1.5 h-1.5' : ''}
                    ${user.online ? "bg-green-500" : "bg-red-500"}`}
                  />
                </div>
                
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex justify-between items-start w-full">
                    <h3 className={`
                      font-medium truncate ${textSizes.username}
                      ${selectedChat === user.id ? "text-blue-600" : "text-blue-300"}
                      max-w-[65%]
                    `}>
                      {user.name}
                    </h3>
                    
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {user.unreadCount > 0 && selectedChat !== user.id && (
                        <span className={`${textSizes.badge} font-medium text-blue-500 bg-blue-100
                          rounded-full min-w-[14px] text-center`}>
                          {user.unreadCount > 99 ? '99+' : user.unreadCount}
                        </span>
                      )}
                      {user.lastMessageTime && (
                        <span className={`${textSizes.time} text-blue-400 whitespace-nowrap`}>
                          {formatTime(user.lastMessageTime)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className={`
                    ${textSizes.message} text-blue-500 opacity-70 truncate
                    ${isPressed || containerWidth >= 150 ? 'block' : 'hidden'}
                    max-w-full
                  `}>
                    {getMessagePreview(user.lastMessage, user.lastMessageSender)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            {hasSearched && searchTerm && (
              <div className="text-center p-2 sm:p-4 text-blue-300 text-xs sm:text-sm">
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
import React, { useState, useEffect, useMemo } from "react";
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
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getMessagePreview = (message, sender) => {
    if (!message) return "No messages yet";
    if (sender === currentUsername) return `You: ${message}`;
    return message
  };



  return (
    <div className={`${styles.chat_sidebar} h-full`}>
      <div className="hidden pl-1 pr-1 md:flex relative flex-1 items-center w-full max-w-md mx-auto h-[70px]">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-3 py-3 text-fuchsia-400 bg-gray-600 border-[2px] border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 md:text-sm lg:text-base"
        />
      </div>
      <div className={`${styles.ulist} transition-all duration-300 ease-in-out rounded-md p-1`}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={`
                md:p-[5px] rounded-md border cursor-pointer
                transition-all duration-300 ease-in-out
                hover:bg-blue-100 hover:shadow-sm
                active:scale-[0.98]
                ${selectedChat === user.id ? "bg-blue-200 shadow-md" : "bg-transparent"}
              `}
            >
              <div className="flex items-center space-x-4 gap-3">
                <div className="relative">
                  <div className={`
                    w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
                    bg-blue-300
                    flex items-center justify-center
                    transition-transform duration-300
                    hover:rotate-6 overflow-hidden
                  `}>
                    <img
                      src={user.avatar || "/default_profile.webp"}
                      className="w-full h-full object-cover rounded-full"
                      alt={`${user.name}'s avatar`}
                    />
                  </div>
                  <div className={`
                    absolute bottom-0 right-0 
                    w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4
                    rounded-full border-2 border-white
                    transition-all duration-300
                    ${user.online ? "bg-green-500" : "bg-red-500"}
                  `} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <h3 className={`
                      font-medium truncate text-xs sm:text-sm md:text-base
                      ${selectedChat === user.id ? "text-blue-600" : "text-blue-300"}
                    `}>
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {user.unreadCount > 0 && selectedChat !== user.id && (
                        <span className="text-[10px] sm:text-xs font-medium text-blue-500 bg-blue-100 
                          px-1.5 sm:px-2 py-0.5 rounded-full">
                          {user.unreadCount > 99 ? '99+' : user.unreadCount}
                        </span>
                      )}
                      {user.lastMessageTime && (
                        <span className="text-[10px] sm:text-xs text-blue-400">
                          {formatTime(user.lastMessageTime)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`
                    text-[10px] sm:text-xs md:text-sm text-blue-500 opacity-70 truncate
                    ${isPressed ? 'block' : 'hidden sm:block'}
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
              <div className="text-center p-4 text-blue-300">
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

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import styles from "../styles.module.scss";

const UserList = ({ friends, selectedChat, setSelectedChat, messages }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const friendsWithLastMessage = useMemo(() => {
    return friends.map(friend => {
      const lastMessage = messages
        .filter(msg => msg.sender === friend.name || msg.receiver === friend.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      return {
        ...friend,
        lastMessage: lastMessage?.text || "",
        lastMessageTime: lastMessage?.timestamp ? new Date(lastMessage.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : ""
      };
    });
  }, [friends, messages]);


  const filteredUsers = friendsWithLastMessage.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = (userId) => {
    setSelectedChat(userId);
  };

  return (
    <div className={`${styles.chat_sidebar} h-full`}>
      <div className="hidden pl-1 pr-4 md:flex relative flex-1 items-center w-full max-w-md mx-auto h-[70px]">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 py-3 text-fuchsia-400 bg-gray-600 border-[2px] border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 md:text-sm lg:text-base"
        />
      </div>

      <div className={`${styles.ulist} transition-all duration-300 ease-in-out rounded-md`}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              className={`
                md:p-[1rem] rounded-md border cursor-pointer 
                transition-all duration-300 ease-in-out 
                hover:bg-blue-100 hover:shadow-sm
                active:scale-[0.98]
                ${selectedChat === user.id ? "bg-blue-200 shadow-md" : "bg-transparent"}
              `}
            >
              <div className="flex items-center space-x-3 gap-2">
                <div className="relative">
                  <div
                    className={`
                      w-12 h-12 md:w-20 md:h-20 rounded-full 
                      bg-blue-300
                      flex items-center justify-center 
                      transition-transform duration-300 
                      hover:rotate-6 overflow-hidden
                    `}
                  >
                    <img
                      src={user.avatar || "/api/placeholder/40/40"}
                      className="w-full h-full object-cover rounded-full"
                      alt={`${user.name}'s avatar`}
                    />
                  </div>
                  <div
                    className={`
                      absolute bottom-1 right-1 w-3 h-3 md:w-4 md:h-4
                      rounded-full border-2 border-white
                      transition-all duration-300
                      ${user.online ? "bg-green-500" : "bg-red-500"}
                    `}
                  />
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-medium truncate text-sm md:text-base ${selectedChat === user.id ? 'text-blue-600' : 'text-blue-300'}`}>
                      {user.name}
                    </h3>
                    <span className="text-xs text-blue-400 ml-2">
                      {user.lastMessageTime}
                    </span>
                  </div>
                  {user.lastMessage && (
                    <p className="text-xs md:text-sm text-blue-500 opacity-70 truncate">
                      {user.lastMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-4 text-blue-300">
            No users found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
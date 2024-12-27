import React, { useRef, useEffect } from "react";
// import { MoreVertical, Smile, Send } from "lucide-react";
import styles from "../styles.module.scss";
import ChatContent from "./ChatContent";
import UserList from "./UserList";

const ChatWin = ({ users, selectedChat, setSelectedChat,messages,newMessage,setNewMessage,sendMessage,handleSidebarToggle}) => {
    
    return (
        <div className={`${styles.chat_win} `}>
          <UserList
            users={users}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
          />
          <ChatContent
            users={users}
            messages={messages}
            selectedChat={selectedChat}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            handleSidebarToggle={handleSidebarToggle}
          />
        </div>
    );
};

export default ChatWin;
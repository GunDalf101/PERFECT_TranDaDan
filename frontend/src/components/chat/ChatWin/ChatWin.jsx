import React from "react";
import styles from "../styles.module.scss";
import ChatContent from "./ChatContent";
import UserList from "./UserList";

const ChatWin = ({
  friends, 
  selectedChat, 
  setSelectedChat, 
  messages, 
  newMessage, 
  setNewMessage, 
  sendMessage, 
  handleSidebarToggle
}) => {
  return (
    <div className={`${styles.chat_win}`}>
      <UserList
        friends={friends}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
      />
      <ChatContent
        friends={friends} 
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

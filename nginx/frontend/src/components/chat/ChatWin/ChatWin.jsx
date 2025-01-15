import React, {useEffect} from "react";
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
  handleSidebarToggle,
  loadMoreMessages,
  hasMore,
  isLoading
}) => {

  return (
    <div className={`${styles.chat_win}`}>
        <UserList
          friends={friends}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          messages={messages} 
        />
          <ChatContent
            friends={friends}
            messages={messages}
            selectedChat={selectedChat}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            handleSidebarToggle={handleSidebarToggle}
            loadMoreMessages={loadMoreMessages}
            hasMore={hasMore}
            isLoading={isLoading}
          />
    </div>
  );
};

export default ChatWin;
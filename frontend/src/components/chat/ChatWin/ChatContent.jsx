import React, { useRef, useEffect, memo, useState } from "react";
import { MoreVertical, Send } from "lucide-react";
import styles from "../styles.module.scss";

const ChatContent = memo(({
  friends,
  messages,
  selectedChat,
  newMessage,
  setNewMessage,
  sendMessage,
  handleSidebarToggle,
  loadMoreMessages,
  hasMore,
  isLoading: parentIsLoading, // renamed to avoid conflict
}) => {
  const chatBodyRef = useRef(null);
  const observerRef = useRef(null);
  const loadingTimerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const selectedUser = friends.find((friend) => friend.id === selectedChat);

  useEffect(() => {
    if (parentIsLoading) {
      setIsLoading(true);
      
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }

      loadingTimerRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 2000); // 2 seconds timeout
    }

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [parentIsLoading]);

  // useEffect(() => {
  //   console.log("Messages content:", messages);

  // }, [messages]);

  useEffect(() => {
    const currentObserverRef = observerRef.current;
    
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 0.1,
    };

    const handleIntersection = (entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        setIsLoading(true);
        loadMoreMessages();
        
        // Automatically stop loading after 2 seconds
        loadingTimerRef.current = setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    const observer = new IntersectionObserver(handleIntersection, options);

    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [hasMore, isLoading, loadMoreMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const chatBody = chatBodyRef.current;
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  // Loading animation component
  const LoadingIndicator = () => (
    <div className="flex justify-center items-center space-x-2 p-2">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
    </div>
  );

  return (
    <div className={`${styles.chat_content}`}>
      <div className="h-16 border-b px-6 flex justify-between">
        <div className="flex gap-2 items-center">
          <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-blue-300 font-semibold">
              {selectedUser.name[0]}
            </span>
          </div>
          <div>
            <h2 className="font-semibold">{selectedUser.name}</h2>
            <span
              className={`text-sm ${
                selectedUser.online ? "text-green-500" : "text-red-500"
              }`}
            >
              {selectedUser.online ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => handleSidebarToggle("settings")}
            className="text-blue-300 hover:text-blue-600"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div
        ref={chatBodyRef}
        className="flex-1 overflow-y-auto flex flex-col-reverse space-y-4 p-4"
      >
        {hasMore && (
          <div
            ref={observerRef}
            className="flex justify-center p-2"
          >
            {isLoading && <LoadingIndicator />}
          </div>
        )}
        
        {messages
        .slice()
        .reverse()
        .map((message) => (
          <div
            key={message.id}
            className={`flex items-center space-x-1 ${
              message.sender === selectedUser.name ? "justify-start" : "justify-end"
            }`}
          >
            {message.sender === selectedUser.name && (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-blue-400 text-sm">
                  {selectedUser.name[0]}
                </span>
              </div>
            )}
            <div
              className={`max-w-[70%] p-3 ${
                message.sender === selectedUser.name
                  ? "bg-gray-200 text-black rounded-tl-2xl rounded-tr-2xl rounded-br-2xl"
                  : "bg-blue-500 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={sendMessage}
        className="h-20 border-t px-6 flex items-center space-x-4"
      >
        <div className="flex-1">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full p-3 rounded-lg border text-stone-950 focus:outline-none focus:border-blue-500 pr-12"
          />
        </div>
        <button
          type="submit"
          className="p-3 bg-blue-500 hover:bg-blue-600 rounded-lg"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </form>
    </div>
  );
});

ChatContent.displayName = 'ChatContent';

export default ChatContent;
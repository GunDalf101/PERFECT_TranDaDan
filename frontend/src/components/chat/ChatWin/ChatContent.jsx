import React, { useRef, useEffect, memo, useState } from "react";
import { MoreVertical, Send } from "lucide-react";
import styles from "../styles.module.scss";

const ChatContent = memo(
  ({
    friends,
    messages,
    selectedChat,
    newMessage,
    setNewMessage,
    handleSendMessage,
    handleSidebarToggle,
    loadMoreMessages,
    hasMore,
    // isLoading,
    isLoadingMore,
  }) => {
    const chatBodyRef = useRef(null);
    const observerRef = useRef(null);
    const loadingTimerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

    const [lastScrollHeight, setLastScrollHeight] = useState(0);
    const loadingRef = useRef(false);
    const selectedUser = friends.find((friend) => friend.id === selectedChat);
    

    const [initialLoad, setInitialLoad] = useState(true);
    const prevScrollHeightRef = useRef(0);
    const isLoadingRef = useRef(false);



    const handleScroll = async () => {
      if (!chatBodyRef.current || isLoadingRef.current || !hasMore || isLoadingMore) return;

      const { scrollTop, scrollHeight} = chatBodyRef.current;
      
  
      if (scrollHeight + scrollTop < 1000) {
        console.log("ok");
        isLoadingRef.current = true;
        prevScrollHeightRef.current = scrollHeight;
        
        try {
          await loadMoreMessages();
        } finally {
          isLoadingRef.current = false;
        }
      }
    };

    // Initialize scroll listener
    useEffect(() => {
      const chatBody = chatBodyRef.current;
      // if (chatBody) {
      //   chatBody.addEventListener('scroll', handleScroll);
      //   return () => chatBody.removeEventListener('scroll', handleScroll);
      // }
    }, [hasMore, isLoadingMore]);

    // Maintain scroll position after loading more messages
    useEffect(() => {
      if (!chatBodyRef.current || initialLoad) {
        setInitialLoad(false);
        return;
      }

      if (prevScrollHeightRef.current > 0) {
        const newScrollHeight = chatBodyRef.current.scrollHeight;
        const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
        if (scrollDiff > 0) {
          chatBodyRef.current.scrollTop = scrollDiff;
        }
        prevScrollHeightRef.current = 0;
      }
    }, [messages, initialLoad]);

    // Auto-scroll to bottom for new messages
    useEffect(() => {
      if (chatBodyRef.current && !isLoadingMore && !initialLoad) {
        const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        if (isNearBottom) {
          chatBodyRef.current.scrollTop = scrollHeight;
        }
      }
    }, [messages, isLoadingMore, initialLoad]);

    const formatMessageTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })}`;
      } else {
        return `${date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })} ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })}`;
      }
    };
    const groupMessagesByDate = (messages) => {
      const groups = {};
      messages.forEach((message) => {
        const date = new Date(message.timestamp).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(message);
      });
      return groups;
    };
    // useEffect(() => {
    //   console.log("Messages content:", messages);

    // }, [messages]);

    useEffect(() => {
      const currentObserverRef = observerRef.current;
      const options = {
        root: null,
        rootMargin: "20px",
        threshold: 0.1,
      };

      const handleIntersection = (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          loadMoreMessages();
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
        const shouldScroll =
          chatBody.scrollHeight - chatBody.scrollTop - chatBody.clientHeight <
          100;

        if (shouldScroll) {
          chatBody.scrollTop = chatBody.scrollHeight;
        }
      }
    }, [messages]);

    // Loading indicator component
    const LoadingIndicator = () => (
      <div className="flex justify-center items-center space-x-2 p-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
      </div>
    );

    // Typing indicator component
    const TypingIndicator = () => (
      <div className="flex items-start space-x-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
          <span className="text-blue-400 text-sm">{selectedUser?.name[0]}</span>
        </div>
        <div className="bg-gray-200 p-3 rounded-2xl rounded-tl-none">
          <LoadingIndicator />
        </div>
      </div>
    );

    if (!selectedUser) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>Select a chat to start messaging</p>
        </div>
      );
    }

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
                className={`text-sm ${selectedUser.online ? "text-green-500" : "text-red-500"
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

        <div ref={chatBodyRef} onScroll={handleScroll} className="flex-1 overflow-y-auto flex flex-col-reverse p-5">
          {messages.slice().map((message) => (
            <div key={message.id} className="mb-4">
              <div className={`flex items-start space-x-2 ${message.sender === selectedUser.name ? "justify-start" : "justify-end"}`}>
                {message.sender === selectedUser.name && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
                    <span className="text-blue-400 text-sm">{selectedUser.name[0]}</span>
                  </div>
                )}
                <div className={`relative max-w-[70%] ${message.sender === selectedUser.name ? "mr-auto" : "ml-auto"}`}>
                  <div className={`p-3 rounded-2xl ${message.sender === selectedUser.name
                    ? "bg-gray-200 text-black rounded-tl-none"
                    : "bg-blue-500 text-white rounded-tr-none"
                    }`}>
                    <p className="break-words whitespace-pre-wrap">{message.text}</p>
                  </div>
                  <span className={`text-xs mt-1 ${message.sender === selectedUser.name ? "text-gray-500 ml-2" : "text-gray-500 text-right mr-2"
                    }`}>
                    {formatMessageTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isTyping && <TypingIndicator />}
        </div>

        {/* Message Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(e);
          }}
          className="h-20 px-2 md:px-4 flex items-center"
        >
          <div className="flex flex-1 space-x-2 p-2 bg-black rounded-lg h-[80%]">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 rounded-lg bg-[#2c2a2aa8] text-white  focus:outline-none "
            />
            <button
              type="submit"
              className={`bg-[#1b243b] p-2 rounded-lg hover:bg-blue-500 text-white flex items-center justify-center transition-colors`}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </form>
      </div>
    );
  }
);

ChatContent.displayName = "ChatContent";

export default ChatContent;
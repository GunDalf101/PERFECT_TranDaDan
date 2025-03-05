import React, {
  useRef,
  useEffect,
  memo,
  useMemo,
  useState,
  Profiler,
} from "react";
import { MoreVertical, Send, User, Gamepad2, X, Trophy } from "lucide-react";
import styles from "../styles.module.scss";
import { useRealTime } from "../../../context/RealTimeContext";
import FriendProfile from "./FriendProfile";
import { useNavigate } from "react-router-dom";
import { useInvite } from "../../../chatContext/InviteContext";
import { blockUser } from "../../../api/blockService";
import { myToast } from "../../../lib/utils1";

const ChatContent = memo(
  ({
    friends,
    messages,
    selectedChat,
    newMessage,
    setNewMessage,
    handleSendMessage,
    loadMoreMessages,
    hasMore,
    isLoadingMore,
  }) => {
    const { sendInvite } = useInvite();
    const navigate = useNavigate();
    const chatBodyRef = useRef(null);
    const observerRef = useRef(null);
    const loadingTimerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [tournamentCooldowns, setTournamentCooldowns] = useState({});
    const previousMessagesLength = useRef(messages.length);
    const isLoadingRef = useRef(false);

    const { onlineFriends, sendRelationshipUpdate, sendTournamentRequest } = useRealTime();

    const handleBlockUser = async () => {
      try {
        await blockUser(selectedUser.name);
        myToast(2, `${selectedUser.name} has been blocked`);
        sendRelationshipUpdate("blocked", selectedUser.name);
      } catch (error) {
        console.error("Error blocking user:", error);
        myToast(0, "Failed to block user. Please try again.");
      }
    };

    const isNewMessageReceived = () => {
      const isNewMessage = messages.length > previousMessagesLength.current;
      const latestMessage = messages[0];
      const isReceivedMessage = latestMessage?.sender === selectedUser?.name;
      return isNewMessage && isReceivedMessage;
    };

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedUser = useMemo(() => {
      const user = friends.find((friend) => friend.id === selectedChat);
      if (user) {
        return {
          ...user,
          online: onlineFriends.includes(user.name),
        };
      }
      setIsOpen(false);
      return null;
    }, [friends, selectedChat, onlineFriends]);

    const scrollToBottom = (behavior = "auto") => {
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    };

    const handleScroll = async () => {
      if (
        !chatBodyRef.current ||
        isLoadingRef.current ||
        !hasMore ||
        isLoadingMore
      )
        return;

      const { scrollTop, scrollHeight } = chatBodyRef.current;

      if (scrollHeight + scrollTop < 1000) {
        isLoadingRef.current = true;

        try {
          await loadMoreMessages();
          if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = -3000;
          }
        } finally {
          isLoadingRef.current = false;
        }
      }
    };

    useEffect(() => {
      if (!chatBodyRef.current || isLoadingMore) return;
      if (isNewMessageReceived()) {
        scrollToBottom("smooth");
      }

    }, [messages, isLoadingMore]);


    const handleSubmit = (e) => {
      e.preventDefault();
      handleSendMessage(e);
      setTimeout(() => scrollToBottom("smooth"), 100);
    };

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
          minute: "2-digit",
        })}`;
      } else {
        return `${date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })} ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }
    };

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


    const LoadingIndicator = () => (
      <div className="flex justify-center items-center space-x-2 p-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
      </div>
    );

    const TypingIndicator = () => (
      <div className="flex items-start space-x-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
          <img src={selectedUser.avatar_url} alt="" />
        </div>
        <div className="bg-gray-200 p-3 rounded-2xl rounded-tl-none">
          <LoadingIndicator />
        </div>
      </div>
    );

    if (!selectedUser) {
      return (
        <div className="font-pixel flex-1 text-3xl flex justify-center items-center  text-blue-300">
          <p>Select a chat to start messaging</p>
        </div>
      );
    }

      const handleTournamentRequest = () => {
        const now = Date.now();
        const lastRequestTime = tournamentCooldowns[selectedUser.name] || 0;
        const cooldownPeriod = 30000;

        if (now - lastRequestTime < cooldownPeriod) {
            const remainingSeconds = Math.ceil((cooldownPeriod - (now - lastRequestTime)) / 1000);
            myToast(2, `Please wait ${remainingSeconds} seconds before sending another tournament request`);
            return;
        }

        setTournamentCooldowns(prev => ({
            ...prev,
            [selectedUser.name]: now
        }));

        sendTournamentRequest(selectedUser.name);
        myToast(0, `Tournament request sent to ${selectedUser.name}`);
    };

    return (
      <>
        <div className={`${styles.chat_content}`}>
          <div className="h-16 border-b px-6 flex justify-between">
            <div className="flex gap-2 items-center">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                <img
                  src={selectedUser.avatar || "/default_profile.webp"}
                  alt=""
                  className="w-full h-full object-cover rounded-full"
                />
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
            <div
              className="relative inline-block left-7 top-2 "
              ref={dropdownRef}
            >
              <div className="flex  min-[1030px]:hidden">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-blue-300 hover:text-blue-600 focus:outline-none p-2"
                  aria-label="Menu"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button
                      className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      onClick={() => {
                        navigate(`/user/${selectedUser.name}`);
                        setIsOpen(false);
                      }}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>

                    <button
                      className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      onClick={() => {
                        sendInvite(selectedUser.name);
                        setIsOpen(false);
                      }}
                    >
                      <Gamepad2 className="w-4 h-4" />
                      Game
                    </button>
                    <button
                      className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      onClick={() => {
                        handleTournamentRequest();
                        setIsOpen(false);
                      }}
                    >
                      <Trophy className="w-4 h-4" />
                      Tournement
                    </button>

                    <button
                      className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      onClick={() => {
                        handleBlockUser();
                        setIsOpen(false);
                      }}
                    >
                      <X className="w-4 h-4" />
                      Blocks
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            ref={chatBodyRef}
            onScroll={handleScroll}
            className={`flex-1 overflow-y-auto flex flex-col-reverse p-2 sm:p-5 min-h-0
            ${styles['message-container']}`}
          >
            {messages.slice().map((message) => (
              <div key={message.id} className="mb-2 sm:mb-4 w-full">
                <div
                  className={`flex items-start space-x-1 sm:space-x-2 ${message.sender === selectedUser.name
                      ? "justify-start"
                      : "justify-end"
                    }`}
                >
                  {message.sender === selectedUser.name && (
                    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={selectedUser.avatar || "/default_profile.webp"}
                        alt=""
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  )}
                  <div
                    className={`relative max-w-[100%] sm:max-w-[90%] min-w-[40px] ${message.sender === selectedUser.name
                        ? "mr-auto"
                        : "ml-auto"
                      }`}
                  >
                    <div
                      className={`p-2 sm:p-3 rounded-2xl ${message.sender === selectedUser.name
                          ? "bg-gray-200 text-black rounded-tl-none"
                          : "bg-blue-500 text-white rounded-tr-none"
                        }`}
                    >
                      <p className="break-words whitespace-pre-wrap text-xs sm:text-sm md:text-base">
                        {message.text}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 block ${message.sender === selectedUser.name
                          ? "text-gray-500 ml-1 sm:ml-2"
                          : "text-gray-500 text-right mr-1 sm:mr-2"
                        }`}
                    >
                      {formatMessageTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && <TypingIndicator />}
          </div>

          <form
            onSubmit={handleSubmit}
            className="h-14 sm:h-20 px-2 md:px-4 flex items-center mt-auto"
          >
            <div className="flex flex-1 space-x-1 sm:space-x-2 p-1 sm:p-2 bg-black rounded-lg h-[80%]">
              <div className="flex flex-1 w-full relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={500}
                  className="w-full p-1.5 sm:p-2 rounded-lg bg-[#2c2a2aa8] text-white focus:outline-none text-xs sm:text-sm md:text-base placeholder:text-xs sm:placeholder:text-sm"
                />
                <span className="absolute top-0.5 sm:top-1 right-1 sm:right-2 text-[10px] sm:text-xs text-gray-400">
                  {newMessage.length}/500
                </span>
              </div>
              <button
                type="submit"
                className="bg-[#1b243b] p-1 sm:p-2 rounded-lg hover:bg-blue-500 text-white flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </button>
            </div>
          </form>
        </div>
        <FriendProfile
          selectedUser={friends.find((user) => user.id === selectedChat)}
          handleTournamentRequest={handleTournamentRequest}
        />
      </>
    );
  }
);

ChatContent.displayName = "ChatContent";

export default ChatContent;

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "../../components/auth/UserContext";
import Logged from '../../components/Navbar/Logged';
import Dprofile from "../../components/chat/Dprofile/Dprofile";
import ChatContent from "../../components/chat/ChatWin/ChatContent";
import UserList from "../../components/chat/ChatWin/UserList";
import getFriends from "../../api/axiosGetFriends";
import getAllMessage from "../../api/axiosGetallMessage";
import styles from "../../components/chat/styles.module.scss";
import { useWebSocket } from '../../components/chatContext/WebSocketContext';


const ChatApp = () => {
  const { user, isAuthenticated } = useUser();
  const { sendMessage, registerMessageHandler, isConnected } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [messageCache, setMessageCache] = useState({});
  const [lastmessafe,setLastmessage] = useState("");
  const messageIdsRef = useRef(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const currentUsername = user ? JSON.parse(user).username : null;

  const generateMessageId = useCallback((sender, timestamp) => {
    return `${sender}-${timestamp}-${Math.random().toString(36).slice(2, 9)}`;
  }, []);


  const loadFriendsWithLastMessages = async () => {
    if (!isAuthenticated) return;


    try {
      setIsLoading(true);
      const data = await getFriends();
      
      const friendsData = data.friends.map((friend, index) => ({
        id: index + 1,
        name: friend,
        online: Math.random() < 0.5, // Replace with actual online status logic
        lastSeen: new Date().toISOString(),
        avatar: `/api/users/${friend}/avatar`, // Replace with actual avatar URL
        lastMessage: null,
        lastMessageTime: null
      }));

      const friendsWithMessages = await Promise.all(
        friendsData.map(async (friend) => {
          try {
            const response = await getAllMessage(`${friend.name}?page=${page}`);
            const lastMessage = response.results[0];
            
            return {
              ...friend,
              lastMessage: lastMessage ? lastMessage.content : null,
              lastMessageTime: lastMessage ? new Date(lastMessage.timestamp).toISOString() : null,
              unreadCount: 0,
            };
          } catch (error) {
            console.error(`Error loading messages for ${friend.name}:`, error);
            return friend;
          }
        })
      );

      setFriends(friendsWithMessages);
      setError(null);
    } catch (error) {
      console.error("Error loading friends:", error);
      setError("Failed to load friends list. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFriendsWithLastMessages();
  }, [isAuthenticated]);


  const getLastMessageForFriend = useCallback((friendId, messagesArray) => {
    const selectedFriend = friends.find(f => f.id === friendId);
    if (!selectedFriend) return null;
  
    return messagesArray
      .filter(msg => 
        msg.sender === selectedFriend.name || 
        msg.receiver === selectedFriend.name
      )
      .slice(-1)[0];
  }, [friends]);

  useEffect(() =>{
    console.log("sadmasdmaskdm",getLastMessageForFriend(1,messages));
  },[messages]);


  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!selectedChat || !friends.length) return;

      try {
        setIsLoading(true);
        const selectedFriend = friends.find(f => f.id === selectedChat);
        if (!selectedFriend) return;

        if (messageCache[selectedChat]) {
          setMessages(messageCache[selectedChat]);
          return;
        }

        const response = await getAllMessage(`${selectedFriend.name}?page=${page}`);
        const formattedMessages = response.results.map(msg => ({
          id: generateMessageId(msg.sender, msg.timestamp),
          text: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp
        }));

        const uniqueMessages = Array.from(
          new Map(formattedMessages.map(msg => [msg.id, msg])).values()
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setMessages(uniqueMessages);
        setMessageCache(prev => ({
          ...prev,
          [selectedChat]: uniqueMessages
        }));
        setHasMore(response.next !== null);
        setError(null);
      } catch (error) {
        console.error('Error loading messages:', error);
        setError('Failed to load message history. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [selectedChat, page, friends, generateMessageId]);

  useEffect(() => {
    const handleMessage = (data) => {
      if (data.error) {
        setError(data.error);
        return;
      }
      
      if (data.message && data.sender) {
        const messageId = generateMessageId(data.sender, Date.now());
        
        if (messageIdsRef.current.has(messageId)) {
          console.log("Duplicate message received, ignoring:", messageId);
          return;
        }
        
        messageIdsRef.current.add(messageId);

        const newMsg = {
          id: messageId,
          text: data.message,
          sender: data.sender,
          timestamp: new Date().toISOString(),
        };
        // console.log("data:",data);
        setMessages(prev => {
          const updatedMessages = [...prev, newMsg].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          return updatedMessages;
        });
      }
    };
    const unregister = registerMessageHandler(handleMessage);
    return () => unregister();
  }, [generateMessageId, registerMessageHandler]);

  const handleSendMessage = useCallback((e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const selectedFriend = friends.find((f) => f.id === selectedChat);
    if (!selectedFriend) return;

    const messageData = {
      username: selectedFriend.name,
      content: newMessage.trim()
    };

    const timestamp = new Date().toISOString();
     const tempMessage = {
      id: generateMessageId(currentUsername, timestamp),
      text: newMessage.trim(),
      sender: currentUsername,
      timestamp: timestamp,
      pending: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");

    if (isConnected) {
      const sent = sendMessage(messageData);
      if (sent) {
        // console.log(messageData);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempMessage.id ? { ...msg, pending: false } : msg
          )
        );
        // console.log(tempMessage);
      } else {
        console.log("Failed",sent);
        setError("Failed to send message. Please try again.");
      }
    } else {
      setError("Connection lost. Please wait while we reconnect.");
    }
  }, [selectedChat, newMessage, friends, currentUsername, generateMessageId, isConnected, sendMessage]);

  const handleSidebarToggle = (type) => {
    setActiveSidebar(activeSidebar === type ? null : type);
  };

  return (
    <div className={`flex flex-col ${styles.nwbody}`}>
      <Logged />
      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4">
          {error}
          <button
            className="ml-2 text-sm underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex ">
        <div className={`${styles.chat_win} `}>
          <UserList
            friends={friends}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            messages={messages}
            isLoading={isLoading}
            currentUsername={currentUsername}
          />
          <ChatContent
            friends={friends}
            messages={messages}
            selectedChat={selectedChat}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            handleSidebarToggle={handleSidebarToggle}
            isOnline={friends.find(f => f.id === selectedChat)?.online}
            loadMoreMessages={() => setPage(prev => prev + 1)}
            hasMore={hasMore}
            isLoading={isLoading}
          />
        </div>
        {activeSidebar && (
          <Dprofile
            selectedUser={friends.find((user) => user.id === selectedChat)}
            onClose={() => setActiveSidebar(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ChatApp;

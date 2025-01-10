import React, { useState, useEffect, useCallback} from "react";
import styles from "../../components/chat/styles.module.scss";
import Logged from '../../components/Navbar/Logged';
import Dprofile from "../../components/chat/Dprofile/Dprofile";
import ChatWin from "../../components/chat/ChatWin/ChatWin";
import { useUser } from "../../components/auth/UserContext";
import getFriends from "../../api/axiosGetFriends";
import getAllMessage from "../../api/axiosGetallMessage";

const useChatWebSocket = ({ setMessages, setSocket, selectedChat }) => {

  useEffect(() => {
    let reconnectTimer = null;

    const connectWebSocket = () => {
      const token = localStorage.getItem("access_token");
      const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${token}`);


      ws.onopen = () => {
        console.log("WebSocket Connected");
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("data a git::",data);
          if (data.error) {
            console.error("WebSocket error:", data.error);
            return;
          }
          if (data.message && data.sender) {
            setMessages(prev => [...prev, {
              id: Math.random(),
              text: data.message,
              sender: data.sender,
              receiver: selectedChat,
              timestamp: new Date().toISOString(),
            }]);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket Disconnected", event.code);
        if (!event.wasClean) {
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      setSocket(ws);
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [selectedChat, setMessages, setSocket]);
};

const ChatApp = () => {
  const { user, isAuthenticated } = useUser();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);



  // Load chat history when selecting a chat
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!selectedChat || !friends.length) return;

      try {
        setIsLoading(true);
        const selectedFriend = friends.find(f => f.id === selectedChat);
        if (!selectedFriend) return;


        const response = await getAllMessage(selectedFriend.name);

        setMessages([]);
        const formattedMessages = response.results.map(msg => ({
          id: Math.random(),
          text: msg.content,
          sender: msg.sender,
          receiver: selectedFriend.name,
          timestamp: msg.timestamp
        }));

        setMessages(prev => {
          const allMessages = [...formattedMessages, ...prev];
          return Array.from(new Set(allMessages.map(m => m.id)))
            .map(id => allMessages.find(m => m.id === id))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        });

        setHasMore(response.next !== null);
      } catch (error) {
        setError('Failed to load message history');
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [selectedChat, page, friends]);



  useEffect(() => {
    console.log("Messages updated:", messages);

  }, [messages]);


  useEffect(() => {
    const loadFriends = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        const data = await getFriends();
        const initialFriends = data.friends.map((friend, index) => ({
          id: index + 1,
          name: friend,
          online: Math.random() < 0.5,
          lastSeen: new Date().toISOString(),
        }));
        setFriends(initialFriends);
      } catch (error) {
        setError("Failed to load friends list");
        console.error("Error fetching friends:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFriends();
  }, [isAuthenticated]);

  useChatWebSocket({ setMessages, setSocket, selectedChat });

  const sendMessage = useCallback((e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const selectedFriend = friends.find((f) => f.id === selectedChat);
    // if (!selectedFriend) return;

    try {
      const messageData = {
        username: selectedFriend.name,
        content: newMessage.trim()
      };

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(messageData));
        // setMessages([]);
        setMessages(prev => [...prev, {
          id: Math.random(),
          text: newMessage.trim(),
          sender: JSON.parse(user).username,
          receiver: selectedFriend.name,
          timestamp: new Date().toISOString(),
        }]);

        setNewMessage([]);
      } else {
        setError("Connection lost. Reconnecting...");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    }
  }, [socket, selectedChat, newMessage, friends, user]);

  const handleSidebarToggle = (type) => {
    setActiveSidebar(activeSidebar === type ? null : type);
  };

  const loadMoreMessages = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
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
      <div className="flex">
        <ChatWin
          friends={friends}
          messages={messages}
          selectedChat={selectedChat}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          setSelectedChat={setSelectedChat}
          handleSidebarToggle={handleSidebarToggle}
          isOnline={friends.find(f => f.id === selectedChat)?.online}
          loadMoreMessages={loadMoreMessages}
          hasMore={hasMore}
          isLoading={isLoading}
        />
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

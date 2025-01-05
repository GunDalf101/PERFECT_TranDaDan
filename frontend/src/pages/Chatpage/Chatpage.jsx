import React, { useState, useEffect, useCallback } from "react";
import styles from "../../components/chat/styles.module.scss";
import Logged from '../../components/Navbar/Logged';
import Dprofile from "../../components/chat/Dprofile/Dprofile";
import ChatWin from "../../components/chat/ChatWin/ChatWin";
import { useUser } from "../../components/auth/UserContext";
import getFriends from "../../api/authGetFriends";

const ChatApp = () => {
  const { user, isAuthenticated } = useUser();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [newMessage, setNewMessage] = useState("");


  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${token}`);

    ws.onopen = () => {
      console.log("WebSocket Connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error("WebSocket error:", data.error);
        return;
      }

      if (data.message && data.sender) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(), // temporary ID
            text: data.message,
            sender: data.sender,
            receiver: selectedChat,
          },
        ]);
      }
    };

    // Fetch friends
    const fetchFriends = async () => {
      const data = await getFriends();
      const initialFriends = data.friends.map((friend, index) => ({
        id: index + 1,
        name: friend,
        online: Math.random() < 0.5, // Simulate online status
      }));
      setFriends(initialFriends);
    };

    // ws.onclose = () => {
    //   console.log("WebSocket Disconnected");
    //   // setTimeout(() => {
    //   //   window.location.reload();
    //   // }, 3000);
    // };

    fetchFriends();
    setSocket(ws);

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [selectedChat]);

  // Send message handler
  const sendMessage = useCallback(
    (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedChat || !socket) return;

      const messageData = {
        username: friends.find((u) => u.id === selectedChat)?.name,
        content: newMessage.trim(),
      };

      socket.send(JSON.stringify(messageData));

      // Optimistically add message to UI
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: newMessage,
          sender: user.username, // Replace with actual logged-in user
          receiver: selectedChat,
        },
      ]);

      setNewMessage("");
    },
    [socket, selectedChat, newMessage, friends, user]
  );

  // Toggle sidebar
  const handleSidebarToggle = (type) => {
    setActiveSidebar(activeSidebar === type ? null : type);
  };

  // Filter messages for selected chat
  const filteredMessages = messages.filter(
    (msg) => msg.sender === selectedChat || msg.receiver === selectedChat
  );

  return (
    <div className={`flex flex-col ${styles.nwbody}`}>
      <Logged />
      <div className="flex">
        <ChatWin
          friends={friends} // Send friends data
          messages={filteredMessages}
          selectedChat={selectedChat}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          setSelectedChat={setSelectedChat}
          handleSidebarToggle={handleSidebarToggle}
        />
        {activeSidebar && (
          <Dprofile
            selectedUser={friends.find((user) => user.id === selectedChat)}
            onClose={() => setActiveSidebar(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ChatApp;
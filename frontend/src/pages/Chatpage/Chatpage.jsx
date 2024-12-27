import React, { useState, useEffect, useCallback ,useRef} from "react";
// import { Card } from '@/components/ui/card';
// import { useToast } from '@/components/ui/use-toast';
import styles from "../../components/chat/styles.module.scss";
import Navbar from "../../components/chat/Navbar/Navbar";
import Sidebar from "../../components/chat/Sidebar/Sidebar";
import Dprofile from "../../components/chat/Dprofile/Dprofile";
import ChatWin from "../../components/chat/ChatWin/ChatWin";

const ChatApp = () => {
  // const [users, setUsers] = useState(null);
  // const [friends, setFriends] = useState([]);
  // const [messages, setMessages] = useState([]);
  // const [selectedChat, setSelectedChat] = useState(null);
  // const [activeSidebar, setActiveSidebar] = useState(false);
  // const [socket, setSocket] = useState(null);
  // // const { toast } = useToast();

  // // Initialize WebSocket connection
  // useEffect(() => {
  //   const ws = new WebSocket(`ws://${window.location.host}/ws/chat/`);

  //   ws.onopen = () => {
  //     console.log('WebSocket Connected');
  //     // Fetch initial data once connected
  //     fetchFriends();
  //     fetchUserProfile();
  //   };

  //   ws.onclose = () => {
  //     console.log('WebSocket Disconnected');
  //     // toast({
  //     //   title: "Connection Lost",
  //     //   description: "Trying to reconnect...",
  //     //   variant: "destructive"
  //     // });
  //     // Attempt to reconnect after 3 seconds
  //     setTimeout(() => {
  //       window.location.reload();
  //     }, 3000);
  //   };

  //   setSocket(ws);

  //   return () => {
  //     if (ws) {
  //       ws.close();
  //     }
  //   };
  // }, []);

  // // Handle incoming WebSocket messages
  // useEffect(() => {
  //   if (!socket) return;

  //   socket.onmessage = (event) => {
  //     const data = JSON.parse(event.data);

  //     switch (data.type) {
  //       case 'chat_message':
  //         setMessages(prev => [...prev, {
  //           message_id: data.message_id,
  //           content: data.message,
  //           sender_id: data.sender_id,
  //           sender_name: data.sender_name,
  //           timestamp: data.timestamp
  //         }]);
  //         break;

  //       case 'chat_created':
  //         setFriends(prev => [...prev, data.chat_room]);
  //         break;

  //       case 'user_online':
  //         setFriends(prev => prev.map(friend =>
  //           friend.id === data.user_id
  //             ? { ...friend, online: true }
  //             : friend
  //         ));
  //         break;

  //       case 'user_offline':
  //         setFriends(prev => prev.map(friend =>
  //           friend.id === data.user_id
  //             ? { ...friend, online: false }
  //             : friend
  //         ));
  //         break;
  //     }
  //   };
  // }, [socket]);

  // // Fetch user's friends/chat rooms
  // const fetchFriends = async () => {
  //   try {
  //     const response = await fetch('/api/chatrooms/');
  //     const data = await response.json();
  //     setFriends(data);
  //   } catch (error) {
  //     // toast({
  //     //   title: "Error",
  //     //   description: "Failed to fetch friends list",
  //     //   variant: "destructive"
  //     // });
  //   }
  // };

  // // Fetch current user's profile
  // const fetchUserProfile = async () => {
  //   try {
  //     const response = await fetch('/api/users/me/');
  //     const data = await response.json();
  //     setUsers(data);
  //   } catch (error) {
  //     // toast({
  //     //   title: "Error",
  //     //   description: "Failed to fetch user profile",
  //     //   variant: "destructive"
  //     // });
  //   }
  // };

  // // Fetch messages for selected chat
  // useEffect(() => {
  //   if (selectedChat) {
  //     fetchMessages(selectedChat);
  //   }
  // }, [selectedChat]);

  // const fetchMessages = async (chatId) => {
  //   try {
  //     const response = await fetch(`/api/messages/?room_id=${chatId}`);
  //     const data = await response.json();
  //     setMessages(data);
  //   } catch (error) {
  //     // toast({
  //     //   title: "Error",
  //     //   description: "Failed to fetch messages",
  //     //   variant: "destructive"
  //     // });
  //   }
  // };

  // // Send message through WebSocket
  // const sendMessage = useCallback((content) => {
  //   if (!socket || !selectedChat || !content.trim()) return;

  //   socket.send(JSON.stringify({
  //     type: 'chat_message',
  //     room_id: selectedChat,
  //     message: content
  //   }));
  // }, [socket, selectedChat]);

  // // Create new chat room
  // const createChatRoom = async (friendId) => {
  //   try {
  //     const response = await fetch('/api/chatrooms/create_room/', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         friend_id: friendId
  //       }),
  //     });

  //     const data = await response.json();
  //     setFriends(prev => [...prev, data]);
  //     setSelectedChat(data.chat_room_id);
  //   } catch (error) {
  //     // toast({
  //     //   title: "Error",
  //     //   description: "Failed to create chat room",
  //     //   variant: "destructive"
  //     // });
  //   }
  // };

  // const handleSidebarToggle = () => {
  //   setActiveSidebar(!activeSidebar);
  // };
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi", sender: "User1", recever: "User12" },
    { id: 1, text: "aaaaa{}", sender: "User1", recever: "User12" },
    { id: 2, text: "Hello2!", sender: "User2", recever: "User13" },
    { id: 3, text: "Hello3!", sender: "User3", recever: "User1" },
    { id: 4, text: "Hello4!", sender: "User4", recever: "User15" },
    { id: 5, text: "Hello5!", sender: "User5", recever: "User14" },
    { id: 6, text: "Hello6!", sender: "User6", recever: "User13" },
    { id: 7, text: "Hello7!", sender: "User7", recever: "User6" },
    { id: 8, text: "Hello8!", sender: "User8", recever: "User5" },
    { id: 9, text: "Hello7!", sender: "User9", recever: "User3" },
    { id: 10, text: "Hello10!", sender: "User10", recever: "User4" },
    { id: 11, text: "Hello9!", sender: "User11", recever: "User9" },
    {
      id: 12,
      text: "Citizen K is a 2019 documentary film about Mikhail Khodorkovsky, written and directed by Alex Gibney.[5][6][7] It is a film about post-Soviet Russia[8] featuring Khodorkovsky, Anton Drel, Maria Logan, Alexei Navalny, Tatyana Lysova, Leonid Nevzlin, Igor Malashenko and Derk Sauer.[9]Citizen K was financed by Amazon.[8] It had its world premiere at Venice Film Festival[8] and was part of the official selection at Venice Film Festival, Toronto International Film Festival and BFI London Film Festival",
      sender: "User12",
      recever: "User1",
    },
    { id: 13, text: "Hello12!", sender: "User13", recever: "User8" },
    { id: 14, text: "Hello13!", sender: "User14", recever: "User10" },
    { id: 15, text: "Hi there!", sender: "User15", recever: "User11" },
  ]);

  const [users, setUsers] = useState([
    { id: 1, name: "User1", online: false },
    { id: 2, name: "User2", online: true },
    { id: 3, name: "User3", online: true },
    { id: 4, name: "User4", online: true },
    { id: 5, name: "User5", online: true },
    { id: 6, name: "User6", online: true },
    { id: 7, name: "User7", online: true },
    { id: 8, name: "User8", online: true },
    { id: 9, name: "User9", online: true },
    { id: 10, name: "User10", online: true },
    { id: 11, name: "User11", online: true },
    { id: 12, name: "User12", online: true },
    { id: 13, name: "User13", online: true },
    { id: 14, name: "User14", online: true },
    { id: 15, name: "User15", online: false },
  ]);

  const [selectedChat, setSelectedChat] = useState(null);
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const chatBodyRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      // console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await fetch(`/api/messages/${chatId}/`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      // console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const response = await fetch("/api/messages/send/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: selectedChat,
          content: newMessage,
        }),
      });
      const data = await response.json();
      setMessages([...messages, data]);
      setNewMessage("");
    } catch (error) {
      // console.error('Error sending message:', error);
    }
  };

  const handleSidebarToggle = (type) => {
    setActiveSidebar(activeSidebar === type ? null : type);
  };

  return (
    <div className={`flex flex-col ${styles.nwbody}`}>
      <Navbar />
      <div className={`flex`}>
        <Sidebar />
        <ChatWin
          users={users}
          messages={messages}
          selectedChat={selectedChat}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          setSelectedChat={setSelectedChat}
          handleSidebarToggle={handleSidebarToggle}
        />
        {activeSidebar && (
          <Dprofile
            selectedUser={users.find((users) => users.id === selectedChat)}
            onClose={() => setActiveSidebar(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ChatApp;

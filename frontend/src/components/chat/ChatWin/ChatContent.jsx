import React, { useRef, useEffect } from "react";
import { MoreVertical, Smile, Send } from "lucide-react";
import styles from "../styles.module.scss";

const ChatContent = ({
  users,
  messages,
  selectedChat,
  newMessage,
  setNewMessage,
  sendMessage,
  handleSidebarToggle,
}) => {
  const chatBodyRef = useRef(null);
  const selectedUser = users.find((user) => user.id === selectedChat);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  if (!selectedUser) return null;

  return (
    <div className={`${styles.chat_content} `}>
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
        className="flex-1 overflow-y-auto   flex flex-col-reverse gap-y-4 py-4 px-1 "
      >
        {messages
          .filter(
            (message) =>
              message.sender === selectedUser.name ||
              message.recever === selectedUser.name
          )
          .map((message) => (
            <div
              key={message.id}
              className={`flex items-center space-x-1 ${
                message.sender === selectedUser.name
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {message.sender !== selectedUser.name && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-blue-400 font-semibold">
                    {selectedUser.name[0]}
                  </span>
                </div>
              )}
              <div
                className={`max-w-[70%] p-3 ${
                  message.sender === selectedUser.name
                    ? "bg-blue-500 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl "
                    : "bg-gray-200 text-black rounded-tl-2xl rounded-tr-2xl rounded-br-2xl "
                }`}
              >
                {message.text}
              </div>
              {message.sender === selectedUser.name && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-blue-400 font-semibold">
                    {selectedUser.name[0]}
                  </span>
                </div>
              )}
            </div>
          ))}
      </div>
      <form
        onSubmit={sendMessage}
        className="h-20 border-t px-6 flex items-center space-x-4"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full p-3 rounded-lg border text-stone-950 focus:outline-none focus:border-blue-500 pr-12"
          />
          {/* <button
            type="button"
            className="absolute right-2 top-2 p-2 rounded-full"
          >
            <Smile className="w-5 h-5 text-gray-500" />
          </button> */}
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
};
export default ChatContent;

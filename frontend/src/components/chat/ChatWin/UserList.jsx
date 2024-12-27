import React from "react";
import styles from "../styles.module.scss";
import imag1 from "./1189258767129399428.webp";
// const avatarPaths = ["./1.png", "./2.png", "./3.png", "./4.png"];
// const generateRandomAvatar = () =>
//   avatarPaths[Math.floor(Math.random() * avatarPaths.length)];
const UserList = ({ users, selectedChat, setSelectedChat }) => (
  <div className={`${styles.chat_sidebar} h-full`}>
      <div className="hidden pl-1 md:flex relative flex-1 items-center  w-full max-w-md mx-auto h-[70px] ">
        <input
          type="text"
          placeholder="Search..."
          className="w-[95%]  p-3 pr-12 py-3 text-fuchsia-400 bg-gray-600 border-[2px] border-blue-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            transition duration-300 
            md:text-sm lg:text-base"
        />
        <button className="absolute pl-3 right-5 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-500 transition duration-300">
          <i className="material-icons-outlined text-3xl md:text-3xl">search</i>
        </button>
      </div>
      <div
        className={`${styles.ulist} transition-all duration-300 ease-in-out rounded-md`}
      >
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => setSelectedChat(user.id)}
            className={`
            
             md:p-[1rem] rounded-md border cursor-pointer 
            transition-all duration-300 ease-in-out 
            transform hover:scale-[1] active:scale-[0.98]
            ${
              selectedChat === user.id
                ? "bg-blue-100 shadow-md"
                : "hover:bg-blue-100 hover:shadow-sm"
            }
          `}
          >
            <div className="flex items-center space-x-3 gap-2">
              <div className="relative">
                <div
                  className={`
                    ${styles.picture}
                    w-12 h-12 md:w-20 md:h-20 rounded-full 
                    bg-blue-300
                    flex items-center justify-center 
                    transition-transform duration-300 
                    hover:rotate-6 overflow-hidden
                  `}
                >
                  <img
                    src={imag1}
                    // alt={`${user.name}'s avatar`}
                    className={`w-full h-full object-cover rounded-full `}
                  />
                </div>
                <div
                  className={`
                    absolute bottom-1 right-1 w-3 h-3 md:w-4 md:h-4
                    rounded-full border-2 border-white
                    transition-all duration-300
                    ${user.online ? "bg-green-500" : "bg-red-500"}
                    `}
                    // ${user.online ? "bg-green-500 absolute bottom-1 right-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2  animate-pulse transition-all duration-300" : ""}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-blue-300 truncate text-sm md:text-base">
                    {user.name}
                  </h3>
                  <span className="text-xs text-blue-400 ml-2">
                    {user.lastMessageTime}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-blue-500 opacity-70 truncate">
                  {user.lastMessage}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
);

export default UserList;

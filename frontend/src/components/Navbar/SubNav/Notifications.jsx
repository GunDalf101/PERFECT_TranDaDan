import React from "react";
import NotifDropdown from "./NotifDropdown";
import { useClickOutside } from "../../../hooks/useClickOutside";
import { useState, useRef } from "react";

const Notifications = () => {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const buttonRef = useRef(null);
  useClickOutside([notifRef, buttonRef], () => setNotifOpen(false));
  
  return (
    <div className="relative">
      <button id="notificationButton" ref={buttonRef} className="focus:outline-none" onClick={() => setNotifOpen(prev => !prev)}>
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 hover:text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.132V11a6 6 0 10-12 0v3.132a2.032 2.032 0 01-.595 1.463L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          ></path>
        </svg>
      </button>
      <NotifDropdown isVisible={notifOpen} ref={notifRef}/>
    </div>
  );
};

export default Notifications;

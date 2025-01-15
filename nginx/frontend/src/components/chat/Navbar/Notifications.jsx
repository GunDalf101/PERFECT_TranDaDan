import React from "react";
import NotifDropdown from "./NotifDropdown";
import { Bell } from "lucide-react"; 
// import { useClickOutside } from "../../../hooks/useClickOutside";
import { useState, useRef,useEffect } from "react";


export const useClickOutside = (refs, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      const refsArray = Array.isArray(refs) ? refs : [refs];
      const isOutside = refsArray.every((ref) => ref.current && !ref.current.contains(event.target));
      
      if (isOutside) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [refs, callback]);
};

const Notifications = () => {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const buttonRef = useRef(null);
  useClickOutside([notifRef, buttonRef], () => setNotifOpen(false));
  
  return (
    <div className="relative">
      <button id="notificationButton" ref={buttonRef} className="focus:outline-none p-2 hover:bg-gray-100 rounded-full" onClick={() => setNotifOpen(prev => !prev)}>
          <Bell className=" text-4xl text-blue-400" />
      </button>
      <NotifDropdown isVisible={notifOpen} ref={notifRef}/>
    </div>
  );
};

export default Notifications;

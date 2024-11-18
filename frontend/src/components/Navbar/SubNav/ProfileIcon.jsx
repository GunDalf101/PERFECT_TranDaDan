import React from "react";
import ProfileDropdown from "./ProfileDropdown";
import { useClickOutside } from "../../../hooks/useClickOutside";
import { useState, useRef } from "react";

const ProfileIcon = () => {
    const [profileDropdown, setProfileDropdown] = useState(false);
    const profileRef = useRef();
    const buttonRef = useRef();
    useClickOutside([profileRef, buttonRef], setProfileDropdown);
  return (
    <div className="relative">
      <button id="profileButton" ref={buttonRef} className="focus:outline-none" onClick={() => setProfileDropdown(prev => !prev)}>
        <img
          src="https://via.placeholder.com/40"
          alt="Profile"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-pink-500"
        />
      </button>
        <ProfileDropdown isVisible={profileDropdown} ref={profileRef}/>
    </div>
  );
};

export default ProfileIcon;

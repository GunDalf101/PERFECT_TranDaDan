import React from "react";
import ProfileDropdown from "./ProfileDropdown";
import { useClickOutside } from "../../../hooks/useClickOutside";
import { useState, useRef } from "react";

const ProfileIcon = () => {
    const [profileDropdown, setProfileDropdown] = useState(false);
    const profileRef = useRef();
    const buttonRef = useRef();
    const userJSON = localStorage.getItem("user");
    const user = userJSON ? JSON.parse(userJSON) : null;
    const avatarUrl =
    user?.intra_connection &&
    JSON.parse(user.intra_connection)?.[0]?.fields?.avatar_url
      ? JSON.parse(user.intra_connection)[0].fields.avatar_url
      : "https://via.placeholder.com/40";
    useClickOutside([profileRef, buttonRef], setProfileDropdown);
  return (
    <div className="relative">
      <button id="profileButton" ref={buttonRef} className="focus:outline-none rounded-full border-2  border-pink-500" onClick={() => setProfileDropdown(prev => !prev)}>
        <img
          src={avatarUrl}
          alt="Profile"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full"
        />
      </button>
        <ProfileDropdown isVisible={profileDropdown} ref={profileRef}/>
    </div>
  );
};

export default ProfileIcon;

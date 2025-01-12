import React from "react";
import ProfileDropdown from "./ProfileDropdown";
import { useClickOutside } from "../../../hooks/useClickOutside";
import { useState, useRef, useEffect } from "react";
import { useUser } from "../../../components/auth/UserContext"

const ProfileIcon = () => {
  const [profileDropdown, setProfileDropdown] = useState(false);
  const profileRef = useRef();
  const buttonRef = useRef();
  const { user } = useUser();
  const [_user,setUser] = useState();

  useEffect(() => {
    setUser(user ? JSON.parse(user) : null);
  }, [user])

  const avatarUrl =
    _user?.intra_connection &&
      JSON.parse(_user.intra_connection)?.[0]?.fields?.avatar_url
      ? JSON.parse(_user.intra_connection)[0].fields.avatar_url
      : "/default_profile.webp";

  useClickOutside([profileRef, buttonRef], setProfileDropdown)

  return (
    <div className="relative">
      <button id="profileButton" ref={buttonRef} className="focus:outline-none rounded-full border-2  border-pink-500" onClick={() => setProfileDropdown(prev => !prev)}>
        <img
          src={avatarUrl}
          alt="Profile"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full"
        />
      </button>
      <ProfileDropdown isVisible={profileDropdown} ref={profileRef} />
    </div>
  );
};

export default ProfileIcon;

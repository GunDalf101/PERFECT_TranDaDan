import React from "react";
import ProfileDropdown from "./ProfileDropdown";
// import { useClickOutside } from "../../../hooks/useClickOutside";
import { useState, useRef,useEffect } from "react";
// import { getUserData } from "../../../api/authService42Intra";
import { useUser } from "../../auth/UserContext";

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

const ProfileIcon = () => {
    const [profileDropdown, setProfileDropdown] = useState(false);
    const profileRef = useRef();
    const buttonRef = useRef();
    useClickOutside([profileRef, buttonRef], setProfileDropdown);
    const {user} = useUser();
    const _user = user ? JSON.parse(user) : null;
    const parseIntraConnection = (intraStr) => {
      try {
        const parsed = JSON.parse(intraStr);
        return parsed[0].fields;
      } catch (error) {
        console.error('Error parsing intra connection:', error);
        return null;
      }
    };
  return (
    <div className="relative py-1 ">
      <button id="profileButton" ref={buttonRef} className="focus:outline-none rounded-full border-2  border-pink-500" onClick={() => setProfileDropdown(prev => !prev)}>
      <img
          src={_user?.avatar_url || "/default_profile.webp"}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full "
        />
      </button>
        <ProfileDropdown isVisible={profileDropdown} ref={profileRef}/>
    </div>
  );
};

export default ProfileIcon;

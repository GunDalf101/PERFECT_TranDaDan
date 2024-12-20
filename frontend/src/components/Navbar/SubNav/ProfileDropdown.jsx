import React from "react";
import styles from "./SubNav.module.scss";

const ProfileDropdown = React.forwardRef(({isVisible}, ref) => {
  return (
    <div
      id="profileDropdown"
      ref={ref}
      className={`${styles.profileDropdown} ${isVisible && styles.show} absolute right-0 mt-2 w-48 bg-gray-900 text-teal-200 border-2 border-pink-500 shadow-lg rounded-md z-10`}
    >
      <a
        href="/profile"
        className="block px-4 py-2 hover:bg-pink-500 hover:text-gray-900"
      >
        View Profile
      </a>
      <a
        href="#"
        className="block px-4 py-2 hover:bg-pink-500 hover:text-gray-900"
      >
        Friends
      </a>
      <a
        href="#"
        className="block px-4 py-2 hover:bg-pink-500 hover:text-gray-900"
      >
        History
      </a>
      <a
        href="#"
        className="block px-4 py-2 hover:bg-pink-500 hover:text-gray-900"
      >
        Dashboards
      </a>
      <a
        href="#"
        className="block px-4 py-2 hover:bg-pink-500 hover:text-gray-900"
      >
        Settings
      </a>
      <a
        href="#"
        className="block px-4 py-2 hover:bg-pink-500 hover:text-gray-900"
      >
        Sign Out
      </a>
    </div>
  )
});

export default ProfileDropdown;

import React from "react";
import styles from "../styles.module.scss";

const ProfileDropdown = React.forwardRef(({isVisible}, ref) => {
  return (
    <div
      id="profileDropdown"
      ref={ref}
      className={`${styles.profileDropdown} ${isVisible && styles.show} absolute right-0 mt-2 w-48  border-pink-500 shadow-lg rounded-md z-[100]`}
    >
      <a
        href="#"
      >
        View Profile
      </a>
      <a
        href="#"
      >
        Friends
      </a>
      <a
        href="#"
      >
        History
      </a>
      <a
        href="#"
      >
        Dashboards
      </a>
      <a
        href="#"
      >
        Settings
      </a>
      <a
        href="#"
      >
        Sign Out
      </a>
    </div>
  )
});

export default ProfileDropdown;

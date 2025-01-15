import React, { useState } from "react";
import styles from "../styles.module.scss";

const Sidebar = () => {
  return (
      <div
        className={`${styles.sidebar} -translate-x-full transition-transform duration-300 ease-in-out  lg:translate-x-0 z-50`}
      >
        <ul className={`${styles.nav_list}`}>
          <li>
            <a href="/">
              <i className="material-icons-outlined">home</i>
            </a>
            <span className={`${styles.tooltip}`}>Home</span>
          </li>
          <li>
            <a href="#">
              <i className="material-icons-outlined">dashboard</i>
            </a>
            <span className={`${styles.tooltip}`}>Dashboard</span>
          </li>
          <li>
            <a href="#">
              <i className="material-icons-outlined">perm_identity</i>
            </a>
            <span className={`${styles.tooltip}`}>Profile</span>
          </li>
          <li>
            <a href="/game-lobby" onClick={() => navigate(`/game-lobby`)}>
              <i className="material-icons-outlined"> sports_esports </i>
            </a>
            <span className={`${styles.tooltip}`}>Game</span>
          </li>
          <li>
            <a href="#">
              <i className="material-icons-outlined">settings</i>
            </a>
            <span className={`${styles.tooltip}`}>Setting</span>
          </li>
          <li className={` ${styles.logout}`}>
            <a href="#">
              <i className="material-icons-outlined" id="log_out">
                logout
              </i>
            </a>
            <span className={`${styles.tooltip}`}>logout</span>
          </li>
        </ul>
      </div>
  );
};

export default Sidebar;

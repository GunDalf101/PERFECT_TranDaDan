import React from "react";
import Searchbar from "./SubNav/Searchbar";
import Sidebar from "./SubNav/Sidebar";
import Notifications from "./SubNav/Notifications";
import { useState, useEffect, useRef } from "react";
import { useClickOutside } from "../../hooks/useClickOutside";
import ProfileIcon from "./SubNav/ProfileIcon";
import styles from "./Navbar.module.scss";
import { Link } from "react-router-dom";

const Logged = () => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isSearhVisible, setSearchVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sidebarRef = useRef(null);
  const searchRef = useRef(null);

  useClickOutside(sidebarRef, () => setSidebarVisible(false));
  useClickOutside(searchRef, () => setSearchVisible(false));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <nav
      id="navbar"
      className={`navbar ${scrolled ? 'scrolled' : ''} fixed top-0 w-full flex flex-column justify-between items-center px-4 sm:px-10 z-10`}
    >
      <div className="flex items-center">
        <button
          id="sidebarToggle"
          className={styles.sidebarToggle}
          onClick={() => setSidebarVisible((prev) => !prev)}
        >
          ☰
        </button>
        <div className="logo text-white text-5xl ml-5 mb-4">TDD</div>
      </div>
      <Searchbar isVisible={isSearhVisible} ref={searchRef} />
      <Sidebar isVisible={isSidebarVisible} ref={sidebarRef} />
      <div className="flex items-center my-auto py-2 space-x-4">
        <button id="searchIcon" className="md:hidden focus:outline-none" onClick={() => setSearchVisible((prev) => !prev)}>
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 hover:text-white"
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            fill="#9ca3af"
            viewBox="0 0 50 50"
          >
            <path d="M 21 3 C 11.601563 3 4 10.601563 4 20 C 4 29.398438 11.601563 37 21 37 C 24.355469 37 27.460938 36.015625 30.09375 34.34375 L 42.375 46.625 L 46.625 42.375 L 34.5 30.28125 C 36.679688 27.421875 38 23.878906 38 20 C 38 10.601563 30.398438 3 21 3 Z M 21 7 C 28.199219 7 34 12.800781 34 20 C 34 27.199219 28.199219 33 21 33 C 13.800781 33 8 27.199219 8 20 C 8 12.800781 13.800781 7 21 7 Z"></path>
          </svg>
        </button>

        <Notifications />
        <ProfileIcon />
      </div>
    </nav>
  );
};

export default Logged;

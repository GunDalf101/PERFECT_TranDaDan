import React from "react";
import styles from "./Navbar.module.scss";
import { useState, useRef, useEffect } from "react";
import { useClickOutside } from "../../hooks/useClickOutside";

const NotLogged = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  useClickOutside([dropdownRef, buttonRef], () => setIsOpen(false));
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHamburgerClick = () => {
    setIsOpen((prev) => !prev);
  };
  return (
    <nav
      id="navbar"
      className={`navbar ${scrolled ? 'scrolled' : ''} fixed top-0 w-full flex flex-column justify-between items-center pb-4 pr-10 pl-10 z-10`}
    >
      <div className="logo text-white text-5xl ml-5">TranDaDan</div>
      <div className="flex space-x-5">
        <button className={styles.loginButton}>Login</button>
        <button className={styles.registerButton}>Register</button>
      </div>
      <button
        className={styles.hamburger}
        onClick={handleHamburgerClick}
        ref={buttonRef}
      >
        ☰
      </button>
      <div
        className={`${styles.authDropdown} ${isOpen && styles.show}`}
        ref={dropdownRef}
      >
        <a href="#" className="dropdown-item block">
          Login
        </a>
        <a href="#" className="dropdown-item block">
          Register
        </a>
      </div>
    </nav>
  );
};

export default NotLogged;

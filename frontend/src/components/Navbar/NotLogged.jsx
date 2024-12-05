import React from "react";
import styles from "./Navbar.module.scss";
import { useState, useRef, useEffect } from "react";
import { useClickOutside } from "../../hooks/useClickOutside";
import { Link } from "react-router-dom";

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
      className={`navbar ${scrolled ? 'scrolled' : ''} fixed top-0 w-full flex flex-column justify-between items-center sm:py-2 px-2 sm:px-10 z-10`}
    >
      <div className="logo text-white text-5xl ml-5 mb-4">TranDaDan</div>
      <div className="flex space-x-5">
        <Link to="/login"><button className={styles.loginButton}>Login</button></Link>
        <Link to="/register"><button className={styles.registerButton}>Register</button></Link>
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
        <Link to="/login" className="dropdown-item block">
          Login
        </Link>
        <Link to="/register" className="dropdown-item block">
          Register
        </Link>
      </div>
    </nav>
  );
};

export default NotLogged;

import React, { useState, useEffect } from "react";
import { Search, Menu, X } from "lucide-react";
import styles from "../styles.module.scss";
import SearchBar from "../SearchBar/SearchBar";
import ProfileIcon from "./ProfileIcon";
import Notifications from "./Notifications";
import { Link } from "react-router-dom";
import { getUserData } from "../../../api/authService42Intra";


const Navbar = () => {
  // const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // const toggleSearch = () => {
  //   setIsSearchExpanded(!isSearchExpanded);
  // };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // const [user,setUser] = useState('');
  // useEffect(() =>{
  //     const fetchUserData = async () => {
  //     try {
  //       const data = await getUserData();
  //       setUser(data);
  //     } catch (error) {
  //       console.error("Error:", error);
  //     }
  //   };
  //   fetchUserData();
  //   },[])


  return (
    <div
      className={`${styles.navbar} flex items-center justify-between flex-wrap`}
    >
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
        >
          <Menu className=" text-blue-400" />
        </button>

        <div className="logo text-white text-5xl ml-5 mb-4">TDD</div>
      </div>
      <SearchBar/>
      <div className="flex items-center space-x-2">
        <Notifications />
        <ProfileIcon />
        {/* <button className="p-2 hover:bg-gray-100 rounded-full">
          <Bell className=" text-blue-400" />
        </button>
        <button className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400"></button> */}
      </div>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[80] "
          onClick={toggleMobileMenu}
        >
          <div
            className="fixed top-0 left-0 h-full bg-blue-300 p-4 "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <p className="text-2xl font-extrabold text-center mb-6 text-indigo-50 font-pixel">
                TranDaDan
              </p>
              <ul className="font-oswald font-blod text-xl text-black">
                <li className="py-3 px-4 hover:bg-white hover:text-blue-300  rounded-md ">
                <Link to="/">Home</Link>
                </li>
                <li className="py-3 px-4 hover:bg-white hover:text-blue-300  rounded-md ">
                  <Link to="/game-lobby">Game Mode</Link>
                </li>
                <li className="py-3 px-4 hover:bg-white hover:text-blue-300  rounded-md ">
                  <a href="#">Leaderboards & Statistics</a>
                </li>
                <li className="py-3 px-4 hover:bg-white hover:text-blue-300  rounded-md ">
                  <a href="#">Settings & Security</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;

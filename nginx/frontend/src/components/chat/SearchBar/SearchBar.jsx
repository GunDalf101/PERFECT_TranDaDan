import React from "react";
import styles from "../styles.module.scss";
import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export const useClickOutside = (refs, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      const refsArray = Array.isArray(refs) ? refs : [refs];
      const isOutside = refsArray.every(
        (ref) => ref.current && !ref.current.contains(event.target)
      );
      if (isOutside) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [refs, callback]);
};
const SearchBar = () => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };
  const notifRef = useRef(null);
  const buttonRef = useRef(null);
  useClickOutside([notifRef, buttonRef], () => setNotifOpen(false));
  return (
    <div className={`${styles.search__container} flex-1 mx-4 relative`}>
        <button
          onClick={toggleSearch}
          className={`md:hidden absolute right-0 top-1/2 transform -translate-y-1/2 
            ${isSearchExpanded ? "hidden" : "block"}`}
        >
          <Search className=" text-blue-400" />
        </button>

        <div
          className={`
          ${styles.search__wrapper}
           relative left-[28%] w-[40%]
          ${isSearchExpanded ? "block" : "hidden md:block"}
          `}
        >
          <input
            type="text"
            placeholder="Search..."
            className={`
              ${styles.search__input}
              ${isSearchExpanded ? "hidden" : "text-base"}
            `}
          />
          {isSearchExpanded && (
            <div
              id="fullSearchModal"
              className={`${styles.search__wrapper}  fixed inset-0 flex md:hidden bg-gray-900 bg-opacity-90 z-50 items-center justify-center px-6 py-4`}
            >
              <button
                id="closeSearchModal"
                onClick={toggleSearch}
                className="absolute top-4 left-4 transition duration-300 ease-in-out"
              >
                <svg
                  className="w-8 h-8 animate-pulse font-oswald"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
              <input
                type="text"
                placeholder="Search..."
                className={` ${styles.search__input} w-full max-w-lg px-6 py-4 text-lg transition duration-300 ease-in-out transform hover:scale-105 font-oswald`}
              />
            </div>
          )}
        </div>
      </div>
  );
};
export default SearchBar;

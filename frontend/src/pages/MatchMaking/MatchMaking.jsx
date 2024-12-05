// MatchMaking.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './MatchMaking.css';
import { Link } from 'react-router-dom';
const ProfileCard = ({ username, title, picture }) => {
  return (
    <div className="card bg-gray-900 p-6 rounded-lg text-center w-full max-w-xs flex flex-col items-center hover-glow">
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-4">
        <img
          src={picture}
          alt={`${username}'s Profile Picture`}
          className="w-full h-full object-cover"
        />
      </div>
      <h2 className="text-xl md:text-2xl font-bold mb-2 text-cyan-400">{username}</h2>
      <p className="text-sm md:text-base text-gray-400 italic">{title}</p>
    </div>
  );
};
const SearchingPlaceholder = () => {
  return (
    <div className="card bg-gray-900 p-6 rounded-lg text-center w-full max-w-xs flex flex-col items-center floaty">
      <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-600 rounded-full mb-4"></div>
      <h2 className="text-xl font-bold mb-2 text-gray-500">Searching...</h2>
      <p className="text-sm md:text-base text-gray-400">Scanning the galaxy...</p>
    </div>
  );
};

const MatchMaking = () => {
  const [opponent, setOpponent] = useState(null);
  const [isSearching, setIsSearching] = useState(true);

  // Mock user data
  const userData = {
    username: "YourUsername",
    title: "Champion of the Stars",
    picture: "https://via.placeholder.com/150"
  };

  // Mock opponent data
  const mockOpponent = {
    username: "StarFighterX",
    title: "Defender of the Milky Way",
    picture: "https://via.placeholder.com/150/0000ff/ffffff?text=Opponent"
  };

  useEffect(() => {
    // Simulate finding an opponent
    const timer = setTimeout(() => {
      setOpponent(mockOpponent);
      setIsSearching(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="match-container text-white flex relative z-0 items-center justify-center min-h-screen">
      <div className="w-full max-w-5xl mx-auto rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row border border-cyan-400 relative z-10">
        {/* Left Side: Your Profile */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-gray-900 to-gray-800 p-6 flex flex-col items-center justify-center border-b md:border-r md:border-b-0 border-gray-700">
          <ProfileCard {...userData} />
        </div>

        {/* Right Side: Opponent Profile */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-gray-900 to-gray-800 p-6 flex flex-col items-center justify-center">
          {isSearching ? (
            <SearchingPlaceholder />
          ) : (
            <ProfileCard {...opponent} />
          )}
        </div>
      </div>
      <div className="absolute bottom-10 w-full flex justify-center">
        <Link to="/game-lobby">
          <button id="cancel-button" className="cancel-button">
            Cancel Matchmaking
          </button>
        </Link>
      </div>
    </div>
  );
};




export default MatchMaking;
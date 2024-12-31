import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './MatchMaking.css';
import { Link, useNavigate } from 'react-router-dom';
import getMyData from '../../api/authServiceMe';
import axiosInstance from '../../api/axiosInstance';

const API_URL = "/games"; // Replace with your API base URL

const ProfileCard = ({ username, title, picture }) => (
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

const SearchingPlaceholder = () => (
  <div className="card bg-gray-900 p-6 rounded-lg text-center w-full max-w-xs flex flex-col items-center floaty">
    <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-600 rounded-full mb-4"></div>
    <h2 className="text-xl font-bold mb-2 text-gray-500">Searching...</h2>
    <p className="text-sm md:text-base text-gray-400">Scanning the galaxy...</p>
  </div>
);

const MatchMaking = () => {
  const [opponent, setOpponent] = useState(null);
  const [isSearching, setIsSearching] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);

  const userDataRef = useRef(null); // Store user data without causing re-renders

  const userData = {
    username: userDataRef.current?.username || 'Loading...',
    title: 'Jedi Master',
    picture: 'https://randomuser.me',
  };

  const fetchUserData = async () => {
    try {
      const data = await getMyData();
      if (data) {
        userDataRef.current = data; // Update the ref
        setIsDataReady(true); // Signal that user data is ready
        console.log("Fetched user data:", userDataRef.current);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleJoinQueue = async () => {
    try {
      await axiosInstance.post(`${API_URL}/matchmaking/join/`, { game_type: 'pong' });
      setIsSearching(true);
    } catch (error) {
      console.error(error.response?.data?.message || "An error occurred");
    }
  };

  const handleLeaveQueue = async () => {
    try {
      await axiosInstance.post(`${API_URL}/matchmaking/leave/`);
      setIsSearching(false);
    } catch (error) {
      console.error(error.response?.data?.message || "An error occurred");
    }
  };

  const handleFindMatch = async () => {
    if (!isSearching) return;
    try {
      const response = await axiosInstance.get(`${API_URL}/matchmaking/find/`);
      if (response.data.status === 'success') {
        const { player1, player2, game_id } = response.data;
        const currentUsername = userDataRef.current?.username;
  
        // Check if a match is found and assign opponent
        if (player1 !== currentUsername && player2 !== currentUsername) {
          // No match found yet
          console.log('Waiting for match...');
        } else {
          console.log('Match found:');
          setOpponent({
            username: currentUsername === player1 ? player2 : player1,
          });
          setIsSearching(false);
  
          // Wait for 2 seconds before navigating to the lobby
          setTimeout(() => {
            navigate(`/game-lobby/remote-play/`);
          }, 5000);
        }
      } else {
        console.log(response.data.message);
      }
    } catch (error) {
      console.error(error || "An error occurred");
    }
  };

  useEffect(() => {
    const startMatchmaking = async () => {
      // Wait until user data is loaded
      if (!isDataReady) return;

      await handleJoinQueue();

      const intervalId = setInterval(async () => {
        await handleFindMatch();
      }, 2000);

      return () => {
        clearInterval(intervalId);
        handleLeaveQueue();
      };
    };

    startMatchmaking();

    // Cleanup function
    return () => {
      handleLeaveQueue();
    };
  }, [isDataReady]); // Ensure matchmaking starts only when data is ready

  return (
    <div className="match-container text-white flex relative z-0 items-center justify-center min-h-screen">
      <div className="w-11/12 max-w-5xl mx-auto rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row border border-cyan-400 relative z-10">
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
          <button id="cancel-button" className="cancel-button" onClick={handleLeaveQueue}>
            Cancel Matchmaking
          </button>
        </Link>
      </div>
    </div>
  );
};

export default MatchMaking;

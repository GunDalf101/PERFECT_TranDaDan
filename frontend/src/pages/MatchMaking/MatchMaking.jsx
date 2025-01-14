import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './MatchMaking.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getMyData } from '../../api/authServiceMe';
import { axiosInstance } from '../../api/axiosInstance';

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

const MatchMaking = ({ gameType = "pong" }) => {
  const [opponent, setOpponent] = useState(null);
  const [isSearching, setIsSearching] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [matchFound, setMatchFound] = useState(false);
  const navigate = useNavigate();

  const userDataRef = useRef(null);
  const [searchParams] = useSearchParams();
  const receivedGameType = searchParams.get("gameType") || gameType;

  const userData = {
    username: username || 'Loading...',
    title: 'Jedi Master',
    picture: avatar || '/default_profile.webp'
  };

  const fetchUserData = async () => {
    try {
      const data = await getMyData();
      if (data) {
        userDataRef.current = data;
        setUsername(data.username);
        setIsDataReady(true);
        setAvatar(data.avatar_url);
        console.log("Fetched user data:", userDataRef.current);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchOpponentData = async (opponentUsername) => {
    try {
      const response = await axiosInstance.get(`api/search/?q=${encodeURIComponent(opponentUsername)}`);
      const opponentData = response.data.results.find(user => user.username === opponentUsername);
      
      if (opponentData) {
        setOpponent({
          username: opponentData.username,
          title: 'Opponent',
          picture: opponentData.avatar_url || '/default_profile.webp'
        });
      }
    } catch (error) {
      console.error("Error fetching opponent data:", error);
      setOpponent({
        username: opponentUsername,
        title: 'Opponent',
        picture: '/default_profile.webp'
      });
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!isDataReady || !username) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/matchmaking/?username=${username}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({ type: "find_match", game_type: receivedGameType }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Message received:", data);

      if (data.status === "matched") {
        setMatchFound(true);
        fetchOpponentData(data.opponent);
        setIsSearching(false);

        console.log("Match found:", data);
        const gameSession = {
          gameId: data.game_id,
          username: username,
          opponent: data.opponent,
          isPlayer1: username === data.player1
        };
        localStorage.setItem('gameSession', JSON.stringify(gameSession));

        setTimeout(() => {
          if (receivedGameType === "pong") {
            navigate('/game-lobby/remote-play', {
              state: gameSession
            });
          }
          if (receivedGameType === "space-rivalry") {
            navigate('/game-lobby/remote-rivalry', {
              state: gameSession
            });
          }
        }, 3000);
      } else if (data.status === "searching") {
        console.log("Searching for a match...");
      }
    };

    ws.onclose = (event) => {
      console.log(event);
      if (event.code === 4001) {
        alert("Connection failed: You are already in a game.");
      }
      if (!matchFound) {
        console.log("WebSocket disconnected");
        setIsSearching(false);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsSearching(false);
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isDataReady, username, navigate]);

  const handleLeaveQueue = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("Leaving queue");
      socket.send(JSON.stringify({ type: "cancel_match" }));
      setIsSearching(false);
      socket.close();
    }
    navigate('/game-lobby');
  };

  return (
    <div className="match-container text-white flex relative z-0 items-center justify-center min-h-screen">
      <div className="w-11/12 max-w-5xl mx-auto rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row border border-cyan-400 relative z-10">
        <div className="w-full md:w-1/2 bg-gradient-to-b from-gray-900 to-gray-800 p-6 flex flex-col items-center justify-center border-b md:border-r md:border-b-0 border-gray-700">
          <ProfileCard {...userData} />
        </div>

        <div className="w-full md:w-1/2 bg-gradient-to-b from-gray-900 to-gray-800 p-6 flex flex-col items-center justify-center">
          {isSearching ? (
            <SearchingPlaceholder />
          ) : opponent ? (
            <ProfileCard {...opponent} />
          ) : (
            <div className="text-center text-gray-400">
              No opponent found
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-10 w-full flex justify-center">
        {!matchFound && (
          <button
            className="cancel-button"
            onClick={handleLeaveQueue}
          >
            Cancel Matchmaking
          </button>
        )}
        {matchFound && (
          <div className="text-cyan-400 text-xl animate-pulse">
            Match found! Preparing game...
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchMaking;
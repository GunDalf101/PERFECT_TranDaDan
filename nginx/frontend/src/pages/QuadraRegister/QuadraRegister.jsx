import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Swords } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { myToast } from '../../lib/utils1';

// Fixed PlayerCard with responsive design and static classes
const PlayerCard = ({ player, onUpdate, teamColor, playerNumber }) => {
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        onUpdate({ ...player, image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const isBlueTeam = teamColor === 'blue';
  
  // Pre-compute all classes
  const cardClass = isBlueTeam 
    ? "card bg-gray-900 p-3 sm:p-6 rounded-lg text-center w-full flex flex-col items-center hover-glow border-2 border-cyan-500/50"
    : "card bg-gray-900 p-3 sm:p-6 rounded-lg text-center w-full flex flex-col items-center hover-glow border-2 border-rose-500/50";
  
  const avatarClass = isBlueTeam
    ? "w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 sm:mb-4 bg-gray-800 border-2 border-cyan-500/50"
    : "w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-3 sm:mb-4 bg-gray-800 border-2 border-rose-500/50";
  
  const uploadClass = isBlueTeam
    ? "cursor-pointer hover:text-cyan-400 transition-colors duration-300"
    : "cursor-pointer hover:text-rose-400 transition-colors duration-300";
  
  const inputClass = isBlueTeam
    ? "bg-gray-800 border-cyan-500/30 text-cyan-400 placeholder-cyan-700 focus:border-cyan-400 focus:ring-cyan-400/50 mb-2 w-full"
    : "bg-gray-800 border-rose-500/30 text-rose-400 placeholder-rose-700 focus:border-rose-400 focus:ring-rose-400/50 mb-2 w-full";
  
  const teamClass = isBlueTeam
    ? "text-sm text-cyan-400"
    : "text-sm text-rose-400";

  const teamName = isBlueTeam ? 'BLUE' : 'RED';

  return (
    <div className={cardClass}>
      <div className={avatarClass}>
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Player"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <label className={uploadClass}>
              <Upload className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <div className="text-xs">Upload</div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
      <Input
        type="text"
        placeholder="Enter nickname"
        value={player.nickname || ''}
        onChange={(e) => onUpdate({ ...player, nickname: e.target.value })}
        className={inputClass}
      />
      <div className={teamClass}>
        {teamName} TEAM - Player {playerNumber}
      </div>
    </div>
  );
};

const QuadraRegister = () => {
  const [teams, setTeams] = useState({
    blue: [
      { nickname: '', image: null },
      { nickname: '', image: null }
    ],
    red: [
      { nickname: '', image: null },
      { nickname: '', image: null }
    ]
  });
  const [battleStarted, setBattleStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.winner) {
      setWinner(location.state.winner);
      setBattleStarted(true);
      if (location.state.teams) {
        setTeams(location.state.teams);
      }
    }
  }, [location]);

  const updatePlayer = (team, index, data) => {
    setTeams(prev => ({
      ...prev,
      [team]: prev[team].map((player, i) => i === index ? data : player)
    }));
  };

  const startBattle = () => {
    const allPlayersReady =
      teams.blue.every(player => player.nickname) &&
      teams.red.every(player => player.nickname);

    if (allPlayersReady) {
      const nicknames = [...teams.blue, ...teams.red].map(player => player.nickname);
      const uniqueNicknames = new Set(nicknames);

      if (uniqueNicknames.size !== nicknames.length) {
        myToast(
          1,
          "Each player must have a unique nickname!"
        );
        return;
      }
      setBattleStarted(true);
      navigate('/game-lobby/quadra-mode', {
        state: {
          teams: teams
        }
      });
    }
  };

  const resetBattle = () => {
    setTeams({
      blue: [
        { nickname: '', image: null },
        { nickname: '', image: null }
      ],
      red: [
        { nickname: '', image: null },
        { nickname: '', image: null }
      ]
    });
    setBattleStarted(false);
    setWinner(null);
  };

  const handleTeamWin = (team) => {
    setWinner(team);
  };

  return (
    <div className="min-h-screen bg-opacity-0 flex items-center justify-center p-4 overflow-auto">
      <div className="w-full sm:w-11/12 max-w-6xl mx-auto rounded-lg shadow-lg overflow-hidden border border-cyan-400 relative z-10">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-4 sm:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8">
            <span className="text-cyan-400">BLUE</span>
            <span className="text-white mx-2 sm:mx-4">VS</span>
            <span className="text-rose-400">RED</span>
          </h1>

          {!battleStarted ? (
            <div className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Blue Team */}
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-center text-cyan-400 mb-4 sm:mb-6">BLUE TEAM</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teams.blue.map((player, index) => (
                      <PlayerCard
                        key={`blue-${index}`}
                        player={player}
                        onUpdate={(data) => updatePlayer('blue', index, data)}
                        teamColor="blue"
                        playerNumber={index + 1}
                      />
                    ))}
                  </div>
                </div>

                {/* Red Team */}
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-center text-rose-400 mb-4 sm:mb-6">RED TEAM</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teams.red.map((player, index) => (
                      <PlayerCard
                        key={`red-${index}`}
                        player={player}
                        onUpdate={(data) => updatePlayer('red', index, data)}
                        teamColor="red"
                        playerNumber={index + 1}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={startBattle}
                  disabled={!teams.blue.every(p => p.nickname) || !teams.red.every(p => p.nickname)}
                  className="cancel-button disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg py-2 sm:py-3 px-4 sm:px-6"
                >
                  Start Battle
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Battle Display */}
                <div className="card bg-gray-900/50 p-4 sm:p-6 text-center">
                  <h3 className="text-cyan-400 text-lg sm:text-xl mb-3 sm:mb-4">BLUE TEAM</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {teams.blue.map((player, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 justify-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-800">
                          {player.image && (
                            <img src={player.image} alt={player.nickname} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className="text-cyan-400 text-xs sm:text-sm">{player.nickname}</span>
                      </div>
                    ))}
                  </div>
                  {!winner && (
                    <button
                      onClick={() => handleTeamWin('blue')}
                      className="cancel-button mt-2 sm:mt-4 py-1 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm"
                    >
                      Victory!
                    </button>
                  )}
                </div>

                <div className="card bg-gray-900/50 p-4 sm:p-6 text-center">
                  <h3 className="text-rose-400 text-lg sm:text-xl mb-3 sm:mb-4">RED TEAM</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {teams.red.map((player, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 justify-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-800">
                          {player.image && (
                            <img src={player.image} alt={player.nickname} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className="text-rose-400 text-xs sm:text-sm">{player.nickname}</span>
                      </div>
                    ))}
                  </div>
                  {!winner && (
                    <button
                      onClick={() => handleTeamWin('red')}
                      className="cancel-button mt-2 sm:mt-4 py-1 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm border-rose-400 text-rose-400"
                    >
                      Victory!
                    </button>
                  )}
                </div>
              </div>

              {winner && (
                <div className="text-center">
                  <div className="card bg-gray-900/50 p-4 sm:p-6 inline-block">
                    <Swords className={`w-12 h-12 sm:w-16 sm:h-16 ${winner === 'blue' ? 'text-cyan-400' : 'text-rose-400'} mx-auto mb-3 sm:mb-4`} />
                    <div className={`text-xl sm:text-2xl font-bold ${winner === 'blue' ? 'text-cyan-400' : 'text-rose-400'} animate-pulse`}>
                      {winner.toUpperCase()} TEAM WINS!
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center pt-4">
                <button
                  onClick={resetBattle}
                  className="cancel-button text-base sm:text-lg py-2 sm:py-3 px-4 sm:px-6"
                >
                  New Battle
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes zoomIn {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }

        .card {
          transform: scale(0.95);
          animation: cardTransition 1s ease-out forwards;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.4), 0 0 30px rgba(0, 255, 255, 0.6);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        @keyframes cardTransition {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .hover-glow:hover {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.8), 0 0 50px rgba(0, 255, 255, 0.8);
        }

        .cancel-button {
          padding: 10px 20px;
          background-color: transparent;
          color: #00f9ff;
          font-size: 16px;
          border: 2px solid #00f9ff;
          border-radius: 12px;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.6), 0 0 15px rgba(0, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
        }

        .cancel-button:hover {
          background-color: rgba(0, 255, 255, 0.1);
          box-shadow: 0 0 20px rgba(0, 255, 255, 1), 0 0 25px rgba(0, 255, 255, 1);
        }

        .cancel-button:focus {
          outline: none;
        }

        @media (max-width: 640px) {
          .cancel-button {
            padding: 8px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default QuadraRegister;
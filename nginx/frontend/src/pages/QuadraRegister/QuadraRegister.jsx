import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Swords } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { myToast } from '../../lib/utils1';

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
  const baseColor = isBlueTeam ? 'cyan' : 'rose';
  const teamName = isBlueTeam ? 'BLUE' : 'RED';

  return (
    <div className={`card bg-gray-900 p-6 rounded-lg text-center w-full flex flex-col items-center hover-glow
      border-2 border-${baseColor}-500/50`}>
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-4 bg-gray-800
        border-2 border-${baseColor}-500/50">
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Player"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <label className={`cursor-pointer hover:text-${baseColor}-400 transition-colors duration-300`}>
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
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
        className={`bg-gray-800 border-${baseColor}-500/30 text-${baseColor}-400 placeholder-${baseColor}-700
          focus:border-${baseColor}-400 focus:ring-${baseColor}-400/50 mb-2 max-w-[200px]`}
      />
      <div className={`text-sm text-${baseColor}-400`}>
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
    <div className="match-container min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-11/12 max-w-6xl mx-auto rounded-lg shadow-lg overflow-hidden border border-cyan-400 relative z-10">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-4 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            <span className="text-cyan-400">BLUE</span>
            <span className="text-white mx-4">VS</span>
            <span className="text-rose-400">RED</span>
          </h1>

          {!battleStarted ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Blue Team */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-center text-cyan-400 mb-6">BLUE TEAM</h2>
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
                  <h2 className="text-2xl font-bold text-center text-rose-400 mb-6">RED TEAM</h2>
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

              <div className="text-center">
                <button
                  onClick={startBattle}
                  disabled={!teams.blue.every(p => p.nickname) || !teams.red.every(p => p.nickname)}
                  className="cancel-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Battle
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Battle Display */}
                <div className="card bg-gray-900/50 p-6 text-center">
                  <h3 className="text-cyan-400 text-xl mb-4">BLUE TEAM</h3>
                  {teams.blue.map((player, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2 justify-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                        {player.image && (
                          <img src={player.image} alt={player.nickname} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="text-cyan-400">{player.nickname}</span>
                    </div>
                  ))}
                  {!winner && (
                    <button
                      onClick={() => handleTeamWin('blue')}
                      className="cancel-button mt-4 py-2 px-4 text-sm"
                    >
                      Victory!
                    </button>
                  )}
                </div>

                <div className="card bg-gray-900/50 p-6 text-center">
                  <h3 className="text-rose-400 text-xl mb-4">RED TEAM</h3>
                  {teams.red.map((player, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2 justify-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                        {player.image && (
                          <img src={player.image} alt={player.nickname} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="text-rose-400">{player.nickname}</span>
                    </div>
                  ))}
                  {!winner && (
                    <button
                      onClick={() => handleTeamWin('red')}
                      className="cancel-button mt-4 py-2 px-4 text-sm border-rose-400 text-rose-400"
                    >
                      Victory!
                    </button>
                  )}
                </div>
              </div>

              {winner && (
                <div className="text-center">
                  <div className="card bg-gray-900/50 p-6 inline-block">
                    <Swords className={`w-16 h-16 ${winner === 'blue' ? 'text-cyan-400' : 'text-rose-400'} mx-auto mb-4`} />
                    <div className={`text-2xl font-bold ${winner === 'blue' ? 'text-cyan-400' : 'text-rose-400'} animate-pulse`}>
                      {winner.toUpperCase()} TEAM WINS!
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={resetBattle}
                  className="cancel-button"
                >
                  New Battle
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .match-container {
          overflow: hidden;
          animation: zoomIn 2s ease-in-out forwards;
          background: radial-gradient(circle at center, rgba(0, 249, 255, 0.1) 0%, transparent 70%);
        }

        @keyframes zoomIn {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }

        .card {
          transform: scale(0.5);
          animation: cardTransition 1s ease-out forwards;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.4), 0 0 30px rgba(0, 255, 255, 0.6);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        @keyframes cardTransition {
          0% {
            opacity: 0;
            transform: scale(0.5);
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
          padding: 12px 24px;
          background-color: transparent;
          color: #00f9ff;
          font-size: 18px;
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
      `}</style>
    </div>
  );
};

export default QuadraRegister;
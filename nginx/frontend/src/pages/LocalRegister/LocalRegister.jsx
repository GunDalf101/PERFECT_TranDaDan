import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Swords, Trophy } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { myToast } from '../../lib/utils1';

// Fixed PlayerCard component with responsive styling
const PlayerCard = ({ player, onUpdate, side }) => {
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

  const isLeftSide = side === 'left';
  // Pre-compute all classes instead of using dynamic string interpolation
  const cardClass = isLeftSide 
    ? "card bg-gray-900/80 p-4 sm:p-6 rounded-lg w-full hover-glow border-2 border-cyan-500/50"
    : "card bg-gray-900/80 p-4 sm:p-6 rounded-lg w-full hover-glow border-2 border-rose-500/50";
  
  const avatarClass = isLeftSide
    ? "w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden bg-gray-800 border-2 border-cyan-500/50"
    : "w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden bg-gray-800 border-2 border-rose-500/50";
  
  const uploadClass = isLeftSide
    ? "cursor-pointer hover:text-cyan-400 transition-colors duration-300"
    : "cursor-pointer hover:text-rose-400 transition-colors duration-300";
  
  const inputClass = isLeftSide
    ? "bg-gray-800 border-cyan-500/30 text-cyan-400 placeholder-cyan-700 focus:border-cyan-400 focus:ring-cyan-400/50 max-w-full sm:max-w-[200px] mx-auto"
    : "bg-gray-800 border-rose-500/30 text-rose-400 placeholder-rose-700 focus:border-rose-400 focus:ring-rose-400/50 max-w-full sm:max-w-[200px] mx-auto";
  
  const labelClass = isLeftSide
    ? "text-sm text-cyan-400 font-bold"
    : "text-sm text-rose-400 font-bold";

  return (
    <div className={cardClass}>
      <div className="text-center space-y-3 sm:space-y-4">
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
          className={inputClass}
        />

        <div className={labelClass}>
          PLAYER {isLeftSide ? '1' : '2'}
        </div>
      </div>
    </div>
  );
};

const LocalRegister = () => {
  const [players, setPlayers] = useState({
    left: { nickname: '', image: null },
    right: { nickname: '', image: null }
  });
  const [battleStarted, setBattleStarted] = useState(false);
  const [winner, setWinner] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const updatePlayer = (side, data) => {
    setPlayers(prev => ({
      ...prev,
      [side]: data
    }));
  };

  useEffect(() => {
    if (location.state?.winner) {
      setWinner(location.state.winner);
      setBattleStarted(true);
      setPlayers({
        left: {
          nickname: location.state.player1Name,
          image: location.state.player1Image
        },
        right: {
          nickname: location.state.player2Name,
          image: location.state.player2Image
        }
      });
    }
  }, [location]);

  const startBattle = () => {
    if (players.left.nickname && players.right.nickname) {
      const nicknames = [players.left.nickname, players.right.nickname];
      const uniqueNicknames = new Set(nicknames);

      if (uniqueNicknames.size !== nicknames.length) {
        myToast(1, "Each player must have a unique nickname!");
        return;
      }
      setBattleStarted(true);
      navigate('/game-lobby/local-mode', {
        state: {
          player1Name: players.left.nickname,
          player2Name: players.right.nickname,
          player1Image: players.left.image,
          player2Image: players.right.image
        },
      });
    }
  };

  const handleWin = (side) => {
    setWinner(side);
  };

  const resetBattle = () => {
    setPlayers({
      left: { nickname: '', image: null },
      right: { nickname: '', image: null }
    });
    setBattleStarted(false);
    setWinner(null);
  };

  return (
    <div className="min-h-screen bg-opacity-0 flex items-center justify-center p-4 overflow-auto">
      <div className="w-full sm:w-11/12 max-w-4xl mx-auto rounded-lg shadow-lg overflow-hidden border border-cyan-400 relative z-10">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-4 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12">
            <span className="text-cyan-400">1</span>
            <span className="text-white mx-2 sm:mx-4">VS</span>
            <span className="text-rose-400">1</span>
          </h1>

          {!battleStarted ? (
            <div className="space-y-6 sm:space-y-8">
              {/* Player Selection - Responsive Layout */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 md:gap-16">
                {/* Left Player */}
                <div className="w-full sm:w-auto max-w-xs">
                  <PlayerCard
                    player={players.left}
                    onUpdate={(data) => updatePlayer('left', data)}
                    side="left"
                  />
                </div>

                {/* VS Divider */}
                <div className="py-2 sm:py-0">
                  <div className="text-3xl sm:text-4xl font-bold text-yellow-400 animate-pulse">VS</div>
                </div>

                {/* Right Player */}
                <div className="w-full sm:w-auto max-w-xs">
                  <PlayerCard
                    player={players.right}
                    onUpdate={(data) => updatePlayer('right', data)}
                    side="right"
                  />
                </div>
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={startBattle}
                  disabled={!players.left.nickname || !players.right.nickname}
                  className="cancel-button disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg py-2 sm:py-3 px-4 sm:px-6"
                >
                  Start Battle
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Battle Display - More Responsive */}
              {!winner ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                  {/* Left Player Battle Card */}
                  <div className="card bg-gray-900/50 p-4 sm:p-6 text-center w-full sm:w-auto">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full overflow-hidden mb-3 sm:mb-4">
                      {players.left.image && (
                        <img src={players.left.image} alt={players.left.nickname} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="text-cyan-400 text-lg sm:text-xl mb-3 sm:mb-4">{players.left.nickname}</div>
                    <button
                      onClick={() => handleWin('left')}
                      className="cancel-button py-1 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm"
                    >
                      Victory!
                    </button>
                  </div>

                  <div className="text-xl sm:text-2xl font-bold text-yellow-400 py-2 sm:py-0">VS</div>

                  {/* Right Player Battle Card */}
                  <div className="card bg-gray-900/50 p-4 sm:p-6 text-center w-full sm:w-auto">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full overflow-hidden mb-3 sm:mb-4">
                      {players.right.image && (
                        <img src={players.right.image} alt={players.right.nickname} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="text-rose-400 text-lg sm:text-xl mb-3 sm:mb-4">{players.right.nickname}</div>
                    <button
                      onClick={() => handleWin('right')}
                      className="cancel-button py-1 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm border-rose-400 text-rose-400"
                    >
                      Victory!
                    </button>
                  </div>
                </div>
              ) : (
                // Winner Display
                <div className="text-center">
                  <div className="card bg-gray-900/50 p-4 sm:p-6 inline-block">
                    <Trophy className={`w-12 h-12 sm:w-16 sm:h-16 ${winner === 'left' ? 'text-cyan-400' : 'text-rose-400'} mx-auto mb-3 sm:mb-4`} />
                    <div className={`text-xl sm:text-2xl font-bold ${winner === 'left' ? 'text-cyan-400' : 'text-rose-400'} animate-pulse`}>
                      {players[winner].nickname} WINS!
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

export default LocalRegister;
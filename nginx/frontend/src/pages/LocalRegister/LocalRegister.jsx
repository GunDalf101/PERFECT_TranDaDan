import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Swords, Trophy } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { myToast } from '../../lib/utils1';

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
  const colors = isLeftSide ? {
    primary: 'cyan',
    accent: 'blue'
  } : {
    primary: 'rose',
    accent: 'red'
  };

  return (
    <div className={`card bg-gray-900/80 p-6 rounded-lg w-full max-w-xs hover-glow
      border-2 border-${colors.primary}-500/50`}>
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-800
          border-2 border-${colors.primary}-500/50">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Player"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <label className={`cursor-pointer hover:text-${colors.primary}-400 transition-colors duration-300`}>
                <Upload className="w-8 h-8 mb-1" />
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
          className={`bg-gray-800 border-${colors.primary}-500/30 text-${colors.primary}-400 
            placeholder-${colors.primary}-700 focus:border-${colors.primary}-400 
            focus:ring-${colors.primary}-400/50 max-w-[200px] mx-auto`}
        />

        <div className={`text-sm text-${colors.primary}-400 font-bold`}>
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
    <div className="match-container min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-11/12 max-w-4xl mx-auto rounded-lg shadow-lg overflow-hidden border border-cyan-400 relative z-10">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-4 sm:p-8">
          <h1 className="text-4xl font-bold text-center mb-12">
            <span className="text-cyan-400">1</span>
            <span className="text-white mx-4">VS</span>
            <span className="text-rose-400">1</span>
          </h1>

          {!battleStarted ? (
            <div className="space-y-8">
              {/* Player Selection */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                {/* Left Player */}
                <PlayerCard
                  player={players.left}
                  onUpdate={(data) => updatePlayer('left', data)}
                  side="left"
                />

                {/* VS Divider */}
                <div className="relative">
                  <div className="text-4xl font-bold text-yellow-400 animate-pulse">VS</div>
                </div>

                {/* Right Player */}
                <PlayerCard
                  player={players.right}
                  onUpdate={(data) => updatePlayer('right', data)}
                  side="right"
                />
              </div>

              <div className="text-center">
                <button
                  onClick={startBattle}
                  disabled={!players.left.nickname || !players.right.nickname}
                  className="cancel-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Battle
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Battle Display */}
              {!winner ? (
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  {/* Left Player Battle Card */}
                  <div className="card bg-gray-900/50 p-6 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-4">
                      {players.left.image && (
                        <img src={players.left.image} alt={players.left.nickname} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="text-cyan-400 text-xl mb-4">{players.left.nickname}</div>
                    <button
                      onClick={() => handleWin('left')}
                      className="cancel-button py-2 px-4 text-sm"
                    >
                      Victory!
                    </button>
                  </div>

                  <div className="text-2xl font-bold text-yellow-400">VS</div>

                  {/* Right Player Battle Card */}
                  <div className="card bg-gray-900/50 p-6 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-4">
                      {players.right.image && (
                        <img src={players.right.image} alt={players.right.nickname} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="text-rose-400 text-xl mb-4">{players.right.nickname}</div>
                    <button
                      onClick={() => handleWin('right')}
                      className="cancel-button py-2 px-4 text-sm border-rose-400 text-rose-400"
                    >
                      Victory!
                    </button>
                  </div>
                </div>
              ) : (
                // Winner Display
                <div className="text-center">
                  <div className="card bg-gray-900/50 p-6 inline-block">
                    <Trophy className={`w-16 h-16 ${winner === 'left' ? 'text-cyan-400' : 'text-rose-400'} mx-auto mb-4`} />
                    <div className={`text-2xl font-bold ${winner === 'left' ? 'text-cyan-400' : 'text-rose-400'} animate-pulse`}>
                      {players[winner].nickname} WINS!
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

export default LocalRegister;
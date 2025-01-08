import React, { useState } from 'react';
// import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Trophy } from 'lucide-react';

const PlayerCard = ({ player, onUpdate, index }) => {
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

  return (
    <div className="card bg-gray-900 p-6 rounded-lg text-center w-full flex flex-col items-center hover-glow">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-4 bg-gray-800">
        {imagePreview ? (
          <img 
            src={imagePreview} 
            alt="Player" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <label className="cursor-pointer hover:text-cyan-400 transition-colors duration-300">
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
        className="bg-gray-800 border-cyan-500/30 text-cyan-400 placeholder-cyan-700
          focus:border-cyan-400 focus:ring-cyan-400/50 mb-2 max-w-[200px]"
      />
      <div className="text-sm text-cyan-400">Player {index + 1}</div>
    </div>
  );
};

const TournamentBracket = () => {
  const [players, setPlayers] = useState([
    { nickname: '', image: null },
    { nickname: '', image: null },
    { nickname: '', image: null },
    { nickname: '', image: null }
  ]);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [round1Matches, setRound1Matches] = useState([]);
  const [finalMatch, setFinalMatch] = useState(null);
  const [winner, setWinner] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);

  // Tournament logic remains the same
  const updatePlayer = (index, data) => {
    const newPlayers = [...players];
    newPlayers[index] = data;
    setPlayers(newPlayers);
  };

  const startTournament = () => {
    if (players.every(player => player.nickname)) {
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
      setRound1Matches([
        [shuffledPlayers[0], shuffledPlayers[1]],
        [shuffledPlayers[2], shuffledPlayers[3]]
      ]);
      setCurrentMatch(0);
      setTournamentStarted(true);
    }
  };

  const handleWin = (winner) => {
    if (currentMatch === 0 || currentMatch === 1) {
      if (!finalMatch) {
        setFinalMatch([winner]);
        setCurrentMatch(currentMatch + 1);
      } else {
        setFinalMatch([...finalMatch, winner]);
        setCurrentMatch(2);
      }
    } else {
      setWinner(winner);
      setCurrentMatch(null);
    }
  };

  const resetTournament = () => {
    setPlayers(players.map(p => ({ ...p, nickname: '' })));
    setTournamentStarted(false);
    setRound1Matches([]);
    setFinalMatch(null);
    setWinner(null);
    setCurrentMatch(null);
  };

  return (
    <div className="match-container min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-11/12 max-w-4xl mx-auto rounded-lg shadow-lg overflow-hidden border border-cyan-400 relative z-10">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-4 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-cyan-400">Tournament Bracket</h1>

          {!tournamentStarted ? (
            <div className="space-y-8">
              {/* Player Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {players.slice(0, 2).map((player, index) => (
                    <PlayerCard
                      key={index}
                      player={player}
                      onUpdate={(data) => updatePlayer(index, data)}
                      index={index}
                    />
                  ))}
                </div>
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {players.slice(2, 4).map((player, index) => (
                    <PlayerCard
                      key={index + 2}
                      player={player}
                      onUpdate={(data) => updatePlayer(index + 2, data)}
                      index={index + 2}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={startTournament}
                  disabled={!players.every(player => player.nickname)}
                  className="cancel-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Tournament
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Tournament Bracket Display */}
              <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {round1Matches.map((match, index) => (
                    <div key={index} className="card bg-gray-900 p-4 rounded-lg">
                      <h3 className="text-cyan-400 text-center mb-4">Match {index + 1}</h3>
                      {match.map((player, playerIndex) => (
                        <div key={playerIndex} 
                          className="flex justify-between items-center mb-2 p-2 border border-cyan-500/30 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                              {player.image && (
                                <img src={player.image} alt={player.nickname} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <span className="text-cyan-400 text-sm">{player.nickname}</span>
                          </div>
                          {currentMatch === index && (
                            <button
                              onClick={() => handleWin(player)}
                              className="cancel-button py-1 px-3 text-xs"
                            >
                              Win
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {finalMatch && finalMatch.length === 2 && (
                  <div className="card bg-gray-900 p-4 rounded-lg max-w-md mx-auto">
                    <h3 className="text-cyan-400 text-center mb-4">Finals</h3>
                    {finalMatch.map((player, index) => (
                      <div key={index} 
                        className="flex justify-between items-center mb-2 p-2 border border-cyan-500/30 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                            {player.image && (
                              <img src={player.image} alt={player.nickname} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="text-cyan-400 text-sm">{player.nickname}</span>
                        </div>
                        {currentMatch === 2 && (
                          <button
                            onClick={() => handleWin(player)}
                            className="cancel-button py-1 px-3 text-xs"
                          >
                            Win
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {winner && (
                  <div className="card bg-gray-900 p-6 text-center max-w-md mx-auto">
                    <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 mx-auto mb-4" />
                    <div className="text-xl sm:text-2xl font-bold text-cyan-400 animate-pulse">
                      {winner.nickname} Wins!
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <button
                    onClick={resetTournament}
                    className="cancel-button"
                  >
                    New Tournament
                  </button>
                </div>
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

export default TournamentBracket;
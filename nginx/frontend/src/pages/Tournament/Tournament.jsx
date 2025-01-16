import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Upload, Trophy } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { myToast } from '../../lib/utils1';

const PlayerCard = ({ player, onUpdate, index }) => {
    const [imagePreview, setImagePreview] = useState(null);

    const handleImageUpload = (event) => {
        let file = event.target.files[0];

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
                {imagePreview || player.image ? (
                    <img
                        src={imagePreview || player.image}
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
    const navigate = useNavigate();
    const location = useLocation();

    const [players, setPlayers] = useState(() => {
        const saved = localStorage.getItem('tournamentPlayers');
        return saved ? JSON.parse(saved) : [
            { nickname: '', image: null },
            { nickname: '', image: null },
            { nickname: '', image: null },
            { nickname: '', image: null }
        ];
    });

    const [tournamentStarted, setTournamentStarted] = useState(() => {
        return localStorage.getItem('tournamentStarted') === 'true';
    });

    const [round1Matches, setRound1Matches] = useState(() => {
        const saved = localStorage.getItem('round1Matches');
        return saved ? JSON.parse(saved) : [];
    });

    const [finalMatch, setFinalMatch] = useState(() => {
        const saved = localStorage.getItem('finalMatch');
        return saved ? JSON.parse(saved) : null;
    });

    const [winner, setWinner] = useState(() => {
        const saved = localStorage.getItem('tournamentWinner');
        return saved ? JSON.parse(saved) : null;
    });

    const [currentMatch, setCurrentMatch] = useState(() => {
        return parseInt(localStorage.getItem('currentMatch')) || null;
    });

    const [nextMatchAvailable, setNextMatchAvailable] = useState(false);

    useEffect(() => {
        localStorage.setItem('tournamentPlayers', JSON.stringify(players));
        localStorage.setItem('tournamentStarted', tournamentStarted);
        localStorage.setItem('round1Matches', JSON.stringify(round1Matches));
        localStorage.setItem('finalMatch', JSON.stringify(finalMatch));
        localStorage.setItem('tournamentWinner', JSON.stringify(winner));
        localStorage.setItem('currentMatch', currentMatch);
    }, [players, tournamentStarted, round1Matches, finalMatch, winner, currentMatch]);

    useEffect(() => {
        if (location.state?.matchWinner) {
            const winner = location.state.matchWinner;
            const matchIndex = location.state.matchIndex;

            if (finalMatch && finalMatch.includes(winner)) {
                return;
            }
            if (!finalMatch) {
                setFinalMatch([winner]);
                setCurrentMatch(matchIndex === 0 ? 1 : 0);
                setNextMatchAvailable(true);

                localStorage.setItem('finalMatch', JSON.stringify([winner]));
                localStorage.setItem('currentMatch', String(matchIndex === 0 ? 1 : 0));
            } else if (finalMatch.length === 1) {
                const updatedFinalMatch = [...finalMatch, winner];
                setFinalMatch(updatedFinalMatch);
                setCurrentMatch(2);
                setNextMatchAvailable(true);

                localStorage.setItem('finalMatch', JSON.stringify(updatedFinalMatch));
                localStorage.setItem('currentMatch', '2');
            } else if (finalMatch.length === 2) {
                setWinner(winner);
                setNextMatchAvailable(false);
                localStorage.setItem('tournamentWinner', JSON.stringify(winner));
            }
        }
    }, [location.state, finalMatch]);

    const updatePlayer = (index, data) => {
        const newPlayers = [...players];
        newPlayers[index] = data;
        setPlayers(newPlayers);
    };

    const startTournament = () => {
        if (players.every(player => player.nickname)) {
            const nicknames = players.map(player => player.nickname);
            const uniqueNicknames = new Set(nicknames);
    
            if (uniqueNicknames.size !== nicknames.length) {
                myToast(1, "Each player must have a unique nickname!");
                return;
            }
            const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
            const newRound1Matches = [
                [shuffledPlayers[0], shuffledPlayers[1]],
                [shuffledPlayers[2], shuffledPlayers[3]]
            ];

            setRound1Matches(newRound1Matches);
            setCurrentMatch(0);
            setTournamentStarted(true);
            setNextMatchAvailable(true);

            localStorage.setItem('round1Matches', JSON.stringify(newRound1Matches));
            localStorage.setItem('currentMatch', '0');
            localStorage.setItem('tournamentStarted', 'true');
        }
    };

    const startNextMatch = () => {
        if (!finalMatch) {
            navigateToMatch([0, 1]);
        } else if (finalMatch.length === 1) {
            navigateToMatch([2, 3]);
        } else if (finalMatch.length === 2) {
            startFinalMatch();
        }
        setNextMatchAvailable(false);
    };

    const navigateToMatch = (matchPlayers) => {
        navigate('/game-lobby/tournament-mode', {
            state: {
                currentMatch: matchPlayers,
                players: players,
                tournamentState: {
                    round1Matches,
                    finalMatch,
                    currentMatch
                }
            }
        });
    };

    const startFinalMatch = () => {
        navigate('/game-lobby/tournament-mode', {
            state: {
                currentMatch: [0, 1],
                players: finalMatch,
                tournamentState: {
                    round1Matches,
                    finalMatch,
                    currentMatch
                }
            }
        });
    };

    const resetTournament = () => {
        localStorage.removeItem('tournamentPlayers');
        localStorage.removeItem('tournamentStarted');
        localStorage.removeItem('round1Matches');
        localStorage.removeItem('finalMatch');
        localStorage.removeItem('tournamentWinner');
        localStorage.removeItem('currentMatch');

        setPlayers([
            { nickname: '', image: null },
            { nickname: '', image: null },
            { nickname: '', image: null },
            { nickname: '', image: null }
        ]);
        setTournamentStarted(false);
        setRound1Matches([]);
        setFinalMatch(null);
        setWinner(null);
        setCurrentMatch(null);
        setNextMatchAvailable(false);
        navigate('', { replace: true, state: null });
    };

    return (
        <div className="match-container min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-11/12 max-w-4xl mx-auto rounded-lg shadow-lg overflow-hidden border border-cyan-400 relative z-10">
                <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-4 sm:p-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-cyan-400">Tournament Bracket</h1>

                    {!tournamentStarted ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
                                {players.map((player, index) => (
                                    <PlayerCard
                                        key={index}
                                        player={player}
                                        onUpdate={(data) => updatePlayer(index, data)}
                                        index={index}
                                    />
                                ))}
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
                            <div className="grid grid-cols-2 gap-8">
                                {round1Matches.map((match, index) => (
                                    <div key={index} className="card bg-gray-900 p-4 rounded-lg">
                                        <h3 className="text-cyan-400 text-center mb-4">Semi-Final {index + 1}</h3>
                                        {match.map((player, playerIndex) => (
                                            <div key={playerIndex}
                                                className="flex justify-between items-center mb-2 p-2 border border-cyan-500/30 rounded">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                                                        {player.image && (
                                                            <img src={player.image} alt={player.nickname}
                                                                className="w-full h-full object-cover" />
                                                        )}
                                                    </div>
                                                    <span className="text-cyan-400 text-sm">{player.nickname}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {finalMatch?.some(p => p.nickname === match[0].nickname || p.nickname === match[1].nickname) && (
                                            <div className="mt-2 text-center">
                                                <span className="text-cyan-400">
                                                    Winner: {finalMatch.find(p => p.nickname === match[0].nickname || p.nickname === match[1].nickname)?.nickname}
                                                </span>
                                            </div>
                                        )}
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
                                                        <img src={player.image} alt={player.nickname}
                                                            className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <span className="text-cyan-400 text-sm">{player.nickname}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {winner && (
                                        <div className="mt-4 text-center space-y-4">
                                            <Trophy className="w-12 h-12 text-cyan-400 mx-auto" />
                                            <div className="text-xl font-bold text-cyan-400 animate-pulse">
                                                Tournament Winner: {winner.nickname}!
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tournament Controls */}
                            <div className="text-center space-x-4">
                                {nextMatchAvailable && !winner && (
                                    <button
                                        onClick={startNextMatch}
                                        className="cancel-button"
                                    >
                                        Start Next Match
                                    </button>
                                )}
                                <button
                                    onClick={resetTournament}
                                    className="cancel-button"
                                >
                                    New Tournament
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

export default TournamentBracket;

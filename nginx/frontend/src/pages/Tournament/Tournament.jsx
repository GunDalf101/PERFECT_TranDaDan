import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import PlayerCard from './PlayerCard';
import { useUser } from '../../components/auth/UserContext';
import { myToast } from '../../lib/utils1';

const TournamentBracket = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { tournamentState, updateTournamentState } = useTournament();
    const { user } = useUser();
    const userData = JSON.parse(user);

    useEffect(() => {
        if (location.state?.matchWinner) {
            const { matchWinner, matchIndex } = location.state;
            
            if (!tournamentState.finalMatch) {
                updateTournamentState({
                    finalMatch: [matchWinner]
                });
            } else if (tournamentState.finalMatch.length === 1) {
                updateTournamentState({
                    finalMatch: [...tournamentState.finalMatch, matchWinner]
                });
            } else if (tournamentState.finalMatch.length === 2) {
                updateTournamentState({
                    winner: matchWinner
                });
            }
        }
    }, [location.state]);

    const updatePlayer = (index, data) => {
        const newPlayers = [...tournamentState.players];
        newPlayers[index] = data;
        updateTournamentState({ players: newPlayers });
    };

    const startTournament = () => {
        if (!tournamentState.players.every((player, i) => i === 0 || player.nickname)) {
            myToast(1, "All players must have nicknames!");
            return;
        }

        const nicknames = tournamentState.players.map(player => player.nickname);
        if (new Set(nicknames).size !== nicknames.length) {
            myToast(1, "Each player must have a unique nickname!");
            return;
        }

        const newRound1Matches = [
            [tournamentState.players[0], tournamentState.players[1]],
            [tournamentState.players[2], tournamentState.players[3]]
        ];

        updateTournamentState({
            round1Matches: newRound1Matches,
            currentMatch: 0,
            tournamentStarted: true
        });
    };

    const startNextMatch = () => {
        const { finalMatch } = tournamentState;
        
        if (!finalMatch) {
            navigateToMatch([0, 1]);
        } else if (finalMatch.length === 1) {
            navigateToMatch([2, 3]);
        } else if (finalMatch.length === 2) {
            startFinalMatch();
        }
    };

    const navigateToMatch = (matchPlayers) => {
        navigate('/game-lobby/tournament-mode', {
            state: {
                matchPlayers,
                players: tournamentState.players,
                tournamentState
            }
        });
    };

    const startFinalMatch = () => {
        navigate('/game-lobby/tournament-mode', {
            state: {
                matchPlayers: [0, 1],
                players: tournamentState.finalMatch,
                tournamentState
            }
        });
    };

    const resetTournament = () => {
        updateTournamentState({
            players: [
                { 
                    nickname: userData?.tournament_alias || '', 
                    image: userData?.avatar_url 
                },
                { nickname: '', image: null },
                { nickname: '', image: null },
                { nickname: '', image: null }
            ],
            round1Matches: [],
            finalMatch: null,
            currentMatch: null,
            winner: null,
            tournamentStarted: false
        });
        navigate('', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-11/12 max-w-4xl mx-auto rounded-lg shadow-lg overflow-hidden border border-cyan-400">
                <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-4 sm:p-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-cyan-400">
                        Tournament Bracket
                    </h1>

                    {!tournamentState.tournamentStarted ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
                                {tournamentState.players.map((player, index) => (
                                    <PlayerCard
                                        key={index}
                                        player={player}
                                        onUpdate={(data) => updatePlayer(index, data)}
                                        index={index}
                                        isDisabled={index === 0}
                                    />
                                ))}
                            </div>
                            <div className="text-center">
                                <button
                                    onClick={startTournament}
                                    className="cancel-button"
                                    disabled={!tournamentState.players.every((player, i) => i === 0 || player.nickname)}
                                >
                                    Start Tournament
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                {tournamentState.round1Matches.map((match, index) => (
                                    <div key={index} className="card bg-gray-900 p-4 rounded-lg">
                                        <h3 className="text-cyan-400 text-center mb-4">
                                            Semi-Final {index + 1}
                                        </h3>
                                        {match.map((player, playerIndex) => (
                                            <div key={playerIndex} className="flex justify-between items-center mb-2 p-2 border border-cyan-500/30 rounded">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                                                        {player.image && (
                                                            <img
                                                                src={player.image}
                                                                alt={player.nickname}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="text-cyan-400 text-sm">
                                                        {player.nickname}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {tournamentState.finalMatch?.some(p => 
                                            p.nickname === match[0].nickname || p.nickname === match[1].nickname
                                        ) && (
                                            <div className="mt-2 text-center">
                                                <span className="text-cyan-400">
                                                    Winner: {tournamentState.finalMatch.find(p => 
                                                        p.nickname === match[0].nickname || p.nickname === match[1].nickname
                                                    )?.nickname}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {tournamentState.finalMatch?.length === 2 && (
                                <div className="card bg-gray-900 p-4 rounded-lg max-w-md mx-auto">
                                    <h3 className="text-cyan-400 text-center mb-4">Finals</h3>
                                    {tournamentState.finalMatch.map((player, index) => (
                                        <div key={index} className="flex justify-between items-center mb-2 p-2 border border-cyan-500/30 rounded">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                                                    {player.image && (
                                                        <img
                                                            src={player.image}
                                                            alt={player.nickname}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <span className="text-cyan-400 text-sm">
                                                    {player.nickname}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {tournamentState.winner && (
                                        <div className="mt-4 text-center space-y-4">
                                            <Trophy className="w-12 h-12 text-cyan-400 mx-auto" />
                                            <div className="text-xl font-bold text-cyan-400 animate-pulse">
                                                Tournament Winner: {tournamentState.winner.nickname}!
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="text-center space-x-4">
                                {!tournamentState.winner && (
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
        </div>
    );
};

export default TournamentBracket;
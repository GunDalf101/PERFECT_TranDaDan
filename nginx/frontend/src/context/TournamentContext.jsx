import React, { createContext, useContext, useState } from 'react';
import { useUser } from '../components/auth/UserContext';

const TournamentContext = createContext();

export const TournamentProvider = ({ children }) => {
    const { user } = useUser();
    const userData = JSON.parse(user);

    const [tournamentState, setTournamentState] = useState({
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

    const updateTournamentState = (newState) => {
        setTournamentState(prev => ({
            ...prev,
            ...newState
        }));
    };

    return (
        <TournamentContext.Provider value={{ tournamentState, updateTournamentState }}>
            {children}
        </TournamentContext.Provider>
    );
};

export const useTournament = () => {
    const context = useContext(TournamentContext);
    if (!context) {
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    return context;
};

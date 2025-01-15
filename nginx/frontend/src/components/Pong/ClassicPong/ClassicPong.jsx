import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { env } from '../../../config/env';
import { useNavigate } from 'react-router-dom';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;

const ClassicPong = () => {
  const [gameState, setGameState] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [winner, setWinner] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [userAvatar, setUserAvatar] = useState('/default_profile.webp');
  const [opponentAvatar, setOpponentAvatar] = useState('/default_profile.webp');

  const navigate = useNavigate();
  const wsRef = useRef(null);
  const cleanupRef = useRef(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 1;

  const [keys, setKeys] = useState({
    up: false,
    down: false
  });

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('gameSession'));
    if (!session) {
      navigate('/game-lobby');
      return;
    }
    setGameSession(session);
  }, []);

  useEffect(() => {
    if (!gameSession) return;

    const { gameId, username, opponent, isPlayer1 } = gameSession;

    const ws = new WebSocket(
      `/ws/classic-pong/${gameId}/?token=${localStorage.getItem('access_token')}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      setErrorMessage('');
      ws.send(JSON.stringify({
        type: 'init',
        username,
        opponent,
        isPlayer1
      }));
    };

    ws.onclose = () => {
      if (cleanupRef.current) return;
      setConnectionStatus('disconnected');
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        setErrorMessage('Connection lost. Attempting to reconnect...');
      } else {
        setErrorMessage('Connection lost. Please return to lobby.');
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch(data.type) {
        case 'game_state':
          setGameState(data.state);
          break;
        case 'game_ended':
          handleGameEnd(data.winner);
          break;
        case 'player_disconnected':
          setErrorMessage('Opponent disconnected. Waiting for reconnection...');
          break;
        case 'player_reconnected':
          setErrorMessage('');
          break;
      }
    };

    return () => {
      cleanupRef.current = true;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [gameSession]);

  useEffect(() => {
    if (!wsRef.current || !gameState?.gameStarted || gameState?.gameOver) return;

    const moveInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        if (keys.up) {
          wsRef.current.send(JSON.stringify({ type: 'player_input', input: 'up' }));
        }
        if (keys.down) {
          wsRef.current.send(JSON.stringify({ type: 'player_input', input: 'down' }));
        }
      }
    }, 1000/60);

    return () => clearInterval(moveInterval);
  }, [gameState, keys]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!gameState?.gameStarted || gameState?.gameOver) return;

      let key = null;
      if (event.key === 'ArrowUp') key = 'up';
      if (event.key === 'ArrowDown') key = 'down';

      if (key) {
        event.preventDefault();
        setKeys(prev => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (event) => {
      let key = null;
      if (event.key === 'ArrowUp') key = 'up';
      if (event.key === 'ArrowDown') key = 'down';

      if (key) {
        event.preventDefault();
        setKeys(prev => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const handleGameEnd = (winner) => {
    setWinner(winner === gameSession?.username ? 'You won!' : `${winner} won!`);
    setGameState(prev => ({ ...prev, gameOver: true }));
  };

  if (!gameState || !gameSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-2xl">Connecting to game...</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-gray-900 text-white">
      <Card className="mt-8 bg-gray-800 border-none">
        <CardHeader>
          <CardTitle className="text-center">
            <div className="flex justify-between items-center px-8">
              <div className="text-blue-400">
                {gameSession.isPlayer1 ? gameSession.username : gameSession.opponent}
                <div className="text-2xl">{gameState.score1}</div>
              </div>
              <div className="text-red-400">
                {gameSession.isPlayer1 ? gameSession.opponent : gameSession.username}
                <div className="text-2xl">{gameState.score2}</div>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative bg-gray-900 rounded-lg overflow-hidden"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            <div className="absolute left-1/2 h-full w-0.5 bg-gray-600 opacity-50" />

            <div
              className="absolute bg-blue-500"
              style={{
                left: 50,
                top: gameState.paddle1Y,
                width: PADDLE_WIDTH,
                height: PADDLE_HEIGHT
              }}
            />
            <div
              className="absolute bg-red-500"
              style={{
                right: 50,
                top: gameState.paddle2Y,
                width: PADDLE_WIDTH,
                height: PADDLE_HEIGHT
              }}
            />

            <div
              className="absolute bg-white rounded-full"
              style={{
                left: gameState.ballX - BALL_SIZE/2,
                top: gameState.ballY - BALL_SIZE/2,
                width: BALL_SIZE,
                height: BALL_SIZE
              }}
            />

            {gameState.gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                <div className="text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                  <div className="text-3xl font-bold mb-4">{winner}</div>
                  <button
                    onClick={() => navigate('/game-lobby')}
                    className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg"
                  >
                    Back to Lobby
                  </button>
                </div>
              </div>
            )}

            {!gameState.gameStarted && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Waiting for opponent...</h2>
                  <div className="text-lg">
                    <p>Use ↑↓ keys to move</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-4 right-4 px-4 py-2 rounded-full text-sm">
        <div className={`w-3 h-3 rounded-full inline-block mr-2 ${
          connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500 animate-pulse'
        }`} />
        {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
      </div>

      {errorMessage && !gameState.gameOver && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2
                      bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default ClassicPong;

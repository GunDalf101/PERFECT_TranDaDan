import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const SHIP_WIDTH = 40;
const SHIP_HEIGHT = 30;
const LASER_WIDTH = 4;
const LASER_HEIGHT = 15;
const POWERUP_SIZE = 25;

// Power-up colors
const POWERUP_COLORS = {
  RAPID_FIRE: 'yellow',
  SHIELD: 'cyan',
  DOUBLE_BULLETS: 'magenta',
  SLOW_MOTION: 'lime'
};

const RemoteRivalry = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 1;
  const reconnectTimeout = useRef(null);
  const reconnectTimeoutId = useRef(null);
  const isReconnecting = useRef(false);
  const [winner, setWinner] = useState(null);
  const navigate = useNavigate();

  // Get game session
  const gameSession = JSON.parse(localStorage.getItem('gameSession'));
  if (!gameSession) {
    navigate('/game-lobby');
    return null;
  }

  const { gameId, username, opponent, isPlayer1 } = gameSession;

  // Key state for continuous movement
  const [keys, setKeys] = useState({
    left: false,
    right: false,
    shoot: false
  });

  // Handle continuous movement
  useEffect(() => {
    if (!socket || !gameState || !gameState.gameStarted || gameState.gameOver) return;

    const moveInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        if (keys.left) {
          socket.send(JSON.stringify({ type: 'player_input', input: 'left' }));
        }
        if (keys.right) {
          socket.send(JSON.stringify({ type: 'player_input', input: 'right' }));
        }
        if (keys.shoot) {
          socket.send(JSON.stringify({ type: 'player_input', input: 'shoot' }));
        }
      }
    }, 1000/60); // 60 FPS updates

    return () => clearInterval(moveInterval);
  }, [socket, gameState, keys]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!gameState?.gameStarted || gameState?.gameOver) return;

      let key = null;
      if (event.key === 'ArrowLeft') key = 'left';
      if (event.key === 'ArrowRight') key = 'right';
      if (event.key === 'Space' || event.key === ' ') key = 'shoot';

      if (key) {
        event.preventDefault();
        setKeys(prev => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (event) => {
      let key = null;
      if (event.key === 'ArrowLeft') key = 'left';
      if (event.key === 'ArrowRight') key = 'right';
      if (event.key === 'Space' || event.key === ' ') key = 'shoot';

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

  // WebSocket connection
  useEffect(() => {
    if (socket) {
      socket.close();
      setSocket(null);
    }

    const ws = new WebSocket(
      `ws://10.13.5.8:8000/ws/space-rivalry/${gameId}/?username=${username}`
    );

    ws.onopen = () => {
      console.log('Connected to game server');
      setConnectionStatus('connected');
      setErrorMessage('');
      reconnectAttempts.current = 0;
      isReconnecting.current = false;

      // Send initial player data
      ws.send(JSON.stringify({
        type: 'init',
        username,
        opponent,
        isPlayer1
      }));
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed', event);
      setConnectionStatus('disconnected');
      setSocket(null);

      // Only attempt reconnect if game isn't over and not already reconnecting
      if (gameState?.gameOver !== true && !isReconnecting.current) {
        isReconnecting.current = true;
        setErrorMessage('Connection lost. Attempting to reconnect...');

        if (reconnectTimeoutId.current) {
          clearTimeout(reconnectTimeoutId.current);
        }

        reconnectTimeoutId.current = setTimeout(() => {
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            setSocket(ws);
          } else {
            setErrorMessage('Connection lost. Please return to lobby.');
          }
        }, 2000);
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch(data.type) {
        case 'game_state':
          setGameState(data.state);
          break;

        case 'player_disconnected':
          setErrorMessage(data.message);
          break;

        case 'player_reconnected':
          setErrorMessage('');
          break;

        case 'connection_warning':
          setErrorMessage(data.message);
          break;

        case 'game_ended':
          handleGameEnd(data.state, false);
          break;

        case 'game_ended_by_forfeit':
          handleGameEnd(data.state, true);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    const handleBeforeUnload = (e) => {
      if (gameState && !gameState.gameOver) {
        ws.close();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
        reconnectTimeoutId.current = null;
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      reconnectAttempts.current = 0;
      isReconnecting.current = false;
      setErrorMessage('');
      setConnectionStatus('connecting');
    };
  }, [gameId, username, opponent, isPlayer1]);

  const handleGameEnd = (state, isForfeit) => {
    let winnerMessage;

    if (isForfeit) {
      winnerMessage = state.winner === username ?
        'You won by forfeit!' :
        `${state.winner} won by forfeit!`;
    } else {
      winnerMessage = state.winner === username ?
        'You won!' :
        `${state.winner} won!`;
    }

    setWinner(winnerMessage);
    setGameState(prev => ({
      ...prev,
      ...state,
      gameOver: true,
    }));
  };

  // Loading state
  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-2xl">Connecting to game...</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-gray-900 text-white">
      {/* Score Display */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-4xl flex justify-between items-center px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
            P1
          </div>
          <div className="text-2xl font-bold">
            <span className="text-blue-500">{gameState.score1}</span>
            {gameState.combo1 > 0 && (
              <span className="ml-2 text-yellow-500">x{1 + Math.floor(gameState.combo1/5)}</span>
            )}
          </div>
        </div>

        <div className="text-xl font-bold text-cyan-400">Wave {gameState.wave}</div>

        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold">
            <span className="text-red-500">{gameState.score2}</span>
            {gameState.combo2 > 0 && (
              <span className="ml-2 text-yellow-500">x{1 + Math.floor(gameState.combo2/5)}</span>
            )}
          </div>
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
            P2
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div
        className="relative mt-16 bg-gray-800 rounded-lg overflow-hidden"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Dividing Line */}
        <div
          className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-800"
          style={{ transform: 'translateX(-50%)' }}
        />

        {/* Health Bars and Power-ups */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="w-32 h-2 bg-gray-800 rounded">
            <div
              className="h-full bg-blue-500 rounded transition-all duration-200"
              style={{ width: `${gameState.health1}%` }}
            />
          </div>
          <div className="flex gap-1">
            {Object.entries(gameState.activeEffects1 || {}).map(([type, effect]) =>
              effect.active && (
                <div
                  key={type}
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: POWERUP_COLORS[type] }}
                />
              )
            )}
          </div>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          <div className="w-32 h-2 bg-gray-800 rounded">
            <div
              className="h-full bg-red-500 rounded transition-all duration-200"
              style={{ width: `${gameState.health2}%` }}
            />
          </div>
          <div className="flex gap-1">
            {Object.entries(gameState.activeEffects2 || {}).map(([type, effect]) =>
              effect.active && (
                <div
                  key={type}
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: POWERUP_COLORS[type] }}
                />
              )
            )}
          </div>
        </div>

        {/* Ships */}
        <div
          className={`absolute rounded transition-transform duration-50 ${
            gameState.activeEffects1?.SHIELD?.active ? 'ring-4 ring-cyan-400' : ''
          }`}
          style={{
            left: gameState.player1Pos - SHIP_WIDTH/2,
            bottom: SHIP_HEIGHT,
            width: SHIP_WIDTH,
            height: SHIP_HEIGHT,
            backgroundColor: 'rgb(59, 130, 246)'
          }}
        />
        <div
          className={`absolute rounded transition-transform duration-50 ${
            gameState.activeEffects2?.SHIELD?.active ? 'ring-4 ring-cyan-400' : ''
          }`}
          style={{
            left: gameState.player2Pos - SHIP_WIDTH/2,
            bottom: SHIP_HEIGHT,
            width: SHIP_WIDTH,
            height: SHIP_HEIGHT,
            backgroundColor: 'rgb(239, 68, 68)'
          }}
        />

        {/* Lasers */}
        {gameState.lasers1.map((laser, i) => (
          <div
            key={`laser1-${i}`}
            className="absolute bg-blue-300"
            style={{
              left: laser.x - LASER_WIDTH/2,
              top: laser.y,
              width: LASER_WIDTH,
              height: LASER_HEIGHT
            }}
          />
        ))}
        {gameState.lasers2.map((laser, i) => (
          <div
            key={`laser2-${i}`}
            className="absolute bg-red-300"
            style={{
              left: laser.x - LASER_WIDTH/2,
              top: laser.y,
              width: LASER_WIDTH,
              height: LASER_HEIGHT
            }}
          />
        ))}

        {/* Asteroids */}
        {gameState.asteroids.map((asteroid, i) => (
          <div
            key={`asteroid-${i}`}
            className="absolute rounded-full"
            style={{
              left: asteroid.x - asteroid.size/2,
              top: asteroid.y - asteroid.size/2,
              width: asteroid.size,
              height: asteroid.size,
              backgroundColor: asteroid.type === 'FAST' ? '#A0A0A0' :
                            asteroid.type === 'SPLIT' ? '#808080' :
                            asteroid.type === 'EXPLODING' ? '#FF6B6B' : '#666666'
            }}
          />
        ))}

        {/* Power-ups */}
        {gameState.powerups.map((powerup, i) => (
          <div
            key={`powerup-${i}`}
            className="absolute rounded-lg animate-bounce"
            style={{
              left: powerup.x - POWERUP_SIZE/2,
              top: powerup.y - POWERUP_SIZE/2,
              width: POWERUP_SIZE,
              height: POWERUP_SIZE,
              backgroundColor: POWERUP_COLORS[powerup.type]
            }}
          />
        ))}

        {/* Explosions */}
        {gameState.explosions.map((explosion, i) => (
          <div
            key={`explosion-${i}`}
            className="absolute rounded-full animate-ping"
            style={{
              left: explosion.x - 50,
              top: explosion.y - 50,
              width: 100,
              height: 100,
              backgroundColor: 'rgba(255, 107, 107, 0.5)'
            }}
          />
        ))}

        {/* Game State Overlays */}
        {!gameState.gameStarted && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-4">
                Waiting for opponent...
              </h2>
              <div className="mb-4 text-lg text-gray-300">
                <h3 className="font-bold mb-2">Controls:</h3>
                <p>← → to move</p>
                <p>Space to shoot</p>
              </div>
              <p className="text-sm text-gray-400">Game ID: {gameId}</p>
            </div>
          </div>
        )}

        {gameState.gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg text-center border-2 border-cyan-400">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-cyan-400 animate-bounce" />
              <div className="text-2xl font-bold text-cyan-400 mb-4">
                {winner}
              </div>
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <div className="text-blue-400 font-bold">Player 1</div>
                  <div className="text-2xl">{gameState.score1}</div>
                </div>
                <div>
                  <div className="text-red-400 font-bold">Player 2</div>
                  <div className="text-2xl">{gameState.score2}</div>
                </div>
              </div>
              <button
                onClick={() => navigate('/game-lobby')}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {errorMessage && !gameState.gameOver && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                      bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {errorMessage}
        </div>
      )}

      {/* Connection Status */}
      <div className="fixed bottom-4 right-4 px-4 py-2 rounded-full text-sm">
        <div className={`w-3 h-3 rounded-full inline-block mr-2 ${
          connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500 animate-pulse'
        }`} />
        {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

export default RemoteRivalry;

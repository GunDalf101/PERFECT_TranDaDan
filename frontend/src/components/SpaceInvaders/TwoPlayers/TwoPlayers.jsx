import React, { useState, useEffect, useCallback } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const SHIP_WIDTH = 40;
const SHIP_HEIGHT = 30;
const LASER_WIDTH = 4;
const LASER_HEIGHT = 15;
const ASTEROID_SIZE = 30;
const DEBRIS_SIZE = 20;
const POWERUP_SIZE = 25;
const MOVEMENT_SPEED = 5;

// Power-up types
const POWERUPS = {
  RAPID_FIRE: { type: 'RAPID_FIRE', duration: 5000, color: 'yellow' },
  SHIELD: { type: 'SHIELD', duration: 8000, color: 'cyan' },
  DOUBLE_BULLETS: { type: 'DOUBLE_BULLETS', duration: 6000, color: 'magenta' },
  SLOW_MOTION: { type: 'SLOW_MOTION', duration: 4000, color: 'lime' }
};

// Asteroid types
const ASTEROID_TYPES = {
  NORMAL: { speed: 2, size: ASTEROID_SIZE, health: 1, points: 100 },
  FAST: { speed: 4, size: ASTEROID_SIZE * 0.7, health: 1, points: 150 },
  SPLIT: { speed: 1.5, size: ASTEROID_SIZE * 1.2, health: 1, points: 200 },
  EXPLODING: { speed: 1, size: ASTEROID_SIZE * 1.3, health: 1, points: 300 }
};

const SpaceRivalry = () => {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [health1, setHealth1] = useState(100);
  const [health2, setHealth2] = useState(100);
  
  // Player positions
  const [player1Pos, setPlayer1Pos] = useState(GAME_WIDTH / 4);
  const [player2Pos, setPlayer2Pos] = useState(3 * GAME_WIDTH / 4);
  
  // Key states for smooth movement
  const [keys, setKeys] = useState({
    a: false,
    d: false,
    ArrowLeft: false,
    ArrowRight: false
  });
  
  // Game objects
  const [lasers1, setLasers1] = useState([]);
  const [lasers2, setLasers2] = useState([]);
  const [asteroids, setAsteroids] = useState([]);
  const [debris, setDebris] = useState([]);
  const [powerups, setPowerups] = useState([]);
  const [explosions, setExplosions] = useState([]);
  
  // Cooldown states
  const [canShoot1, setCanShoot1] = useState(true);
  const [canShoot2, setCanShoot2] = useState(true);

  // Game mechanics
  const [activeEffects1, setActiveEffects1] = useState({});
  const [activeEffects2, setActiveEffects2] = useState({});
  const [combo1, setCombo1] = useState(0);
  const [combo2, setCombo2] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [wave, setWave] = useState(1);

  // Shooting function
  const shoot = useCallback((playerId) => {
    const playerPos = playerId === 1 ? player1Pos : player2Pos;
    const setLasers = playerId === 1 ? setLasers1 : setLasers2;
    const effects = playerId === 1 ? activeEffects1 : activeEffects2;
    
    const bullets = [];
    if (effects.DOUBLE_BULLETS?.active) {
      bullets.push(
        { x: playerPos - 10, y: GAME_HEIGHT - SHIP_HEIGHT - 10 },
        { x: playerPos + 10, y: GAME_HEIGHT - SHIP_HEIGHT - 10 }
      );
    } else {
      bullets.push({ x: playerPos, y: GAME_HEIGHT - SHIP_HEIGHT - 10 });
    }

    setLasers(prev => [...prev, ...bullets]);

    // Rapid fire affects cooldown
    const cooldownTime = effects.RAPID_FIRE?.active ? 250 : 500;
    if (playerId === 1) {
      setCanShoot1(false);
      setTimeout(() => setCanShoot1(true), cooldownTime);
    } else {
      setCanShoot2(false);
      setTimeout(() => setCanShoot2(true), cooldownTime);
    }
  }, [player1Pos, player2Pos, activeEffects1, activeEffects2]);

  // Handle key down
  const handleKeyDown = useCallback((event) => {
    if (!gameStarted || gameOver) return;

    if (['a', 'd', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      setKeys(prev => ({ ...prev, [event.key]: true }));
    }

    // Shooting controls
    if (event.key === 'w' && canShoot1) {
      shoot(1);
    }
    if (event.key === 'ArrowUp' && canShoot2) {
      shoot(2);
    }
  }, [gameStarted, gameOver, canShoot1, canShoot2, shoot]);

  // Handle key up
  const handleKeyUp = useCallback((event) => {
    if (['a', 'd', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      setKeys(prev => ({ ...prev, [event.key]: false }));
    }
  }, []);

  // Collision handling
  const createExplosion = useCallback((x, y) => {
    setExplosions(prev => [...prev, { x, y, created: Date.now() }]);
    
    // Damage nearby asteroids
    setAsteroids(prev => prev.filter(asteroid => {
      const distance = Math.sqrt(
        Math.pow(asteroid.x - x, 2) + Math.pow(asteroid.y - y, 2)
      );
      return distance > 100;
    }));
  }, []);

  // Power-up collection
  const collectPowerup = useCallback((powerup, playerId) => {
    const setActiveEffects = playerId === 1 ? setActiveEffects1 : setActiveEffects2;
    const currentEffects = playerId === 1 ? activeEffects1 : activeEffects2;
    
    setActiveEffects({
      ...currentEffects,
      [powerup.type]: {
        active: true,
        endsAt: Date.now() + POWERUPS[powerup.type].duration
      }
    });

    // Clear effect after duration
    setTimeout(() => {
      setActiveEffects(prev => ({
        ...prev,
        [powerup.type]: { active: false }
      }));
    }, POWERUPS[powerup.type].duration);
  }, [activeEffects1, activeEffects2]);

  // Spawn asteroid
  const spawnAsteroid = useCallback(() => {
    const types = Object.keys(ASTEROID_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      x: Math.random() * GAME_WIDTH,
      y: 0,
      type,
      ...ASTEROID_TYPES[type]
    };
  }, []);

  // Split asteroid
  const splitAsteroid = useCallback((asteroid) => {
    if (asteroid.type === 'SPLIT') {
      return [
        {
          x: asteroid.x - 20,
          y: asteroid.y,
          type: 'NORMAL',
          ...ASTEROID_TYPES.NORMAL
        },
        {
          x: asteroid.x + 20,
          y: asteroid.y,
          type: 'NORMAL',
          ...ASTEROID_TYPES.NORMAL
        }
      ];
    }
    return [];
  }, []);

  // Check collisions
  const checkCollisions = useCallback(() => {
    // Check laser hits on asteroids
    const checkLaserAsteroidCollisions = (lasers, isPlayer1) => {
      setAsteroids(prevAsteroids => {
        let newAsteroids = [...prevAsteroids];
        lasers.forEach(laser => {
          newAsteroids = newAsteroids.filter(asteroid => {
            const hit = Math.abs(laser.x - asteroid.x) < asteroid.size/2 &&
                       Math.abs(laser.y - asteroid.y) < asteroid.size/2;
            
            if (hit) {
              // Handle different asteroid types
              if (asteroid.type === 'SPLIT') {
                newAsteroids.push(...splitAsteroid(asteroid));
              } else if (asteroid.type === 'EXPLODING') {
                createExplosion(asteroid.x, asteroid.y);
              }

              // Maybe spawn power-up
              if (Math.random() < 0.2) {
                const powerupTypes = Object.keys(POWERUPS);
                const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
                setPowerups(prev => [...prev, {
                  x: asteroid.x,
                  y: asteroid.y,
                  type,
                  ...POWERUPS[type]
                }]);
              }

              // Update combo and score
              if (isPlayer1) {
                setCombo1(prev => prev + 1);
                setScore1(prev => prev + asteroid.points * (1 + Math.floor(combo1 / 5)));
              } else {
                setCombo2(prev => prev + 1);
                setScore2(prev => prev + asteroid.points * (1 + Math.floor(combo2 / 5)));
              }

              // Create debris
              setDebris(prev => [...prev, {
                x: asteroid.x,
                y: asteroid.y,
                targetPlayer: isPlayer1 ? 2 : 1
              }]);
            }
            return !hit;
          });
        });
        return newAsteroids;
      });
    };

    checkLaserAsteroidCollisions(lasers1, true);
    checkLaserAsteroidCollisions(lasers2, false);

    // Check power-up collection
    setPowerups(prev => prev.filter(powerup => {
      const hitPlayer1 = Math.abs(powerup.x - player1Pos) < (SHIP_WIDTH + POWERUP_SIZE)/2 &&
                        Math.abs(powerup.y - (GAME_HEIGHT - SHIP_HEIGHT/2)) < (SHIP_HEIGHT + POWERUP_SIZE)/2;
      const hitPlayer2 = Math.abs(powerup.x - player2Pos) < (SHIP_WIDTH + POWERUP_SIZE)/2 &&
                        Math.abs(powerup.y - (GAME_HEIGHT - SHIP_HEIGHT/2)) < (SHIP_HEIGHT + POWERUP_SIZE)/2;
      
      if (hitPlayer1) {
        collectPowerup(powerup, 1);
        return false;
      }
      if (hitPlayer2) {
        collectPowerup(powerup, 2);
        return false;
      }
      return powerup.y < GAME_HEIGHT;
    }));

    // Check ship collisions
    debris.forEach(d => {
      if (d.targetPlayer === 1 &&
          Math.abs(d.x - player1Pos) < (SHIP_WIDTH + DEBRIS_SIZE)/2 &&
          Math.abs(d.y - (GAME_HEIGHT - SHIP_HEIGHT/2)) < (SHIP_HEIGHT + DEBRIS_SIZE)/2) {
        if (!activeEffects1.SHIELD?.active) {
          setHealth1(prev => Math.max(0, prev - 10));
        }
      }
      if (d.targetPlayer === 2 &&
          Math.abs(d.x - player2Pos) < (SHIP_WIDTH + DEBRIS_SIZE)/2 &&
          Math.abs(d.y - (GAME_HEIGHT - SHIP_HEIGHT/2)) < (SHIP_HEIGHT + DEBRIS_SIZE)/2) {
        if (!activeEffects2.SHIELD?.active) {
          setHealth2(prev => Math.max(0, prev - 10));
        }
      }
    });

    asteroids.forEach(asteroid => {
      if (Math.abs(asteroid.x - player1Pos) < (SHIP_WIDTH + asteroid.size)/2 &&
          Math.abs(asteroid.y - (GAME_HEIGHT - SHIP_HEIGHT/2)) < (SHIP_HEIGHT + asteroid.size)/2) {
        if (!activeEffects1.SHIELD?.active) {
          setHealth1(prev => Math.max(0, prev - 20));
        }
      }
      if (Math.abs(asteroid.x - player2Pos) < (SHIP_WIDTH + asteroid.size)/2 &&
          Math.abs(asteroid.y - (GAME_HEIGHT - SHIP_HEIGHT/2)) < (SHIP_HEIGHT + asteroid.size)/2) {
        if (!activeEffects2.SHIELD?.active) {
          setHealth2(prev => Math.max(0, prev - 20));
        }
      }
    });

    if (health1 <= 0 || health2 <= 0) {
      setGameOver(true);
    }
  }, [
    player1Pos, player2Pos, lasers1, lasers2, debris, asteroids,
    activeEffects1, activeEffects2, combo1, combo2,
    createExplosion, splitAsteroid, collectPowerup
  ]);

  // Effect for difficulty increase and combo decay
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    // Increase difficulty over time
    const difficultyTimer = setInterval(() => {
      setDifficulty(prev => Math.min(prev + 0.1, 3));
      setWave(prev => prev + 1);
    }, 30000);

    // Clear combos if no hits for a while
    const comboTimer = setInterval(() => {
      setCombo1(prev => prev > 0 ? prev - 1 : 0);
      setCombo2(prev => prev > 0 ? prev - 1 : 0);
    }, 2000);

    return () => {
      clearInterval(difficultyTimer);
      clearInterval(comboTimer);
    };
  }, [gameStarted, gameOver]);

  // Movement update loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveInterval = setInterval(() => {
      // Player 1 movement
      if (keys.a && player1Pos > SHIP_WIDTH/2) {
        setPlayer1Pos(prev => Math.max(SHIP_WIDTH/2, prev - MOVEMENT_SPEED));
      }
      if (keys.d && player1Pos < GAME_WIDTH/2 - SHIP_WIDTH/2) {
        setPlayer1Pos(prev => Math.min(GAME_WIDTH/2 - SHIP_WIDTH/2, prev + MOVEMENT_SPEED));
      }

      // Player 2 movement
      if (keys.ArrowLeft && player2Pos > GAME_WIDTH/2 + SHIP_WIDTH/2) {
        setPlayer2Pos(prev => Math.max(GAME_WIDTH/2 + SHIP_WIDTH/2, prev - MOVEMENT_SPEED));
      }
      if (keys.ArrowRight && player2Pos < GAME_WIDTH - SHIP_WIDTH/2) {
        setPlayer2Pos(prev => Math.min(GAME_WIDTH - SHIP_WIDTH/2, prev + MOVEMENT_SPEED));
      }
    }, 1000/60); // 60 FPS movement updates

    return () => clearInterval(moveInterval);
  }, [keys, gameStarted, gameOver, player1Pos, player2Pos]);

  // Main game loop
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      // Move lasers
      setLasers1(prev => prev.map(laser => ({ ...laser, y: laser.y - 5 }))
        .filter(laser => laser.y > 0));
      setLasers2(prev => prev.map(laser => ({ ...laser, y: laser.y - 5 }))
        .filter(laser => laser.y > 0));

      // Move asteroids with slow motion effect
      const slowMotion1 = activeEffects1.SLOW_MOTION?.active;
      const slowMotion2 = activeEffects2.SLOW_MOTION?.active;
      const speedMultiplier = slowMotion1 || slowMotion2 ? 0.5 : 1;

      setAsteroids(prev => {
        const moved = prev.map(asteroid => ({
          ...asteroid,
          y: asteroid.y + asteroid.speed * speedMultiplier
        }));
        const filtered = moved.filter(asteroid => asteroid.y < GAME_HEIGHT);
        
        // Spawn new asteroids based on difficulty
        if (Math.random() < 0.02 * difficulty) {
          filtered.push(spawnAsteroid());
        }
        
        return filtered;
      });

      // Move power-ups
      setPowerups(prev => prev.map(powerup => ({
        ...powerup,
        y: powerup.y + 2
      })).filter(powerup => powerup.y < GAME_HEIGHT));

      // Move debris
      setDebris(prev => prev.map(d => ({ ...d, y: d.y + 3 }))
        .filter(d => d.y < GAME_HEIGHT));

      // Update explosions
      setExplosions(prev => prev.filter(explosion => 
        Date.now() - explosion.created < 500
      ));

      // Check collisions
      checkCollisions();
    }, 1000/60);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    gameStarted, gameOver, handleKeyDown, handleKeyUp,
    difficulty, activeEffects1, activeEffects2,
    spawnAsteroid, checkCollisions
  ]);

  return (
    <div className="flex flex-col items-center">
      {/* Score Display */}
      <div className="w-full max-w-4xl mb-4 flex justify-between px-4">
        <div className="text-2xl font-bold text-blue-500">
          Player 1: {score1}
          {combo1 > 0 && <span className="ml-2 text-yellow-500">x{1 + Math.floor(combo1/5)}</span>}
        </div>
        <div className="text-xl font-bold text-white">Wave {wave}</div>
        <div className="text-2xl font-bold text-red-500">
          Player 2: {score2}
          {combo2 > 0 && <span className="ml-2 text-yellow-500">x{1 + Math.floor(combo2/5)}</span>}
        </div>
      </div>

      {!gameStarted ? (
        <div className="text-center my-8">
          <h1 className="text-4xl font-bold mb-6">Space Rivalry</h1>
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4 text-white">Controls</h2>
            <div className="grid grid-cols-2 gap-4 text-white">
              <div>
                <h3 className="font-bold text-blue-400">Player 1</h3>
                <p>A/D to move</p>
                <p>W to shoot</p>
              </div>
              <div>
                <h3 className="font-bold text-red-400">Player 2</h3>
                <p>←/→ to move</p>
                <p>↑ to shoot</p>
              </div>
            </div>
            <div className="mt-6 text-white">
              <h3 className="font-bold mb-2">Power-ups</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-yellow-400">●</span> Rapid Fire</div>
                <div><span className="text-cyan-400">●</span> Shield</div>
                <div><span className="text-fuchsia-400">●</span> Double Bullets</div>
                <div><span className="text-lime-400">●</span> Slow Motion</div>
              </div>
            </div>
          </div>
          <button 
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-xl"
            onClick={() => setGameStarted(true)}
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
          {/* Game canvas */}
          <div className="absolute inset-0 bg-gray-900">
            {/* Dividing line */}
            <div 
              className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-600"
              style={{ transform: 'translateX(-50%)' }}
            />
            
            {/* Health and power-up status bars */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {/* Health bar */}
              <div className="w-32 h-2 bg-gray-700 rounded">
                <div 
                  className="h-full bg-blue-500 rounded transition-all duration-200"
                  style={{ width: `${health1}%` }}
                />
              </div>
              {/* Power-up indicators */}
              <div className="flex gap-1">
                {Object.entries(activeEffects1).map(([type, effect]) => 
                  effect.active && (
                    <div 
                      key={type}
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: POWERUPS[type].color }}
                    />
                  )
                )}
              </div>
            </div>

            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
              {/* Health bar */}
              <div className="w-32 h-2 bg-gray-700 rounded">
                <div 
                  className="h-full bg-red-500 rounded transition-all duration-200"
                  style={{ width: `${health2}%` }}
                />
              </div>
              {/* Power-up indicators */}
              <div className="flex gap-1">
                {Object.entries(activeEffects2).map(([type, effect]) => 
                  effect.active && (
                    <div 
                      key={type}
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: POWERUPS[type].color }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Player ships */}
            <div
              className={`absolute rounded transition-transform duration-50 ${
                activeEffects1.SHIELD?.active ? 'ring-4 ring-cyan-400' : ''
              }`}
              style={{
                left: player1Pos - SHIP_WIDTH/2,
                bottom: 0,
                width: SHIP_WIDTH,
                height: SHIP_HEIGHT,
                backgroundColor: 'rgb(59, 130, 246)',
                transform: `translateX(${keys.a ? -2 : keys.d ? 2 : 0}px)`
              }}
            />
            <div
              className={`absolute rounded transition-transform duration-50 ${
                activeEffects2.SHIELD?.active ? 'ring-4 ring-cyan-400' : ''
              }`}
              style={{
                left: player2Pos - SHIP_WIDTH/2,
                bottom: 0,
                width: SHIP_WIDTH,
                height: SHIP_HEIGHT,
                backgroundColor: 'rgb(239, 68, 68)',
                transform: `translateX(${keys.ArrowLeft ? -2 : keys.ArrowRight ? 2 : 0}px)`
              }}
            />

            {/* Lasers */}
            {lasers1.map((laser, i) => (
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
            {lasers2.map((laser, i) => (
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
            {asteroids.map((asteroid, i) => (
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
            {powerups.map((powerup, i) => (
              <div
                key={`powerup-${i}`}
                className="absolute rounded-lg animate-bounce"
                style={{
                  left: powerup.x - POWERUP_SIZE/2,
                  top: powerup.y - POWERUP_SIZE/2,
                  width: POWERUP_SIZE,
                  height: POWERUP_SIZE,
                  backgroundColor: powerup.color
                }}
              />
            ))}

            {/* Explosions */}
            {explosions.map((explosion, i) => (
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
          </div>

          {/* Game Over overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-white text-center p-8 bg-gray-800 rounded-lg">
                <h2 className="text-4xl font-bold mb-6">Game Over!</h2>
                <p className="text-2xl mb-6">
                  {health1 <= 0 && health2 <= 0 ? "It's a tie!" :
                   health1 <= 0 ? "Player 2 wins!" :
                   "Player 1 wins!"}
                </p>
                <div className="grid grid-cols-2 gap-8 mb-6 text-xl">
                  <div className="text-blue-400">
                    Player 1<br/>
                    Score: {score1}
                  </div>
                  <div className="text-red-400">
                    Player 2<br/>
                    Score: {score2}
                  </div>
                </div>
                <p className="mb-4 text-lg">Waves Survived: {wave}</p>
                <button 
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-xl"
                  onClick={() => {
                    setGameStarted(false);
                    setGameOver(false);
                    setScore1(0);
                    setScore2(0);
                    setHealth1(100);
                    setHealth2(100);
                    setPlayer1Pos(GAME_WIDTH / 4);
                    setPlayer2Pos(3 * GAME_WIDTH / 4);
                    setLasers1([]);
                    setLasers2([]);
                    setAsteroids([]);
                    setDebris([]);
                    setPowerups([]);
                    setActiveEffects1({});
                    setActiveEffects2({});
                    setCombo1(0);
                    setCombo2(0);
                    setDifficulty(1);
                    setWave(1);
                    setKeys({
                      a: false,
                      d: false,
                      ArrowLeft: false,
                      ArrowRight: false
                    });
                  }}
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpaceRivalry;
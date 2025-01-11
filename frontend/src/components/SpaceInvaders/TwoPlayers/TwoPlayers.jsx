import React, { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import gsap from 'gsap';

// Game classes
class Player {
  constructor({ position = { x: 0, y: 0 }, color = 'white' } = {}) {
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.opacity = 1;
    this.color = color;

    const image = new Image();
    image.src = '/img/spaceship.png'; // Updated path
    image.onload = () => {
      const scale = 0.15;
      this.image = image;
      this.width = image.width * scale;
      this.height = image.height * scale;
      this.position = position;
    };

    this.particles = [];
    this.frames = 0;
    this.powerUp = null;
  }

  draw(ctx) {
    if (!this.image || !this.position) {
      console.log('Missing image or position', { image: !!this.image, position: this.position });
      // Draw a placeholder rectangle if image isn't loaded
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.fillRect(this.position?.x || 0, this.position?.y || 0, 50, 50);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalAlpha = this.opacity;
    try {
      ctx.translate(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2
      );
      ctx.rotate(this.rotation);
      ctx.translate(
        -this.position.x - this.width / 2,
        -this.position.y - this.height / 2
      );
      ctx.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    } catch (error) {
      console.error('Error drawing player:', error);
      // Draw fallback rectangle
      ctx.fillStyle = this.color;
      ctx.fillRect(this.position.x, this.position.y, 50, 50);
    }
    ctx.restore();
  }

  update(ctx) {
    if (!this.image) return;
    this.draw(ctx);
    this.position.x += this.velocity.x;
  }
}

class Invader {
  constructor({ position }) {
    this.velocity = { x: 0, y: 0 };

    const image = new Image();
    image.src = '/img/invader.png'; // Updated path
    image.onload = () => {
      const scale = 1;
      this.image = image;
      this.width = image.width * scale;
      this.height = image.height * scale;
      this.position = position;
    };
  }

  draw(ctx) {
    if (!this.image) return;
    ctx.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  update(ctx, velocity) {
    if (this.image) {
      this.draw(ctx);
      this.position.x += velocity.x;
      this.position.y += velocity.y;
    }
  }

  shoot(invaderProjectiles) {
    if (!this.position) return;
    audio.enemyShoot.play();
    invaderProjectiles.push(
      new InvaderProjectile({
        position: {
          x: this.position.x + this.width / 2,
          y: this.position.y + this.height
        },
        velocity: {
          x: 0,
          y: 5
        }
      })
    );
  }
}
class Bomb {
  static radius = 30;
  
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 0;
    this.color = 'red';
    this.opacity = 1;
    this.active = false;

    gsap.to(this, {
      radius: 30
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update(ctx, canvas) {
    this.draw(ctx);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (
      this.position.x + this.radius + this.velocity.x >= canvas.width ||
      this.position.x - this.radius + this.velocity.x <= 0
    ) {
      this.velocity.x = -this.velocity.x;
    } else if (
      this.position.y + this.radius + this.velocity.y >= canvas.height ||
      this.position.y - this.radius + this.velocity.y <= 0
    ) {
      this.velocity.y = -this.velocity.y;
    }
  }

  explode() {
    audio.bomb.play();
    this.active = true;
    this.velocity.x = 0;
    this.velocity.y = 0;
    gsap.to(this, {
      radius: 200,
      color: 'white'
    });

    gsap.to(this, {
      delay: 0.1,
      opacity: 0,
      duration: 0.15
    });
  }
}

class PowerUp {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 15;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.closePath();
  }

  update(ctx) {
    this.draw(ctx);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Projectile {
  constructor({ position, velocity, color = 'red' }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 4;
    this.color = color;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  update(ctx) {
    this.draw(ctx);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Grid {
  constructor() {
    this.position = {
      x: 0,
      y: 0
    };

    this.velocity = {
      x: 3,
      y: 0
    };

    this.invaders = [];

    const columns = Math.floor(Math.random() * 10 + 5);
    const rows = Math.floor(Math.random() * 5 + 2);

    this.width = columns * 30;

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        this.invaders.push(
          new Invader({
            position: {
              x: x * 30,
              y: y * 30
            }
          })
        );
      }
    }
  }

  update(canvasWidth) {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.velocity.y = 0;

    if (this.position.x + this.width >= canvasWidth || this.position.x <= 0) {
      this.velocity.x = -this.velocity.x * 1.15;
      this.velocity.y = 30;
    }
  }
}

class InvaderProjectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.width = 3;
    this.height = 10;
  }

  draw(ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }

  update(ctx) {
    this.draw(ctx);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Particle {
  constructor({ position, velocity, radius, color, fades }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
    this.fades = fades;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  update(ctx) {
    this.draw(ctx);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.fades) this.opacity -= 0.01;
  }
}

// Audio setup exactly matching original
const audio = {
  backgroundMusic: new Howl({
    src: ['./audio/backgroundMusic.wav'],
    loop: true
  }),
  bomb: new Howl({
    src: ['./audio/bomb.mp3']
  }),
  bonus: new Howl({
    src: ['./audio/bonus.mp3'],
    volume: 0.8
  }),
  enemyShoot: new Howl({
    src: ['./audio/enemyShoot.wav']
  }),
  explode: new Howl({
    src: ['./audio/explode.wav']
  }),
  gameOver: new Howl({
    src: ['./audio/gameOver.mp3']
  }),
  select: new Howl({
    src: ['./audio/select.mp3']
  }),
  shoot: new Howl({
    src: ['./audio/shoot.wav']
  }),
  start: new Howl({
    src: ['./audio/start.mp3']
  })
};

// Utility functions
const randomBetween = (min, max) => {
  return Math.random() * (max - min) + min;
};

const createScoreLabel = ({ score = 100, object }, parentRef) => {
  const scoreLabel = document.createElement('label');
  scoreLabel.innerHTML = score;
  scoreLabel.style.position = 'absolute';
  scoreLabel.style.color = 'white';
  scoreLabel.style.top = object.position.y + 'px';
  scoreLabel.style.left = object.position.x + 'px';
  scoreLabel.style.userSelect = 'none';
  parentRef.current.appendChild(scoreLabel);

  gsap.to(scoreLabel, {
    opacity: 0,
    y: -30,
    duration: 0.75,
    onComplete: () => {
      parentRef.current.removeChild(scoreLabel);
    }
  });
};

const rectangularCollision = ({ rectangle1, rectangle2 }) => {
  return (
    rectangle1.position.y + rectangle1.height >= rectangle2.position.y &&
    rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
    rectangle1.position.x <= rectangle2.position.x + rectangle2.width
  );
};

const createParticles = ({ object, color, fades }, particles) => {
  for (let i = 0; i < 15; i++) {
    particles.push(
      new Particle({
        position: {
          x: object.position.x + object.width / 2,
          y: object.position.y + object.height / 2
        },
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2
        },
        radius: Math.random() * 3,
        color: color || '#BAA0DE',
        fades
      })
    );
  }
};

const SpaceInvaders = () => {
    const canvasRef = useRef(null);
    const parentRef = useRef(null);
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);
    const [gameState, setGameState] = useState('start');
    const [isLoading, setIsLoading] = useState(true);
  

  // Game state refs
  const player1Ref = useRef(null);
  const player2Ref = useRef(null);
  const projectiles1Ref = useRef([]);
  const projectiles2Ref = useRef([]);
  const gridsRef = useRef([]);
  const invaderProjectilesRef = useRef([]);
  const particlesRef = useRef([]);
  const bombsRef = useRef([]);
  const powerUpsRef = useRef([]);
  const framesRef = useRef(0);
  const spawnBufferRef = useRef(500);
  const gameLoopRef = useRef(null);
  const lastTimeRef = useRef(0);
  const fpsInterval = 1000 / 60;

  const keysRef = useRef({
    a: { pressed: false },
    d: { pressed: false },
    left: { pressed: false },
    right: { pressed: false },
    space: { pressed: false },
    p: { pressed: false },
    shift: { pressed: false }
  });

  const initGame = () => {
    const canvas = canvasRef.current;
    
    player1Ref.current = new Player({
      position: { x: canvas.width / 4, y: canvas.height - 100 },
      color: 'red'
    });
    
    player2Ref.current = new Player({
      position: { x: (canvas.width / 4) * 3, y: canvas.height - 100 },
      color: 'blue'
    });

    projectiles1Ref.current = [];
    projectiles2Ref.current = [];
    gridsRef.current = [];
    invaderProjectilesRef.current = [];
    particlesRef.current = [];
    bombsRef.current = [];
    powerUpsRef.current = [];
    framesRef.current = 0;
    spawnBufferRef.current = 500;
    
    setScore1(0);
    setScore2(0);

    // Create initial stars
    for (let i = 0; i < 100; i++) {
      particlesRef.current.push(
        new Particle({
          position: {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
          },
          velocity: {
            x: 0,
            y: 0.3
          },
          radius: Math.random() * 2,
          color: 'white'
        })
      );
    }
  };

  const endGame = () => {
    audio.gameOver.play();

    // Makes player1 disappear
    if (score1 > score2) {
      player1Ref.current.opacity = 1;
      player2Ref.current.opacity = 0;
    } else if (score1 < score2) {
      player1Ref.current.opacity = 0;
      player2Ref.current.opacity = 1;
    } else {
      player1Ref.current.opacity = 1;
      player2Ref.current.opacity = 1;
    }

    // Create explosion particles
    createParticles({
      object: player1Ref.current,
      color: 'red',
      fades: true
    }, particlesRef.current);

    createParticles({
      object: player2Ref.current,
      color: 'blue',
      fades: true
    }, particlesRef.current);

    // stops game altogether
    setTimeout(() => {
      setGameState('over');
    }, 2000);
  };

  const animate = (currentTime) => {
    if (gameState !== 'playing') return;

    const elapsed = currentTime - lastTimeRef.current;

    if (elapsed < fpsInterval) {
      gameLoopRef.current = requestAnimationFrame(animate);
      return;
    }

    lastTimeRef.current = currentTime - (elapsed % fpsInterval);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update power-ups
    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const powerUp = powerUpsRef.current[i];

      if (powerUp.position.x - powerUp.radius >= canvas.width) {
        powerUpsRef.current.splice(i, 1);
      } else {
        powerUp.update(ctx);
      }
    }

    // Spawn power-ups
    if (framesRef.current % 500 === 0) {
      powerUpsRef.current.push(
        new PowerUp({
          position: {
            x: 0,
            y: Math.random() * 300 + 15
          },
          velocity: {
            x: 5,
            y: 0
          }
        })
      );
    }

    // Spawn bombs
    if (framesRef.current % 200 === 0 && bombsRef.current.length < 3) {
      bombsRef.current.push(
        new Bomb({
          position: {
            x: randomBetween(Bomb.radius, canvas.width - Bomb.radius),
            y: randomBetween(Bomb.radius, canvas.height - Bomb.radius)
          },
          velocity: {
            x: (Math.random() - 0.5) * 6,
            y: (Math.random() - 0.5) * 6
          }
        })
      );
    }

    // Update bombs
    for (let i = bombsRef.current.length - 1; i >= 0; i--) {
      const bomb = bombsRef.current[i];
      if (bomb.opacity <= 0) {
        bombsRef.current.splice(i, 1);
      } else {
        bomb.update(ctx, canvas);
      }
    }

    // Update players
    player1Ref.current?.update(ctx);
    player2Ref.current?.update(ctx);

    // Update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const particle = particlesRef.current[i];
      
      if (particle.position.y - particle.radius >= canvas.height) {
        particle.position.x = Math.random() * canvas.width;
        particle.position.y = -particle.radius;
      }

      if (particle.opacity <= 0) {
        setTimeout(() => {
          particlesRef.current.splice(i, 1);
        }, 0);
      } else {
        particle.update(ctx);
      }
    }

    // Update invader projectiles
    invaderProjectilesRef.current.forEach((invaderProjectile, index) => {
      if (invaderProjectile.position.y + invaderProjectile.height >= canvas.height) {
        setTimeout(() => {
          invaderProjectilesRef.current.splice(index, 1);
        }, 0);
      } else {
        invaderProjectile.update(ctx);
      }

      // Projectile hits player1
      if (rectangularCollision({
        rectangle1: invaderProjectile,
        rectangle2: player1Ref.current
      })) {
        invaderProjectilesRef.current.splice(index, 1);
        endGame();
      }

      // Projectile hits player2
      if (rectangularCollision({
        rectangle1: invaderProjectile,
        rectangle2: player2Ref.current
      })) {
        invaderProjectilesRef.current.splice(index, 1);
        endGame();
      }
    });

    // Update player projectiles
    const updateProjectiles = (projectiles, playerNum) => {
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];

        // Check bomb collisions
        for (let j = bombsRef.current.length - 1; j >= 0; j--) {
          const bomb = bombsRef.current[j];
          if (
            Math.hypot(
              projectile.position.x - bomb.position.x,
              projectile.position.y - bomb.position.y
            ) < projectile.radius + bomb.radius &&
            !bomb.active
          ) {
            projectiles.splice(i, 1);
            bomb.explode();
            break;
          }
        }

        // Check power-up collisions
        for (let j = powerUpsRef.current.length - 1; j >= 0; j--) {
          const powerUp = powerUpsRef.current[j];
          if (
            Math.hypot(
              projectile.position.x - powerUp.position.x,
              projectile.position.y - powerUp.position.y
            ) < projectile.radius + powerUp.radius
          ) {
            projectiles.splice(i, 1);
            powerUpsRef.current.splice(j, 1);
            const player = playerNum === 1 ? player1Ref.current : player2Ref.current;
            player.powerUp = 'MachineGun';
            audio.bonus.play();

            setTimeout(() => {
              player.powerUp = null;
            }, 5000);
            break;
          }
        }

        if (projectile.position.y + projectile.radius <= 0) {
          projectiles.splice(i, 1);
        } else {
          projectile.update(ctx);
        }
      }
    };

    updateProjectiles(projectiles1Ref.current, 1);
    updateProjectiles(projectiles2Ref.current, 2);

    // Update grids
    gridsRef.current.forEach((grid, gridIndex) => {
      grid.update(canvas.width);

      // Random invader shooting
      if (framesRef.current % 100 === 0 && grid.invaders.length > 0) {
        grid.invaders[Math.floor(Math.random() * grid.invaders.length)]
          .shoot(invaderProjectilesRef.current);
      }

      // Update invaders
      for (let i = grid.invaders.length - 1; i >= 0; i--) {
        const invader = grid.invaders[i];
        invader.update(ctx, grid.velocity);

        // Check bomb collisions
        for (let j = bombsRef.current.length - 1; j >= 0; j--) {
          const bomb = bombsRef.current[j];
          const invaderRadius = 15;

          if (
            Math.hypot(
              invader.position.x - bomb.position.x,
              invader.position.y - bomb.position.y
            ) < invaderRadius + bomb.radius &&
            bomb.active
          ) {
            setScore1(prev => prev + 50);
            grid.invaders.splice(i, 1);
            createScoreLabel({
              object: invader,
              score: 50
            }, parentRef);
            createParticles({
              object: invader,
              fades: true
            }, particlesRef.current);
            break;
          }
        }

        // Check projectile collisions
        const checkProjectileCollisions = (projectiles, playerNum) => {
          projectiles.forEach((projectile, j) => {
            if (
              projectile.position.y - projectile.radius <= invader.position.y + invader.height &&
              projectile.position.x + projectile.radius >= invader.position.x &&
              projectile.position.x - projectile.radius <= invader.position.x + invader.width &&
              projectile.position.y + projectile.radius >= invader.position.y
            ) {
              setTimeout(() => {
                const invaderFound = grid.invaders.find(invader2 => invader2 === invader);
                const projectileFound = projectiles.find(projectile2 => projectile2 === projectile);

                if (invaderFound && projectileFound) {
                  if (playerNum === 1) {
                    setScore1(prev => prev + 100);
                  } else {
                    setScore2(prev => prev + 100);
                  }

                  createScoreLabel({
                    object: invader,
                    score: 100
                  }, parentRef);

                  createParticles({
                    object: invader,
                    fades: true
                  }, particlesRef.current);

                  audio.explode.play();
                  grid.invaders.splice(i, 1);
                  projectiles.splice(j, 1);

                  if (grid.invaders.length > 0) {
                    const firstInvader = grid.invaders[0];
                    const lastInvader = grid.invaders[grid.invaders.length - 1];

                    grid.width = lastInvader.position.x - firstInvader.position.x + lastInvader.width;
                    grid.position.x = firstInvader.position.x;
                  } else {
                    gridsRef.current.splice(gridIndex, 1);
                  }
                }
              }, 0);
            }
          });
        };

        checkProjectileCollisions(projectiles1Ref.current, 1);
        checkProjectileCollisions(projectiles2Ref.current, 2);

        // Check player collision
        if (rectangularCollision({
          rectangle1: invader,
          rectangle2: player1Ref.current
        }) || rectangularCollision({
          rectangle1: invader,
          rectangle2: player2Ref.current
        })) {
          endGame();
        }
      }
    });

    // Player movement
    const movePlayer = (player, leftKey, rightKey) => {
      if (keysRef.current[leftKey].pressed && player.position.x >= 0) {
        player.velocity.x = -7;
        player.rotation = -0.15;
      } else if (keysRef.current[rightKey].pressed && player.position.x + player.width <= canvas.width) {
        player.velocity.x = 7;
        player.rotation = 0.15;
      } else {
        player.velocity.x = 0;
        player.rotation = 0;
      }
    };

    movePlayer(player1Ref.current, 'a', 'd');
    movePlayer(player2Ref.current, 'left', 'right');

    // Spawn enemies
    if (framesRef.current % 100 === 0) {
      spawnBufferRef.current = spawnBufferRef.current < 0 ? 100 : spawnBufferRef.current;
      gridsRef.current.push(new Grid());
      spawnBufferRef.current -= 100;
    }

    // Machine gun power-up shooting
    if (keysRef.current.space.pressed && player1Ref.current.powerUp === 'MachineGun' && framesRef.current % 2 === 0) {
      if (framesRef.current % 6 === 0) audio.shoot.play();
      projectiles1Ref.current.push(
        new Projectile({
          position: {
            x: player1Ref.current.position.x + player1Ref.current.width / 2,
            y: player1Ref.current.position.y
          },
          velocity: { x: 0, y: -10 },
          color: 'yellow'
        })
      );
    }

    if (keysRef.current.shift.pressed && player2Ref.current.powerUp === 'MachineGun' && framesRef.current % 2 === 0) {
      if (framesRef.current % 6 === 0) audio.shoot.play();
      projectiles2Ref.current.push(
        new Projectile({
          position: {
            x: player2Ref.current.position.x + player2Ref.current.width / 2,
            y: player2Ref.current.position.y
          },
          velocity: { x: 0, y: -10 },
          color: 'blue'
        })
      );
    }

    framesRef.current++;
    gameLoopRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 1024;
    canvas.height = 576;
    
    // Set the initial black background
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const handleKeyDown = ({ key }) => {
      if (gameState !== 'playing') return;

      switch (key) {
        case 'a':
          keysRef.current.a.pressed = true;
          break;
        case 'd':
          keysRef.current.d.pressed = true;
          break;
        case ' ':
          keysRef.current.space.pressed = true;
          if (player1Ref.current.powerUp === 'MachineGun') return;

          audio.shoot.play();
          projectiles1Ref.current.push(
            new Projectile({
              position: {
                x: player1Ref.current.position.x + player1Ref.current.width / 2,
                y: player1Ref.current.position.y
              },
              velocity: { x: 0, y: -10 },
              color: 'red'
            })
          );
          break;
        case 'ArrowLeft':
          keysRef.current.left.pressed = true;
          break;
        case 'ArrowRight':
          keysRef.current.right.pressed = true;
          break;
        case 'Shift':
          keysRef.current.shift.pressed = true;
          if (player2Ref.current.powerUp === 'MachineGun') return;

          audio.shoot.play();
          projectiles2Ref.current.push(
            new Projectile({
              position: {
                x: player2Ref.current.position.x + player2Ref.current.width / 2,
                y: player2Ref.current.position.y
              },
              velocity: { x: 0, y: -10 },
              color: 'blue'
            })
          );
          break;
      }
    };

    const handleKeyUp = ({ key }) => {
      switch (key) {
        case 'a':
          keysRef.current.a.pressed = false;
          break;
        case 'd':
          keysRef.current.d.pressed = false;
          break;
        case ' ':
          keysRef.current.space.pressed = false;
          break;
        case 'ArrowLeft':
          keysRef.current.left.pressed = false;
          break;
        case 'ArrowRight':
          keysRef.current.right.pressed = false;
          break;
        case 'Shift':
          keysRef.current.shift.pressed = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  const startGame = () => {
    audio.backgroundMusic.play();
    audio.start.play();
    setGameState('playing');
    
    // Ensure canvas is ready before initializing
    const canvas = canvasRef.current;
    if (canvas) {
      initGame();
      lastTimeRef.current = window.performance.now();
      animate(lastTimeRef.current);
    }
  };

  const restartGame = () => {
    audio.select.play();
    setGameState('playing');
    initGame();
    lastTimeRef.current = window.performance.now();
    animate(lastTimeRef.current);
  };

  return (
    <div className="m-0 flex justify-center items-center bg-black min-h-screen">
      <div className="relative" ref={parentRef}>
        <p
          className={`absolute z-10 text-white left-2 top-2 m-0 ${
            gameState === 'playing' ? 'block' : 'hidden'
          }`}
          id="scoreContainer"
        >
          <span>Score:</span> <span id="scoreEl1">{score1}</span>
          <span className="ml-4">Score:</span> <span id="scoreEl2">{score2}</span>
        </p>
        
        <canvas 
          ref={canvasRef} 
          width={1024}
          height={576}
          className="bg-black"
        />

        {gameState === 'start' && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `url('/img/startScreenBackground.png')`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="text-center">
              <h1 className="text-white text-4xl mb-8">Space Invaders</h1>
              <button
                onClick={startGame}
                className="relative inline-block cursor-pointer bg-transparent border-none p-0"
              >
                <img 
                  src="/img/button.png" 
                  alt="Start Button" 
                  className="w-40"
                />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
                  Start
                </span>
              </button>
            </div>
          </div>
        )}

        {gameState === 'over' && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `url('/img/startScreenBackground.png')`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="text-center">
              <h1 className="text-white text-2xl">Game Over</h1>
              <h1 className="text-white m-0 text-5xl">{score1}</h1>
              <p className="text-white mt-0">Points</p>
              <button
                onClick={restartGame}
                className="relative inline-block cursor-pointer bg-transparent border-none p-0"
              >
                <img 
                  src="/img/button.png" 
                  alt="Restart Button" 
                  className="w-40"
                />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
                  Restart
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceInvaders;
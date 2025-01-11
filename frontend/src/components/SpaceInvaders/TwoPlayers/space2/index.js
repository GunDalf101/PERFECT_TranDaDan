const scoreEl1 = document.querySelector('#scoreEl1')
const scoreEl2 = document.querySelector('#scoreEl2')
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

let player1 = new Player({
  position: { x: canvas.width / 4, y: canvas.height - 100 },
  color: 'red'
})
let player2 = new Player({
  position: { x: (canvas.width / 4) * 3, y: canvas.height - 100 },
  color: 'blue'
})
let projectiles1 = []
let projectiles2 = []
let grids = []
let invaderProjectiles = []
let particles = []
let bombs = []
let powerUps = []

let keys = {
  a: {
    pressed: false
  },
  d: {
    pressed: false
  },
  left: {
    pressed: false
  },
  right: {
    pressed: false
  },
  space: {
    pressed: false
  },
  p: {
    pressed: false
  },
  shift: {
    pressed: false
  }
}

let frames = 0
let randomInterval = Math.floor(Math.random() * 500 + 500)
let game = {
  over: false,
  active: true
}
let score1 = 0
let score2 = 0

let spawnBuffer = 500
let fps = 60
let fpsInterval = 1000 / fps
let msPrev = window.performance.now()

function init() {
  let player1 = new Player({
    position: { x: canvas.width / 4, y: canvas.height - 100 },
    color: 'red'
  })
  let player2 = new Player({
    position: { x: (canvas.width / 4) * 3, y: canvas.height - 100 },
    color: 'blue'
  })
  projectiles1 = []
  projectiles2 = []
  grids = []
  invaderProjectiles = []
  particles = []
  bombs = []
  powerUps = []

  keys = {
    a: {
      pressed: false
    },
    d: {
      pressed: false
    },
    left: {
      pressed: false
    },
    right: {
      pressed: false
    },
    space: {
      pressed: false
    },
    p: {
      pressed: false
    },
    shift: {
      pressed: false
    }
  }

  frames = 0
  randomInterval = Math.floor(Math.random() * 500 + 500)
  game = {
    over: false,
    active: true
  }
  score1 = 0
  score2 = 0
  document.querySelector('#finalScore').innerHTML = score1
  document.querySelector('#scoreEl1').innerHTML = score1
  document.querySelector('#scoreEl2').innerHTML = score2

  for (let i = 0; i < 100; i++) {
    particles.push(
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
    )
  }
}

function endGame() {
  audio.gameOver.play()

  // Makes player1 disappear
  if (score1 > score2) {
    player1.opacity = 1
    player2.opacity = 0
  } else if (score1 < score2) {
    player1.opacity = 0
    player2.opacity = 1
  } else {
    player1.opacity = 1
    player2.opacity = 1
  }

  // stops game altogether
  setTimeout(() => {
    game.active = false
    document.querySelector('#restartScreen').style.display = 'flex'
    document.querySelector('#finalScore').innerHTML = score1
  }, 2000)

  createParticles({
    object: player1,
    color: 'red',
    fades: true
  })

  createParticles({
    object: player2,
    color: 'blue',
    fades: true
  })
}

function animate() {
  if (!game.active) return
  requestAnimationFrame(animate)

  const msNow = window.performance.now()
  const elapsed = msNow - msPrev

  if (elapsed < fpsInterval) return

  msPrev = msNow - (elapsed % fpsInterval)

  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i]

    if (powerUp.position.x - powerUp.radius >= canvas.width)
      powerUps.splice(i, 1)
    else powerUp.update()
  }

  // spawn powerups
  if (frames % 500 === 0) {
    powerUps.push(
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
    )
  }

  // spawn bombs
  if (frames % 200 === 0 && bombs.length < 3) {
    bombs.push(
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
    )
  }

  for (let i = bombs.length - 1; i >= 0; i--) {
    const bomb = bombs[i]

    if (bomb.opacity <= 0) {
      bombs.splice(i, 1)
    } else bomb.update()
  }

  player1.update()
  player2.update()

  for (let i = player1.particles.length - 1; i >= 0; i--) {
    const particle = player1.particles[i]
    particle.update()

    if (particle.opacity === 0) player1.particles[i].splice(i, 1)
  }

  for (let i = player2.particles.length - 1; i >= 0; i--) {
    const particle = player2.particles[i]
    particle.update()

    if (particle.opacity === 0) player2.particles[i].splice(i, 1)
  }

  particles.forEach((particle, i) => {
    if (particle.position.y - particle.radius >= canvas.height) {
      particle.position.x = Math.random() * canvas.width
      particle.position.y = -particle.radius
    }

    if (particle.opacity <= 0) {
      setTimeout(() => {
        particles.splice(i, 1)
      }, 0)
    } else {
      particle.update()
    }
  })

  invaderProjectiles.forEach((invaderProjectile, index) => {
    if (
      invaderProjectile.position.y + invaderProjectile.height >=
      canvas.height
    ) {
      setTimeout(() => {
        invaderProjectiles.splice(index, 1)
      }, 0)
    } else invaderProjectile.update()

    // projectile hits player1
    if (
      rectangularCollision({
        rectangle1: invaderProjectile,
        rectangle2: player1
      })
    ) {
      invaderProjectiles.splice(index, 1)
      endGame()
    }

    // projectile hits player2
    if (
      rectangularCollision({
        rectangle1: invaderProjectile,
        rectangle2: player2
      })
    ) {
      invaderProjectiles.splice(index, 1)
      endGame()
    }
  })

  for (let i = projectiles1.length - 1; i >= 0; i--) {
    const projectile = projectiles1[i]

    for (let j = bombs.length - 1; j >= 0; j--) {
      const bomb = bombs[j]
      if (
        Math.hypot(
          projectile.position.x - bomb.position.x,
          projectile.position.y - bomb.position.y
        ) <
        projectile.radius + bomb.radius &&
        !bomb.active
      ) {
        projectiles1.splice(i, 1)
        bomb.explode()
      }
    }

    for (let j = powerUps.length - 1; j >= 0; j--) {
      const powerUp = powerUps[j]
      if (
        Math.hypot(
          projectile.position.x - powerUp.position.x,
          projectile.position.y - powerUp.position.y
        ) <
        projectile.radius + powerUp.radius
      ) {
        projectiles1.splice(i, 1)
        powerUps.splice(j, 1)
        player1.powerUp = 'MachineGun'
        console.log('powerup started')
        audio.bonus.play()

        setTimeout(() => {
          player1.powerUp = null
          console.log('powerup ended')
        }, 5000)
      }

    }

    if (projectile.position.y + projectile.radius <= 0) {
      projectiles1.splice(i, 1)
    } else {
      projectile.update()
    }
  }

  for (let i = projectiles2.length - 1; i >= 0; i--) {
    const projectile = projectiles2[i]
  
    for (let j = bombs.length - 1; j >= 0; j--) {
      const bomb = bombs[j]
      if (
        Math.hypot(
          projectile.position.x - bomb.position.x,
          projectile.position.y - bomb.position.y
        ) <
        projectile.radius + bomb.radius &&
        !bomb.active
      ) {
        projectiles2.splice(i, 1)
        bomb.explode()
      }
    }
  
    for (let j = powerUps.length - 1; j >= 0; j--) {
      const powerUp = powerUps[j]

      if (
        Math.hypot(
          projectile.position.x - powerUp.position.x,
          projectile.position.y - powerUp.position.y
        ) <
        projectile.radius + powerUp.radius
      ) {
        projectiles2.splice(i, 1)
        powerUps.splice(j, 1)
        player2.powerUp = 'MachineGun'
        console.log('powerup started for player 2')
        audio.bonus.play()
  
        setTimeout(() => {
          player2.powerUp = null
          console.log('powerup ended for player 2')
        }, 5000)
      }
    }
  
    if (projectile.position.y + projectile.radius <= 0) {
      projectiles2.splice(i, 1)
    } else {
      projectile.update()
    }
  }

  grids.forEach((grid, gridIndex) => {
    grid.update()

    if (frames % 100 === 0 && grid.invaders.length > 0) {
      grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(
        invaderProjectiles
      )
    }

    for (let i = grid.invaders.length - 1; i >= 0; i--) {
      const invader = grid.invaders[i]
      invader.update({ velocity: grid.velocity })

      for (let j = bombs.length - 1; j >= 0; j--) {
        const bomb = bombs[j]

        const invaderRadius = 15

        if (
          Math.hypot(
            invader.position.x - bomb.position.x,
            invader.position.y - bomb.position.y
          ) <
          invaderRadius + bomb.radius &&
          bomb.active
        ) {
          score1 += 50
          scoreEl1.innerHTML = score1

          grid.invaders.splice(i, 1)
          createScoreLabel({
            object: invader,
            score1: 50
          })

          createParticles({
            object: invader,
            fades: true
          })
        }
      }

      projectiles1.forEach((projectile, j) => {
        if (
          projectile.position.y - projectile.radius <=
          invader.position.y + invader.height &&
          projectile.position.x + projectile.radius >= invader.position.x &&
          projectile.position.x - projectile.radius <=
          invader.position.x + invader.width &&
          projectile.position.y + projectile.radius >= invader.position.y
        ) {
          setTimeout(() => {
            const invaderFound = grid.invaders.find(
              (invader2) => invader2 === invader
            )
            const projectileFound = projectiles1.find(
              (projectile2) => projectile2 === projectile
            )

            if (invaderFound && projectileFound) {
              score1 += 100
              scoreEl1.innerHTML = score1

              createScoreLabel({
                object: invader
              })

              createParticles({
                object: invader,
                fades: true
              })

              audio.explode.play()
              grid.invaders.splice(i, 1)
              projectiles1.splice(j, 1)

              if (grid.invaders.length > 0) {
                const firstInvader = grid.invaders[0]
                const lastInvader = grid.invaders[grid.invaders.length - 1]

                grid.width =
                  lastInvader.position.x -
                  firstInvader.position.x +
                  lastInvader.width
                grid.position.x = firstInvader.position.x
              } else {
                grids.splice(gridIndex, 1)
              }
            }
          }, 0)
        }
      })

      projectiles2.forEach((projectile, j) => {
        if (
          projectile.position.y - projectile.radius <=
          invader.position.y + invader.height &&
          projectile.position.x + projectile.radius >= invader.position.x &&
          projectile.position.x - projectile.radius <=
          invader.position.x + invader.width &&
          projectile.position.y + projectile.radius >= invader.position.y
        ) {
          setTimeout(() => {
            const invaderFound = grid.invaders.find(
              (invader2) => invader2 === invader
            )
            const projectileFound = projectiles2.find(
              (projectile2) => projectile2 === projectile
            )
      
            if (invaderFound && projectileFound) {
              score2 += 100
              scoreEl2.innerHTML = score2
      
              createScoreLabel({
                object: invader,
                score: 100
              })
      
              createParticles({
                object: invader,
                fades: true
              })
      
              audio.explode.play()
              grid.invaders.splice(i, 1)
              projectiles2.splice(j, 1)
      
              if (grid.invaders.length > 0) {
                const firstInvader = grid.invaders[0]
                const lastInvader = grid.invaders[grid.invaders.length - 1]
      
                grid.width =
                  lastInvader.position.x -
                  firstInvader.position.x +
                  lastInvader.width
                grid.position.x = firstInvader.position.x
              } else {
                grids.splice(gridIndex, 1)
              }
            }
          }, 0)
        }
      })

      if (
        rectangularCollision({
          rectangle1: invader,
          rectangle2: player1
        }) &&
        !game.over
      )
        endGame()
    }
  })

  if (keys.a.pressed && player1.position.x >= 0) {
    player1.velocity.x = -7
    player1.rotation = 0
  } else if (
    keys.d.pressed &&
    player1.position.x + player1.width <= canvas.width
  ) {
    player1.velocity.x = 7
    player1.rotation = 0
  } else {
    player1.velocity.x = 0
    player1.rotation = 0
  }

  if (keys.left.pressed && player2.position.x >= 0) {
    player2.velocity.x = -7
    player2.rotation = 0
  } else if (keys.right.pressed && player2.position.x + player2.width <= canvas.width) {
    player2.velocity.x = 7
    player2.rotation = 0
  } else {
    player2.velocity.x = 0
    player2.rotation = 0
  }

  // spawning enemies
  if (frames % randomInterval === 0) {
    spawnBuffer = spawnBuffer < 0 ? 100 : spawnBuffer
    grids.push(new Grid())
    randomInterval = Math.floor(Math.random() * 500 + spawnBuffer)
    frames = 0
    spawnBuffer -= 100
  }

  if (
    keys.space.pressed &&
    player1.powerUp === 'MachineGun' &&
    frames % 2 === 0 &&
    !game.over
  ) {
    if (frames % 6 === 0) audio.shoot.play()
    projectiles1.push(
      new Projectile({
        position: {
          x: player1.position.x + player1.width / 2,
          y: player1.position.y
        },
        velocity: {
          x: 0,
          y: -10
        },
        color: 'yellow'
      })
    )
  }
  if (
    keys.shift.pressed &&
    player2.powerUp === 'MachineGun' &&
    frames % 2 === 0 &&
    !game.over
  ) {
    if (frames % 6 === 0) audio.shoot.play()
    projectiles2.push(
      new Projectile({
        position: {
          x: player2.position.x + player2.width / 2,
          y: player2.position.y
        },
        velocity: {
          x: 0,
          y: -10
        },
        color: 'blue'
      })
    )
  }

  frames++
}

document.querySelector('#startButton').addEventListener('click', () => {
  audio.backgroundMusic.play()
  audio.start.play()

  document.querySelector('#startScreen').style.display = 'none'
  document.querySelector('#scoreContainer').style.display = 'block'
  init()
  animate()
})

document.querySelector('#restartButton').addEventListener('click', () => {
  audio.select.play()
  document.querySelector('#restartScreen').style.display = 'none'
  init()
  animate()
})

addEventListener('keydown', ({ key }) => {
  if (game.over) return

  switch (key) {
    case 'a':
      keys.a.pressed = true
      break
    case 'd':
      keys.d.pressed = true
      break
    case ' ':
      keys.space.pressed = true

      if (player1.powerUp === 'MachineGun') return

      audio.shoot.play()
      projectiles1.push(
        new Projectile({
          position: {
            x: player1.position.x + player1.width / 2,
            y: player1.position.y
          },
          velocity: {
            x: 0,
            y: -10
          }
        })
      )

      break
    case 'ArrowLeft':
      keys.left.pressed = true
      break
    case 'ArrowRight':
      keys.right.pressed = true
      break
    case 'Shift':
      keys.shift.pressed = true
      if (player2.powerUp === 'MachineGun') return

      audio.shoot.play()
      projectiles2.push(
        new Projectile({
          position: {
            x: player2.position.x + player2.width / 2,
            y: player2.position.y
          },
          velocity: {
            x: 0,
            y: -10
          },
          color: 'blue'
        })
      )
      break
  }
})

addEventListener('keyup', ({ key }) => {
  switch (key) {
    case 'a':
      keys.a.pressed = false
      break
    case 'd':
      keys.d.pressed = false
      break
    case ' ':
      keys.space.pressed = false

      break
    case 'ArrowLeft':
      keys.left.pressed = false
      break
    case 'ArrowRight':
      keys.right.pressed = false
      break
    case 'Shift':
      keys.shift.pressed = false
      break
  }
})

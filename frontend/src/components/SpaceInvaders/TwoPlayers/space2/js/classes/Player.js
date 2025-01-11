class Player {
  constructor({ position = { x: canvas.width / 2, y: canvas.height - 100 }, color = 'white' } = {}) {
    this.velocity = {
      x: 0,
      y: 0
    }

    this.rotation = 0
    this.opacity = 1

    const image = new Image()
    image.src = './img/spaceship.png'
    image.onload = () => {
      const scale = 0.15
      this.image = image
      this.width = image.width * scale
      this.height = image.height * scale
      this.position = position  
    }

    this.particles = []
    this.frames = 0
  }

  draw() {
    // c.fillStyle = 'red'
    // c.fillRect(this.position.x, this.position.y, this.width, this.height)

    c.save()
    c.globalAlpha = this.opacity
    c.translate(
      player1.position.x + player1.width / 2,
      player1.position.y + player1.height / 2
    )
    c.rotate(this.rotation)

    c.translate(
      -player1.position.x - player1.width / 2,
      -player1.position.y - player1.height / 2
    )

    c.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    )
    c.restore()
  }

  update() {
    if (!this.image) return

    this.draw()
    this.position.x += this.velocity.x

    if (this.opacity !== 1) return

    this.frames++
    if (this.frames % 2 === 0) {
      this.particles.push(
        new Particle({
          position: {
            x: this.position.x + this.width / 2,
            y: this.position.y + this.height
          },
          velocity: {
            x: (Math.random() - 0.5) * 1.5,
            y: 1.4
          },
          radius: Math.random() * 2,
          color: 'white',
          fades: true
        })
      )
    }
  }
}

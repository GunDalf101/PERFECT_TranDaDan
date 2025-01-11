// Player.js
export class Player {
  constructor({ position, velocity, color = 'red' }) {
    this.position = position;
    this.velocity = velocity || { x: 0, y: 0 };
    this.rotation = 0;
    this.opacity = 1;
    this.color = color;
    this.powerUp = null;

    const image = new Image();
    image.src = `/spaceShip.png`;
    image.onload = () => {
      const scale = 0.15;
      this.image = image;
      this.width = image.width * scale;
      this.height = image.height * scale;
      this.position = {
        x: position.x,
        y: position.y
      };
    };
  }

  draw(c) {
    c.save();
    c.globalAlpha = this.opacity;
    c.translate(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    );
    c.rotate(this.rotation);
    c.translate(
      -this.position.x - this.width / 2,
      -this.position.y - this.height / 2
    );

    if (this.image) {
      c.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }
    c.restore();
  }

  update(c) {
    if (this.image) {
      this.draw(c);
      this.position.x += this.velocity.x;
    }
  }
}

// Projectile.js
export class Projectile {
  constructor({ position, velocity, color = 'white' }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 4;
    this.color = color;
  }

  draw(c) {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  }

  update(c) {
    this.draw(c);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

// Particle.js
export class Particle {
  constructor({ position, velocity, radius, color, fades }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
    this.fades = fades;
  }

  draw(c) {
    c.save();
    c.globalAlpha = this.opacity;
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
    c.restore();
  }

  update(c) {
    this.draw(c);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.fades) this.opacity -= 0.01;
  }
}

// InvaderProjectile.js
export class InvaderProjectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.width = 3;
    this.height = 10;
  }

  draw(c) {
    c.fillStyle = 'white';
    c.fillRect(this.position.x, this.position.y, this.width, this.height);
  }

  update(c) {
    this.draw(c);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

// PowerUp.js
export class PowerUp {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 15;
  }

  draw(c) {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = 'yellow';
    c.fill();
    c.strokeStyle = 'white';
    c.lineWidth = 2;
    c.stroke();
    c.closePath();
  }

  update(c) {
    this.draw(c);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

// Bomb.js
export class Bomb {
  static radius = 15;

  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = Bomb.radius;
    this.active = false;
    this.opacity = 1;
  }

  draw(c) {
    c.save();
    c.globalAlpha = this.opacity;
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.closePath();
    c.fillStyle = this.active ? 'red' : 'gray';
    c.fill();
    c.restore();
  }

  update(c) {
    this.draw(c);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Bounce off walls
    if (
      this.position.x + this.radius >= c.canvas.width ||
      this.position.x - this.radius <= 0
    ) {
      this.velocity.x = -this.velocity.x;
    }
    if (
      this.position.y + this.radius >= c.canvas.height ||
      this.position.y - this.radius <= 0
    ) {
      this.velocity.y = -this.velocity.y;
    }
  }

  explode() {
    this.active = true;
    this.velocity = { x: 0, y: 0 };
    setTimeout(() => {
      this.opacity = 0;
    }, 150);
  }
}

// Grid.js
export class Grid {
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

  update(c) {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    this.velocity.y = 0;

    if (this.position.x + this.width >= c.canvas.width || this.position.x <= 0) {
      this.velocity.x = -this.velocity.x;
      this.velocity.y = 30;
    }
  }
}

// Invader.js
export class Invader {
  constructor({ position }) {
    this.position = position;
    this.velocity = { x: 0, y: 0 };

    const image = new Image();
    image.src = `/invader.png`;
    image.onload = () => {
      const scale = 1;
      this.image = image;
      this.width = image.width * scale;
      this.height = image.height * scale;
      this.position = {
        x: position.x,
        y: position.y
      };
    };
  }

  draw(c) {
    if (this.image) {
      c.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }
  }

  update(c, { velocity }) {
    if (this.image) {
      this.draw(c);
      this.position.x += velocity.x;
      this.position.y += velocity.y;
    }
  }

  shoot(invaderProjectiles) {
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
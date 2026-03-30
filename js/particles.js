export class Particle {
  constructor(x, y, vx, vy, life, color, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  get alpha() {
    return Math.max(0, this.life / this.maxLife);
  }

  get alive() {
    return this.life > 0;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, config) {
    for (let i = 0; i < count; i++) {
      const angle = config.angleMin + Math.random() * (config.angleMax - config.angleMin);
      const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = config.lifeMin + Math.random() * (config.lifeMax - config.lifeMin);
      const size = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      this.particles.push(new Particle(x, y, vx, vy, life, color, size));
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.update(dt);
    }
    this.particles = this.particles.filter(p => p.alive);
  }

  render(ctx, cameraY) {
    for (const p of this.particles) {
      const sy = p.y - cameraY;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x - p.size / 2, sy - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}

export const PARTICLE_CONFIGS = {
  dust: {
    angleMin: -Math.PI, angleMax: 0,
    speedMin: 20, speedMax: 60,
    lifeMin: 0.3, lifeMax: 0.6,
    sizeMin: 2, sizeMax: 4,
    colors: ['#8a7a6a', '#6a5a4a', '#9a8a7a'],
  },
  waterDrip: {
    angleMin: Math.PI * 0.4, angleMax: Math.PI * 0.6,
    speedMin: 30, speedMax: 80,
    lifeMin: 0.5, lifeMax: 1.0,
    sizeMin: 1, sizeMax: 3,
    colors: ['#4488cc', '#66aaee', '#3377bb'],
  },
  magmaSpark: {
    angleMin: -Math.PI, angleMax: 0,
    speedMin: 40, speedMax: 100,
    lifeMin: 0.4, lifeMax: 0.8,
    sizeMin: 2, sizeMax: 4,
    colors: ['#ff6622', '#ff8844', '#ffaa22'],
  },
  steam: {
    angleMin: -Math.PI * 0.8, angleMax: -Math.PI * 0.2,
    speedMin: 30, speedMax: 70,
    lifeMin: 0.6, lifeMax: 1.2,
    sizeMin: 3, sizeMax: 6,
    colors: ['#ffffff44', '#dddddd44', '#cccccc33'],
  },
  metalGlow: {
    angleMin: 0, angleMax: Math.PI * 2,
    speedMin: 10, speedMax: 30,
    lifeMin: 0.5, lifeMax: 1.0,
    sizeMin: 2, sizeMax: 5,
    colors: ['#ffcc4444', '#ffaa2244', '#ff882244'],
  },
};

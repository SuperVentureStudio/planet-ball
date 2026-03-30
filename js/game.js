import { Ball } from './ball.js';
import { getGravity, depthToMeters, BOUNCE_VELOCITY, findLandingPlatform } from './physics.js';
import { PlatformManager } from './platforms.js';
import { getLayerAtDepth } from './layers.js';
import { ComboTracker } from './combo.js';
import { Renderer } from './renderer.js';
import { ParticleSystem, PARTICLE_CONFIGS } from './particles.js';

export class Game {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lastTime = 0;
    this.running = false;

    this.worldWidth = 400;
    this.worldHeight = 700;

    this.cameraY = 0;
    this.ball = new Ball(this.worldWidth / 2, 50);
    this.input = input;
    this.platforms = new PlatformManager(this.worldWidth);
    this._lastPlatformType = 'solid';

    this.state = 'playing';

    this.ceilingY = -200;
    this.ceilingSpeed = 30;
    this.ceilingSpeedTimer = 0;
    this.hurryUpTimer = 0;
    this.depthReached = 0;
    this.combo = new ComboTracker();
    this.renderer = new Renderer(this.ctx, this.worldWidth);
    this.particles = new ParticleSystem();

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.scale = this.canvas.width / this.worldWidth;
    this.worldHeight = this.canvas.height / this.scale;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state !== 'playing') return;

    const depthM = depthToMeters(this.ball.y);
    const layer = getLayerAtDepth(depthM);
    const gravity = layer.gravity;

    // Input
    const horizontal = this.input.getHorizontal();
    const moveAccel = 1500;
    this.ball.vx += horizontal * moveAccel * dt;

    // Horizontal friction — reduced on slippery platforms
    let friction = 0.95;
    if (this.ball.onPlatform && this._lastPlatformType === 'slippery') {
      friction = 0.995;
    }
    this.ball.vx *= Math.pow(friction, dt * 60);

    this.ball.update(dt, gravity, this.worldWidth);

    // Platform collision
    const landed = findLandingPlatform(this.ball, this.platforms.getPlatforms(), dt);
    if (landed) {
      this.ball.land(landed.y);
      landed.onLand();
      this._lastPlatformType = landed.type;

      // Steam vent: apply lateral force
      if (landed.type === 'steam') {
        this.ball.vx += landed.steamForce;
      }

      // Auto-bounce after landing
      this.ball.bounce(BOUNCE_VELOCITY);

      // Track combo
      const avgGap = (layer.platformGap.min + layer.platformGap.max) / 2;
      this.combo.onLand(landed.y, avgGap);

      // Landing particles based on layer
      const pDepth = depthM;
      let pConfig;
      if (pDepth < 100) pConfig = PARTICLE_CONFIGS.dust;
      else if (pDepth < 500) pConfig = PARTICLE_CONFIGS.dust;
      else if (pDepth < 1000) pConfig = PARTICLE_CONFIGS.waterDrip;
      else if (pDepth < 2000) pConfig = PARTICLE_CONFIGS.magmaSpark;
      else pConfig = PARTICLE_CONFIGS.metalGlow;

      this.particles.emit(this.ball.x, landed.y, 6, pConfig);

      if (landed.type === 'steam') {
        this.particles.emit(this.ball.x, landed.y, 8, PARTICLE_CONFIGS.steam);
      }
    }

    // Update platforms
    this.platforms.update(dt, this.cameraY, this.worldHeight);

    // Camera follows ball
    const targetCameraY = this.ball.y - this.worldHeight * 0.4;
    this.cameraY = Math.max(this.cameraY, targetCameraY);

    // Ceiling chase
    this.ceilingY += this.ceilingSpeed * dt;
    this.ceilingSpeedTimer += dt;

    if (this.ceilingSpeedTimer >= 30) {
      this.ceilingSpeedTimer -= 30;
      this.ceilingSpeed += 15;
      this.hurryUpTimer = 2.0;
    }

    if (this.hurryUpTimer > 0) {
      this.hurryUpTimer -= dt;
    }

    // Track max depth
    const currentDepth = depthToMeters(this.ball.y);
    this.depthReached = Math.max(this.depthReached, currentDepth);
    this.combo.update(dt, currentDepth);
    this.particles.update(dt);

    // Death: ceiling catches ball
    if (this.ball.y - this.ball.radius < this.ceilingY) {
      this.state = 'dead';
    }

    // Death: ball falls off bottom of screen
    if (this.ball.y - this.cameraY > this.worldHeight + 100) {
      this.state = 'dead';
    }
  }

  render() {
    const { ctx, scale, renderer, ball, cameraY, worldWidth, worldHeight } = this;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const depthM = depthToMeters(ball.y);
    const layer = getLayerAtDepth(depthM);

    renderer.drawBackground(cameraY, worldHeight);
    renderer.drawPlatforms(this.platforms.getPlatforms(), cameraY, worldHeight, depthM);
    renderer.drawCeiling(this.ceilingY, cameraY, worldWidth);
    renderer.drawBall(ball, cameraY);
    this.particles.render(ctx, cameraY);
    renderer.drawHUD(depthM, layer.name, this.combo.getTotalScore(), this.combo, this.hurryUpTimer, worldWidth, worldHeight);
  }
}

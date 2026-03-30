import { Ball } from './ball.js';
import { getGravity, depthToMeters, BOUNCE_VELOCITY, findLandingPlatform } from './physics.js';
import { Input } from './input.js';
import { PlatformManager } from './platforms.js';
import { getLayerAtDepth } from './layers.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lastTime = 0;
    this.running = false;

    this.worldWidth = 400;
    this.worldHeight = 700;

    this.cameraY = 0;
    this.ball = new Ball(this.worldWidth / 2, 50);
    this.input = new Input();
    this.platforms = new PlatformManager(this.worldWidth);
    this._lastPlatformType = 'solid';

    this.state = 'playing';

    this.ceilingY = -200;
    this.ceilingSpeed = 30;
    this.ceilingSpeedTimer = 0;
    this.hurryUpTimer = 0;
    this.depthReached = 0;

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
    const { ctx, scale, ball, cameraY } = this;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const depthM = depthToMeters(ball.y);
    const layer = getLayerAtDepth(depthM);

    // Background
    ctx.fillStyle = layer.bgColor;
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Draw platforms
    const platforms = this.platforms.getPlatforms();
    for (const p of platforms) {
      const py = p.y - this.cameraY;
      if (py < -20 || py > this.worldHeight + 20) continue;

      let color = layer.platformColor;
      if (p.type === 'crumbly' && p.crumbleTimer > 0) {
        color = p.crumbleTimer % 0.2 > 0.1 ? '#ff4444' : layer.platformColor;
      } else if (p.type === 'slippery') {
        color = '#6688bb';
      } else if (p.type === 'steam') {
        color = '#cc5522';
      } else if (p.type === 'moving') {
        color = '#ddaa33';
      }

      ctx.fillStyle = color;
      ctx.fillRect(p.x, py, p.width, p.height);

      ctx.fillStyle = layer.platformTopColor;
      ctx.fillRect(p.x, py, p.width, 2);
    }

    // Draw ceiling (death zone)
    const ceilScreenY = this.ceilingY - this.cameraY;
    if (ceilScreenY > -10) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.worldWidth, Math.max(0, ceilScreenY));

      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, ceilScreenY - 2, this.worldWidth, 4);
    }

    // Draw ball
    const screenX = ball.x;
    const screenY = ball.y - cameraY;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(ball.rotation);
    ctx.scale(ball.scaleX, ball.scaleY);

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(-3, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Depth HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText(`${Math.floor(depthM)}m`, 10, 20);

    // Layer name
    ctx.fillStyle = '#ffffff88';
    ctx.font = '11px monospace';
    ctx.fillText(layer.name, 10, 38);

    // Hurry up warning
    if (this.hurryUpTimer > 0) {
      ctx.fillStyle = `rgba(255, 50, 50, ${Math.min(this.hurryUpTimer, 1)})`;
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HURRY UP!', this.worldWidth / 2, this.worldHeight / 2 - 40);
      ctx.textAlign = 'left';
    }
  }
}

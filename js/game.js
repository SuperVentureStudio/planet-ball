import { Ball } from './ball.js';
import { getGravity, depthToMeters, BOUNCE_VELOCITY } from './physics.js';
import { Input } from './input.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lastTime = 0;
    this.running = false;

    this.worldWidth = 400;
    this.worldHeight = 700;

    // Camera offset (world Y of the top of the screen)
    this.cameraY = 0;

    // Ball starts near top
    this.ball = new Ball(this.worldWidth / 2, 50);

    this.input = new Input();

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
    const depthM = depthToMeters(this.ball.y);
    const gravity = getGravity(depthM);

    // Apply tilt/keyboard input as horizontal acceleration
    const horizontal = this.input.getHorizontal();
    const moveAccel = 1500; // px/s^2
    this.ball.vx += horizontal * moveAccel * dt;

    // Horizontal friction (air drag)
    this.ball.vx *= Math.pow(0.95, dt * 60);

    this.ball.update(dt, gravity, this.worldWidth);

    // Camera follows ball (ball stays in upper 40% of screen)
    const targetCameraY = this.ball.y - this.worldHeight * 0.4;
    this.cameraY = Math.max(this.cameraY, targetCameraY);
  }

  render() {
    const { ctx, scale, ball, cameraY } = this;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Draw ball (translated by camera)
    const screenX = ball.x;
    const screenY = ball.y - cameraY;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(ball.rotation);
    ctx.scale(ball.scaleX, ball.scaleY);

    // Planet ball — blue with green landmass
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Simple continent detail
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(-3, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Depth HUD
    const depthM = depthToMeters(ball.y);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText(`${Math.floor(depthM)}m`, 10, 20);
  }
}

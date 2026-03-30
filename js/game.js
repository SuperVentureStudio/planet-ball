export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lastTime = 0;
    this.running = false;

    // Game world dimensions (logical pixels, portrait)
    this.worldWidth = 400;
    this.worldHeight = 700;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    // Fill screen, maintain aspect ratio
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Scale to fit world width, let height adapt
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

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap at 50ms
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // Placeholder — will be filled in subsequent tasks
  }

  render() {
    const { ctx, scale } = this;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
  }
}

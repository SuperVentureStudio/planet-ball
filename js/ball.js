export class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;          // horizontal velocity (px/s)
    this.vy = 0;          // vertical velocity (px/s, positive = downward)
    this.radius = 12;
    this.onPlatform = false;

    // Squash/stretch animation
    this.scaleX = 1;
    this.scaleY = 1;
    this.squashTimer = 0;

    // Rotation (visual only)
    this.rotation = 0;
  }

  update(dt, gravity, worldWidth) {
    // Apply gravity (downward)
    this.vy += gravity * dt;

    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Wall bounce
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx) * 0.9; // slight dampening
    } else if (this.x + this.radius > worldWidth) {
      this.x = worldWidth - this.radius;
      this.vx = -Math.abs(this.vx) * 0.9;
    }

    // Rotation based on horizontal velocity
    this.rotation += this.vx * dt * 0.01;

    // Squash/stretch recovery
    if (this.squashTimer > 0) {
      this.squashTimer -= dt;
      const t = this.squashTimer / 0.15; // 150ms animation
      this.scaleX = 1 + 0.3 * t;
      this.scaleY = 1 - 0.2 * t;
    } else {
      // Stretch while falling fast
      const speed = Math.abs(this.vy);
      const stretch = Math.min(speed / 800, 0.2);
      this.scaleX = 1 - stretch * 0.5;
      this.scaleY = 1 + stretch;
    }
  }

  bounce(bounceVelocity) {
    this.vy = -bounceVelocity; // upward
    this.onPlatform = false;
    this.squashTimer = 0.15;   // trigger squash animation
  }

  land(platformY) {
    this.y = platformY - this.radius;
    this.vy = 0;
    this.onPlatform = true;
  }
}

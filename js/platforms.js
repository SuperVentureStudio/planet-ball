import { getLayerAtDepth } from './layers.js';
import { PIXELS_PER_METER } from './physics.js';

export class Platform {
  constructor(x, y, width, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 10;
    this.type = type;
    this.alive = true;

    this.crumbleTimer = -1;

    this.moveSpeed = 0;
    this.moveDir = 1;
    if (type === 'moving') {
      this.moveSpeed = 40 + Math.random() * 60;
      this.moveDir = Math.random() < 0.5 ? -1 : 1;
    }

    this.steamForce = type === 'steam' ? (Math.random() < 0.5 ? -300 : 300) : 0;
  }

  update(dt, worldWidth) {
    if (this.type === 'moving') {
      this.x += this.moveSpeed * this.moveDir * dt;
      if (this.x < 0) {
        this.x = 0;
        this.moveDir = 1;
      } else if (this.x + this.width > worldWidth) {
        this.x = worldWidth - this.width;
        this.moveDir = -1;
      }
    }

    if (this.crumbleTimer > 0) {
      this.crumbleTimer -= dt;
      if (this.crumbleTimer <= 0) {
        this.alive = false;
      }
    }
  }

  onLand() {
    if (this.type === 'crumbly') {
      this.crumbleTimer = 1.0;
    }
  }
}

export class PlatformManager {
  constructor(worldWidth) {
    this.worldWidth = worldWidth;
    this.platforms = [];
    this.lastPlatformY = 0;

    this._generateStartingFloor();
    this._generateAhead(1400);
  }

  _generateStartingFloor() {
    // Narrow starting platform so ball can fall off the edges
    const width = 160;
    const x = (this.worldWidth - width) / 2;
    this.platforms.push(new Platform(x, 80, width, 'solid'));
    this.lastPlatformY = 80;
  }

  _generateAhead(targetWorldY) {
    while (this.lastPlatformY < targetWorldY) {
      const depthM = this.lastPlatformY / PIXELS_PER_METER;
      const layer = getLayerAtDepth(depthM);

      const gap = layer.platformGap.min +
        Math.random() * (layer.platformGap.max - layer.platformGap.min);
      const y = this.lastPlatformY + gap;

      const width = layer.platformWidth.min +
        Math.random() * (layer.platformWidth.max - layer.platformWidth.min);

      const x = Math.random() * (this.worldWidth - width);

      const types = layer.platformTypes;
      const type = types[Math.floor(Math.random() * types.length)];

      this.platforms.push(new Platform(x, y, width, type));
      this.lastPlatformY = y;
    }
  }

  update(dt, cameraY, worldHeight) {
    const aheadY = cameraY + worldHeight + 400;
    if (this.lastPlatformY < aheadY) {
      this._generateAhead(aheadY);
    }

    for (const p of this.platforms) {
      p.update(dt, this.worldWidth);
    }

    const cullY = cameraY - 200;
    this.platforms = this.platforms.filter(p => p.alive && p.y > cullY);
  }

  getPlatforms() {
    return this.platforms;
  }
}

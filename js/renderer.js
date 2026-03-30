import { LAYERS, getLayerAtDepth } from './layers.js';
import { PIXELS_PER_METER } from './physics.js';

export class Renderer {
  constructor(ctx, worldWidth) {
    this.ctx = ctx;
    this.worldWidth = worldWidth;
  }

  drawBackground(cameraY, worldHeight) {
    const { ctx } = this;
    const topDepthM = Math.max(0, cameraY / PIXELS_PER_METER);
    const botDepthM = (cameraY + worldHeight) / PIXELS_PER_METER;

    const topLayer = getLayerAtDepth(topDepthM);
    const botLayer = getLayerAtDepth(botDepthM);

    if (topLayer === botLayer) {
      ctx.fillStyle = topLayer.bgColor;
      ctx.fillRect(0, 0, this.worldWidth, worldHeight);
    } else {
      const transitionDepth = botLayer.startDepth;
      const transitionScreenY = (transitionDepth * PIXELS_PER_METER - cameraY);

      ctx.fillStyle = topLayer.bgColor;
      ctx.fillRect(0, 0, this.worldWidth, transitionScreenY);

      ctx.fillStyle = botLayer.bgColor;
      ctx.fillRect(0, transitionScreenY, this.worldWidth, worldHeight - transitionScreenY);

      const blendH = 40;
      const gradient = ctx.createLinearGradient(0, transitionScreenY - blendH / 2, 0, transitionScreenY + blendH / 2);
      gradient.addColorStop(0, topLayer.bgColor);
      gradient.addColorStop(1, botLayer.bgColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, transitionScreenY - blendH / 2, this.worldWidth, blendH);
    }

    this._drawLayerDecor(cameraY, worldHeight, topDepthM);
  }

  _drawLayerDecor(cameraY, worldHeight, depthM) {
    const { ctx } = this;

    if (depthM < 100) {
      this._drawParallaxDots(cameraY, worldHeight, 0.3, '#444455', 3);
      ctx.fillStyle = '#555566';
      ctx.fillRect(0, 0, 8, worldHeight);
      ctx.fillRect(this.worldWidth - 8, 0, 8, worldHeight);

      // Water drips on side walls
      ctx.fillStyle = '#4488cc44';
      for (let i = 0; i < 8; i++) {
        const hash = ((Math.floor(cameraY * 0.1) + i) * 2654435761) >>> 0;
        const x = (hash % 2 === 0) ? 2 : this.worldWidth - 6;
        const baseY = (hash >> 4) % 300;
        const y = baseY - (cameraY * 0.5 % 300);
        ctx.fillRect(x, y, 4, 8 + (hash >> 12) % 12);
      }
    }

    if (depthM >= 50 && depthM < 500) {
      this._drawParallaxDots(cameraY, worldHeight, 0.2, '#4a3a2a', 2);
    }

    if (depthM >= 400 && depthM < 1000) {
      this._drawParallaxDots(cameraY, worldHeight, 0.15, '#5577aa44', 4);

      // Underground water streams in background
      ctx.fillStyle = '#3366aa22';
      const streamY1 = 200 - (cameraY * 0.08 % 400);
      const streamY2 = 500 - (cameraY * 0.08 % 400);
      ctx.fillRect(0, streamY1, this.worldWidth, 20);
      ctx.fillRect(20, streamY2, this.worldWidth - 40, 15);
    }

    if (depthM >= 900 && depthM < 2000) {
      this._drawParallaxDots(cameraY, worldHeight, 0.1, '#ff440033', 3);
    }

    if (depthM >= 1800) {
      this._drawParallaxDots(cameraY, worldHeight, 0.08, '#ffaa4422', 5);
    }
  }

  _drawParallaxDots(cameraY, worldHeight, parallaxFactor, color, size) {
    const { ctx } = this;
    const offsetY = cameraY * parallaxFactor;
    const seed = Math.floor(offsetY / 200);

    ctx.fillStyle = color;
    for (let i = 0; i < 15; i++) {
      const hash = ((seed + i) * 2654435761) >>> 0;
      const x = (hash % this.worldWidth);
      const baseY = ((hash >> 8) % 400);
      const y = baseY - (offsetY % 400);
      if (y > -size && y < worldHeight + size) {
        ctx.fillRect(x, y, size, size);
      }
    }
  }

  drawPlatforms(platforms, cameraY, worldHeight, depthM) {
    const { ctx } = this;
    const layer = getLayerAtDepth(depthM);

    for (const p of platforms) {
      const py = p.y - cameraY;
      if (py < -20 || py > worldHeight + 20) continue;

      let color = layer.platformColor;
      let topColor = layer.platformTopColor;

      if (p.type === 'crumbly' && p.crumbleTimer > 0) {
        color = p.crumbleTimer % 0.2 > 0.1 ? '#ff4444' : color;
      } else if (p.type === 'slippery') {
        color = '#4477aa';
        topColor = '#88bbee';
      } else if (p.type === 'steam') {
        color = '#884422';
        topColor = '#cc6633';
      } else if (p.type === 'moving') {
        topColor = '#ffcc44';
      }

      ctx.fillStyle = color;
      ctx.fillRect(p.x, py, p.width, p.height);

      ctx.fillStyle = topColor;
      ctx.fillRect(p.x, py, p.width, 2);

      if (p.type === 'steam') {
        ctx.fillStyle = '#ff884488';
        const dir = p.steamForce > 0 ? 1 : -1;
        const ax = dir > 0 ? p.x + p.width + 2 : p.x - 8;
        ctx.fillRect(ax, py + 2, 6, 6);
      }

      // Water pool shimmer on slippery platforms
      if (p.type === 'slippery') {
        ctx.fillStyle = '#4488cc33';
        ctx.fillRect(p.x + 2, py + 2, p.width - 4, p.height - 2);
      }
    }
  }

  drawBall(ball, cameraY) {
    const { ctx } = this;
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

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(-3, -4, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawCeiling(ceilingY, cameraY, worldWidth) {
    const { ctx } = this;
    const ceilScreenY = ceilingY - cameraY;

    if (ceilScreenY > -10) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, worldWidth, Math.max(0, ceilScreenY));

      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, ceilScreenY - 2, worldWidth, 4);

      const gradient = ctx.createLinearGradient(0, ceilScreenY, 0, ceilScreenY + 60);
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, ceilScreenY, worldWidth, 60);
    }
  }

  drawHUD(depthM, layerName, score, combo, hurryUpTimer, worldWidth, worldHeight) {
    const { ctx } = this;

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(depthM)}m`, 10, 20);

    ctx.fillStyle = '#ffffff88';
    ctx.font = '11px monospace';
    ctx.fillText(layerName, 10, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${score}`, worldWidth - 10, 20);
    ctx.textAlign = 'left';

    if (combo.comboDisplayTimer > 0) {
      const alpha = Math.min(combo.comboDisplayTimer, 1);
      ctx.fillStyle = `rgba(255, 220, 50, ${alpha})`;
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(combo.lastComboText, worldWidth / 2, worldHeight * 0.3);
      ctx.textAlign = 'left';
    }

    if (hurryUpTimer > 0) {
      ctx.fillStyle = `rgba(255, 50, 50, ${Math.min(hurryUpTimer, 1)})`;
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HURRY UP!', worldWidth / 2, worldHeight / 2 - 40);
      ctx.textAlign = 'left';
    }
  }
}

export class Screens {
  constructor(ctx, worldWidth, worldHeight) {
    this.ctx = ctx;
    this.w = worldWidth;
    this.h = worldHeight;
  }

  renderStart(highScore) {
    const { ctx, w, h } = this;

    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#444455';
    ctx.fillRect(0, h * 0.45, w, 4);
    ctx.fillRect(0, h * 0.55, w, 4);

    const cx = w / 2;
    const cy = h / 2;
    const r = 60;

    ctx.fillStyle = '#555566';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3a3a4a';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#555566';
    ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      const y = cy + i * 14;
      const halfW = Math.sqrt(r * r - (i * 14) * (i * 14));
      if (halfW > 0) {
        ctx.beginPath();
        ctx.moveTo(cx - halfW, y);
        ctx.lineTo(cx + halfW, y);
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PLANET BALL', cx, h * 0.18);

    ctx.fillStyle = '#aaaacc';
    ctx.font = '14px monospace';
    ctx.fillText('Fall through the Earth', cx, h * 0.24);

    ctx.fillStyle = '#ffffff99';
    ctx.font = '13px monospace';
    ctx.fillText('Tilt to move', cx, h * 0.76);
    ctx.fillText('Tap to drop', cx, h * 0.81);

    if (highScore > 0) {
      ctx.fillStyle = '#ffdd55';
      ctx.font = '12px monospace';
      ctx.fillText(`Best: ${highScore}m`, cx, h * 0.88);
    }

    ctx.textAlign = 'left';
  }

  renderGameOver(depthReached, layerName, totalScore, highScore) {
    const { ctx, w, h } = this;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', cx, h * 0.25);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`${Math.floor(depthReached)}m deep`, cx, h * 0.36);

    ctx.fillStyle = '#aaaacc';
    ctx.font = '14px monospace';
    ctx.fillText(`Reached: ${layerName}`, cx, h * 0.43);

    ctx.fillStyle = '#ffdd55';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`Score: ${totalScore}`, cx, h * 0.53);

    if (totalScore >= highScore) {
      ctx.fillStyle = '#55ff55';
      ctx.font = '14px monospace';
      ctx.fillText('NEW HIGH SCORE!', cx, h * 0.60);
    } else {
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '12px monospace';
      ctx.fillText(`Best: ${highScore}`, cx, h * 0.60);
    }

    ctx.fillStyle = '#ffffff88';
    ctx.font = '14px monospace';
    ctx.fillText('Tap to retry', cx, h * 0.75);

    ctx.textAlign = 'left';
  }

  renderWin(depthReached, totalScore, highScore) {
    const { ctx, w, h } = this;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;

    ctx.fillStyle = '#ffdd55';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU REACHED', cx, h * 0.22);
    ctx.fillText("EARTH'S CORE!", cx, h * 0.28);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('6,371m deep', cx, h * 0.38);

    ctx.fillStyle = '#55ff55';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`Score: ${totalScore}`, cx, h * 0.50);

    if (totalScore >= highScore) {
      ctx.fillStyle = '#ffdd55';
      ctx.font = '14px monospace';
      ctx.fillText('NEW HIGH SCORE!', cx, h * 0.58);
    }

    ctx.fillStyle = '#ffffff88';
    ctx.font = '14px monospace';
    ctx.fillText('Tap to play again', cx, h * 0.75);

    ctx.textAlign = 'left';
  }
}

export class ComboTracker {
  constructor() {
    this.score = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboTimeout = 3.0;
    this.lastLandY = 0;
    this.comboDisplayTimer = 0;
    this.lastComboText = '';
    this.depthScore = 0;
  }

  onLand(platformY, platformGap) {
    if (this.lastLandY === 0) {
      this.lastLandY = platformY;
      return;
    }

    const distance = platformY - this.lastLandY;
    const platformsSkipped = Math.floor(distance / platformGap);

    if (platformsSkipped > 1) {
      this.comboCount += platformsSkipped;
      this.comboTimer = 0;
      const bonus = platformsSkipped * this.comboCount * 10;
      this.score += bonus;
      this.lastComboText = `x${this.comboCount} +${bonus}`;
      this.comboDisplayTimer = 1.5;
    } else {
      if (this.comboCount > 0) {
        this.comboCount = 0;
      }
      this.comboTimer = 0;
    }

    this.lastLandY = platformY;
  }

  update(dt, depthMeters) {
    this.depthScore = Math.floor(depthMeters);

    this.comboTimer += dt;
    if (this.comboTimer >= this.comboTimeout && this.comboCount > 0) {
      this.comboCount = 0;
    }

    if (this.comboDisplayTimer > 0) {
      this.comboDisplayTimer -= dt;
    }
  }

  getTotalScore() {
    return this.depthScore + this.score;
  }
}

export class Input {
  constructor() {
    this.tiltX = 0;           // -1 (left) to 1 (right)
    this.hasTilt = false;
    this.keyLeft = false;
    this.keyRight = false;
    this.tapped = false;
    this.tiltPermissionGranted = false;

    // Touch-drag fallback for when tilt doesn't work
    this._touchStartX = 0;
    this._touchCurrentX = 0;
    this._isTouching = false;
    this._touchHorizontal = 0;

    this._initKeyboard();
    this._initTouch();
  }

  _initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.keyLeft = true;
      if (e.key === 'ArrowRight') this.keyRight = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') this.keyLeft = false;
      if (e.key === 'ArrowRight') this.keyRight = false;
    });
  }

  // Must be called from a user gesture (tap/click)
  async requestTiltPermission() {
    // iOS 13+ needs explicit permission
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const state = await DeviceOrientationEvent.requestPermission();
        if (state === 'granted') {
          this.tiltPermissionGranted = true;
          this._listenTilt();
          return true;
        }
      } catch (e) {
        console.warn('Tilt permission denied:', e);
      }
      return false;
    }

    // Android and other browsers — just try listening
    this._listenTilt();

    // Give it a moment to see if events fire
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.hasTilt) {
          this.tiltPermissionGranted = true;
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  }

  _listenTilt() {
    this._tiltCalibrated = false;
    this._tiltOffset = 0;

    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null) {
        this.hasTilt = true;
        this.tiltPermissionGranted = true;

        if (!this._tiltCalibrated) {
          this._tiltOffset = e.gamma;
          this._tiltCalibrated = true;
        }

        const deadZone = 3;
        let angle = e.gamma - this._tiltOffset;

        if (Math.abs(angle) < deadZone) {
          this.tiltX = 0;
        } else {
          const sign = Math.sign(angle);
          const magnitude = Math.min((Math.abs(angle) - deadZone) / 42, 1);
          this.tiltX = sign * magnitude;
        }
      }
    });
  }

  recalibrate() {
    this._tiltCalibrated = false;
  }

  _initTouch() {
    // Don't preventDefault on touchstart — iOS needs click events to fire
    // for DeviceOrientationEvent.requestPermission() to work
    window.addEventListener('touchstart', (e) => {
      this.tapped = true;
      const touch = e.touches[0];
      this._touchStartX = touch.clientX;
      this._touchCurrentX = touch.clientX;
      this._isTouching = true;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this._isTouching) {
        const touch = e.touches[0];
        this._touchCurrentX = touch.clientX;

        // Map drag distance to -1..1 (60px = full tilt)
        const dx = this._touchCurrentX - this._touchStartX;
        const sensitivity = 60;
        this._touchHorizontal = Math.max(-1, Math.min(1, dx / sensitivity));
      }
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchend', () => {
      this._isTouching = false;
      this._touchHorizontal = 0;
    });

    window.addEventListener('touchcancel', () => {
      this._isTouching = false;
      this._touchHorizontal = 0;
    });
  }

  getHorizontal() {
    // Priority: tilt > touch-drag > keyboard
    if (this.hasTilt) {
      return this.tiltX;
    }
    if (this._isTouching && Math.abs(this._touchHorizontal) > 0.05) {
      return this._touchHorizontal;
    }
    if (this.keyLeft && !this.keyRight) return -1;
    if (this.keyRight && !this.keyLeft) return 1;
    return 0;
  }

  consumeTap() {
    if (this.tapped) {
      this.tapped = false;
      return true;
    }
    return false;
  }
}

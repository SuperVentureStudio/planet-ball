export class Input {
  constructor() {
    this.tiltX = 0;           // -1 (left) to 1 (right)
    this.hasTilt = false;
    this.keyLeft = false;
    this.keyRight = false;
    this.tapped = false;

    this._initKeyboard();
    this._initTilt();
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

  _initTilt() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      this._needsTiltPermission = true;
    } else {
      this._listenTilt();
    }
  }

  requestTiltPermission() {
    if (!this._needsTiltPermission) return Promise.resolve();
    return DeviceOrientationEvent.requestPermission().then((state) => {
      if (state === 'granted') {
        this._listenTilt();
        this._needsTiltPermission = false;
      }
    });
  }

  _listenTilt() {
    this._tiltCalibrated = false;
    this._tiltOffset = 0;

    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null) {
        this.hasTilt = true;

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
    window.addEventListener('touchstart', (e) => {
      this.tapped = true;
      e.preventDefault();
    }, { passive: false });
  }

  getHorizontal() {
    if (this.hasTilt) {
      return this.tiltX;
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

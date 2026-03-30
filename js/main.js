import { Game } from './game.js';
import { Screens } from './screens.js';
import { Input } from './input.js';
import { Audio as GameAudio } from './audio.js';
import { getLayerAtDepth } from './layers.js';
import { depthToMeters } from './physics.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input();
const audio = new GameAudio();

// Warn if landscape
function checkOrientation() {
  if (window.innerWidth > window.innerHeight * 1.2) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const s = canvas.width / 400;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 400, canvas.height / s);
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Please rotate to portrait', 200, canvas.height / s / 2);
    ctx.textAlign = 'left';
    return true;
  }
  return false;
}

window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 200));

let game = null;
let state = 'menu'; // 'menu' | 'requesting_tilt' | 'playing' | 'dead' | 'won'
let highScore = parseInt(localStorage.getItem('planetball_highscore') || '0');
let highDepth = parseInt(localStorage.getItem('planetball_highdepth') || '0');
let tiltRequested = false;

function newGame() {
  game = new Game(canvas, input, audio);
  game.start();
  state = 'playing';
}

async function handleTap() {
  if (state === 'menu') {
    audio.init();

    // On mobile, request tilt permission first (needs user gesture)
    if (!tiltRequested && 'ontouchstart' in window) {
      tiltRequested = true;
      state = 'requesting_tilt';

      try {
        await input.requestTiltPermission();
      } catch (e) {
        // Tilt not available — touch-drag will work as fallback
      }

      // Start game after permission resolved
      newGame();
      return;
    }

    // Desktop or tilt already requested
    newGame();
  } else if (state === 'dead' || state === 'won') {
    state = 'menu';
  }
}

// Use click for iOS permission compatibility (touchstart preventDefault kills click)
// Don't preventDefault on touchstart in main — let click fire through
canvas.addEventListener('click', (e) => {
  e.preventDefault();
  handleTap();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') handleTap();
});

let screens = null;

function tick() {
  if (state === 'requesting_tilt') {
    // Show "requesting permission" state
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const worldWidth = 400;
    const scale = canvas.width / worldWidth;
    const worldHeight = canvas.height / scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, worldWidth, worldHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Allow motion access...', worldWidth / 2, worldHeight / 2);
    ctx.textAlign = 'left';
    requestAnimationFrame(tick);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const worldWidth = 400;
  const scale = canvas.width / worldWidth;
  const worldHeight = canvas.height / scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  screens = new Screens(ctx, worldWidth, worldHeight);

  if (state === 'menu') {
    screens.renderStart(highDepth);
  } else if (state === 'playing' && game) {
    if (game.state === 'dead' || game.state === 'won') {
      state = game.state;
      const score = game.combo.getTotalScore();
      const depth = Math.floor(game.depthReached);
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('planetball_highscore', String(highScore));
      }
      if (depth > highDepth) {
        highDepth = depth;
        localStorage.setItem('planetball_highdepth', String(highDepth));
      }
    }
  } else if ((state === 'dead' || state === 'won') && game) {
    game.render();
    const layerName = getLayerAtDepth(game.depthReached).name;
    if (state === 'won') {
      screens.renderWin(game.depthReached, game.combo.getTotalScore(), highScore);
    } else {
      screens.renderGameOver(game.depthReached, layerName, game.combo.getTotalScore(), highScore);
    }
  }

  requestAnimationFrame(tick);
}

tick();

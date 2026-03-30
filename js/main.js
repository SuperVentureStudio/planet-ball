import { Game } from './game.js';
import { Screens } from './screens.js';
import { Input } from './input.js';
import { getLayerAtDepth } from './layers.js';
import { depthToMeters } from './physics.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input();

let game = null;
let state = 'menu'; // 'menu' | 'playing' | 'dead'
let highScore = parseInt(localStorage.getItem('planetball_highscore') || '0');
let highDepth = parseInt(localStorage.getItem('planetball_highdepth') || '0');

function newGame() {
  game = new Game(canvas, input);
  game.start();
  state = 'playing';
}

function handleTap() {
  if (state === 'menu') {
    input.requestTiltPermission();
    newGame();
  } else if (state === 'dead') {
    state = 'menu';
  }
}

window.addEventListener('touchstart', (e) => { e.preventDefault(); handleTap(); }, { passive: false });
window.addEventListener('click', handleTap);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') handleTap();
});

let screens = null;

function tick() {
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
    // Check if game ended
    if (game.state === 'dead') {
      state = 'dead';
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
  } else if (state === 'dead' && game) {
    game.render();
    const layerName = getLayerAtDepth(game.depthReached).name;
    screens.renderGameOver(game.depthReached, layerName, game.combo.getTotalScore(), highScore);
  }

  requestAnimationFrame(tick);
}

tick();

import { initCA, stepCA, drawCA, getTicks } from './ca.js';
import { initGame, updateGame } from './game.js';
import { initAudio } from './audio.js';
import manifest from '../manifest.json' assert { type: 'json' };

const diag = document.getElementById('diag');
const overlay = document.getElementById('overlay');
let lastTime = performance.now();
let fps = 0;

function startLoop() {
  function frame(now) {
    stepCA();
    updateGame();
    drawCA();
    const ticks = getTicks();
    const delta = now - lastTime;
    fps = delta > 0 ? 1000 / delta : 0;
    lastTime = now;
    if (diag) {
      diag.textContent = `Diagnostics: ticks=${ticks} fps=${fps.toFixed(1)}`;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

async function enableAudioOnce() {
  try {
    if (window.Tone && Tone.context.state !== 'running') {
      await Tone.start();
    }
  } catch (e) {
    console.warn('Audio unlock failed, continuing without sound', e);
  }
  initAudio(manifest.audio);
  if (overlay) overlay.remove();
  window.removeEventListener('pointerdown', enableAudioOnce, true);
  window.removeEventListener('touchstart', enableAudioOnce, true);
  window.removeEventListener('keydown', enableAudioOnce, true);
}

window.addEventListener('pointerdown', enableAudioOnce, true);
window.addEventListener('touchstart', enableAudioOnce, true);
window.addEventListener('keydown', enableAudioOnce, true);

if (navigator.userActivation?.hasBeenActive) {
  enableAudioOnce();
}

window.addEventListener('DOMContentLoaded', () => {
  const caCanvas = document.getElementById('ca');
  const gameEl = document.getElementById('game');
  if (!caCanvas || !gameEl) {
    if (diag) {
      diag.style.color = 'red';
      diag.textContent = 'Error: missing #ca or #game element';
    }
    return;
  }
  initCA(caCanvas, 512, 288);
  initGame(gameEl);
  startLoop();
});

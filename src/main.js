import { initCA, stepCA, getTicks } from './ca.js';
import { initGame } from './game.js';
import { initAudio } from './audio.js';

async function loadManifest() {
  try {
    const res = await fetch('./config/assets.manifest.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('Manifest load failed, continuing with placeholders:', e);
    return { images: {}, audio: {} };
  }
}

const diag = document.getElementById('diag');
let last = performance.now();

function frame(now) {
  const dt = now - last; last = now;
  stepCA(dt);
  if (diag) {
    const fps = (1000 / Math.max(1, dt));
    diag.textContent = `Diagnostics: ticks=${getTicks()} fps=${fps.toFixed(0)}`;
  }
  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', async () => {
  const ca = document.getElementById('ca');
  const game = document.getElementById('game');
  if (!ca || !game) {
    if (diag) { diag.style.color = 'red'; diag.textContent = 'Error: missing #ca or #game'; }
    return;
  }
  initCA(ca, 512, 288);
  initGame(game);
  requestAnimationFrame(frame);

  const manifest = await loadManifest();
  try {
    if (window.Tone && Tone.context.state !== 'running') await Tone.start();
  } catch (e) {
    console.warn('Audio unlock failed:', e);
  }
  initAudio(manifest.audio);
});

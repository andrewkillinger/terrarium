import { createApp } from './rendering/index.js';
import { createEngine } from './physics/index.js';
import { Grid } from './grid/index.js';
import { AudioManager } from './audio/index.js';
import { setupBrushUI } from './ui/brush.js';
import { Villager } from './agents/villager.js';

async function boot() {
  const appDiv = document.getElementById('app');
  const diag = document.getElementById('diagnostics');
  const brushesDiv = document.getElementById('brushes');

  function fail(msg) {
    appDiv.innerHTML = `<pre style="color:red">${msg}</pre>`;
    throw new Error(msg);
  }

  if (!(window.PIXI && PIXI.filters && window.Matter && window.b3 && window.Howl)) {
    fail('Missing libs: PIXI, PIXI.filters, Matter, b3, Howl required');
    return;
  }

  let manifest;
  try {
    const res = await fetch('./config/assets.manifest.json');
    manifest = await res.json();
  } catch (e) {
    fail('Failed to load asset manifest');
    return;
  }

  if (location.protocol === 'https:') {
    const mixed = Object.values(manifest).flat().filter(u => u.startsWith('http://'));
    if (mixed.length) {
      fail('Mixed content in asset manifest');
      return;
    }
  }

  const assetStatus = {};
  await Promise.all(Object.values(manifest).flat().map(async url => {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      assetStatus[url] = res.ok ? 'pass' : 'fail';
    } catch (e) {
      assetStatus[url] = 'fail';
    }
  }));

  const app = createApp();
  appDiv.appendChild(app.view);

  const foliage = manifest.foliage.slice(0, 3);
  const textures = await Promise.all(foliage.map(u => PIXI.Assets.load(u)));
  const tree1 = new PIXI.Sprite(textures[0]);
  tree1.position.set(100, 200);
  const tree2 = new PIXI.Sprite(textures[1]);
  tree2.position.set(200, 200);
  const leaf = new PIXI.Sprite(textures[2]);
  leaf.position.set(150, 100);
  leaf.alpha = 0.7;
  app.stage.addChild(tree1, tree2, leaf);

  if (PIXI.filters && PIXI.filters.AdvancedBloomFilter) {
    const bloom = new PIXI.filters.AdvancedBloomFilter();
    app.stage.filters = [bloom];
  }

  const engine = createEngine();
  const rock = Matter.Bodies.circle(300, 100, 20, { restitution: 0.8 });
  Matter.World.add(engine.world, rock);

  const grid = new Grid(64, 36);
  setupBrushUI(brushesDiv, grid, app);

  const audio = new AudioManager(manifest);
  window.addEventListener('pointerdown', () => audio.start(), { once: true });

  const treeData = await fetch('./ai/trees/villager.json').then(r => r.json());
  const villager = new Villager(engine, grid, treeData);

  const materialsText = await fetch('./data/materials.csv').then(r => r.text());
  const materials = {};
  materialsText.trim().split(/\r?\n/).slice(1).forEach(line => {
    const [id, density, flammability, flow] = line.split(',');
    materials[id] = { density: +density, flammability: +flammability, flow: +flow };
  });

  function updateDiagnostics() {
    const assets = Object.entries(assetStatus).map(([u, s]) => `<div>${s}: ${u}</div>`).join('');
    diag.innerHTML = `FPS: ${Math.round(app.ticker.FPS)}<br>` +
      `Bodies: ${engine.world.bodies.length}<br>` +
      `Grid: ${grid.width}x${grid.height}<br>` +
      `Visibility: ${document.hidden ? 'hidden' : 'visible'}<br>` +
      `<details><summary>Assets</summary>${assets}</details>`;
  }

  document.addEventListener('visibilitychange', () => {
    app.ticker.maxFPS = document.hidden ? 10 : 60;
  });

  app.ticker.add(() => {
    grid.update(materials);
    audio.update(grid.waterCount);
    villager.update();
    Matter.Engine.update(engine, 1000 / 60);
    updateDiagnostics();
  });
}

boot();

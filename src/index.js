import { initRenderer } from './rendering/index.js';
import { initPhysics } from './physics/index.js';
import { createGrid } from './grid/index.js';
import { initAgents } from './agents/index.js';
import { initAudio } from './audio/index.js';
import { initUI } from './ui/index.js';

(function preflight() {
  const missing = [];
  if (!(window.PIXI && PIXI.Application)) missing.push('PIXI');
  if (!window.PIXI?.filters) missing.push('PIXI.filters (pixi-filters UMD)');
  if (!(window.Matter && Matter.Engine)) missing.push('Matter.js');
  if (!(window.b3 && b3.BehaviorTree)) missing.push('Behavior3JS');
  if (!window.Howl) missing.push('Howler.js');

  if (missing.length) {
    const el = document.createElement('pre');
    el.textContent = 'Dependency check failed:\n' + missing.join('\n');
    el.style.cssText = 'color:#fff;background:#111;padding:12px;position:absolute;inset:12px;overflow:auto;';
    document.body.appendChild(el);
    throw new Error('Missing deps: ' + missing.join(', '));
  }

  console.log('Pixi', PIXI.VERSION, 'filters', Object.keys(PIXI.filters || {}));
})();

const app = initRenderer();
const physics = initPhysics(app);
const grid = createGrid(app);
const audio = initAudio();
initAgents(app, physics.engine, grid);
initUI(app, grid, audio);

const alive = new PIXI.Graphics().beginFill(0x4caf50).drawRect(0,0,40,40).endFill();
alive.position.set(10,10);
app.stage.addChild(alive);

app.ticker.add(() => {
  grid.update();
  grid.render();
  physics.render();
});

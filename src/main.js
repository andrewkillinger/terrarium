import { initRenderer } from './rendering/index.js';
import { initPhysics } from './physics/index.js';
import { createGrid } from './grid/index.js';
import { initAgents } from './agents/index.js';
import { initAudio } from './audio/index.js';
import { initUI } from './ui/index.js';

const app = initRenderer();
const physics = initPhysics(app);
const grid = createGrid(app);
const audio = initAudio();
initAgents(app, physics.engine, grid);
initUI(app, grid, audio);

app.ticker.add(() => {
  grid.update();
  grid.render();
  physics.render();
});

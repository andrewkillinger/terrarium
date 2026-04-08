import { ElementId } from './elements/types';
import { createInput, InputState } from './input/Input';
import { startLoop } from './loop';
import { Renderer } from './render/Renderer';
import { buildUi } from './ui/Palette';
import './ui/styles.css';
import { World } from './world/World';

function boot() {
  const canvas = document.getElementById('game') as HTMLCanvasElement | null;
  const uiRoot = document.getElementById('ui') as HTMLElement | null;
  if (!canvas || !uiRoot) throw new Error('missing canvas or ui root');

  const world = new World(Date.now() & 0x7fffffff);
  world.defaultScene();

  const renderer = new Renderer(canvas);

  const state: InputState = {
    tool: { kind: 'element', id: ElementId.SAND },
    brushRadius: 5,
    paused: false,
    speed: 1,
  };

  createInput(canvas, world, renderer, state);

  let fps = 60;
  buildUi(uiRoot, world, state, () => fps);

  startLoop({
    tick: () => world.tick(),
    render: (f) => {
      fps = f;
      renderer.render(world);
    },
    isPaused: () => state.paused,
    speedMultiplier: () => state.speed,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

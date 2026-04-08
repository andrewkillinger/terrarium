import { CreatureKind } from '../creatures/Creature';
import { ElementId } from '../elements/types';
import type { Renderer } from '../render/Renderer';
import type { World } from '../world/World';
import { paintLine, spawnCreature } from './Brush';

export type Tool =
  | { kind: 'element'; id: number }
  | { kind: 'creature'; creatureKind: CreatureKind };

export type InputState = {
  tool: Tool;
  brushRadius: number;
  paused: boolean;
  speed: number;
};

export function createInput(canvas: HTMLCanvasElement, world: World, renderer: Renderer, state: InputState) {
  let drawing = false;
  let erasing = false;
  let lastX = -1;
  let lastY = -1;

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = renderer.clientToGrid(e.clientX, e.clientY);
    if (e.button === 2) {
      erasing = true;
    } else {
      drawing = true;
    }
    lastX = x;
    lastY = y;
    applyStroke(x, y, true);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drawing && !erasing) return;
    const { x, y } = renderer.clientToGrid(e.clientX, e.clientY);
    applyStroke(x, y, false);
    lastX = x;
    lastY = y;
  });

  const endStroke = (e: PointerEvent) => {
    drawing = false;
    erasing = false;
    lastX = lastY = -1;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // capture may have been released already
    }
  };
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);

  function applyStroke(x: number, y: number, isFirst: boolean) {
    if (state.tool.kind === 'creature') {
      if (isFirst && drawing) spawnCreature(world, state.tool.creatureKind, x, y);
      return;
    }
    const id = erasing ? ElementId.EMPTY : state.tool.id;
    if (isFirst || lastX < 0) {
      paintLine(world, x, y, x, y, state.brushRadius, id);
    } else {
      paintLine(world, lastX, lastY, x, y, state.brushRadius, id);
    }
  }

  // Keyboard shortcuts.
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    switch (e.key) {
      case ' ':
        state.paused = !state.paused;
        e.preventDefault();
        break;
      case 'c':
      case 'C':
        world.clear();
        break;
      case 'r':
      case 'R':
        world.defaultScene();
        break;
      case '[':
        state.brushRadius = Math.max(1, state.brushRadius - 1);
        break;
      case ']':
        state.brushRadius = Math.min(20, state.brushRadius + 1);
        break;
      case '+':
      case '=':
        state.speed = Math.min(4, state.speed + 0.5);
        break;
      case '-':
      case '_':
        state.speed = Math.max(0.25, state.speed - 0.25);
        break;
    }
  });
}

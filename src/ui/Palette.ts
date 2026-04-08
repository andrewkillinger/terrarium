import { CREATURE_DEFS, CreatureKind } from '../creatures/Creature';
import { ELEMENTS } from '../elements/registry';
import { Category, ElementId } from '../elements/types';
import type { InputState, Tool } from '../input/Input';
import type { World } from '../world/World';

// Convert the renderer's 0xAABBGGRR packed color into a CSS hex color.
function colorToCss(color: number): string {
  const r = color & 0xff;
  const g = (color >>> 8) & 0xff;
  const b = (color >>> 16) & 0xff;
  return `rgb(${r}, ${g}, ${b})`;
}

const CATEGORY_ORDER: { cat: Category; label: string }[] = [
  { cat: Category.SOLID, label: 'Solids' },
  { cat: Category.LIQUID, label: 'Liquids' },
  { cat: Category.GAS, label: 'Gases' },
  { cat: Category.PLANT, label: 'Plants' },
  { cat: Category.EXPLOSIVE, label: 'Explosives' },
];

export function buildUi(
  root: HTMLElement,
  world: World,
  state: InputState,
  getFps: () => number,
): void {
  root.innerHTML = '';

  const h = document.createElement('h2');
  h.textContent = 'Terrarium';
  root.appendChild(h);

  const fps = document.createElement('div');
  fps.className = 'fps';
  fps.textContent = 'FPS —';
  root.appendChild(fps);

  // Element buttons by category.
  const buttons: { el: HTMLButtonElement; tool: Tool }[] = [];

  for (const { cat, label } of CATEGORY_ORDER) {
    const lbl = document.createElement('div');
    lbl.className = 'section-label';
    lbl.textContent = label;
    root.appendChild(lbl);
    const grid = document.createElement('div');
    grid.className = 'element-grid';
    root.appendChild(grid);
    for (const el of ELEMENTS) {
      if (!el || el.category !== cat) continue;
      if (el.id === ElementId.EMPTY || el.id === ElementId.WALL) continue;
      const btn = document.createElement('button');
      btn.className = 'element-btn';
      const swatch = document.createElement('div');
      swatch.className = 'swatch';
      swatch.style.background = colorToCss(el.color);
      btn.appendChild(swatch);
      const name = document.createElement('span');
      name.textContent = el.name;
      btn.appendChild(name);
      const tool: Tool = { kind: 'element', id: el.id };
      btn.addEventListener('click', () => {
        state.tool = tool;
        refreshSelection();
      });
      grid.appendChild(btn);
      buttons.push({ el: btn, tool });
    }
  }

  // Creatures.
  const clbl = document.createElement('div');
  clbl.className = 'section-label';
  clbl.textContent = 'Creatures';
  root.appendChild(clbl);
  const cgrid = document.createElement('div');
  cgrid.className = 'element-grid';
  root.appendChild(cgrid);
  const creatureKinds: CreatureKind[] = [
    CreatureKind.ANT,
    CreatureKind.FISH,
    CreatureKind.BIRD,
    CreatureKind.WORM,
    CreatureKind.FROG,
    CreatureKind.BEETLE,
  ];
  for (const kind of creatureKinds) {
    const def = CREATURE_DEFS[kind];
    const btn = document.createElement('button');
    btn.className = 'element-btn';
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.background = def.color;
    btn.appendChild(swatch);
    const name = document.createElement('span');
    name.textContent = def.name;
    btn.appendChild(name);
    const tool: Tool = { kind: 'creature', creatureKind: kind };
    btn.addEventListener('click', () => {
      state.tool = tool;
      refreshSelection();
    });
    cgrid.appendChild(btn);
    buttons.push({ el: btn, tool });
  }

  // Controls.
  const controls = document.createElement('div');
  controls.className = 'controls';
  root.appendChild(controls);

  const brushRow = document.createElement('div');
  brushRow.className = 'row';
  brushRow.innerHTML = '<label>Brush</label>';
  const brushInput = document.createElement('input');
  brushInput.type = 'range';
  brushInput.min = '1';
  brushInput.max = '20';
  brushInput.value = String(state.brushRadius);
  const brushVal = document.createElement('div');
  brushVal.className = 'value';
  brushVal.textContent = String(state.brushRadius);
  brushInput.addEventListener('input', () => {
    state.brushRadius = Number(brushInput.value);
    brushVal.textContent = String(state.brushRadius);
  });
  brushRow.appendChild(brushInput);
  brushRow.appendChild(brushVal);
  controls.appendChild(brushRow);

  const speedRow = document.createElement('div');
  speedRow.className = 'row';
  speedRow.innerHTML = '<label>Speed</label>';
  const speedInput = document.createElement('input');
  speedInput.type = 'range';
  speedInput.min = '0.25';
  speedInput.max = '4';
  speedInput.step = '0.25';
  speedInput.value = String(state.speed);
  const speedVal = document.createElement('div');
  speedVal.className = 'value';
  speedVal.textContent = state.speed + 'x';
  speedInput.addEventListener('input', () => {
    state.speed = Number(speedInput.value);
    speedVal.textContent = state.speed + 'x';
  });
  speedRow.appendChild(speedInput);
  speedRow.appendChild(speedVal);
  controls.appendChild(speedRow);

  const btnRow = document.createElement('div');
  btnRow.className = 'btn-row';
  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'btn';
  pauseBtn.textContent = 'Pause';
  pauseBtn.addEventListener('click', () => {
    state.paused = !state.paused;
  });
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn';
  clearBtn.textContent = 'Clear';
  clearBtn.addEventListener('click', () => world.clear());
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn';
  resetBtn.textContent = 'Reset';
  resetBtn.addEventListener('click', () => world.defaultScene());
  btnRow.appendChild(pauseBtn);
  btnRow.appendChild(clearBtn);
  btnRow.appendChild(resetBtn);
  controls.appendChild(btnRow);

  // Refresh loop for dynamic UI bits (FPS, pause state, brush/speed sync).
  function refreshSelection() {
    for (const b of buttons) {
      const selected = toolsEqual(b.tool, state.tool);
      b.el.classList.toggle('selected', selected);
    }
  }

  function tick() {
    fps.textContent = 'FPS ' + getFps().toFixed(0);
    pauseBtn.classList.toggle('active', state.paused);
    pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
    if (Number(brushInput.value) !== state.brushRadius) {
      brushInput.value = String(state.brushRadius);
      brushVal.textContent = String(state.brushRadius);
    }
    if (Number(speedInput.value) !== state.speed) {
      speedInput.value = String(state.speed);
      speedVal.textContent = state.speed + 'x';
    }
    refreshSelection();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  refreshSelection();
}

function toolsEqual(a: Tool, b: Tool): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'element' && b.kind === 'element') return a.id === b.id;
  if (a.kind === 'creature' && b.kind === 'creature') return a.creatureKind === b.creatureKind;
  return false;
}

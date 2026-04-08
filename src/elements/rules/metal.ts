import type { World } from '../../world/World';
import { Category, ElementDef, ElementId } from '../types';

export function registerMetal(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.METAL,
    name: 'Metal',
    category: Category.SOLID,
    color: 0xffb0b0b8,
    flammable: false,
    density: 230,
    update(world, x, y, i) {
      const g = world.grid;
      // Melt if very hot.
      if (g.temp[i] > 1500) {
        g.id[i] = ElementId.LAVA;
        g.life[i] = 255;
        return;
      }
      // Conduct heat: average with one random neighbor per tick (cheap).
      conductHeat(world, x, y, i);
    },
  });
}

function conductHeat(world: World, x: number, y: number, i: number): void {
  const g = world.grid;
  const w = g.width;
  const h = g.height;
  // Pick one neighbor deterministically from the rng.
  const r = world.rng.int(4);
  let ni = -1;
  if (r === 0 && x > 0) ni = i - 1;
  else if (r === 1 && x < w - 1) ni = i + 1;
  else if (r === 2 && y > 0) ni = i - w;
  else if (r === 3 && y < h - 1) ni = i + w;
  if (ni === -1) return;
  const avg = (g.temp[i] + g.temp[ni]) >> 1;
  g.temp[i] = avg;
  g.temp[ni] = avg;
}

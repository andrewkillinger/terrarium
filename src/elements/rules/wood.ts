import { FLAG_BURNING, GRID_W } from '../../config';
import type { World } from '../../world/World';
import { Category, ElementDef, ElementId } from '../types';

export function registerWood(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.WOOD,
    name: 'Wood',
    category: Category.SOLID,
    color: 0xff1c4a7a,
    flammable: true,
    density: 90,
    update(world, x, y, i) {
      const g = world.grid;
      const burning = (g.flags[i] & FLAG_BURNING) !== 0;
      if (!burning) {
        if (g.temp[i] > 300) {
          g.flags[i] |= FLAG_BURNING;
          g.life[i] = 200;
          return;
        }
        if (hasFireNeighbor(world, x, y, i)) {
          g.flags[i] |= FLAG_BURNING;
          g.life[i] = 200;
        }
        return;
      }
      g.temp[i] = Math.min(1000, g.temp[i] + 6);
      if (world.rng.chance(0.12)) {
        const ai = i - GRID_W;
        if (y > 1 && g.id[ai] === ElementId.EMPTY) {
          g.id[ai] = ElementId.FIRE;
          g.life[ai] = 25;
          g.temp[ai] = 700;
        }
      }
      if (g.life[i] === 0 || world.rng.chance(0.01)) {
        g.id[i] = ElementId.FIRE;
        g.life[i] = 20;
        g.flags[i] &= ~FLAG_BURNING & 0xff;
      } else {
        g.life[i]--;
      }
    },
  });
}

function hasFireNeighbor(world: World, x: number, y: number, i: number): boolean {
  const g = world.grid;
  const w = g.width;
  const h = g.height;
  if (x > 0 && g.id[i - 1] === ElementId.FIRE) return true;
  if (x < w - 1 && g.id[i + 1] === ElementId.FIRE) return true;
  if (y > 0 && g.id[i - w] === ElementId.FIRE) return true;
  if (y < h - 1 && g.id[i + w] === ElementId.FIRE) return true;
  if (x > 0 && y > 0 && g.id[i - w - 1] === ElementId.FIRE) return true;
  if (x < w - 1 && y > 0 && g.id[i - w + 1] === ElementId.FIRE) return true;
  if (x > 0 && y < h - 1 && g.id[i + w - 1] === ElementId.FIRE) return true;
  if (x < w - 1 && y < h - 1 && g.id[i + w + 1] === ElementId.FIRE) return true;
  return false;
}

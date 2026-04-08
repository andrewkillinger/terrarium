import { FLAG_BURNING, GRID_W } from '../../config';
import { tryFlow } from '../helpers';
import { Category, ElementDef, ElementId } from '../types';

export function registerOil(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.OIL,
    name: 'Oil',
    category: Category.LIQUID,
    color: 0xff1a2030, // very dark brown
    flammable: true,
    density: 45, // lighter than water -> floats
    update(world, x, y, i) {
      const g = world.grid;
      const burning = (g.flags[i] & FLAG_BURNING) !== 0;
      if (!burning) {
        if (g.temp[i] > 80) {
          g.flags[i] |= FLAG_BURNING;
          g.life[i] = 100;
          return;
        }
        // Fire neighbor ignites.
        const w = GRID_W;
        if (
          (x > 0 && g.id[i - 1] === ElementId.FIRE) ||
          (x < w - 1 && g.id[i + 1] === ElementId.FIRE) ||
          (y > 0 && g.id[i - w] === ElementId.FIRE) ||
          (y < g.height - 1 && g.id[i + w] === ElementId.FIRE)
        ) {
          g.flags[i] |= FLAG_BURNING;
          g.life[i] = 100;
          return;
        }
      } else {
        g.temp[i] = Math.min(1000, g.temp[i] + 10);
        if (world.rng.chance(0.25)) {
          const ai = i - GRID_W;
          if (y > 1 && g.id[ai] === ElementId.EMPTY) {
            g.id[ai] = ElementId.FIRE;
            g.life[ai] = 25;
            g.temp[ai] = 800;
          }
        }
        if (g.life[i] === 0) {
          g.id[i] = ElementId.FIRE;
          g.life[i] = 18;
          g.flags[i] &= ~FLAG_BURNING & 0xff;
          return;
        }
        g.life[i]--;
      }
      tryFlow(world, x, y, i, 4);
    },
  });
}

import { GRID_W } from '../../config';
import { tryFall } from '../helpers';
import { Category, ElementDef, ElementId } from '../types';

export function registerSeed(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.SEED,
    name: 'Seed',
    category: Category.PLANT,
    color: 0xff20a0e0, // tan
    flammable: true,
    density: 55,
    update(world, x, y, i) {
      const g = world.grid;
      // If resting on dirt/grass with empty above (light), sprout into grass.
      const w = GRID_W;
      if (y < g.height - 1) {
        const below = g.id[i + w];
        const above = y > 0 ? g.id[i - w] : ElementId.EMPTY;
        if ((below === ElementId.DIRT || below === ElementId.GRASS) && above === ElementId.EMPTY) {
          if (world.rng.chance(0.02)) {
            g.id[i] = ElementId.GRASS;
            return;
          }
        }
      }
      tryFall(world, x, y, i);
    },
  });
}

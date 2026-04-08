import { FLAG_BURNING, GRID_W } from '../../config';
import { Category, ElementDef, ElementId } from '../types';

export function registerVine(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.VINE,
    name: 'Vine',
    category: Category.PLANT,
    color: 0xff20a040,
    flammable: true,
    density: 70,
    update(world, x, y, i) {
      const g = world.grid;
      if ((g.flags[i] & FLAG_BURNING) !== 0) {
        if (g.life[i] === 0 || world.rng.chance(0.1)) {
          g.id[i] = ElementId.FIRE;
          g.life[i] = 15;
          g.flags[i] &= ~FLAG_BURNING & 0xff;
          return;
        }
        g.life[i]--;
        return;
      }
      // Life acts as remaining growth budget.
      if (g.life[i] === 0) {
        // Mature vine: small chance to drop a seed sideways.
        if (world.rng.chance(0.001) && x > 0) {
          const si = i - 1;
          if (g.id[si] === ElementId.EMPTY) {
            g.id[si] = ElementId.SEED;
          }
        }
        return;
      }
      // Try to grow up or diagonally up.
      if (world.rng.chance(0.1) && y > 1) {
        const w = GRID_W;
        const choices = [i - w, i - w - 1, i - w + 1];
        const choice = choices[world.rng.int(3)];
        if (g.id[choice] === ElementId.EMPTY) {
          g.id[choice] = ElementId.VINE;
          g.life[choice] = g.life[i] - 1;
          g.life[i] = 0; // this cell is now mature
        }
      }
    },
  });
}

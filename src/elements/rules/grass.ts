import { FLAG_BURNING, GRID_W } from '../../config';
import { Category, ElementDef, ElementId } from '../types';

export function registerGrass(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.GRASS,
    name: 'Grass',
    category: Category.PLANT,
    color: 0xff30c040, // vibrant green
    flammable: true,
    density: 70,
    update(world, _x, y, i) {
      const g = world.grid;
      // Burning behavior.
      if ((g.flags[i] & FLAG_BURNING) !== 0) {
        g.temp[i] = Math.min(800, g.temp[i] + 8);
        if (g.life[i] === 0 || world.rng.chance(0.05)) {
          g.id[i] = ElementId.FIRE;
          g.life[i] = 15;
          g.flags[i] &= ~FLAG_BURNING & 0xff;
          return;
        }
        g.life[i]--;
        return;
      }
      // Needs dirt/grass support below, else wilts.
      const w = GRID_W;
      if (y >= g.height - 1) return;
      const belowId = g.id[i + w];
      if (belowId !== ElementId.DIRT && belowId !== ElementId.GRASS && belowId !== ElementId.STONE) {
        if (world.rng.chance(0.02)) g.id[i] = ElementId.EMPTY;
        return;
      }
      // Occasionally sprout a vine upward.
      if (world.rng.chance(0.002) && y > 1) {
        const ai = i - w;
        if (g.id[ai] === ElementId.EMPTY) {
          g.id[ai] = ElementId.VINE;
          g.life[ai] = 20;
        }
      }
    },
  });
}

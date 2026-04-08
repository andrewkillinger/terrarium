import { GRID_W } from '../../config';
import { Category, ElementDef, ElementId } from '../types';

export function registerIce(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.ICE,
    name: 'Ice',
    category: Category.SOLID,
    color: 0xfff0d0a0, // pale blue-white
    flammable: false,
    density: 85,
    update(world, x, y, i) {
      const g = world.grid;
      // Melt if warm.
      if (g.temp[i] > 0 && world.rng.chance(0.02)) {
        g.id[i] = ElementId.WATER;
        return;
      }
      // Freeze adjacent water if very cold.
      if (g.temp[i] < -5 && world.rng.chance(0.05)) {
        const w = GRID_W;
        const h = g.height;
        const candidates = [
          x > 0 ? i - 1 : -1,
          x < w - 1 ? i + 1 : -1,
          y > 0 ? i - w : -1,
          y < h - 1 ? i + w : -1,
        ];
        for (const ni of candidates) {
          if (ni !== -1 && g.id[ni] === ElementId.WATER) {
            g.id[ni] = ElementId.ICE;
            g.temp[ni] = -10;
            break;
          }
        }
      }
      // Steady cold source.
      if (g.temp[i] > -10) g.temp[i]--;
    },
  });
}

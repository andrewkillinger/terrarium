import { FLAG_BURNING, GRID_W } from '../../config';
import { Category, ElementDef, ElementId } from '../types';

export function registerDynamite(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.DYNAMITE,
    name: 'Dynamite',
    category: Category.EXPLOSIVE,
    color: 0xff2060f0, // orange-red
    flammable: true,
    density: 100,
    update(world, x, y, i) {
      const g = world.grid;
      const burning = (g.flags[i] & FLAG_BURNING) !== 0;
      if (!burning) {
        if (g.temp[i] > 200) {
          g.flags[i] |= FLAG_BURNING;
          g.life[i] = 30;
          return;
        }
        const w = GRID_W;
        const h = g.height;
        const neighbors = [
          x > 0 ? i - 1 : -1,
          x < w - 1 ? i + 1 : -1,
          y > 0 ? i - w : -1,
          y < h - 1 ? i + w : -1,
        ];
        for (const ni of neighbors) {
          if (ni === -1) continue;
          const nid = g.id[ni];
          if (nid === ElementId.FIRE || nid === ElementId.LAVA) {
            g.flags[i] |= FLAG_BURNING;
            g.life[i] = 30;
            return;
          }
        }
        return;
      }
      // Burning fuse: countdown, then big boom.
      g.temp[i] = 500;
      if (g.life[i] === 0) {
        g.id[i] = ElementId.EMPTY;
        world.queueExplosion(x, y, 22, 1000);
        return;
      }
      g.life[i]--;
      // Emit a small puff of fire above to visualize the fuse.
      if (y > 1 && world.rng.chance(0.4)) {
        const ai = i - GRID_W;
        if (g.id[ai] === ElementId.EMPTY) {
          g.id[ai] = ElementId.FIRE;
          g.life[ai] = 6;
          g.temp[ai] = 700;
        }
      }
    },
  });
}

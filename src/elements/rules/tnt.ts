import { FLAG_BURNING, GRID_W } from '../../config';
import { Category, ElementDef, ElementId } from '../types';

export function registerTnt(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.TNT,
    name: 'TNT',
    category: Category.EXPLOSIVE,
    color: 0xff2030d8, // red
    flammable: true,
    density: 100,
    update(world, x, y, i) {
      const g = world.grid;
      // Already burning or very hot -> explode.
      if ((g.flags[i] & FLAG_BURNING) !== 0 || g.temp[i] > 200) {
        g.id[i] = ElementId.EMPTY;
        world.queueExplosion(x, y, 14, 600);
        return;
      }
      // Check for fire/flame neighbor.
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
          g.id[i] = ElementId.EMPTY;
          world.queueExplosion(x, y, 14, 600);
          return;
        }
      }
    },
  });
}

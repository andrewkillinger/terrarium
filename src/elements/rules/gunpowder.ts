import { FLAG_BURNING, GRID_W } from '../../config';
import { tryFall } from '../helpers';
import { Category, ElementDef, ElementId } from '../types';

export function registerGunpowder(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.GUNPOWDER,
    name: 'Powder',
    category: Category.EXPLOSIVE,
    color: 0xff404048,
    flammable: true,
    density: 58,
    update(world, x, y, i) {
      const g = world.grid;
      const burning = (g.flags[i] & FLAG_BURNING) !== 0;
      if (!burning) {
        if (g.temp[i] > 100) {
          g.flags[i] |= FLAG_BURNING;
          g.life[i] = 6;
        } else {
          // Neighbor fire ignites.
          const w = GRID_W;
          const h = g.height;
          if (
            (x > 0 && g.id[i - 1] === ElementId.FIRE) ||
            (x < w - 1 && g.id[i + 1] === ElementId.FIRE) ||
            (y > 0 && g.id[i - w] === ElementId.FIRE) ||
            (y < h - 1 && g.id[i + w] === ElementId.FIRE)
          ) {
            g.flags[i] |= FLAG_BURNING;
            g.life[i] = 6;
          } else {
            tryFall(world, x, y, i);
          }
        }
        return;
      }
      // Burning: pass the flame, tiny explosion, spawn fire.
      g.temp[i] = 600;
      if (g.life[i] === 0) {
        g.id[i] = ElementId.FIRE;
        g.life[i] = 12;
        g.flags[i] &= ~FLAG_BURNING & 0xff;
        // Tiny pop.
        world.queueExplosion(x, y, 2, 100);
        return;
      }
      g.life[i]--;
      // Chain-ignite unburning powder neighbors.
      const w = GRID_W;
      const h = g.height;
      const neighbors = [
        x > 0 ? i - 1 : -1,
        x < w - 1 ? i + 1 : -1,
        y > 0 ? i - w : -1,
        y < h - 1 ? i + w : -1,
        x > 0 && y > 0 ? i - w - 1 : -1,
        x < w - 1 && y > 0 ? i - w + 1 : -1,
        x > 0 && y < h - 1 ? i + w - 1 : -1,
        x < w - 1 && y < h - 1 ? i + w + 1 : -1,
      ];
      for (const ni of neighbors) {
        if (ni === -1) continue;
        if (g.id[ni] === ElementId.GUNPOWDER && (g.flags[ni] & FLAG_BURNING) === 0) {
          g.flags[ni] |= FLAG_BURNING;
          g.life[ni] = 6;
        }
      }
    },
  });
}

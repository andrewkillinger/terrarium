import { FLAG_BURNING, GRID_W } from '../../config';
import { Category, ElementDef, ElementId } from '../types';

export function registerFire(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.FIRE,
    name: 'Fire',
    category: Category.GAS,
    color: 0xff20a0ff, // bright orange-yellow
    flammable: false,
    density: 2,
    update(world, x, y, i) {
      const g = world.grid;
      g.temp[i] = 800;
      if (g.life[i] === 0) {
        // Decay to smoke (sometimes empty).
        if (world.rng.chance(0.6)) {
          g.id[i] = ElementId.SMOKE;
          g.life[i] = 120;
        } else {
          g.id[i] = ElementId.EMPTY;
        }
        return;
      }
      g.life[i]--;

      // Ignite flammable neighbors.
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
        if (nid === ElementId.WATER) {
          g.id[i] = ElementId.STEAM;
          g.life[i] = 120;
          g.id[ni] = ElementId.STEAM;
          g.life[ni] = 120;
          g.temp[ni] = 105;
          return;
        }
        if (nid === ElementId.TNT || nid === ElementId.DYNAMITE) {
          g.temp[ni] = 600;
          continue;
        }
        if (
          nid === ElementId.WOOD ||
          nid === ElementId.OIL ||
          nid === ElementId.GUNPOWDER ||
          nid === ElementId.GRASS ||
          nid === ElementId.VINE ||
          nid === ElementId.SEED
        ) {
          if ((g.flags[ni] & FLAG_BURNING) === 0 && world.rng.chance(0.4)) {
            g.flags[ni] |= FLAG_BURNING;
            if (g.life[ni] === 0) g.life[ni] = 150;
            g.temp[ni] = 500;
          }
        }
      }

      // Rise if there's room above.
      if (y > 1) {
        const ai = i - w;
        if (g.id[ai] === ElementId.EMPTY && world.rng.chance(0.7)) {
          g.id[ai] = ElementId.FIRE;
          g.life[ai] = g.life[i];
          g.temp[ai] = 750;
          g.id[i] = ElementId.SMOKE;
          g.life[i] = 80;
        }
      }
    },
  });
}

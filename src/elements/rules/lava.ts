import { FLAG_BURNING, GRID_W } from '../../config';
import { tryFlow } from '../helpers';
import { Category, ElementDef, ElementId } from '../types';

export function registerLava(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.LAVA,
    name: 'Lava',
    category: Category.LIQUID,
    color: 0xff1050f0, // bright orange (BGR)
    flammable: false,
    density: 120,
    update(world, x, y, i) {
      const g = world.grid;
      g.temp[i] = 1500;
      // Ignite flammable neighbors / vaporize water.
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
      let cold = 0;
      for (const ni of neighbors) {
        if (ni === -1) continue;
        const nid = g.id[ni];
        if (nid === ElementId.WATER) {
          g.id[ni] = ElementId.STEAM;
          g.life[ni] = 180;
          g.temp[ni] = 110;
          g.id[i] = ElementId.STONE;
          g.temp[i] = 600;
          return;
        }
        if (nid === ElementId.ICE) {
          g.id[ni] = ElementId.WATER;
          continue;
        }
        if (nid === ElementId.SAND) {
          g.id[ni] = ElementId.GLASS;
          continue;
        }
        const nel = nid;
        // Light flammables on fire.
        if (nel === ElementId.WOOD || nel === ElementId.OIL || nel === ElementId.GUNPOWDER || nel === ElementId.GRASS || nel === ElementId.VINE || nel === ElementId.SEED) {
          g.flags[ni] |= FLAG_BURNING;
          if (g.life[ni] === 0) g.life[ni] = 150;
          g.temp[ni] = 700;
        }
        // Empty cell above -> occasional fire
        if (nel === ElementId.EMPTY && world.rng.chance(0.05)) {
          g.id[ni] = ElementId.FIRE;
          g.life[ni] = 20;
          g.temp[ni] = 800;
        }
        if (nel === ElementId.STONE || nel === ElementId.WALL || nel === ElementId.BRICK) cold++;
      }
      // Cool to stone if mostly surrounded by solids and low life.
      if (cold >= 5 && world.rng.chance(0.01)) {
        g.id[i] = ElementId.STONE;
        g.temp[i] = 600;
        return;
      }
      tryFlow(world, x, y, i, 1);
    },
  });
}

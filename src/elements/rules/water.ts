import { GRID_W } from '../../config';
import { tryFlow } from '../helpers';
import { Category, ElementDef, ElementId } from '../types';

export function registerWater(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.WATER,
    name: 'Water',
    category: Category.LIQUID,
    color: 0xffe87020, // deep blue (BGR)
    flammable: false,
    density: 50,
    update(world, x, y, i) {
      const g = world.grid;
      // Freeze if very cold.
      if (g.temp[i] < -5 && world.rng.chance(0.05)) {
        g.id[i] = ElementId.ICE;
        return;
      }
      // Interact with neighbors: lava -> stone+steam, fire -> steam.
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
        if (nid === ElementId.LAVA) {
          g.id[ni] = ElementId.STONE;
          g.temp[ni] = 800;
          g.id[i] = ElementId.STEAM;
          g.life[i] = 180;
          g.temp[i] = 110;
          return;
        }
        if (nid === ElementId.FIRE) {
          g.id[ni] = ElementId.STEAM;
          g.life[ni] = 120;
          g.temp[ni] = 105;
          g.id[i] = ElementId.STEAM;
          g.life[i] = 120;
          g.temp[i] = 105;
          return;
        }
      }
      // Evaporate if very hot.
      if (g.temp[i] > 100) {
        g.id[i] = ElementId.STEAM;
        g.life[i] = 180;
        return;
      }
      tryFlow(world, x, y, i, 5);
    },
  });
}

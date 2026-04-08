import { GRID_W } from '../../config';
import { tryFlow } from '../helpers';
import { Category, ElementDef, ElementId } from '../types';

export function registerAcid(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.ACID,
    name: 'Acid',
    category: Category.LIQUID,
    color: 0xff30f080, // bright green
    flammable: false,
    density: 55,
    update(world, x, y, i) {
      const g = world.grid;
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
        if (
          nid === ElementId.EMPTY ||
          nid === ElementId.WALL ||
          nid === ElementId.GLASS ||
          nid === ElementId.METAL ||
          nid === ElementId.ACID ||
          nid === ElementId.WATER ||
          nid === ElementId.STEAM ||
          nid === ElementId.SMOKE ||
          nid === ElementId.FIRE
        ) continue;
        if (world.rng.chance(0.15)) {
          g.id[ni] = ElementId.EMPTY;
          g.id[i] = ElementId.EMPTY;
          return;
        }
      }
      tryFlow(world, x, y, i, 4);
    },
  });
}

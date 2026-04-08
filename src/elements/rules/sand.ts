import { tryFall } from '../helpers';
import { Category, ElementDef, ElementId } from '../types';

export function registerSand(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.SAND,
    name: 'Sand',
    category: Category.SOLID,
    color: 0xff4fc6e4, // sandy yellow (BGR)
    flammable: false,
    density: 60,
    update(world, x, y, i) {
      // Sand falls and slides diagonally; if directly above lava, fuse into glass.
      const g = world.grid;
      const below = g.id[i + g.width];
      if (below === ElementId.LAVA) {
        g.id[i] = ElementId.GLASS;
        return;
      }
      tryFall(world, x, y, i);
    },
  });
}

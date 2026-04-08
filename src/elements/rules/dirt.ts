import { tryFall } from '../helpers';
import { Category, ElementDef, ElementId } from '../types';

export function registerDirt(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.DIRT,
    name: 'Dirt',
    category: Category.SOLID,
    color: 0xff2a4868, // brown (BGR: R=0x68, G=0x48, B=0x2a)
    flammable: false,
    density: 65,
    update(world, x, y, i) {
      // Dirt mostly stays put but will fall straight down if unsupported.
      const g = world.grid;
      const below = g.id[i + g.width];
      if (below === ElementId.EMPTY || below === ElementId.WATER) {
        tryFall(world, x, y, i);
      }
    },
  });
}

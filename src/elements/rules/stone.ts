import { Category, ElementDef, ElementId } from '../types';

export function registerStone(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.STONE,
    name: 'Stone',
    category: Category.SOLID,
    color: 0xff6b6b6b, // grey
    flammable: false,
    density: 200,
    update(world, _x, _y, i) {
      // Stone melts above 1200°C.
      const g = world.grid;
      if (g.temp[i] > 1200) {
        g.id[i] = ElementId.LAVA;
        g.life[i] = 255;
      }
    },
  });
}

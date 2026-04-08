import { tryRise } from '../helpers';
import { Category, ElementDef, ElementId } from '../types';

export function registerSmoke(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.SMOKE,
    name: 'Smoke',
    category: Category.GAS,
    color: 0xff404048,
    flammable: false,
    density: 3,
    update(world, x, y, i) {
      const g = world.grid;
      if (g.life[i] === 0) {
        g.id[i] = ElementId.EMPTY;
        return;
      }
      g.life[i]--;
      tryRise(world, x, y, i);
    },
  });
}

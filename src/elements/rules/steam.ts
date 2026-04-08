import { tryRise } from '../helpers';
import { Category, ElementDef, ElementId } from '../types';

export function registerSteam(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.STEAM,
    name: 'Steam',
    category: Category.GAS,
    color: 0xffc0c0c0,
    flammable: false,
    density: 5,
    update(world, x, y, i) {
      const g = world.grid;
      if (g.life[i] === 0) {
        if (g.temp[i] < 60) {
          g.id[i] = ElementId.WATER;
          g.temp[i] = 40;
        } else {
          g.id[i] = ElementId.EMPTY;
        }
        return;
      }
      g.life[i]--;
      if (g.temp[i] > 30) g.temp[i]--;
      tryRise(world, x, y, i);
    },
  });
}

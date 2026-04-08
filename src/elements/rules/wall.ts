import { Category, ElementDef, ElementId } from '../types';

export function registerWall(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.WALL,
    name: 'Wall',
    category: Category.SPECIAL,
    color: 0xff3a3f4b,
    flammable: false,
    density: 255,
  });
}

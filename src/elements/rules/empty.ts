import { Category, ElementDef, ElementId } from '../types';

export function registerEmpty(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.EMPTY,
    name: 'Air',
    category: Category.SPECIAL,
    color: 0xff201a15, // dark blue-grey background
    flammable: false,
    density: 0,
  });
}

import { Category, ElementDef, ElementId } from '../types';

export function registerGlass(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.GLASS,
    name: 'Glass',
    category: Category.SOLID,
    color: 0xffe8e8b8, // pale cyan tint
    flammable: false,
    density: 180,
    // Glass is inert; shattering into sand happens in World.detonate.
  });
}

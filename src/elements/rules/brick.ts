import { Category, ElementDef, ElementId } from '../types';

export function registerBrick(reg: (d: ElementDef) => void): void {
  reg({
    id: ElementId.BRICK,
    name: 'Brick',
    category: Category.SOLID,
    color: 0xff3a4aa8, // reddish
    flammable: false,
    density: 220,
    // Brick is inert except via explosions (handled in World.detonate) and
    // acid (handled by acid's update). No per-tick logic.
  });
}

import { describe, expect, it } from 'vitest';
import { FLAG_BURNING } from '../config';
import { ElementId } from '../elements/types';
import { World } from '../world/World';

function place(world: World, x: number, y: number, id: number, life = 0, temp = 20): void {
  const g = world.grid;
  const i = y * g.width + x;
  g.id[i] = id;
  g.life[i] = life;
  g.temp[i] = temp;
  g.flags[i] = 0;
}

describe('fire', () => {
  it('ignites adjacent wood', () => {
    const world = new World(3);
    world.clear();
    // Wood column supported on a stone floor so it doesn't fall.
    for (let y = 40; y <= 45; y++) place(world, 50, y, ElementId.WOOD);
    for (let x = 48; x <= 52; x++) place(world, x, 46, ElementId.STONE);
    // Fire right next to the wood.
    place(world, 51, 42, ElementId.FIRE, 100, 800);

    let ignited = false;
    for (let t = 0; t < 40; t++) {
      world.tick();
      // Look for a burning wood cell or the wood replaced by fire.
      for (let y = 40; y <= 45; y++) {
        const i = y * world.grid.width + 50;
        if (
          world.grid.id[i] === ElementId.FIRE ||
          (world.grid.id[i] === ElementId.WOOD && (world.grid.flags[i] & FLAG_BURNING) !== 0)
        ) {
          ignited = true;
          break;
        }
      }
      if (ignited) break;
    }
    expect(ignited).toBe(true);
  });

  it('does not ignite metal', () => {
    const world = new World(4);
    world.clear();
    place(world, 50, 40, ElementId.METAL);
    place(world, 51, 40, ElementId.FIRE, 100, 800);
    for (let t = 0; t < 30; t++) world.tick();
    const i = 40 * world.grid.width + 50;
    // Metal should still be metal (or possibly melted to lava if hot, but not fire).
    const id = world.grid.id[i];
    expect([ElementId.METAL, ElementId.LAVA]).toContain(id);
    expect((world.grid.flags[i] & FLAG_BURNING) === 0).toBe(true);
  });
});

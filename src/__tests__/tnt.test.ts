import { describe, expect, it } from 'vitest';
import { ElementId } from '../elements/types';
import { World } from '../world/World';

function place(world: World, x: number, y: number, id: number, temp = 20): void {
  const g = world.grid;
  const i = y * g.width + x;
  g.id[i] = id;
  g.life[i] = id === ElementId.FIRE ? 100 : 0;
  g.temp[i] = temp;
  g.flags[i] = 0;
}

describe('tnt', () => {
  it('explodes when ignited by fire and clears stone within radius but not walls', () => {
    const world = new World(123);
    world.clear();
    // Stone fortress around a TNT core.
    for (let y = 40; y <= 60; y++) {
      for (let x = 40; x <= 60; x++) {
        place(world, x, y, ElementId.STONE);
      }
    }
    place(world, 50, 50, ElementId.TNT);
    place(world, 51, 50, ElementId.FIRE, 800);

    for (let t = 0; t < 30; t++) world.tick();

    // Center should now be empty / fire / smoke (not TNT, not stone).
    const centerId = world.grid.id[50 * world.grid.width + 50];
    expect(centerId).not.toBe(ElementId.TNT);
    expect(centerId).not.toBe(ElementId.STONE);

    // Some stone within a radius should have been destroyed.
    let destroyed = 0;
    for (let dy = -6; dy <= 6; dy++) {
      for (let dx = -6; dx <= 6; dx++) {
        const id = world.grid.id[(50 + dy) * world.grid.width + (50 + dx)];
        if (id !== ElementId.STONE) destroyed++;
      }
    }
    expect(destroyed).toBeGreaterThan(8);

    // The outer border (walls) must remain intact.
    const w = world.grid.width;
    expect(world.grid.id[0]).toBe(ElementId.WALL);
    expect(world.grid.id[w - 1]).toBe(ElementId.WALL);
    const lastRow = (world.grid.height - 1) * w;
    expect(world.grid.id[lastRow]).toBe(ElementId.WALL);
  });
});

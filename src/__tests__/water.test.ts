import { describe, expect, it } from 'vitest';
import { ElementId } from '../elements/types';
import { World } from '../world/World';

function place(world: World, x: number, y: number, id: number): void {
  const g = world.grid;
  g.id[y * g.width + x] = id;
}

describe('water', () => {
  it('fills a basin horizontally and cannot escape through stone walls', () => {
    const world = new World(10);
    world.clear();
    // Stone basin: walls at x=60, x=80, floor y=40.
    for (let y = 25; y <= 40; y++) {
      place(world, 60, y, ElementId.STONE);
      place(world, 80, y, ElementId.STONE);
    }
    for (let x = 60; x <= 80; x++) place(world, x, 40, ElementId.STONE);

    // Drop a block of water above the basin mouth.
    for (let wy = 18; wy < 24; wy++) {
      for (let wx = 63; wx < 78; wx++) {
        place(world, wx, wy, ElementId.WATER);
      }
    }

    for (let t = 0; t < 600; t++) world.tick();

    // Count water cells that ended up inside the basin.
    let waterInside = 0;
    for (let y = 30; y < 40; y++) {
      for (let x = 61; x < 80; x++) {
        if (world.grid.id[y * world.grid.width + x] === ElementId.WATER) waterInside++;
      }
    }
    expect(waterInside).toBeGreaterThan(40);

    // Water must not have escaped through the stone walls onto the floor
    // outside the basin.
    const outLeft = world.grid.id[40 * world.grid.width + 58];
    const outRight = world.grid.id[40 * world.grid.width + 82];
    expect(outLeft).not.toBe(ElementId.WATER);
    expect(outRight).not.toBe(ElementId.WATER);
  });
});

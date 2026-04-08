import { describe, expect, it } from 'vitest';
import { ElementId } from '../elements/types';
import { World } from '../world/World';

function place(world: World, x: number, y: number, id: number): void {
  const g = world.grid;
  g.id[y * g.width + x] = id;
}

describe('sand', () => {
  it('falls straight down through empty space', () => {
    const world = new World(1);
    world.clear();
    // Drop a grain at (50, 10); the border at y=0 is WALL so start below it.
    place(world, 50, 10, ElementId.SAND);
    // Floor at the bottom border is WALL already.
    for (let t = 0; t < 400; t++) world.tick();
    // Sand should have settled at the last open row just above the WALL border.
    const lastRow = world.grid.height - 2;
    // It may slide sideways slightly on a flat floor; just confirm it's near the
    // bottom and no longer where it started.
    expect(world.grid.id[10 * world.grid.width + 50]).not.toBe(ElementId.SAND);
    let found = false;
    for (let x = 1; x < world.grid.width - 1; x++) {
      if (world.grid.id[lastRow * world.grid.width + x] === ElementId.SAND) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('piles up when landing on a fixed surface', () => {
    const world = new World(2);
    world.clear();
    // Build a small stone shelf.
    for (let x = 40; x < 60; x++) place(world, x, 30, ElementId.STONE);
    place(world, 50, 5, ElementId.SAND);
    for (let t = 0; t < 200; t++) world.tick();
    // Sand must not be below the shelf (y >= 30).
    let belowShelf = false;
    for (let y = 31; y < world.grid.height - 1; y++) {
      if (world.grid.id[y * world.grid.width + 50] === ElementId.SAND) {
        belowShelf = true;
        break;
      }
    }
    expect(belowShelf).toBe(false);
  });
});

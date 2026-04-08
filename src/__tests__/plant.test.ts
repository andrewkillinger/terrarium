import { describe, expect, it } from 'vitest';
import { ElementId } from '../elements/types';
import { World } from '../world/World';

function place(world: World, x: number, y: number, id: number): void {
  const g = world.grid;
  g.id[y * g.width + x] = id;
}

// Fill a column of dirt all the way to the floor so it doesn't collapse while
// we wait for plants to grow.
function packDirt(world: World, x0: number, x1: number, topY: number): void {
  const floor = world.grid.height - 2;
  for (let x = x0; x < x1; x++) {
    for (let y = topY; y <= floor; y++) {
      place(world, x, y, ElementId.DIRT);
    }
  }
}

describe('plants', () => {
  it('seed on dirt with empty above sprouts into grass', () => {
    const world = new World(42);
    world.clear();
    packDirt(world, 40, 60, 45);
    place(world, 50, 44, ElementId.SEED);

    let sprouted = false;
    for (let t = 0; t < 1200; t++) {
      world.tick();
      if (world.grid.id[44 * world.grid.width + 50] === ElementId.GRASS) {
        sprouted = true;
        break;
      }
    }
    expect(sprouted).toBe(true);
  });

  it('grass on dirt eventually grows a vine above', () => {
    const world = new World(99);
    world.clear();
    packDirt(world, 40, 60, 45);
    place(world, 50, 44, ElementId.GRASS);

    let sawVine = false;
    for (let t = 0; t < 8000; t++) {
      world.tick();
      for (let y = 35; y < 44; y++) {
        if (world.grid.id[y * world.grid.width + 50] === ElementId.VINE) {
          sawVine = true;
          break;
        }
      }
      if (sawVine) break;
    }
    expect(sawVine).toBe(true);
  });
});

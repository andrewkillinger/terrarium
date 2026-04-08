import { describe, expect, it } from 'vitest';
import { ElementId } from '../elements/types';
import { World } from '../world/World';

function place(world: World, x: number, y: number, id: number, temp = 20): void {
  const g = world.grid;
  const i = y * g.width + x;
  g.id[i] = id;
  g.life[i] = 0;
  g.temp[i] = temp;
  g.flags[i] = 0;
}

describe('lava', () => {
  it('turns into stone when it touches water, producing steam', () => {
    const world = new World(11);
    world.clear();
    // Stone cradle so lava stays put.
    place(world, 50, 41, ElementId.STONE);
    place(world, 49, 40, ElementId.STONE);
    place(world, 51, 40, ElementId.STONE);
    place(world, 50, 40, ElementId.LAVA, 1500);
    place(world, 50, 39, ElementId.WATER);

    let sawStone = false;
    let sawSteam = false;
    for (let t = 0; t < 10; t++) {
      world.tick();
      const id = world.grid.id;
      const w = world.grid.width;
      // Look for stone where lava was.
      if (id[40 * w + 50] === ElementId.STONE) sawStone = true;
      // Steam should exist somewhere around the reaction.
      for (let y = 37; y <= 40; y++) {
        for (let x = 48; x <= 52; x++) {
          if (id[y * w + x] === ElementId.STEAM) sawSteam = true;
        }
      }
      if (sawStone && sawSteam) break;
    }
    expect(sawStone).toBe(true);
    expect(sawSteam).toBe(true);
  });
});

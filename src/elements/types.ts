import type { World } from '../world/World';

export const enum ElementId {
  EMPTY = 0,
  WALL = 1,
  SAND = 2,
  DIRT = 3,
  STONE = 4,
  WOOD = 5,
  BRICK = 6,
  METAL = 7,
  GLASS = 8,
  ICE = 9,
  WATER = 10,
  OIL = 11,
  LAVA = 12,
  ACID = 13,
  STEAM = 14,
  SMOKE = 15,
  FIRE = 16,
  SEED = 17,
  GRASS = 18,
  VINE = 19,
  TNT = 20,
  GUNPOWDER = 21,
  DYNAMITE = 22,
  COUNT = 23,
}

export const enum Category {
  SOLID = 0,
  LIQUID = 1,
  GAS = 2,
  PLANT = 3,
  EXPLOSIVE = 4,
  SPECIAL = 5,
}

export type UpdateFn = (world: World, x: number, y: number, i: number) => void;

export type ElementDef = {
  id: ElementId;
  name: string;
  category: Category;
  color: number; // packed 0xAABBGGRR little-endian (what Uint32Array over ImageData expects)
  flammable: boolean;
  density: number; // higher = sinks through lower
  update?: UpdateFn;
};

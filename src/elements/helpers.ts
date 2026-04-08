import { FLAG_MOVED, GRID_W } from '../config';
import type { World } from '../world/World';
import { ELEMENTS } from './registry';
import { ElementId } from './types';

// Swap two cells and mark both as moved this tick.
export function swap(world: World, a: number, b: number): void {
  const g = world.grid;
  const tid = g.id[a];
  const tlife = g.life[a];
  const ttemp = g.temp[a];
  g.id[a] = g.id[b];
  g.life[a] = g.life[b];
  g.temp[a] = g.temp[b];
  g.id[b] = tid;
  g.life[b] = tlife;
  g.temp[b] = ttemp;
  g.flags[a] |= FLAG_MOVED;
  g.flags[b] |= FLAG_MOVED;
}

// Powder fall: straight down, then down-left / down-right depending on tick parity.
// Returns true if the cell moved.
export function tryFall(world: World, x: number, _y: number, i: number): boolean {
  const g = world.grid;
  const myId = g.id[i];
  const myDensity = ELEMENTS[myId].density;

  // Straight down
  const di = i + GRID_W;
  const below = g.id[di];
  if (isTraversableBy(below, myDensity)) {
    swap(world, i, di);
    return true;
  }
  // Diagonal
  const leftFirst = world.rng.next() < 0.5;
  const a = leftFirst ? -1 : 1;
  const b = leftFirst ? 1 : -1;
  if (x + a > 0 && x + a < g.width - 1) {
    const da = i + GRID_W + a;
    if (isTraversableBy(g.id[da], myDensity)) {
      swap(world, i, da);
      return true;
    }
  }
  if (x + b > 0 && x + b < g.width - 1) {
    const db = i + GRID_W + b;
    if (isTraversableBy(g.id[db], myDensity)) {
      swap(world, i, db);
      return true;
    }
  }
  return false;
}

// Liquid flow: fall first; if blocked, flow sideways up to `dispersion` cells.
export function tryFlow(world: World, x: number, y: number, i: number, dispersion: number): boolean {
  if (tryFall(world, x, y, i)) return true;
  const g = world.grid;
  const myId = g.id[i];
  const myDensity = ELEMENTS[myId].density;
  const dir = world.rng.next() < 0.5 ? -1 : 1;
  let farthest = 0;
  for (let step = 1; step <= dispersion; step++) {
    const nx = x + dir * step;
    if (nx <= 0 || nx >= g.width - 1) break;
    const ni = i + dir * step;
    if (!isTraversableBy(g.id[ni], myDensity)) break;
    farthest = step;
  }
  if (farthest > 0) {
    swap(world, i, i + dir * farthest);
    return true;
  }
  // Opposite direction one step (helps escape tight corners).
  const bx = x - dir;
  if (bx > 0 && bx < g.width - 1) {
    const bi = i - dir;
    if (isTraversableBy(g.id[bi], myDensity)) {
      swap(world, i, bi);
      return true;
    }
  }
  return false;
}

// Gas rise: up, then up-left / up-right, and occasional random sideways drift.
export function tryRise(world: World, x: number, y: number, i: number): boolean {
  const g = world.grid;
  const myId = g.id[i];
  const myDensity = ELEMENTS[myId].density;
  if (y <= 1) return false;
  const ui = i - GRID_W;
  if (isTraversableBy(g.id[ui], myDensity)) {
    swap(world, i, ui);
    return true;
  }
  const leftFirst = world.rng.next() < 0.5;
  const a = leftFirst ? -1 : 1;
  const b = leftFirst ? 1 : -1;
  if (x + a > 0 && x + a < g.width - 1) {
    const ua = i - GRID_W + a;
    if (isTraversableBy(g.id[ua], myDensity)) {
      swap(world, i, ua);
      return true;
    }
  }
  if (x + b > 0 && x + b < g.width - 1) {
    const ub = i - GRID_W + b;
    if (isTraversableBy(g.id[ub], myDensity)) {
      swap(world, i, ub);
      return true;
    }
  }
  // Occasional sideways drift.
  if (world.rng.chance(0.3)) {
    const sdir = world.rng.sign();
    if (x + sdir > 0 && x + sdir < g.width - 1) {
      const si = i + sdir;
      if (isTraversableBy(g.id[si], myDensity)) {
        swap(world, i, si);
        return true;
      }
    }
  }
  return false;
}

// A cell of density `myDensity` can displace a cell whose element has lower
// density (heavier falls through lighter), or pass through EMPTY.
export function isTraversableBy(otherId: number, myDensity: number): boolean {
  if (otherId === ElementId.EMPTY) return true;
  if (otherId === ElementId.WALL) return false;
  const other = ELEMENTS[otherId];
  if (other.category === 5) return false;
  // Only heavier materials can sink into lighter ones, and only liquids/gases
  // are displaceable — solids never get shoved aside by a falling grain.
  if (other.category !== 1 && other.category !== 2) return false;
  return myDensity > other.density;
}

// Get 8-neighborhood indices. Unrolled manually at callsites to stay
// allocation-free; this helper is only for non-hot callers.
export function forEachNeighbor(
  world: World,
  x: number,
  y: number,
  fn: (nx: number, ny: number, ni: number) => void,
): void {
  const g = world.grid;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= g.width || ny < 0 || ny >= g.height) continue;
      fn(nx, ny, ny * g.width + nx);
    }
  }
}

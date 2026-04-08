import { AMBIENT_TEMP, GRID_H, GRID_W } from '../config';
import { Creature, CreatureKind } from '../creatures/Creature';
import { ElementId } from '../elements/types';
import type { World } from '../world/World';

// Paint a disc of `elementId` centered at (cx, cy). Skips WALL cells and,
// for solid materials, prefers not to overwrite existing solid walls so the
// user can "paint air" freely but solid→solid replaces.
export function paintCircle(
  world: World,
  cx: number,
  cy: number,
  radius: number,
  elementId: number,
): void {
  if (elementId === ElementId.WALL) return; // never user-paintable
  const g = world.grid;
  const r2 = radius * radius;
  const minX = Math.max(1, cx - radius);
  const maxX = Math.min(GRID_W - 2, cx + radius);
  const minY = Math.max(1, cy - radius);
  const maxY = Math.min(GRID_H - 2, cy + radius);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;
      const i = y * GRID_W + x;
      if (g.id[i] === ElementId.WALL) continue;
      g.id[i] = elementId;
      g.life[i] = initialLife(elementId);
      g.temp[i] = initialTemp(elementId);
      g.flags[i] = 0;
    }
  }
}

// Spawn a creature at the given grid coordinates.
export function spawnCreature(world: World, kind: CreatureKind, x: number, y: number): void {
  world.creatures.push(new Creature(kind, x, y));
}

function initialLife(id: number): number {
  switch (id) {
    case ElementId.FIRE:
      return 30;
    case ElementId.SMOKE:
      return 180;
    case ElementId.STEAM:
      return 120;
    case ElementId.VINE:
      return 20;
    default:
      return 0;
  }
}

function initialTemp(id: number): number {
  switch (id) {
    case ElementId.FIRE:
      return 800;
    case ElementId.LAVA:
      return 1500;
    case ElementId.ICE:
      return -15;
    case ElementId.STEAM:
      return 105;
    default:
      return AMBIENT_TEMP;
  }
}

// Bresenham-ish line: paint brush at each integer step between two points
// so fast drags don't leave gaps. Avoids allocations.
export function paintLine(
  world: World,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  elementId: number,
): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  // Safety cap to prevent pathological loops.
  let steps = 0;
  const maxSteps = (GRID_W + GRID_H) * 2;
  while (steps++ < maxSteps) {
    paintCircle(world, x, y, radius, elementId);
    if (x === x1 && y === y1) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}
